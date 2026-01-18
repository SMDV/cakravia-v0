#!/bin/bash

# Recovery Script for Cakravia After Server Restart
# This script helps diagnose and recover from deployment issues after server reboot

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
COMPOSE_FILE="$PROJECT_DIR/docker-compose.blue-green.yml"
ENV_FILE="$PROJECT_DIR/.env"

# Check if we're in the right directory
if [ ! -f "$COMPOSE_FILE" ]; then
    log_error "docker-compose.blue-green.yml not found at $COMPOSE_FILE"
    log "Please run this script from the project root or ensure the script is in the scripts/ directory"
    exit 1
fi

cd "$PROJECT_DIR"

echo -e "${GREEN}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║     Cakravia Recovery Script - Post Server Restart         ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# ============================================================================
# STEP 1: Check Environment File
# ============================================================================
log "Step 1: Checking .env file..."
if [ ! -f "$ENV_FILE" ]; then
    log_error ".env file not found at $ENV_FILE"
    log "The .env file is REQUIRED for the application to start."
    log ""
    log "Please create the .env file with the following required variables:"
    log "  - NEXT_PUBLIC_GOOGLE_CLIENT_ID (required for health checks)"
    log ""
    log "You can create it from the example:"
    log "  cp .env.example .env"
    log "  nano .env  # Edit and add your values"
    log ""
    exit 1
else
    log_success ".env file found"

    # Check for required variables
    if grep -q "NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id_here" "$ENV_FILE" 2>/dev/null; then
        log_warning "NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set in .env"
        log "Please edit $ENV_FILE and set the actual Google Client ID"
        log "Without this variable, health checks will FAIL"
    elif grep -q "^NEXT_PUBLIC_GOOGLE_CLIENT_ID=" "$ENV_FILE" 2>/dev/null; then
        log_success "NEXT_PUBLIC_GOOGLE_CLIENT_ID is set"
    else
        log_warning "NEXT_PUBLIC_GOOGLE_CLIENT_ID not found in .env"
        log "This variable is REQUIRED for health checks to pass"
    fi
fi

# ============================================================================
# STEP 2: Check Docker
# ============================================================================
log ""
log "Step 2: Checking Docker..."
if ! docker info > /dev/null 2>&1; then
    log_error "Docker is not running"
    log "Please start Docker and run this script again"
    exit 1
fi
log_success "Docker is running"

# ============================================================================
# STEP 3: Check Container Status
# ============================================================================
log ""
log "Step 3: Checking container status..."

# Function to check container
check_container() {
    local container_name=$1
    local is_running=$(docker ps -q -f name="$container_name" | wc -l)

    if [ "$is_running" -eq 0 ]; then
        log_warning "$container_name is NOT running"
        return 1
    else
        log_success "$container_name is running"

        # Check health status
        local health_status=$(docker inspect --format='{{.State.Health.Status}}' "$container_name" 2>/dev/null || echo "none")
        if [ "$health_status" = "healthy" ]; then
            log_success "  └─ Health status: healthy"
        elif [ "$health_status" = "unhealthy" ]; then
            log_warning "  └─ Health status: UNHEALTHY"
        elif [ "$health_status" = "starting" ]; then
            log_warning "  └─ Health status: starting..."
        else
            log_warning "  └─ Health status: $health_status"
        fi
        return 0
    fi
}

# Check each container
BLUE_RUNNING=false
GREEN_RUNNING=false
NGINX_RUNNING=false

if check_container "cakravia-app-blue"; then
    BLUE_RUNNING=true
fi

if check_container "cakravia-app-green"; then
    GREEN_RUNNING=true
fi

if check_container "cakravia-nginx"; then
    NGINX_RUNNING=true
fi

# ============================================================================
# STEP 4: Diagnose Issues
# ============================================================================
log ""
log "Step 4: Diagnosing deployment state..."

if [ "$BLUE_RUNNING" = false ] && [ "$GREEN_RUNNING" = false ]; then
    log_error "NO app containers are running!"
    log ""
    log "Starting containers..."
    docker-compose -f "$COMPOSE_FILE" up -d app-blue nginx

    log ""
    log "Waiting for containers to start (90 seconds for health checks)..."
    for i in {1..18}; do
        echo -n "."
        sleep 5
    done
    echo ""

    # Re-check status
    if check_container "cakravia-app-blue"; then
        BLUE_RUNNING=true
    fi
fi

# ============================================================================
# STEP 5: Check Health Endpoints
# ============================================================================
log ""
log "Step 5: Checking health endpoints..."

