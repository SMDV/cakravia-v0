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

# Function to determine which containers are running
get_running_containers() {
    local blue_running=false
    local green_running=false
    
    if is_container_running "cakravia-app-blue"; then
        blue_running=true
    fi
    
    if is_container_running "cakravia-app-green"; then
        green_running=true
    fi
    
    echo "${blue_running},${green_running}"
}

# Function to create dynamic nginx configuration
create_dynamic_nginx_config() {
    local target_deployment=$1
    local version=$2
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    
    log "Creating dynamic nginx configuration for ${target_deployment}..."
    
    # Verify target container is actually running
    if ! is_container_running "cakravia-app-${target_deployment}"; then
        log_error "Target container cakravia-app-${target_deployment} is not running!"
        return 1
    fi
    
    # Get running container status
    local container_status=$(get_running_containers)
    local blue_running=$(echo $container_status | cut -d',' -f1)
    local green_running=$(echo $container_status | cut -d',' -f2)
    
    log "Container status - Blue: ${blue_running}, Green: ${green_running}"
    
    # Create base configuration
    cat > nginx/nginx.conf << 'EOF'
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging with deployment tracking
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for" '
                    'upstream_addr="$upstream_addr" '
                    'upstream_response_time=$upstream_response_time '
                    'upstream_status=$upstream_status';

    log_format deployment '$time_local: $upstream_addr responded with $upstream_status in $upstream_response_time seconds';

    access_log /var/log/nginx/access.log main;
    access_log /var/log/nginx/deployment.log deployment;

    # Basic Settings
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 20M;

    # Gzip Settings
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_comp_level 6;
    gzip_types
        application/atom+xml
        application/javascript
        application/json
        application/rss+xml
        application/vnd.ms-fontobject
        application/x-font-ttf
        application/x-web-app-manifest+json
        application/xhtml+xml
        application/xml
        font/opentype
        image/svg+xml
        image/x-icon
        text/css
        text/plain
        text/x-component;

    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";

    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

    # Upstream configuration - dynamically generated based on running containers
    upstream nextjs_app {
        least_conn;
        
        # ACTIVE_DEPLOYMENT: {{TARGET_DEPLOYMENT}}
        # DEPLOYMENT_TIMESTAMP: {{TIMESTAMP}}
        # DEPLOYMENT_VERSION: {{VERSION}}
        
EOF

    # Add primary server (target deployment)
    echo "        server cakravia-app-${target_deployment}:3000 max_fails=3 fail_timeout=30s;" >> nginx/nginx.conf
    
    # Add backup server if the other container is running
    local backup_deployment=$(get_inactive_deployment "$target_deployment")
    if [ "$target_deployment" = "blue" ] && [ "$green_running" = "true" ]; then
        echo "        server cakravia-app-green:3000 max_fails=3 fail_timeout=30s backup;" >> nginx/nginx.conf
        log "Added green as backup server"
    elif [ "$target_deployment" = "green" ] && [ "$blue_running" = "true" ]; then
        echo "        server cakravia-app-blue:3000 max_fails=3 fail_timeout=30s backup;" >> nginx/nginx.conf
        log "Added blue as backup server"
    fi
    
    # Continue with the rest of the configuration
    cat >> nginx/nginx.conf << 'EOF'
        
        keepalive 32;
        keepalive_requests 1000;
        keepalive_timeout 60s;
    }

    # Health check upstream for monitoring
    upstream health_check {
EOF

    # Add health check servers based on what's running
    echo "        server cakravia-app-${target_deployment}:3000;" >> nginx/nginx.conf
    if [ "$target_deployment" = "blue" ] && [ "$green_running" = "true" ]; then
        echo "        server cakravia-app-green:3000 backup;" >> nginx/nginx.conf
    elif [ "$target_deployment" = "green" ] && [ "$blue_running" = "true" ]; then
        echo "        server cakravia-app-blue:3000 backup;" >> nginx/nginx.conf
    fi
    
    cat >> nginx/nginx.conf << 'EOF'
        keepalive 8;
    }

    # Internal health check server
    server {
        listen 8081;
        server_name localhost;
        
        location /health-check {
            access_log off;
            proxy_pass http://health_check/api/health;
            proxy_connect_timeout 5s;
            proxy_send_timeout 5s;
            proxy_read_timeout 5s;
        }
        
        location /nginx-status {
            stub_status on;
            access_log off;
            allow 127.0.0.1;
            allow 172.16.0.0/12;
            deny all;
        }
    }

    # HTTP server
    server {
        listen 80;
        server_name cakravia.com www.cakravia.com;
        
        # Health check endpoint (for load balancer)
        location /api/health {
            proxy_pass http://nextjs_app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            access_log off;
        }
        
        # Let's Encrypt challenge
        location ^~ /.well-known/acme-challenge/ {
            root /var/www/html;
            try_files $uri =404;
        }

        # Main application
        location / {
            proxy_pass http://nextjs_app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_set_header X-Forwarded-Port $server_port;
            
            # WebSocket support
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            
            # Enhanced upstream configuration
            proxy_next_upstream error timeout invalid_header http_500 http_502 http_503 http_504;
            proxy_next_upstream_tries 2;
            proxy_next_upstream_timeout 10s;
            
            # Timeouts
            proxy_connect_timeout 30s;
            proxy_send_timeout 30s;
            proxy_read_timeout 30s;
            
            # Buffer settings
            proxy_buffering on;
            proxy_buffer_size 4k;
            proxy_buffers 8 4k;
        }
    }
}
EOF

    # Replace placeholders
    sed -i "s/{{TARGET_DEPLOYMENT}}/$target_deployment/g" nginx/nginx.conf
    sed -i "s/{{TIMESTAMP}}/$timestamp/g" nginx/nginx.conf
    sed -i "s/{{VERSION}}/$version/g" nginx/nginx.conf
    
    log_success "Dynamic nginx configuration created for ${target_deployment}"
    return 0
}

