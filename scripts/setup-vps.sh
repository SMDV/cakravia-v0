#!/bin/bash

# VPS Setup Script for Cakravia
# This script sets up a fresh Ubuntu 24.04 VPS for Cakravia deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Setting up VPS for Cakravia...${NC}"

# Update system
echo -e "${YELLOW}📦 Updating system packages...${NC}"
sudo apt update && sudo apt upgrade -y

# Install essential packages
echo -e "${YELLOW}📦 Installing essential packages...${NC}"
sudo apt install -y curl wget git htop ufw fail2ban

# Install Docker
echo -e "${YELLOW}🐳 Installing Docker...${NC}"
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
echo -e "${YELLOW}🐙 Installing Docker Compose...${NC}"
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Nginx
echo -e "${YELLOW}🌐 Installing Nginx...${NC}"
sudo apt install -y nginx

# Install Certbot for Let's Encrypt
echo -e "${YELLOW}🔒 Installing Certbot...${NC}"
sudo apt install -y certbot python3-certbot-nginx

# Configure UFW firewall
echo -e "${YELLOW}🔥 Configuring firewall...${NC}"
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

# Create application directory
echo -e "${YELLOW}📁 Creating application directory...${NC}"
sudo mkdir -p /opt/cakravia
sudo chown $USER:$USER /opt/cakravia

# Clone repository (you'll need to do this manually with your credentials)
echo -e "${YELLOW}📥 Instructions for cloning repository:${NC}"
echo -e "1. cd /opt/cakravia"
echo -e "2. git clone https://github.com/yourusername/cakravia-v0.git ."
echo -e "3. Copy your environment variables to .env.production"

# Configure Nginx
echo -e "${YELLOW}🌐 Configuring Nginx...${NC}"
sudo rm -f /etc/nginx/sites-enabled/default

# Create Nginx configuration for Let's Encrypt
cat > /tmp/cakravia-nginx.conf << 'EOF'
server {
    listen 80;
    server_name cakravia.com www.cakravia.com;
    
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

sudo mv /tmp/cakravia-nginx.conf /etc/nginx/sites-available/cakravia
sudo ln -s /etc/nginx/sites-available/cakravia /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# Create SSL certificate directory
sudo mkdir -p /etc/nginx/ssl

# Instructions for SSL setup
echo -e "${YELLOW}🔒 SSL Certificate Setup Instructions:${NC}"
echo -e "1. Run: sudo certbot --nginx -d cakravia.com -d www.cakravia.com"
echo -e "2. Follow the prompts to get your SSL certificate"
echo -e "3. Test auto-renewal: sudo certbot renew --dry-run"

# Set up log rotation
echo -e "${YELLOW}📜 Setting up log rotation...${NC}"
cat > /tmp/cakravia-logrotate << 'EOF'
/opt/cakravia/nginx/logs/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 root root
    postrotate
        docker-compose -f /opt/cakravia/docker-compose.yml exec nginx nginx -s reload
    endscript
}
EOF

sudo mv /tmp/cakravia-logrotate /etc/logrotate.d/cakravia

# Create system service for Docker Compose (optional)
echo -e "${YELLOW}🎯 Creating systemd service...${NC}"
cat > /tmp/cakravia.service << 'EOF'
[Unit]
Description=Cakravia Application
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/cakravia
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

sudo mv /tmp/cakravia.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable cakravia

# Set up monitoring script
echo -e "${YELLOW}📊 Setting up monitoring script...${NC}"
cat > /opt/cakravia/monitor.sh << 'EOF'
#!/bin/bash
# Simple monitoring script for Cakravia

echo "=== Cakravia System Status ==="
echo "Date: $(date)"
echo

echo "=== Docker Containers ==="
docker-compose ps

echo
echo "=== System Resources ==="
echo "Memory Usage:"
free -h
echo
echo "Disk Usage:"
df -h
echo
echo "CPU Usage:"
top -bn1 | grep "Cpu(s)"

echo
echo "=== Application Health ==="
curl -s http://localhost:3000/api/health | jq . || echo "Health check failed"

echo
echo "=== Recent Logs ==="
docker-compose logs --tail=10
EOF

chmod +x /opt/cakravia/monitor.sh

echo -e "${GREEN}✅ VPS setup completed!${NC}"
echo -e "${GREEN}🔄 Please log out and log back in to apply Docker group changes.${NC}"
echo -e "${GREEN}📋 Next steps:${NC}"
echo -e "1. Clone your repository to /opt/cakravia"
echo -e "2. Set up your environment variables in .env.production"
echo -e "3. Run SSL certificate setup: sudo certbot --nginx -d cakravia.com -d www.cakravia.com"
echo -e "4. Deploy your application: ./scripts/deploy.sh"
echo -e "5. Monitor with: ./monitor.sh"