# Function to test health endpoint
test_health() {
    local container_name=$1
    local port=$2

    if docker ps -q -f name="$container_name" | grep -q .; then
        local response=$(docker exec "$container_name" curl -s http://localhost:3000/api/health 2>/dev/null || echo "")

        if [ -n "$response" ]; then
            local status=$(echo "$response" | grep -o '"status":"[^"]*"' | cut -d'"' -f4 2>/dev/null || echo "unknown")
            if [ "$status" = "healthy" ]; then
                log_success "$container_name health check: healthy"
                return 0
            else
                log_warning "$container_name health check: $status"
                return 1
            fi
        else
            log_warning "$container_name health endpoint not responding"
            return 1
        fi
    fi
    return 1
}

# Test both containers
BLUE_HEALTHY=false
GREEN_HEALTHY=false

if [ "$BLUE_RUNNING" = true ]; then
    if test_health "cakravia-app-blue" 3000; then
        BLUE_HEALTHY=true
    fi
fi

if [ "$GREEN_RUNNING" = true ]; then
    if test_health "cakravia-app-green" 3001; then
        GREEN_HEALTHY=true
    fi
fi

# ============================================================================
# STEP 6: Check Nginx Configuration
# ============================================================================
log ""
log "Step 6: Checking nginx configuration..."

if [ "$NGINX_RUNNING" = true ]; then
    # Test if nginx can reach the app containers
    if [ "$BLUE_HEALTHY" = true ]; then
        if docker exec cakravia-nginx curl -s -f http://cakravia-app-blue:3000/api/health > /dev/null 2>&1; then
            log_success "Nginx can reach app-blue container"
        else
            log_warning "Nginx CANNOT reach app-blue container (network issue?)"
        fi
    fi

    if [ "$GREEN_HEALTHY" = true ]; then
        if docker exec cakravia-nginx curl -s -f http://cakravia-app-green:3000/api/health > /dev/null 2>&1; then
            log_success "Nginx can reach app-green container"
        else
            log_warning "Nginx CANNOT reach app-green container (network issue?)"
        fi
    fi
fi

# ============================================================================
# STEP 7: Check Container Logs for Errors
# ============================================================================
log ""
log "Step 7: Checking for errors in container logs..."

if [ "$BLUE_RUNNING" = true ]; then
    log ""
    log "Recent logs from cakravia-app-blue:"
    docker logs --tail=20 cakravia-app-blue 2>&1 | grep -i -E "(error|fail|unhealthy|missing)" || log "  No obvious errors found"
fi

if [ "$GREEN_RUNNING" = true ]; then
    log ""
    log "Recent logs from cakravia-app-green:"
    docker logs --tail=20 cakravia-app-green 2>&1 | grep -i -E "(error|fail|unhealthy|missing)" || log "  No obvious errors found"
fi

# ============================================================================
# STEP 8: Provide Recommendations
# ============================================================================
log ""
log "Step 8: Recovery recommendations..."

if [ "$BLUE_HEALTHY" = false ] && [ "$GREEN_HEALTHY" = false ]; then
    log_error "Both containers are unhealthy!"
    log ""
    log "Common causes and fixes:"
    log ""
    log "1. Missing NEXT_PUBLIC_GOOGLE_CLIENT_ID in .env:"
    log "   Edit $ENV_FILE and add the correct value"
    log "   Then restart: docker-compose -f $COMPOSE_FILE restart app-blue"
    log ""
    log "2. Container needs more time to start:"
    log "   Wait 2-3 minutes and check again"
    log ""
    log "3. Build issue:"
    log "   Rebuild: docker-compose -f $COMPOSE_FILE build --no-cache app-blue"
    log ""
    log "4. Memory/resource issue:"
    log "   Check: docker stats"
    log ""
    log "5. Network issue:"
    log "   Recreate network: docker network rm cakravia-network"
    log "                   docker-compose -f $COMPOSE_FILE up -d"
    log ""
elif [ "$NGINX_RUNNING" = false ]; then
    log_warning "Nginx is not running"
    log "   Start: docker-compose -f $COMPOSE_FILE up -d nginx"
elif [ "$BLUE_HEALTHY" = true ] || [ "$GREEN_HEALTHY" = true ]; then
    log_success "At least one container is healthy!"

    # Test through nginx
    if [ "$NGINX_RUNNING" = true ]; then
        log ""
        log "Testing application through nginx..."
        if curl -s -f http://localhost:8080/api/health > /dev/null 2>&1; then
            log_success "Application is accessible through nginx (port 8080)"
        else
            log_warning "Application NOT accessible through nginx"
        fi
    fi
fi

# ============================================================================
# FINAL STATUS
# ============================================================================
log ""
echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
log "Recovery check complete!"
echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
log ""
log "Container Status Summary:"
log "  app-blue:   $([ "$BLUE_RUNNING" = true ] && echo "Running" || echo "Stopped") $([ "$BLUE_HEALTHY" = true ] && echo "(Healthy)" || echo "([ "$BLUE_RUNNING" = true ] && echo "(Unhealthy)" || echo "")"
log "  app-green:  $([ "$GREEN_RUNNING" = true ] && echo "Running" || echo "Stopped") $([ "$GREEN_HEALTHY" = true ] && echo "(Healthy)" || echo "([ "$GREEN_RUNNING" = true ] && echo "(Unhealthy)" || echo "")"
log "  nginx:      $([ "$NGINX_RUNNING" = true ] && echo "Running" || echo "Stopped")"
log ""
log "Next steps:"
log "  1. If containers are healthy but app is not accessible, check nginx config"
log "  2. If containers are unhealthy, check .env file and restart containers"
log "  3. If issues persist, check logs: docker-compose -f $COMPOSE_FILE logs"
log "  4. As last resort, redeploy: trigger GitHub Actions workflow"
log ""
