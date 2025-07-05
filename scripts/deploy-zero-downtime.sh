#!/bin/bash

# Zero-Downtime Blue-Green Deployment Script for Cakravia
# This script implements blue-green deployment to achieve zero downtime

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
HEALTH_CHECK_RETRIES=12
HEALTH_CHECK_TIMEOUT=10
HEALTH_CHECK_INTERVAL=5
ROLLBACK_TIMEOUT=30
DEPLOYMENT_TIMEOUT=300

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
            # Default to blue if unclear
            echo "blue"
        fi
    else
        echo "blue"
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

# Function to update nginx upstream configuration
update_nginx_upstream() {
    local target_deployment=$1
    local version=$2
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    
    log "Updating nginx upstream configuration to point to ${target_deployment}..."
    
    # Create backup of current configuration
    cp nginx/upstream.conf nginx/upstream.conf.backup
    
    # Update upstream configuration
    sed -e "s/{{TIMESTAMP}}/$timestamp/g" -e "s/{{VERSION}}/$version/g" \
        "nginx/upstream.${target_deployment}.template" > nginx/upstream.conf
    
    # Test nginx configuration
    if ! docker exec cakravia-nginx nginx -t > /dev/null 2>&1; then
        log_error "Nginx configuration test failed! Restoring backup..."
        cp nginx/upstream.conf.backup nginx/upstream.conf
        return 1
    fi
    
    # Reload nginx (zero downtime)
    if docker exec cakravia-nginx nginx -s reload > /dev/null 2>&1; then
        log_success "Nginx configuration reloaded successfully"
        return 0
    else
        log_error "Nginx reload failed! Restoring backup..."
        cp nginx/upstream.conf.backup nginx/upstream.conf
        docker exec cakravia-nginx nginx -s reload > /dev/null 2>&1
        return 1
    fi
}

# Function to rollback deployment
rollback_deployment() {
    local active_deployment=$1
    local inactive_deployment=$2
    
    log_warning "Initiating rollback to ${active_deployment}..."
    
    # Restore previous nginx configuration
    if [ -f "nginx/upstream.conf.backup" ]; then
        cp nginx/upstream.conf.backup nginx/upstream.conf
        docker exec cakravia-nginx nginx -s reload > /dev/null 2>&1
    fi
    
    # Stop the failed container
    docker-compose -f docker-compose.blue-green.yml stop "app-${inactive_deployment}" > /dev/null 2>&1 || true
    
    log_success "Rollback completed. ${active_deployment} is still active."
}

# Function to cleanup old deployment
cleanup_old_deployment() {
    local old_deployment=$1
    
    log "Cleaning up old ${old_deployment} deployment..."
    
    # Stop and remove old container
    docker-compose -f docker-compose.blue-green.yml stop "app-${old_deployment}" > /dev/null 2>&1 || true
    docker-compose -f docker-compose.blue-green.yml rm -f "app-${old_deployment}" > /dev/null 2>&1 || true
    
    # Clean up old images
    docker image prune -f > /dev/null 2>&1 || true
    
    log_success "Cleanup completed for ${old_deployment} deployment"
}

# Function to perform comprehensive health checks
comprehensive_health_check() {
    local deployment=$1
    local port=$2
    
    log "Performing comprehensive health checks for ${deployment}..."
    
    # Check 1: Container is running
    if ! is_container_running "cakravia-app-${deployment}"; then
        log_error "Container cakravia-app-${deployment} is not running"
        return 1
    fi
    
    # Check 2: Health endpoint responds
    if ! curl -f -s "http://localhost:${port}/api/health" > /dev/null 2>&1; then
        log_error "Health endpoint not responding on port ${port}"
        return 1
    fi
    
    # Check 3: Application returns expected response
    local health_response=$(curl -s "http://localhost:${port}/api/health" | jq -r '.status' 2>/dev/null || echo "")
    if [ "$health_response" != "healthy" ]; then
        log_error "Application not reporting healthy status: ${health_response}"
        return 1
    fi
    
    # Check 4: Application can handle basic request
    if ! curl -f -s "http://localhost:${port}/" > /dev/null 2>&1; then
        log_error "Application not responding to basic requests"
        return 1
    fi
    
    log_success "All health checks passed for ${deployment}"
    return 0
}

