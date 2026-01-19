#!/bin/bash

# Rollback Script for Cakravia Zero-Downtime Deployment
# This script can quickly rollback to the previous deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ROLLBACK_TIMEOUT=120
HEALTH_CHECK_RETRIES=10
HEALTH_CHECK_INTERVAL=5

# Logging function
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] ✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] ⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ❌ $1${NC}"
}

# Function to check if container is running
is_container_running() {
    local container_name=$1
    if docker ps --format 'table {{.Names}}' | grep -q "^${container_name}$"; then
        return 0
    else
        return 1
    fi
}

# Function to check container health
check_container_health() {
    local container_name=$1
    local port=$2
    
    if ! is_container_running "$container_name"; then
        return 1
    fi
    
    # Check Docker health status
    local health_status=$(docker inspect --format='{{.State.Health.Status}}' "$container_name" 2>/dev/null || echo "none")
    if [ "$health_status" = "healthy" ]; then
        return 0
    elif [ "$health_status" = "none" ]; then
        # Fallback to direct HTTP check if no Docker health check
        if curl -f -s "http://localhost:${port}/api/health" > /dev/null 2>&1; then
            return 0
        fi
    fi
    
    return 1
}

# Function to wait for container to be healthy
wait_for_health() {
    local container_name=$1
    local port=$2
    local max_retries=$3
    
    log "Waiting for ${container_name} to be healthy..."
    
    for i in $(seq 1 $max_retries); do
        if check_container_health "$container_name" "$port"; then
            log_success "${container_name} is healthy!"
            return 0
        fi
        
        if [ $i -eq $max_retries ]; then
            log_error "${container_name} failed health check after $max_retries attempts"
            return 1
        fi
        
        log "Health check $i/$max_retries failed, retrying in ${HEALTH_CHECK_INTERVAL}s..."
        sleep $HEALTH_CHECK_INTERVAL
    done
    
    return 1
}

# Function to determine current active deployment
get_active_deployment() {
    if [ -f "nginx/upstream.conf" ]; then
        if grep -q "ACTIVE_DEPLOYMENT: blue" nginx/upstream.conf; then
            echo "blue"
        elif grep -q "ACTIVE_DEPLOYMENT: green" nginx/upstream.conf; then
            echo "green"
        else
            echo "unknown"
        fi
    else
        echo "unknown"
    fi
}

# Function to get inactive deployment
get_inactive_deployment() {
    local active=$1
    if [ "$active" = "blue" ]; then
        echo "green"
    else
        echo "blue"
    fi
}

# Function to get deployment history
get_deployment_history() {
    if [ -f "deployment-history.log" ]; then
        tail -n 10 deployment-history.log
    else
        echo "No deployment history available"
    fi
}

# Function to get previous deployment info
get_previous_deployment() {
    if [ -f "deployment-history.log" ]; then
        # Get the second most recent deployment (current is most recent)
        tail -n 2 deployment-history.log | head -n 1
    else
        echo ""
    fi
}

# Function to update nginx configuration
update_nginx_configuration() {
    local target_deployment=$1
    local version=$2
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    
    log "Updating nginx configuration to point to ${target_deployment}..."
    
    # Create backup of current configuration
    cp nginx/nginx.conf nginx/nginx.conf.backup
    
    # Update nginx configuration
    if [ -f "nginx/nginx.${target_deployment}.conf" ]; then
        sed -e "s/{{TIMESTAMP}}/$timestamp/g" -e "s/{{VERSION}}/$version/g" \
            "nginx/nginx.${target_deployment}.conf" > nginx/nginx.conf
    else
        log_error "Nginx configuration template for ${target_deployment} not found!"
        return 1
    fi
    
    # Test nginx configuration by copying to container and testing
    if docker cp nginx/nginx.conf cakravia-nginx:/tmp/nginx.conf.test; then
        if docker exec cakravia-nginx nginx -t -c /tmp/nginx.conf.test > /dev/null 2>&1; then
            # Configuration is valid, apply it
            docker cp nginx/nginx.conf cakravia-nginx:/etc/nginx/nginx.conf
            
            # Reload nginx (zero downtime)
            if docker exec cakravia-nginx nginx -s reload > /dev/null 2>&1; then
                log_success "Nginx configuration updated and reloaded successfully"
                return 0
            else
                log_error "Nginx reload failed! Restoring backup..."
                cp nginx/nginx.conf.backup nginx/nginx.conf
                docker cp nginx/nginx.conf cakravia-nginx:/etc/nginx/nginx.conf
                docker exec cakravia-nginx nginx -s reload > /dev/null 2>&1
                return 1
            fi
        else
            log_error "Nginx configuration test failed! Restoring backup..."
            cp nginx/nginx.conf.backup nginx/nginx.conf
            return 1
        fi
    else
        log_error "Failed to copy configuration to nginx container!"
        cp nginx/nginx.conf.backup nginx/nginx.conf
        return 1
    fi
}

