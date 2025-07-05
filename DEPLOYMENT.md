# Cakravia Deployment Guide

This guide covers deploying the Cakravia application to your VPS using Docker and automated CI/CD.

## Prerequisites

- Ubuntu 24.04 VPS (2GB RAM, 2 CPU cores, 20GB disk)
- Domain pointing to your VPS (cakravia.com)
- GitHub repository with push access
- Google Client ID for authentication

## Quick Start

### 1. VPS Setup

Run the VPS setup script on your server:

```bash
# Download and run the setup script
curl -fsSL https://raw.githubusercontent.com/yourusername/cakravia-v0/main/scripts/setup-vps.sh -o setup-vps.sh
chmod +x setup-vps.sh
./setup-vps.sh
```

### 2. Clone Repository

```bash
cd /opt/cakravia
git clone https://github.com/yourusername/cakravia-v0.git .
```

### 3. Environment Configuration

```bash
# Copy environment template
cp .env.example .env.production

# Edit with your values
nano .env.production
```

### 4. SSL Certificate Setup

```bash
# Get SSL certificate
sudo certbot --nginx -d cakravia.com -d www.cakravia.com

# Test auto-renewal
sudo certbot renew --dry-run
```

### 5. First Deployment

```bash
# Run initial deployment
./scripts/deploy.sh
```

## Detailed Setup Instructions

### VPS Configuration

1. **System Updates**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **Install Required Packages**
   ```bash
   sudo apt install -y curl wget git htop ufw fail2ban
   ```

3. **Docker Installation**
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   sudo usermod -aG docker $USER
   ```

4. **Docker Compose Installation**
   ```bash
   sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   ```

5. **Nginx Installation**
   ```bash
   sudo apt install -y nginx certbot python3-certbot-nginx
   ```

6. **Firewall Configuration**
   ```bash
   sudo ufw default deny incoming
   sudo ufw default allow outgoing
   sudo ufw allow ssh
   sudo ufw allow 'Nginx Full'
   sudo ufw --force enable
   ```

### GitHub Actions Setup

1. **Create GitHub Secrets**
   
   Go to your GitHub repository → Settings → Secrets and variables → Actions
   
   Add these secrets:
   - `VPS_HOST`: Your VPS IP address
   - `VPS_USER`: Username for SSH access (usually `root` or your username)
   - `VPS_SSH_KEY`: Private SSH key for accessing your VPS
   - `NEXT_PUBLIC_GOOGLE_CLIENT_ID`: Your Google OAuth client ID

2. **SSH Key Generation**
   ```bash
   # On your local machine
   ssh-keygen -t rsa -b 4096 -C "github-actions"
   
   # Copy public key to VPS
   ssh-copy-id -i ~/.ssh/id_rsa.pub user@your-vps-ip
   
   # Copy private key content to GitHub secrets
   cat ~/.ssh/id_rsa
   ```

### Application Configuration

1. **Environment Variables**
   ```bash
   # Edit .env.production
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
   NODE_ENV=production
   NEXT_TELEMETRY_DISABLED=1
   ```

2. **Docker Configuration**
   
   The application uses these containers:
   - **App Container**: Next.js application (512MB RAM, 1 CPU)
   - **Nginx Container**: Reverse proxy with SSL termination (64MB RAM)

3. **SSL Certificate**
   ```bash
   # Initial certificate
   sudo certbot --nginx -d cakravia.com -d www.cakravia.com
   
   # Auto-renewal is configured automatically
   ```

## CI/CD Pipeline

### Automatic Deployment

Every push to the `main` branch triggers:

1. **Build Process**
   - Checkout code
   - Install dependencies
   - Run linting
   - Build application

2. **Deployment Process**
   - SSH to VPS
   - Pull latest changes
   - Update environment variables
   - Rebuild Docker containers
   - Health check verification

### Manual Deployment

```bash
# On your VPS
cd /opt/cakravia
./scripts/deploy.sh
```

## Monitoring & Maintenance

### Health Monitoring

```bash
# Check application health
curl https://cakravia.com/api/health

# Check container status
docker-compose ps

# View logs
docker-compose logs --tail=50

# System monitoring
./monitor.sh
```

### Log Management

Logs are automatically rotated daily. Manual log viewing:

```bash
# Application logs
docker-compose logs app

