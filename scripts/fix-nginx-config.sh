#!/bin/bash

# Fix Nginx Configuration for VPS Restart Scenarios
# This script creates a robust nginx configuration that handles missing containers gracefully

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Function to create safe nginx configuration
create_safe_nginx_config() {
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    local version=${1:-"restart-$(date +%Y%m%d-%H%M%S)"}
    
    log "Creating safe nginx configuration..."
    
    # Get running container status
    local container_status=$(get_running_containers)
    local blue_running=$(echo $container_status | cut -d',' -f1)
    local green_running=$(echo $container_status | cut -d',' -f2)
    
    log "Container status - Blue: ${blue_running}, Green: ${green_running}"
    
    # Create backup of current configuration
    if [ -f "nginx/nginx.conf" ]; then
        cp nginx/nginx.conf nginx/nginx.conf.backup.$(date +%Y%m%d-%H%M%S)
    fi
    
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
        
        # ACTIVE_DEPLOYMENT: auto-detected
        # DEPLOYMENT_TIMESTAMP: {{TIMESTAMP}}
        # DEPLOYMENT_VERSION: {{VERSION}}
        
EOF

    # Add servers based on what's running
    if [ "$blue_running" = "true" ] && [ "$green_running" = "true" ]; then
        # Both running - prefer green (latest deployment)
        echo "        server app-green:3000 max_fails=3 fail_timeout=30s;" >> nginx/nginx.conf
        echo "        server app-blue:3000 max_fails=3 fail_timeout=30s backup;" >> nginx/nginx.conf
        log "Both containers running - green primary, blue backup"
    elif [ "$blue_running" = "true" ]; then
        # Only blue running
        echo "        server app-blue:3000 max_fails=3 fail_timeout=30s;" >> nginx/nginx.conf
        log "Only blue container running"
    elif [ "$green_running" = "true" ]; then
        # Only green running
        echo "        server app-green:3000 max_fails=3 fail_timeout=30s;" >> nginx/nginx.conf
        log "Only green container running"
    else
        # Neither running - create fallback to localhost (will fail gracefully)
        echo "        server 127.0.0.1:3000 max_fails=1 fail_timeout=5s down;" >> nginx/nginx.conf
        log_warning "No containers running - created fallback configuration"
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
    if [ "$blue_running" = "true" ] && [ "$green_running" = "true" ]; then
        echo "        server app-green:3000;" >> nginx/nginx.conf
        echo "        server app-blue:3000 backup;" >> nginx/nginx.conf
    elif [ "$blue_running" = "true" ]; then
        echo "        server app-blue:3000;" >> nginx/nginx.conf
    elif [ "$green_running" = "true" ]; then
        echo "        server app-green:3000;" >> nginx/nginx.conf
    else
        echo "        server 127.0.0.1:3000 down;" >> nginx/nginx.conf
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
    sed -i "s/{{TIMESTAMP}}/$timestamp/g" nginx/nginx.conf
    sed -i "s/{{VERSION}}/$version/g" nginx/nginx.conf
    
    log_success "Safe nginx configuration created"
}

# Function to test and apply configuration
test_and_apply_config() {
    log "Testing nginx configuration..."
    
    # Test configuration by copying to container and testing
    if docker cp nginx/nginx.conf cakravia-nginx:/tmp/nginx.conf.test 2>/dev/null; then
        if docker exec cakravia-nginx nginx -t -c /tmp/nginx.conf.test > /dev/null 2>&1; then
            # Configuration is valid, apply it
            docker cp nginx/nginx.conf cakravia-nginx:/etc/nginx/nginx.conf
            
            # Reload nginx (zero downtime)
            if docker exec cakravia-nginx nginx -s reload > /dev/null 2>&1; then
                log_success "Nginx configuration updated and reloaded successfully"
                return 0
            else
                log_error "Nginx reload failed! Configuration test passed but reload failed"
                return 1
            fi
        else
            log_error "Nginx configuration test failed!"
            return 1
        fi
    else
        log_error "Failed to copy configuration to nginx container!"
        return 1
    fi
}

# Main function
main() {
    local version=${1:-"restart-$(date +%Y%m%d-%H%M%S)"}
    
    echo -e "${GREEN}🔧 Fixing Nginx Configuration for VPS Restart...${NC}"
    echo -e "${BLUE}Version: ${version}${NC}"
    echo -e "${BLUE}Timestamp: $(date)${NC}"
    
    # Check if nginx container is running
    if ! is_container_running "cakravia-nginx"; then
        log_error "Nginx container is not running. Please start it first."
        exit 1
    fi
    
    # Create safe configuration
    create_safe_nginx_config "$version"
    
    # Test and apply configuration
    if test_and_apply_config; then
        log_success "Nginx configuration fix completed successfully!"
        
        # Show container status
        log "Current container status:"
        docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Image}}'
        
        # Test health endpoint
        log "Testing health endpoint..."
        sleep 2
        if curl -f -s "http://localhost:8080/api/health" > /dev/null 2>&1; then
            log_success "Health endpoint is responding"
        else
            log_warning "Health endpoint not responding - this may be expected if no app containers are running"
        fi
        
    else
        log_error "Failed to apply nginx configuration fix"
        exit 1
    fi
}

# Run main function
main "$@"