#!/bin/bash

# Deployment Monitoring Script for Cakravia
# This script continuously monitors the deployment status and health

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
MONITOR_INTERVAL=30
LOG_FILE="/var/log/cakravia-monitor.log"
ALERT_FILE="/tmp/cakravia-alerts.log"
HEALTH_HISTORY_FILE="/tmp/cakravia-health-history.json"
MAX_FAILED_CHECKS=3
ALERT_THRESHOLD=5

# Initialize counters
FAILED_CHECKS=0
ALERT_COUNT=0

# Logging function
log() {
    local message="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${BLUE}[${timestamp}]${NC} $message"
    echo "[${timestamp}] $message" >> "$LOG_FILE"
}

log_success() {
    local message="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${GREEN}[${timestamp}] ✅ $message${NC}"
    echo "[${timestamp}] SUCCESS: $message" >> "$LOG_FILE"
}

log_warning() {
    local message="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${YELLOW}[${timestamp}] ⚠️  $message${NC}"
    echo "[${timestamp}] WARNING: $message" >> "$LOG_FILE"
}

log_error() {
    local message="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${RED}[${timestamp}] ❌ $message${NC}"
    echo "[${timestamp}] ERROR: $message" >> "$LOG_FILE"
    echo "[${timestamp}] ERROR: $message" >> "$ALERT_FILE"
}

# Function to check container health
check_container_health() {
    local container_name="$1"
    local expected_status="Up"
    
    if docker ps --format 'table {{.Names}}\t{{.Status}}' | grep -q "${container_name}.*${expected_status}"; then
        return 0
    else
        return 1
    fi
}

# Function to check HTTP health endpoints
check_http_health() {
    local endpoint="$1"
    local expected_status="$2"
    
    local response_code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:8080${endpoint}" 2>/dev/null || echo "000")
    
    if [ "$response_code" = "$expected_status" ]; then
        return 0
    else
        log_error "HTTP health check failed for ${endpoint}. Expected: ${expected_status}, Got: ${response_code}"
        return 1
    fi
}

# Function to get deployment status
get_deployment_status() {
    local status_json=$(curl -s http://localhost:8080/api/deployment/status 2>/dev/null || echo '{}')
    echo "$status_json"
}

# Function to check active deployment slot
get_active_slot() {
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

# Function to perform comprehensive health check
perform_health_check() {
    local health_status=0
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    local active_slot=$(get_active_slot)
    
    log "Performing health check for active slot: ${active_slot}"
    
    # Check 1: Container health
    if check_container_health "cakravia-app-${active_slot}"; then
        log_success "Container cakravia-app-${active_slot} is healthy"
    else
        log_error "Container cakravia-app-${active_slot} is not healthy"
        health_status=1
    fi
    
    # Check 2: Nginx container
    if check_container_health "cakravia-nginx"; then
        log_success "Nginx container is healthy"
    else
        log_error "Nginx container is not healthy"
        health_status=1
    fi
    
    # Check 3: Main health endpoint
    if check_http_health "/api/health" "200"; then
        log_success "Main health endpoint is responding"
    else
        log_error "Main health endpoint is not responding"
        health_status=1
    fi
    
    # Check 4: Readiness endpoint
    if check_http_health "/api/health/ready" "200"; then
        log_success "Readiness endpoint is responding"
    else
        log_warning "Readiness endpoint is not responding"
    fi
    
    # Check 5: Liveness endpoint
    if check_http_health "/api/health/live" "200"; then
        log_success "Liveness endpoint is responding"
    else
        log_warning "Liveness endpoint is not responding"
    fi
    
    # Check 6: Application homepage
    if check_http_health "/" "200"; then
        log_success "Application homepage is accessible"
    else
        log_error "Application homepage is not accessible"
        health_status=1
    fi
    
    # Store health check result
    local health_record="{
        \"timestamp\": \"${timestamp}\",
        \"active_slot\": \"${active_slot}\",
        \"health_status\": ${health_status},
        \"containers\": {
            \"app\": $(check_container_health "cakravia-app-${active_slot}" && echo "true" || echo "false"),
            \"nginx\": $(check_container_health "cakravia-nginx" && echo "true" || echo "false")
        },
        \"endpoints\": {
            \"health\": $(check_http_health "/api/health" "200" && echo "true" || echo "false"),
            \"ready\": $(check_http_health "/api/health/ready" "200" && echo "true" || echo "false"),
            \"live\": $(check_http_health "/api/health/live" "200" && echo "true" || echo "false"),
            \"homepage\": $(check_http_health "/" "200" && echo "true" || echo "false")
        }
    }"
    
    # Append to health history
    echo "$health_record" >> "$HEALTH_HISTORY_FILE"
    
    # Keep only last 100 records
    tail -n 100 "$HEALTH_HISTORY_FILE" > "${HEALTH_HISTORY_FILE}.tmp" && mv "${HEALTH_HISTORY_FILE}.tmp" "$HEALTH_HISTORY_FILE"
    
    return $health_status
}

# Function to send alert
send_alert() {
    local alert_message="$1"
    local severity="$2"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    log_error "ALERT [${severity}]: ${alert_message}"
    
    # Store alert
    echo "[${timestamp}] ${severity}: ${alert_message}" >> "$ALERT_FILE"
    
    # Here you could integrate with external alerting systems
    # Examples:
    # - Send Slack notification
    # - Send email
    # - Send to monitoring system
    # - Trigger PagerDuty incident
}