# Main deployment function
main() {
    local version=${1:-$(date +%Y%m%d-%H%M%S)}
    
    echo -e "${GREEN}🚀 Starting Zero-Downtime Blue-Green Deployment...${NC}"
    echo -e "${BLUE}Version: ${version}${NC}"
    echo -e "${BLUE}Timestamp: $(date)${NC}"
    
    # Pre-deployment checks
    log "Performing pre-deployment checks..."
    
    # Check if Docker is running
    if ! docker info > /dev/null 2>&1; then
        log_error "Docker is not running. Please start Docker and try again."
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
    
    # Determine current deployment state
    local active_deployment=$(get_active_deployment)
    local inactive_deployment=$(get_inactive_deployment "$active_deployment")
    
    log "Current active deployment: ${active_deployment}"
    log "Target deployment: ${inactive_deployment}"
    
    # Determine ports
    local active_port=3000
    local inactive_port=3001
    if [ "$active_deployment" = "green" ]; then
        active_port=3001
        inactive_port=3000
    fi
    
    # Build new container image
    log "Building new container image for ${inactive_deployment}..."
    if ! docker-compose -f docker-compose.blue-green.yml build --no-cache "app-${inactive_deployment}"; then
        log_error "Failed to build new container image"
        exit 1
    fi
    
    # Start new container
    log "Starting new ${inactive_deployment} container..."
    if ! docker-compose -f docker-compose.blue-green.yml up -d "app-${inactive_deployment}"; then
        log_error "Failed to start new container"
        exit 1
    fi
    
    # Wait for new container to be healthy
    log "Waiting for new container to be ready..."
    if ! wait_for_health "cakravia-app-${inactive_deployment}" "$inactive_port" "$HEALTH_CHECK_RETRIES"; then
        log_error "New container failed health checks"
        rollback_deployment "$active_deployment" "$inactive_deployment"
        exit 1
    fi
    
    # Perform comprehensive health checks
    if ! comprehensive_health_check "$inactive_deployment" "$inactive_port"; then
        log_error "Comprehensive health checks failed"
        rollback_deployment "$active_deployment" "$inactive_deployment"
        exit 1
    fi
    
    # Switch traffic to new deployment
    log "Switching traffic to ${inactive_deployment}..."
    if ! update_nginx_upstream "$inactive_deployment" "$version"; then
        log_error "Failed to switch traffic"
        rollback_deployment "$active_deployment" "$inactive_deployment"
        exit 1
    fi
    
    # Verify traffic switch was successful
    log "Verifying traffic switch..."
    sleep 5
    if ! curl -f -s "http://localhost:8080/api/health" > /dev/null 2>&1; then
        log_error "Traffic switch verification failed"
        rollback_deployment "$active_deployment" "$inactive_deployment"
        exit 1
    fi
    
    # Wait a bit more to ensure stability
    log "Monitoring new deployment stability..."
    sleep 10
    
    # Final health check through nginx
    if ! comprehensive_health_check "$inactive_deployment" "$inactive_port"; then
        log_error "Final health check failed"
        rollback_deployment "$active_deployment" "$inactive_deployment"
        exit 1
    fi
    
    # Deployment successful - cleanup old deployment
    cleanup_old_deployment "$active_deployment"
    
    # Success!
    log_success "Zero-downtime deployment completed successfully!"
    echo -e "${GREEN}🎉 Deployment Summary:${NC}"
    echo -e "${GREEN}   Previous: ${active_deployment}${NC}"
    echo -e "${GREEN}   Current:  ${inactive_deployment}${NC}"
    echo -e "${GREEN}   Version:  ${version}${NC}"
    echo -e "${GREEN}   URL:      https://cakravia.com${NC}"
    
    # Show container status
    log "Current container status:"
    docker-compose -f docker-compose.blue-green.yml ps
    
    # Show recent logs
    log "Recent application logs:"
    docker-compose -f docker-compose.blue-green.yml logs --tail=10 "app-${inactive_deployment}"
}

# Handle script interruption
cleanup_on_exit() {
    local exit_code=$?
    if [ $exit_code -ne 0 ]; then
        log_error "Deployment interrupted with exit code $exit_code"
        # Attempt to rollback if we can determine the active deployment
        local active_deployment=$(get_active_deployment)
        local inactive_deployment=$(get_inactive_deployment "$active_deployment")
        rollback_deployment "$active_deployment" "$inactive_deployment"
    fi
    exit $exit_code
}

trap cleanup_on_exit INT TERM

# Run main function
main "$@"