# Function to update nginx configuration
update_nginx_configuration() {
    local target_deployment=$1
    local version=$2

    log "Updating nginx configuration to point to ${target_deployment}..."

    # Create backup of current configuration
    cp nginx/nginx.conf nginx/nginx.conf.backup

    # Create dynamic configuration based on running containers
    if ! create_dynamic_nginx_config "$target_deployment" "$version"; then
        log_error "Failed to create dynamic nginx configuration"
        return 1
    fi

    # Since nginx.conf is mounted as a volume, we need to restart the container
    # The restart will be quick because nginx is lightweight
    log "Restarting nginx container to apply new configuration..."
    if docker-compose -f docker-compose.blue-green.yml restart nginx > /dev/null 2>&1; then
        # Wait for nginx to be ready
        sleep 3

        # Verify nginx is running and can reach the target
        if docker ps --format 'table {{.Names}}' | grep -q "^cakravia-nginx$"; then
            # Test connectivity to target deployment
            if docker exec cakravia-nginx curl -f -s "http://cakravia-app-${target_deployment}:3000/api/health" > /dev/null 2>&1; then
                log_success "Nginx configuration updated and nginx restarted successfully"
                return 0
            else
                log_warning "Nginx restarted but cannot reach target deployment yet"
                # Give it a bit more time
                sleep 5
                if docker exec cakravia-nginx curl -f -s "http://cakravia-app-${target_deployment}:3000/api/health" > /dev/null 2>&1; then
                    log_success "Nginx can now reach target deployment"
                    return 0
                fi
            fi
        fi
    fi

    log_error "Nginx restart failed! Restoring backup..."
    cp nginx/nginx.conf.backup nginx/nginx.conf
    docker-compose -f docker-compose.blue-green.yml restart nginx > /dev/null 2>&1
    return 1
}

