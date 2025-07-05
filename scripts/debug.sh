#!/bin/bash

# Cakravia Debug Script
# This script helps troubleshoot deployment issues

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Cakravia Debug Information${NC}"
echo "=================================="

# System Information
echo -e "\n${YELLOW}📊 System Information:${NC}"
echo "Date: $(date)"
echo "User: $(whoami)"
echo "Directory: $(pwd)"

# Docker Information
echo -e "\n${YELLOW}🐳 Docker Information:${NC}"
if command -v docker > /dev/null 2>&1; then
    echo "Docker version: $(docker --version)"
    if docker info > /dev/null 2>&1; then
        echo "✅ Docker is running"
    else
        echo "❌ Docker is not running"
    fi
else
    echo "❌ Docker is not installed"
fi

if command -v docker-compose > /dev/null 2>&1; then
    echo "Docker Compose version: $(docker-compose --version)"
else
    echo "❌ Docker Compose is not installed"
fi

# Project Files
echo -e "\n${YELLOW}📁 Project Files:${NC}"
echo "Files in current directory:"
ls -la

echo -e "\nRequired files check:"
for file in "docker-compose.yml" "Dockerfile" ".env.production" "nginx/nginx.conf"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file missing"
    fi
done

# Environment Variables
echo -e "\n${YELLOW}🔧 Environment Variables:${NC}"
if [ -f ".env.production" ]; then
    echo "Environment file contents:"
    cat .env.production | sed 's/=.*/=***/' # Hide sensitive values
else
    echo "❌ .env.production file not found"
fi

# Container Status
echo -e "\n${YELLOW}📦 Container Status:${NC}"
if [ -f "docker-compose.yml" ]; then
    docker-compose ps 2>/dev/null || echo "No containers running"
else
    echo "❌ docker-compose.yml not found"
fi

# Container Logs
echo -e "\n${YELLOW}📜 Recent Container Logs:${NC}"
if [ -f "docker-compose.yml" ]; then
    echo "App container logs (last 20 lines):"
    docker-compose logs --tail=20 app 2>/dev/null || echo "No app container logs"
    
    echo -e "\nNginx container logs (last 20 lines):"
    docker-compose logs --tail=20 nginx 2>/dev/null || echo "No nginx container logs"
else
    echo "❌ docker-compose.yml not found"
fi

# Network Connectivity
echo -e "\n${YELLOW}🌐 Network Connectivity:${NC}"
echo "Testing localhost:3000..."
if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✅ App is responding on localhost:3000"
    curl -s http://localhost:3000/api/health | head -5
else
    echo "❌ App is not responding on localhost:3000"
fi

# System Resources
echo -e "\n${YELLOW}💾 System Resources:${NC}"
echo "Memory usage:"
free -h

echo -e "\nDisk usage:"
df -h

echo -e "\nDocker system info:"
docker system df 2>/dev/null || echo "Docker not available"

# Port Usage
echo -e "\n${YELLOW}🔌 Port Usage:${NC}"
echo "Ports 80, 443, 3000 usage:"
netstat -tlnp | grep -E ':80|:443|:3000' || echo "No processes found on these ports"

echo -e "\n${BLUE}🔍 Debug information complete${NC}"
echo "=================================="