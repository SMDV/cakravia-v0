#!/bin/bash

# SSL Certificate Copy Script
# This script copies renewed SSL certificates to nginx directory

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}📋 Copying SSL certificates...${NC}"

# Check if certificates exist
if [ ! -f "/etc/letsencrypt/live/cakravia.com/fullchain.pem" ]; then
    echo -e "${RED}❌ SSL certificates not found!${NC}"
    exit 1
fi

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Copy certificates
cp /etc/letsencrypt/live/cakravia.com/fullchain.pem "$PROJECT_DIR/nginx/ssl/"
cp /etc/letsencrypt/live/cakravia.com/privkey.pem "$PROJECT_DIR/nginx/ssl/"

# Set proper permissions
chmod 644 "$PROJECT_DIR/nginx/ssl/fullchain.pem"
chmod 600 "$PROJECT_DIR/nginx/ssl/privkey.pem"

# Restart nginx
cd "$PROJECT_DIR"
docker-compose restart nginx

echo -e "${GREEN}✅ SSL certificates copied and nginx restarted!${NC}"