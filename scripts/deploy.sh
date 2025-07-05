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

# Stop existing containers (ignore errors if none exist)
echo -e "${YELLOW}🛑 Stopping existing containers...${NC}"
docker-compose down || true

# Remove old images to save space
echo -e "${YELLOW}🧹 Cleaning up old Docker images...${NC}"
docker image prune -f || true

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

# Test health endpoint with retry
echo -e "${YELLOW}🏥 Testing health endpoint...${NC}"
for i in {1..5}; do
    if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Health check passed!${NC}"
        break
    else
        echo -e "${YELLOW}Health check failed, retrying in 10 seconds... ($i/5)${NC}"
        sleep 10
    fi
done

# Final check
if ! curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    echo -e "${RED}❌ Health check failed after 5 attempts!${NC}"
    echo -e "${YELLOW}📜 Container logs:${NC}"
    docker-compose logs --tail=50
    exit 1
fi

echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${GREEN}🌐 Application is available at: https://cakravia.com${NC}"

# Show container logs
echo -e "${YELLOW}📜 Recent logs:${NC}"
docker-compose logs --tail=20