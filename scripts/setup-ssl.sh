#!/bin/bash

# SSL Certificate Setup Script using Let's Encrypt
# This script sets up SSL certificates for cakravia.com

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔐 Setting up SSL certificates for cakravia.com...${NC}"

# Check if domain is accessible
echo -e "${YELLOW}🌐 Checking domain accessibility...${NC}"
if ! curl -f http://cakravia.com/api/health > /dev/null 2>&1; then
    echo -e "${RED}❌ Domain cakravia.com is not accessible via HTTP. Please ensure the site is running first.${NC}"
    exit 1
fi

# Install certbot if not already installed
echo -e "${YELLOW}📦 Installing certbot...${NC}"
if ! command -v certbot > /dev/null 2>&1; then
    # For Ubuntu/Debian
    if command -v apt-get > /dev/null 2>&1; then
        sudo apt-get update
        sudo apt-get install -y certbot
    # For CentOS/RHEL
    elif command -v yum > /dev/null 2>&1; then
        sudo yum install -y certbot
    else
        echo -e "${RED}❌ Unable to install certbot. Please install it manually.${NC}"
        exit 1
    fi
fi

# Create webroot directory for challenges
echo -e "${YELLOW}📁 Creating webroot directory...${NC}"
sudo mkdir -p /var/www/html/.well-known/acme-challenge

# Update nginx config to handle ACME challenges
echo -e "${YELLOW}🔧 Updating nginx configuration for ACME challenges...${NC}"
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
        
        # Let's Encrypt challenge
        location ^~ /.well-known/acme-challenge/ {
            root /var/www/html;
            try_files $uri =404;
        }
        
        # All other traffic to app
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

# Update docker-compose to mount webroot
echo -e "${YELLOW}🐳 Updating docker-compose for webroot...${NC}"
cp docker-compose.yml docker-compose.yml.backup

# Add webroot volume to nginx service
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  app:
    build: 
      context: .
      dockerfile: Dockerfile
    container_name: cakravia-app
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_GOOGLE_CLIENT_ID=${NEXT_PUBLIC_GOOGLE_CLIENT_ID}
    networks:
      - cakravia-network
    mem_limit: 512m
    cpus: 1.0
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:3000/api/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s

  nginx:
    image: nginx:alpine
    container_name: cakravia-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - ./nginx/logs:/var/log/nginx
      - /var/www/html:/var/www/html:ro
    networks:
      - cakravia-network
    mem_limit: 64m
    depends_on:
      - app

networks:
  cakravia-network:
    driver: bridge

volumes:
  nginx-logs:
EOF

# Restart nginx with new config
echo -e "${YELLOW}🔄 Restarting nginx with ACME challenge support...${NC}"
docker-compose up -d nginx

# Wait for nginx to be ready
sleep 10

# Generate SSL certificates
echo -e "${YELLOW}🔐 Generating SSL certificates...${NC}"
sudo certbot certonly \
    --webroot \
    --webroot-path=/var/www/html \
    --email admin@cakravia.com \
    --agree-tos \
    --no-eff-email \
    --domains cakravia.com,www.cakravia.com

# Check if certificates were generated
if [ ! -f "/etc/letsencrypt/live/cakravia.com/fullchain.pem" ]; then
    echo -e "${RED}❌ SSL certificate generation failed!${NC}"
    exit 1
fi

# Copy certificates to nginx directory
echo -e "${YELLOW}📋 Copying certificates to nginx directory...${NC}"
sudo cp /etc/letsencrypt/live/cakravia.com/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/cakravia.com/privkey.pem nginx/ssl/
sudo chmod 644 nginx/ssl/fullchain.pem
sudo chmod 600 nginx/ssl/privkey.pem

# Restore original nginx config with SSL
echo -e "${YELLOW}🔧 Restoring full nginx configuration with SSL...${NC}"
if [ -f "nginx/nginx.conf.backup" ]; then
    cp nginx/nginx.conf.backup nginx/nginx.conf
else
    echo -e "${RED}❌ Original nginx config backup not found!${NC}"
    exit 1
fi

# Restart nginx with SSL config
echo -e "${YELLOW}🔄 Restarting nginx with SSL configuration...${NC}"
docker-compose restart nginx

# Wait for nginx to be ready
sleep 10

# Test SSL
echo -e "${YELLOW}🧪 Testing SSL certificate...${NC}"
if curl -f https://cakravia.com/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ SSL certificate is working!${NC}"
    echo -e "${GREEN}🌐 Your site is now available at: https://cakravia.com${NC}"
else
    echo -e "${RED}❌ SSL test failed. Check nginx logs:${NC}"
    docker-compose logs nginx
    exit 1
fi

echo -e "${GREEN}🎉 SSL setup completed successfully!${NC}"
echo -e "${YELLOW}📝 Note: Certificates will expire in 90 days. Set up auto-renewal with crontab:${NC}"
echo -e "${YELLOW}   sudo crontab -e${NC}"
echo -e "${YELLOW}   Add: 0 12 * * * /usr/bin/certbot renew --quiet --post-hook \"cd /opt/cakravia && ./scripts/copy-ssl.sh\"${NC}"