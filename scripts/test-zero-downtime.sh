#!/bin/bash

# End-to-End Testing Script for Zero-Downtime Deployment
# This script tests all aspects of the zero-downtime deployment system

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Test configuration
TEST_DURATION=300  # 5 minutes
CONCURRENT_REQUESTS=10
REQUEST_INTERVAL=1
TEST_RESULTS_DIR="/tmp/cakravia-test-results"
LOAD_TEST_LOG="${TEST_RESULTS_DIR}/load-test.log"
DOWNTIME_LOG="${TEST_RESULTS_DIR}/downtime.log"

# Test statistics
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Logging functions
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

log_test() {
    echo -e "${MAGENTA}[$(date '+%Y-%m-%d %H:%M:%S')] 🧪 $1${NC}"
}

# Function to run a test and track results
run_test() {
    local test_name="$1"
    local test_function="$2"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    log_test "Running test: $test_name"
    
    if $test_function; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
        log_success "Test passed: $test_name"
        return 0
    else
        FAILED_TESTS=$((FAILED_TESTS + 1))
        log_error "Test failed: $test_name"
        return 1
    fi
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

# Function to wait for service to be available
wait_for_service() {
    local url="$1"
    local timeout="$2"
    local interval="${3:-5}"
    
    local count=0
    local max_count=$((timeout / interval))
    
    while [ $count -lt $max_count ]; do
        if curl -f -s "$url" > /dev/null 2>&1; then
            return 0
        fi
        sleep $interval
        count=$((count + 1))
    done
    
    return 1
}

# Function to get current active deployment
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

# Test 1: Prerequisites check
test_prerequisites() {
    log "Checking prerequisites..."
    
    # Check Docker
    if ! docker info > /dev/null 2>&1; then
        log_error "Docker is not running"
        return 1
    fi
    
    # Check required files
    local required_files=(
        "docker-compose.blue-green.yml"
        "scripts/deploy-zero-downtime.sh"
        "scripts/rollback-deployment.sh"
        "scripts/monitor-deployment.sh"
        "nginx/nginx.blue-green.conf"
        "nginx/upstream.blue.template"
        "nginx/upstream.green.template"
    )
    
    for file in "${required_files[@]}"; do
        if [ ! -f "$file" ]; then
            log_error "Required file missing: $file"
            return 1
        fi
    done
    
    # Check if scripts are executable
    local scripts=(
        "scripts/deploy-zero-downtime.sh"
        "scripts/rollback-deployment.sh"
        "scripts/monitor-deployment.sh"
    )
    
    for script in "${scripts[@]}"; do
        if [ ! -x "$script" ]; then
            log_error "Script not executable: $script"
            return 1
        fi
    done
    
    log_success "All prerequisites met"
    return 0
}

# Test 2: Health endpoints functionality
test_health_endpoints() {
    log "Testing health endpoints..."
    
    # Wait for service to be available
    if ! wait_for_service "http://localhost:8080/api/health" 60; then
        log_error "Service not available"
        return 1
    fi
    
    # Test main health endpoint
    local health_response=$(curl -s http://localhost:8080/api/health 2>/dev/null || echo "")
    if [ -z "$health_response" ]; then
        log_error "Health endpoint not responding"
        return 1
    fi
    
    # Test readiness endpoint
    if ! curl -f -s http://localhost:8080/api/health/ready > /dev/null 2>&1; then
        log_warning "Readiness endpoint not responding (this might be expected during startup)"
    fi
    
    # Test liveness endpoint
    if ! curl -f -s http://localhost:8080/api/health/live > /dev/null 2>&1; then
        log_warning "Liveness endpoint not responding"
    fi
    
    # Test deployment status endpoint
    if ! curl -f -s http://localhost:8080/api/deployment/status > /dev/null 2>&1; then
        log_error "Deployment status endpoint not responding"
        return 1
    fi
    
    log_success "Health endpoints are functional"
    return 0
}

# Test 3: Load testing with continuous requests
test_load_during_deployment() {
    log "Starting load testing during deployment..."
    
    # Create results directory
    mkdir -p "$TEST_RESULTS_DIR"
    
    # Start load testing in background
    start_load_test &
    local load_test_pid=$!
    
    # Wait a bit for load test to establish baseline
    sleep 10
    
    # Perform deployment
    log "Performing deployment during load test..."
    local deployment_version="test-$(date +%Y%m%d-%H%M%S)"
    
    if ./scripts/deploy-zero-downtime.sh "$deployment_version"; then
        log_success "Deployment completed during load test"
    else
        log_error "Deployment failed during load test"
        kill $load_test_pid 2>/dev/null || true
        return 1
    fi
    
    # Let load test continue for a bit after deployment
    sleep 30
    
    # Stop load test
    kill $load_test_pid 2>/dev/null || true
    wait $load_test_pid 2>/dev/null || true
    
    # Analyze results
    analyze_load_test_results
}

# Function to start load testing
start_load_test() {
    log "Starting continuous load test..."
    local request_count=0
    local error_count=0
    local start_time=$(date +%s)
    
    while true; do
        for i in $(seq 1 $CONCURRENT_REQUESTS); do
            {
                local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
                local response_time_start=$(date +%s.%N)
                
                if curl -f -s http://localhost:8080/api/health > /dev/null 2>&1; then
                    local response_time_end=$(date +%s.%N)
                    local response_time=$(echo "$response_time_end - $response_time_start" | bc)
                    echo "$timestamp,SUCCESS,$response_time" >> "$LOAD_TEST_LOG"
                else
                    echo "$timestamp,FAILED,0" >> "$LOAD_TEST_LOG"
                    echo "$timestamp: Request failed" >> "$DOWNTIME_LOG"
                fi
            } &
        done
        
        wait
        request_count=$((request_count + CONCURRENT_REQUESTS))
        
        # Log progress every 100 requests
        if [ $((request_count % 100)) -eq 0 ]; then
            local current_time=$(date +%s)
            local elapsed=$((current_time - start_time))
            log "Load test progress: $request_count requests in ${elapsed}s"
        fi
        
        sleep $REQUEST_INTERVAL
    done
}

# Function to analyze load test results
analyze_load_test_results() {
    log "Analyzing load test results..."
    
    if [ ! -f "$LOAD_TEST_LOG" ]; then
        log_error "Load test log not found"
        return 1
    fi
    
    local total_requests=$(wc -l < "$LOAD_TEST_LOG")
    local failed_requests=$(grep -c "FAILED" "$LOAD_TEST_LOG" || echo "0")
    local success_requests=$((total_requests - failed_requests))
    local success_rate=$(echo "scale=2; $success_requests * 100 / $total_requests" | bc)
    
    # Calculate average response time
    local avg_response_time=$(grep "SUCCESS" "$LOAD_TEST_LOG" | cut -d',' -f3 | awk '{sum+=$1; count++} END {if(count>0) printf "%.3f", sum/count; else print "0"}')
    
    log_success "Load test results:"
    log_success "  Total requests: $total_requests"
    log_success "  Successful requests: $success_requests"
    log_success "  Failed requests: $failed_requests"
    log_success "  Success rate: ${success_rate}%"
    log_success "  Average response time: ${avg_response_time}s"
    
    # Check for downtime
    if [ -f "$DOWNTIME_LOG" ] && [ -s "$DOWNTIME_LOG" ]; then
        local downtime_events=$(wc -l < "$DOWNTIME_LOG")
        log_warning "Detected $downtime_events downtime events"
        
        # If more than 5% failure rate, consider it a problem
        if (( $(echo "$success_rate < 95" | bc -l) )); then
            log_error "Success rate below 95% - deployment may not be truly zero-downtime"
            return 1
        fi
    else
        log_success "No downtime detected during deployment!"
    fi
    
    return 0
}

# Test 4: Rollback functionality
test_rollback() {
    log "Testing rollback functionality..."
    
    local initial_deployment=$(get_active_deployment)
    log "Initial deployment: $initial_deployment"
    
    # Perform a deployment first
    local deployment_version="rollback-test-$(date +%Y%m%d-%H%M%S)"
    if ! ./scripts/deploy-zero-downtime.sh "$deployment_version"; then
        log_error "Failed to perform initial deployment for rollback test"
        return 1
    fi
    
    # Verify deployment switched
    local new_deployment=$(get_active_deployment)
    if [ "$new_deployment" = "$initial_deployment" ]; then
        log_error "Deployment did not switch slots"
        return 1
    fi
    
    log "Deployment switched from $initial_deployment to $new_deployment"
    
    # Wait a bit
    sleep 10
    
    # Test rollback
    if ! ./scripts/rollback-deployment.sh rollback "Test rollback" "previous"; then
        log_error "Rollback failed"
        return 1
    fi
    
    # Verify rollback
    local rolled_back_deployment=$(get_active_deployment)
    if [ "$rolled_back_deployment" != "$initial_deployment" ]; then
        log_error "Rollback did not restore original deployment"
        return 1
    fi
    
    log_success "Rollback test completed successfully"
    return 0
}

# Test 5: Monitoring functionality
test_monitoring() {
    log "Testing monitoring functionality..."
    
    # Test monitoring script
    if ! ./scripts/monitor-deployment.sh check; then
        log_error "Monitoring health check failed"
        return 1
    fi
    
    # Test status reporting
    local status_output=$(./scripts/monitor-deployment.sh status 2>/dev/null || echo "")
    if [ -z "$status_output" ]; then
        log_error "Monitoring status output is empty"
        return 1
    fi
    
    # Test deployment status script
    if ! ./scripts/rollback-deployment.sh status > /dev/null 2>&1; then
        log_error "Deployment status check failed"
        return 1
    fi
    
    log_success "Monitoring functionality is working"
    return 0
}

# Test 6: Container failover
test_container_failover() {
    log "Testing container failover..."
    
    local active_deployment=$(get_active_deployment)
    local active_container="cakravia-app-${active_deployment}"
    
    # Stop the active container to simulate failure
    log "Simulating container failure by stopping $active_container"
    docker stop "$active_container" > /dev/null 2>&1
    
    # Wait a bit and check if nginx fails over
    sleep 10
    
    # Check if service is still accessible (should fail over to backup)
    if curl -f -s http://localhost:8080/api/health > /dev/null 2>&1; then
        log_success "Service remained accessible during container failure"
    else
        log_warning "Service became inaccessible during container failure"
    fi
    
    # Restart the container
    log "Restarting $active_container"
    docker start "$active_container" > /dev/null 2>&1
    
    # Wait for it to be healthy
    if wait_for_service "http://localhost:8080/api/health" 60; then
        log_success "Container recovered successfully"
        return 0
    else
        log_error "Container failed to recover"
        return 1
    fi
}

# Test 7: Configuration validation
test_configuration_validation() {
    log "Testing configuration validation..."
    
    # Test nginx configuration
    if ! docker exec cakravia-nginx nginx -t > /dev/null 2>&1; then
        log_error "Nginx configuration is invalid"
        return 1
    fi
    
    # Test Docker Compose configuration
    if ! docker-compose -f docker-compose.blue-green.yml config > /dev/null 2>&1; then
        log_error "Docker Compose configuration is invalid"
        return 1
    fi
    
    # Test upstream templates
    for template in nginx/upstream.blue.template nginx/upstream.green.template; do
        if ! grep -q "{{TIMESTAMP}}" "$template" || ! grep -q "{{VERSION}}" "$template"; then
            log_error "Template $template is missing required placeholders"
            return 1
        fi
    done
    
    log_success "Configuration validation passed"
    return 0
}

# Function to generate test report
generate_test_report() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local report_file="${TEST_RESULTS_DIR}/test-report.txt"
    
    cat > "$report_file" << EOF
=====================================
Cakravia Zero-Downtime Deployment Test Report
=====================================
Generated: $timestamp

Test Summary:
  Total Tests: $TOTAL_TESTS
  Passed: $PASSED_TESTS
  Failed: $FAILED_TESTS
  Success Rate: $(echo "scale=2; $PASSED_TESTS * 100 / $TOTAL_TESTS" | bc)%

Test Environment:
  Active Deployment: $(get_active_deployment)
  Docker Version: $(docker --version)
  System: $(uname -a)

Container Status:
$(docker-compose -f docker-compose.blue-green.yml ps)

Recent Deployment History:
$(./scripts/rollback-deployment.sh history 2>/dev/null || echo "No history available")

Health Status:
$(curl -s http://localhost:8080/api/deployment/status | jq '.' 2>/dev/null || echo "Could not fetch status")

Load Test Results:
$([ -f "$LOAD_TEST_LOG" ] && analyze_load_test_results || echo "No load test data available")

=====================================
EOF
    
    log_success "Test report generated: $report_file"
}

# Function to cleanup test environment
cleanup_test_environment() {
    log "Cleaning up test environment..."
    
    # Stop any running load tests
    pkill -f "curl.*localhost:8080" 2>/dev/null || true
    
    # Clean up test files
    rm -f /tmp/cakravia-test-* 2>/dev/null || true
    
    log_success "Test environment cleaned up"
}

# Main test function
main() {
    echo -e "${GREEN}🧪 Starting Zero-Downtime Deployment End-to-End Tests${NC}"
    echo -e "${BLUE}Test Duration: ${TEST_DURATION}s${NC}"
    echo -e "${BLUE}Concurrent Requests: ${CONCURRENT_REQUESTS}${NC}"
    echo -e "${BLUE}Results Directory: ${TEST_RESULTS_DIR}${NC}"
    echo ""
    
    # Ensure we're in the correct directory
    if [ -d "/opt/cakravia" ]; then
        cd /opt/cakravia
    fi
    
    # Create results directory
    mkdir -p "$TEST_RESULTS_DIR"
    
    # Cleanup previous test artifacts
    cleanup_test_environment
    
    # Run tests
    run_test "Prerequisites Check" test_prerequisites
    run_test "Health Endpoints" test_health_endpoints
    run_test "Configuration Validation" test_configuration_validation
    run_test "Monitoring Functionality" test_monitoring
    run_test "Load Testing During Deployment" test_load_during_deployment
    run_test "Rollback Functionality" test_rollback
    run_test "Container Failover" test_container_failover
    
    # Generate report
    generate_test_report
    
    # Print summary
    echo ""
    echo -e "${GREEN}🎉 Test Summary:${NC}"
    echo -e "${GREEN}   Total Tests: ${TOTAL_TESTS}${NC}"
    echo -e "${GREEN}   Passed: ${PASSED_TESTS}${NC}"
    if [ $FAILED_TESTS -gt 0 ]; then
        echo -e "${RED}   Failed: ${FAILED_TESTS}${NC}"
    else
        echo -e "${GREEN}   Failed: ${FAILED_TESTS}${NC}"
    fi
    
    local success_rate=$(echo "scale=1; $PASSED_TESTS * 100 / $TOTAL_TESTS" | bc)
    echo -e "${GREEN}   Success Rate: ${success_rate}%${NC}"
    
    if [ $FAILED_TESTS -eq 0 ]; then
        echo -e "${GREEN}   Status: ✅ ALL TESTS PASSED${NC}"
        return 0
    else
        echo -e "${RED}   Status: ❌ SOME TESTS FAILED${NC}"
        return 1
    fi
}

# Handle script options
case "${1:-test}" in
    test)
        main
        ;;
    load)
        log "Running load test only..."
        mkdir -p "$TEST_RESULTS_DIR"
        start_load_test &
        local pid=$!
        sleep ${2:-60}
        kill $pid
        analyze_load_test_results
        ;;
    monitor)
        log "Running monitoring test only..."
        test_monitoring
        ;;
    rollback)
        log "Running rollback test only..."
        test_rollback
        ;;
    cleanup)
        cleanup_test_environment
        ;;
    help|*)
        echo "Zero-Downtime Deployment Testing Script"
        echo ""
        echo "Usage: $0 [command] [options]"
        echo ""
        echo "Commands:"
        echo "  test      Run all tests (default)"
        echo "  load [duration]   Run load test only"
        echo "  monitor   Run monitoring test only"
        echo "  rollback  Run rollback test only"
        echo "  cleanup   Clean up test environment"
        echo "  help      Show this help message"
        ;;
esac