# Function to rollback deployment
rollback_deployment() {
    local active_deployment=$1
    local inactive_deployment=$2

    log_warning "Initiating rollback to ${active_deployment}..."

    # Restore previous nginx configuration
    if [ -f "nginx/nginx.conf.backup" ]; then
        cp nginx/nginx.conf.backup nginx/nginx.conf
        docker-compose -f docker-compose.blue-green.yml restart nginx > /dev/null 2>&1
        sleep 3
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
    
    # Ensure nginx is running first
    log "Ensuring nginx container is running..."
    if ! is_container_running "cakravia-nginx"; then
        log "Starting nginx container..."
        if ! docker-compose -f docker-compose.blue-green.yml up -d nginx; then
            log_error "Failed to start nginx container"
            exit 1
        fi
        
        # Wait for nginx to be ready
        log "Waiting for nginx to be ready..."
        sleep 10
        
        if ! is_container_running "cakravia-nginx"; then
            log_error "Nginx container failed to start"
            exit 1
        fi
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

    # Restart nginx to refresh DNS cache for the new container
    # This is needed because nginx's depends_on uses 'service_started' for green,
    # which means nginx may have stale DNS entries for newly-healthy containers
    log "Restarting nginx to refresh DNS cache for ${inactive_deployment} container..."
    if docker-compose -f docker-compose.blue-green.yml restart nginx > /dev/null 2>&1; then
        # Wait for nginx to stabilize and reload its DNS cache
        sleep 5
        if ! is_container_running "cakravia-nginx"; then
            log_error "Nginx failed to restart after DNS cache refresh"
            rollback_deployment "$active_deployment" "$inactive_deployment"
            exit 1
        fi
        log_success "Nginx restarted successfully, DNS cache refreshed"
    else
        log_warning "Nginx restart failed, continuing with existing DNS cache..."
    fi

    # Verify container is still running and reachable before switching traffic
    log "Final verification before traffic switch..."
    if ! is_container_running "cakravia-app-${inactive_deployment}"; then
        log_error "Target container stopped unexpectedly before traffic switch"
        rollback_deployment "$active_deployment" "$inactive_deployment"
        exit 1
    fi
    
    # Verify nginx container is running before network test
    if ! is_container_running "cakravia-nginx"; then
        log_error "Nginx container is not running - cannot verify network connectivity"
        rollback_deployment "$active_deployment" "$inactive_deployment"
        exit 1
    fi
    
    # Wait for nginx container to stabilize if it was recently restarted
    local nginx_status=$(docker inspect cakravia-nginx --format='{{.State.Status}}' 2>/dev/null || echo "unknown")
    if [ "$nginx_status" = "restarting" ]; then
        log "Waiting for nginx container to stabilize..."
        sleep 10
        if ! is_container_running "cakravia-nginx"; then
            log_error "Nginx container failed to stabilize"
            rollback_deployment "$active_deployment" "$inactive_deployment"
            exit 1
        fi
    fi
    
    # Verify container is reachable via Docker network
    if ! docker exec cakravia-nginx curl -f -s "http://cakravia-app-${inactive_deployment}:3000/api/health" > /dev/null 2>&1; then
        log_warning "Target container not reachable via Docker network - checking network configuration..."
        
        # Check if containers are on the same network
        local nginx_networks=$(docker inspect cakravia-nginx --format='{{range $k, $v := .NetworkSettings.Networks}}{{$k}} {{end}}' 2>/dev/null || echo "")
        local app_networks=$(docker inspect "cakravia-app-${inactive_deployment}" --format='{{range $k, $v := .NetworkSettings.Networks}}{{$k}} {{end}}' 2>/dev/null || echo "")
        
        log "Nginx networks: ${nginx_networks}"
        log "App networks: ${app_networks}"
        
        # Try to connect to the same network if needed
        local main_network="cakravia-network"
        if echo "$nginx_networks" | grep -q "$main_network" && ! echo "$app_networks" | grep -q "$main_network"; then
            log "Connecting ${inactive_deployment} container to ${main_network}..."
            if docker network connect "$main_network" "cakravia-app-${inactive_deployment}" 2>/dev/null; then
                sleep 2
                # Retry the connectivity test
                if docker exec cakravia-nginx curl -f -s "http://cakravia-app-${inactive_deployment}:3000/api/health" > /dev/null 2>&1; then
                    log_success "Network connectivity restored after connecting to correct network"
                else
                    log_error "Still cannot reach container after network connection"
                    rollback_deployment "$active_deployment" "$inactive_deployment"
                    exit 1
                fi
            else
                log_error "Failed to connect container to network"
                rollback_deployment "$active_deployment" "$inactive_deployment"
                exit 1
            fi
        else
            log_error "Target container not reachable via Docker network"
            rollback_deployment "$active_deployment" "$inactive_deployment"
            exit 1
        fi
    fi
    
    # Switch traffic to new deployment
    log "Switching traffic to ${inactive_deployment}..."
    if ! update_nginx_configuration "$inactive_deployment" "$version"; then
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