# Function to check for deployment issues
check_deployment_issues() {
    local deployment_status=$(get_deployment_status)
    
    # Check for deployment errors
    local deployment_health=$(echo "$deployment_status" | jq -r '.health.status' 2>/dev/null || echo "unknown")
    local app_uptime=$(echo "$deployment_status" | jq -r '.application.uptime' 2>/dev/null || echo "0")
    
    # Alert if deployment is unhealthy
    if [ "$deployment_health" = "unhealthy" ]; then
        send_alert "Deployment is reporting unhealthy status" "CRITICAL"
    fi
    
    # Alert if application has restarted recently (uptime < 5 minutes)
    if [ "$app_uptime" != "null" ] && [ "$app_uptime" != "0" ]; then
        if (( $(echo "$app_uptime < 300" | bc -l) )); then
            send_alert "Application has restarted recently (uptime: ${app_uptime}s)" "WARNING"
        fi
    fi
}

# Function to generate monitoring report
generate_report() {
    local active_slot=$(get_active_slot)
    local deployment_status=$(get_deployment_status)
    
    echo "======================================"
    echo "Cakravia Deployment Monitoring Report"
    echo "======================================"
    echo "Timestamp: $(date)"
    echo "Active Slot: ${active_slot}"
    echo ""
    
    echo "Container Status:"
    docker-compose -f docker-compose.blue-green.yml ps 2>/dev/null || echo "Could not fetch container status"
    echo ""
    
    echo "Deployment Status:"
    echo "$deployment_status" | jq '.' 2>/dev/null || echo "Could not fetch deployment status"
    echo ""
    
    echo "Recent Health History (last 5 checks):"
    tail -n 5 "$HEALTH_HISTORY_FILE" 2>/dev/null | jq '.' || echo "No health history available"
    echo ""
    
    echo "Recent Alerts:"
    tail -n 10 "$ALERT_FILE" 2>/dev/null || echo "No recent alerts"
    echo ""
    
    echo "System Resources:"
    echo "Memory Usage:"
    free -h
    echo ""
    echo "Disk Usage:"
    df -h
    echo ""
    echo "Docker Stats:"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}"
    echo "======================================"
}

# Function to cleanup old logs
cleanup_logs() {
    # Rotate main log if it's too large (>10MB)
    if [ -f "$LOG_FILE" ] && [ $(stat -c%s "$LOG_FILE") -gt 10485760 ]; then
        mv "$LOG_FILE" "${LOG_FILE}.old"
        touch "$LOG_FILE"
    fi
    
    # Rotate alert log if it's too large (>5MB)
    if [ -f "$ALERT_FILE" ] && [ $(stat -c%s "$ALERT_FILE") -gt 5242880 ]; then
        mv "$ALERT_FILE" "${ALERT_FILE}.old"
        touch "$ALERT_FILE"
    fi
}

# Main monitoring loop
main() {
    log "Starting Cakravia deployment monitoring..."
    
    # Ensure we're in the correct directory
    if [ -d "/opt/cakravia" ]; then
        cd /opt/cakravia
    fi
    
    while true; do
        # Perform health check
        if perform_health_check; then
            FAILED_CHECKS=0
            log_success "Health check passed"
        else
            FAILED_CHECKS=$((FAILED_CHECKS + 1))
            log_error "Health check failed (${FAILED_CHECKS}/${MAX_FAILED_CHECKS})"
            
            # Send alert if threshold reached
            if [ $FAILED_CHECKS -ge $MAX_FAILED_CHECKS ]; then
                ALERT_COUNT=$((ALERT_COUNT + 1))
                send_alert "Multiple consecutive health check failures (${FAILED_CHECKS})" "CRITICAL"
                
                # Reset counter to avoid spam
                FAILED_CHECKS=0
                
                # If too many alerts, something is seriously wrong
                if [ $ALERT_COUNT -ge $ALERT_THRESHOLD ]; then
                    send_alert "Alert threshold reached (${ALERT_COUNT}). System needs immediate attention!" "CRITICAL"
                    ALERT_COUNT=0
                fi
            fi
        fi
        
        # Check for deployment issues
        check_deployment_issues
        
        # Cleanup logs periodically
        cleanup_logs
        
        # Wait before next check
        sleep $MONITOR_INTERVAL
    done
}

# Handle script options
case "${1:-monitor}" in
    monitor)
        main
        ;;
    report)
        generate_report
        ;;
    check)
        perform_health_check
        ;;
    status)
        get_deployment_status | jq '.'
        ;;
    alerts)
        echo "Recent alerts:"
        tail -n 20 "$ALERT_FILE" 2>/dev/null || echo "No alerts found"
        ;;
    history)
        echo "Health check history:"
        tail -n 10 "$HEALTH_HISTORY_FILE" 2>/dev/null | jq '.' || echo "No health history available"
        ;;
    help|*)
        echo "Cakravia Deployment Monitoring Script"
        echo ""
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  monitor   Start continuous monitoring (default)"
        echo "  report    Generate a one-time monitoring report"
        echo "  check     Perform a single health check"
        echo "  status    Show current deployment status"
        echo "  alerts    Show recent alerts"
        echo "  history   Show health check history"
        echo "  help      Show this help message"
        ;;
esac