# Function to start previous deployment container
start_previous_deployment() {
    local target_deployment=$1
    
    log "Starting ${target_deployment} container..."
    
    # Check if container already exists and is running
    if is_container_running "cakravia-app-${target_deployment}"; then
        log_success "${target_deployment} container is already running"
        return 0
    fi
    
    # Start the container
    if docker-compose -f docker-compose.blue-green.yml up -d "app-${target_deployment}"; then
        log_success "${target_deployment} container started"
        return 0
    else
        log_error "Failed to start ${target_deployment} container"
        return 1
    fi
}

# Function to log deployment change
log_deployment_change() {
    local from_deployment=$1
    local to_deployment=$2
    local version=$3
    local reason=$4
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    
    echo "[${timestamp}] ROLLBACK: ${from_deployment} -> ${to_deployment} | Version: ${version} | Reason: ${reason}" >> deployment-history.log
}

# Function to perform rollback
perform_rollback() {
    local reason="${1:-Manual rollback}"
    local target_version="${2:-previous}"
    
    echo -e "${YELLOW}🔄 Starting rollback deployment...${NC}"
    echo -e "${BLUE}Reason: ${reason}${NC}"
    
    # Get current deployment state
    local current_deployment=$(get_active_deployment)
    local target_deployment=$(get_inactive_deployment "$current_deployment")
    
    if [ "$current_deployment" = "unknown" ]; then
        log_error "Cannot determine current deployment state"
        exit 1
    fi
    
    log "Current deployment: ${current_deployment}"
    log "Target deployment: ${target_deployment}"
    
    # Determine ports
    local current_port=3000
    local target_port=3001
    if [ "$current_deployment" = "green" ]; then
        current_port=3001
        target_port=3000
    fi
    
    # Check if target deployment container exists
    if ! docker-compose -f docker-compose.blue-green.yml ps | grep -q "cakravia-app-${target_deployment}"; then
        log_warning "Target deployment container doesn't exist. This might be the first deployment."
        log_error "Cannot rollback - no previous deployment available"
        exit 1
    fi
    
    # Start target deployment container if not running
    if ! is_container_running "cakravia-app-${target_deployment}"; then
        log "Starting target deployment container..."
        if ! start_previous_deployment "$target_deployment"; then
            log_error "Failed to start target deployment container"
            exit 1
        fi
    fi
    
    # Wait for target container to be healthy
    log "Waiting for target container to be ready..."
    if ! wait_for_health "cakravia-app-${target_deployment}" "$target_port" "$HEALTH_CHECK_RETRIES"; then
        log_error "Target container failed health checks"
        exit 1
    fi
    
    # Switch traffic to target deployment
    log "Switching traffic to ${target_deployment}..."
    if ! update_nginx_configuration "$target_deployment" "$target_version"; then
        log_error "Failed to switch traffic"
        exit 1
    fi
    
    # Verify traffic switch was successful
    log "Verifying traffic switch..."
    sleep 5
    if ! curl -f -s "http://localhost:8080/api/health" > /dev/null 2>&1; then
        log_error "Traffic switch verification failed"
        # Try to restore original configuration
        if [ -f "nginx/upstream.conf.backup" ]; then
            cp nginx/upstream.conf.backup nginx/upstream.conf
            docker exec cakravia-nginx nginx -s reload > /dev/null 2>&1
        fi
        exit 1
    fi
    
    # Wait a bit more to ensure stability
    log "Monitoring rollback stability..."
    sleep 10
    
    # Final health check
    if ! check_container_health "cakravia-app-${target_deployment}" "$target_port"; then
        log_error "Final health check failed"
        exit 1
    fi
    
    # Stop the previous (now inactive) deployment
    log "Stopping previous deployment container..."
    docker-compose -f docker-compose.blue-green.yml stop "app-${current_deployment}" > /dev/null 2>&1 || true
    
    # Log the rollback
    log_deployment_change "$current_deployment" "$target_deployment" "$target_version" "$reason"
    
    # Success!
    log_success "Rollback completed successfully!"
    echo -e "${GREEN}🎉 Rollback Summary:${NC}"
    echo -e "${GREEN}   From: ${current_deployment}${NC}"
    echo -e "${GREEN}   To:   ${target_deployment}${NC}"
    echo -e "${GREEN}   Version: ${target_version}${NC}"
    echo -e "${GREEN}   Reason: ${reason}${NC}"
    echo -e "${GREEN}   URL: https://cakravia.com${NC}"
    
    # Show container status
    log "Current container status:"
    docker-compose -f docker-compose.blue-green.yml ps
}