# Nginx logs
docker-compose logs nginx

# System logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Container Management

```bash
# Restart containers
docker-compose restart

# Update without downtime
docker-compose up -d --no-deps app

# Clean up old images
docker system prune -f
```

## Security Considerations

### Firewall Rules
- Port 22 (SSH) - Restricted to your IP
- Port 80 (HTTP) - Redirects to HTTPS
- Port 443 (HTTPS) - Open for web traffic

### SSL Configuration
- TLS 1.2 and 1.3 only
- Strong cipher suites
- HSTS enabled
- Perfect Forward Secrecy

### Rate Limiting
- API routes: 10 requests/second
- Auth routes: 5 requests/minute
- Implemented at Nginx level

## Troubleshooting

### Quick Debug

Run the debug script to get comprehensive system information:
```bash
cd /opt/cakravia
./scripts/debug.sh
```

### Common GitHub Actions Issues

1. **Git Repository Not Found**
   ```bash
   # Solution: Ensure the directory exists and repository is cloned
   sudo mkdir -p /opt/cakravia
   sudo chown $USER:$USER /opt/cakravia
   cd /opt/cakravia
   git clone https://github.com/yourusername/cakravia-v0.git .
   ```

2. **Docker Compose Not Found**
   ```bash
   # Solution: Install Docker Compose on VPS
   sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   ```

3. **Health Check Failures**
   ```bash
   # Check if app container is running
   docker-compose ps
   
   # Check app logs
   docker-compose logs app
   
   # Test health endpoint manually
   curl http://localhost:3000/api/health
   ```

### Common Issues

1. **Container Won't Start**
   ```bash
   # Check logs
   docker-compose logs app
   
   # Check resources
   docker stats
   free -h
   
   # Rebuild from scratch
   docker-compose down
   docker system prune -f
   docker-compose build --no-cache
   docker-compose up -d
   ```

2. **SSL Certificate Issues**
   ```bash
   # Check certificate status
   sudo certbot certificates
   
   # Renew certificate
   sudo certbot renew
   
   # Test SSL configuration
   sudo nginx -t
   ```

3. **Application Not Accessible**
   ```bash
   # Check Nginx status
   sudo systemctl status nginx
   
   # Test configuration
   sudo nginx -t
   
   # Check firewall
   sudo ufw status
   
   # Check if ports are open
   netstat -tlnp | grep -E ':80|:443|:3000'
   ```

4. **Build Failures**
   ```bash
   # Check build logs
   docker-compose logs --tail=100
   
   # Manual build with verbose output
   docker-compose build --no-cache --progress=plain
   
   # Check disk space
   df -h
   ```

5. **Environment Variable Issues**
   ```bash
   # Verify environment file exists
   ls -la .env.production
   
   # Check environment variables are loaded
   docker-compose config
   
   # Recreate environment file
   cat > .env.production << EOF
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_actual_client_id
   NODE_ENV=production
   NEXT_TELEMETRY_DISABLED=1
   EOF
   ```

### Performance Optimization

1. **Memory Usage**
   ```bash
   # Monitor memory
   docker stats
   
   # Adjust limits in docker-compose.yml if needed
   ```

2. **Disk Space**
   ```bash
   # Clean up Docker
   docker system prune -a
   
   # Check disk usage
   df -h
   ```

## Backup Strategy

### Application Backup
```bash
# Backup application code
cd /opt/cakravia
tar -czf backup-$(date +%Y%m%d).tar.gz .

# Backup environment files
cp .env.production .env.production.backup
```

### Database Backup
If using external database, ensure regular backups are configured on your API server.

## Support

For issues with deployment:
1. Check container logs: `docker-compose logs`
2. Verify health endpoint: `curl https://cakravia.com/api/health`
3. Check system resources: `./monitor.sh`
4. Review GitHub Actions logs for CI/CD issues

## Resource Usage

**Expected Resource Consumption:**
- **RAM**: ~600MB total (App: 512MB, Nginx: 64MB, System: ~300MB)
- **CPU**: Low usage during normal operation
- **Disk**: ~2GB for application and Docker images
- **Network**: Minimal, only HTTPS traffic

This leaves ~1.4GB RAM and ~18GB disk space for system operation and future growth.