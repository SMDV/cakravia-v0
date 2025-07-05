#!/bin/bash

# Cakravia Deployment Script
# This script handles the deployment of the Cakravia application

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting Cakravia deployment...${NC}"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker and try again.${NC}"
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker Compose is not installed. Please install Docker Compose and try again.${NC}"
    exit 1
fi

# Check if this is first deployment
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}❌ docker-compose.yml not found. Are you in the correct directory?${NC}"
    exit 1
fi

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env not found. Creating from template...${NC}"
    if [ -f .env.example ]; then
        cp .env.example .env
        echo -e "${RED}❌ Please update .env with your environment variables and run again.${NC}"
        exit 1
    else
        # Create basic .env
        cat > .env << EOF
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id_here
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
EOF
        echo -e "${RED}❌ Created .env template. Please update with your environment variables and run again.${NC}"
        exit 1
    fi
fi

# Create nginx directories if they don't exist
echo -e "${YELLOW}📁 Creating nginx directories...${NC}"
mkdir -p nginx/ssl nginx/logs

# Check SSL certificates and create temporary HTTP config if missing
if [ ! -f "nginx/ssl/fullchain.pem" ] || [ ! -f "nginx/ssl/privkey.pem" ]; then
    echo -e "${YELLOW}⚠️  SSL certificates not found. Creating temporary HTTP-only nginx config...${NC}"
    
    # Backup existing config if it exists
    if [ -f "nginx/nginx.conf" ]; then
        cp nginx/nginx.conf nginx/nginx.conf.backup
    fi
    
    # Create temporary HTTP-only config
    cat > nginx/nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    upstream nextjs_app {
        server app:3000;
        keepalive 32;
    }

    server {
        listen 80;
        server_name cakravia.com www.cakravia.com;
        
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
            
            # Timeouts
            proxy_connect_timeout 30s;
            proxy_send_timeout 30s;
            proxy_read_timeout 30s;
        }
        
        # Health check endpoint
        location /api/health {
            proxy_pass http://nextjs_app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            access_log off;
        }
    }
}
EOF
    echo -e "${RED}⚠️  Running with HTTP-only configuration. Please install SSL certificates for HTTPS.${NC}"
fi

# Stop existing containers and clean up networks
echo -e "${YELLOW}🛑 Stopping existing containers...${NC}"
docker-compose down --volumes --remove-orphans || true

# Clean up Docker system including networks and images
echo -e "${YELLOW}🧹 Cleaning up Docker system...${NC}"
docker system prune -f || true
docker network prune -f || true

# Build new images
echo -e "${YELLOW}🏗️  Building new Docker images...${NC}"
docker-compose build --no-cache

# Start containers
echo -e "${YELLOW}🚀 Starting containers...${NC}"
docker-compose up -d

# Wait for containers to be ready
echo -e "${YELLOW}⏳ Waiting for containers to be ready...${NC}"
sleep 30

# Check container status
echo -e "${YELLOW}📊 Checking container status...${NC}"
docker-compose ps

# Verify both containers are running
if ! docker-compose ps | grep -q "cakravia-app.*Up"; then
    echo -e "${RED}❌ App container is not running!${NC}"
    docker-compose logs app
    exit 1
fi

if ! docker-compose ps | grep -q "cakravia-nginx.*Up"; then
    echo -e "${RED}❌ Nginx container is not running!${NC}"
    docker-compose logs nginx
    exit 1
fi

# Test health endpoint with retry (both direct and through nginx)
echo -e "${YELLOW}🏥 Testing health endpoints...${NC}"

# Test direct app health
for i in {1..5}; do
    if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Direct app health check passed!${NC}"
        break
    else
        echo -e "${YELLOW}Direct health check failed, retrying in 10 seconds... ($i/5)${NC}"
        sleep 10
    fi
done

# Test nginx proxy health
for i in {1..5}; do
    if curl -f http://localhost:8080/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Nginx proxy health check passed!${NC}"
        break
    else
        echo -e "${YELLOW}Nginx proxy health check failed, retrying in 10 seconds... ($i/5)${NC}"
        sleep 10
    fi
done

# Final checks
if ! curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    echo -e "${RED}❌ Direct health check failed after 5 attempts!${NC}"
    echo -e "${YELLOW}📜 App container logs:${NC}"
    docker-compose logs app --tail=50
    exit 1
fi

if ! curl -f http://localhost:8080/api/health > /dev/null 2>&1; then
    echo -e "${RED}❌ Nginx proxy health check failed after 5 attempts!${NC}"
    echo -e "${YELLOW}📜 Nginx container logs:${NC}"
    docker-compose logs nginx --tail=50
    exit 1
fi

echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"

# Show appropriate URL based on SSL availability
if [ -f "nginx/ssl/fullchain.pem" ] && [ -f "nginx/ssl/privkey.pem" ]; then
    echo -e "${GREEN}🌐 Application is available at: https://cakravia.com${NC}"
else
    echo -e "${GREEN}🌐 Application is available at: http://cakravia.com${NC}"
    echo -e "${YELLOW}⚠️  SSL certificates not installed. For HTTPS, please install SSL certificates in nginx/ssl/${NC}"
fi

# Show container logs
echo -e "${YELLOW}📜 Recent logs:${NC}"
docker-compose logs --tail=20