# Function to show rollback status
show_status() {
    local current_deployment=$(get_active_deployment)
    
    echo "======================================"
    echo "Cakravia Rollback Status"
    echo "======================================"
    echo "Current Active Deployment: ${current_deployment}"
    echo ""
    
    echo "Container Status:"
    docker-compose -f docker-compose.blue-green.yml ps 2>/dev/null || echo "Could not fetch container status"
    echo ""
    
    echo "Deployment History (last 10):"
    get_deployment_history
    echo ""
    
    echo "Available Rollback Options:"
    local inactive_deployment=$(get_inactive_deployment "$current_deployment")
    if is_container_running "cakravia-app-${inactive_deployment}"; then
        echo "  ✅ Can rollback to ${inactive_deployment} (container is running)"
    elif docker-compose -f docker-compose.blue-green.yml ps | grep -q "cakravia-app-${inactive_deployment}"; then
        echo "  ⚠️  Can rollback to ${inactive_deployment} (container exists but stopped)"
    else
        echo "  ❌ Cannot rollback (no previous deployment available)"
    fi
    echo "======================================"
}

# Function to validate rollback prerequisites
validate_prerequisites() {
    # Check if Docker is running
    if ! docker info > /dev/null 2>&1; then
        log_error "Docker is not running"
        exit 1
    fi
    
    # Check if required files exist
    if [ ! -f "docker-compose.blue-green.yml" ]; then
        log_error "docker-compose.blue-green.yml not found!"
        exit 1
    fi
    
    if [ ! -f "nginx/upstream.blue.template" ] || [ ! -f "nginx/upstream.green.template" ]; then
        log_error "Nginx upstream templates not found!"
        exit 1
    fi
    
    # Check if nginx container is running
    if ! is_container_running "cakravia-nginx"; then
        log_error "Nginx container is not running"
        exit 1
    fi
}

# Main function
main() {
    local command="${1:-status}"
    local reason="${2:-Manual rollback}"
    local version="${3:-previous}"
    
    # Ensure we're in the correct directory
    if [ -d "/opt/cakravia" ]; then
        cd /opt/cakravia
    fi
    
    case "$command" in
        rollback)
            validate_prerequisites
            perform_rollback "$reason" "$version"
            ;;
        status)
            show_status
            ;;
        history)
            echo "Deployment History:"
            get_deployment_history
            ;;
        validate)
            validate_prerequisites
            log_success "All prerequisites are met"
            ;;
        help|*)
            echo "Cakravia Rollback Script"
            echo ""
            echo "Usage: $0 [command] [reason] [version]"
            echo ""
            echo "Commands:"
            echo "  rollback [reason] [version]  Perform rollback to previous deployment"
            echo "  status                       Show current rollback status"
            echo "  history                      Show deployment history"
            echo "  validate                     Validate rollback prerequisites"
            echo "  help                         Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0 rollback \"Health check failures\" \"v1.2.0\""
            echo "  $0 rollback \"Critical bug found\""
            echo "  $0 status"
            ;;
    esac
}

# Handle script interruption
cleanup_on_exit() {
    local exit_code=$?
    if [ $exit_code -ne 0 ]; then
        log_error "Rollback interrupted with exit code $exit_code"
        # Attempt to restore original nginx configuration if backup exists
        if [ -f "nginx/upstream.conf.backup" ]; then
            log "Restoring nginx configuration backup..."
            cp nginx/upstream.conf.backup nginx/upstream.conf
            docker exec cakravia-nginx nginx -s reload > /dev/null 2>&1 || true
        fi
    fi
    exit $exit_code
}

trap cleanup_on_exit INT TERM

# Run main function
main "$@"