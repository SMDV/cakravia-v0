# Zero-Downtime Deployment for Cakravia

This document describes the zero-downtime deployment system implemented for Cakravia using blue-green deployment strategy.

## Overview

The zero-downtime deployment system ensures that your application remains available to users during deployments by:

1. **Blue-Green Deployment**: Maintaining two identical production environments (blue and green)
2. **Health Checks**: Comprehensive health monitoring before switching traffic
3. **Nginx Load Balancing**: Intelligent traffic routing with automatic failover
4. **Rollback Capabilities**: Quick rollback to previous version if issues arise
5. **Monitoring**: Continuous monitoring of deployment status and application health

## Architecture

```
[GitHub Push] → [GitHub Actions] → [VPS Deployment]
                                         ↓
[Blue Container] ← [Nginx Load Balancer] → [Green Container]
                         ↓
[Health Monitoring] → [Automatic Rollback]
```

### Components

- **Blue-Green Containers**: Two app containers that alternate as active/standby
- **Nginx Upstream**: Load balancer that routes traffic to healthy containers
- **Health Checks**: Multiple endpoint checks for comprehensive health monitoring
- **Deployment Scripts**: Automated scripts for zero-downtime deployment and rollback
- **Monitoring System**: Continuous monitoring with alerting capabilities

## Files Structure

```
├── docker-compose.blue-green.yml    # Blue-green Docker configuration
├── nginx/
│   ├── nginx.blue-green.conf        # Enhanced nginx configuration
│   ├── upstream.conf                # Dynamic upstream configuration
│   ├── upstream.blue.template       # Blue deployment template
│   └── upstream.green.template      # Green deployment template
├── scripts/
│   ├── deploy-zero-downtime.sh      # Main deployment script
│   ├── rollback-deployment.sh       # Rollback script
│   ├── monitor-deployment.sh        # Monitoring script
│   ├── setup-monitoring.sh          # Monitoring setup script
│   └── test-zero-downtime.sh        # End-to-end testing script
├── src/app/api/
│   ├── health/route.ts              # Enhanced health endpoint
│   ├── health/ready/route.ts        # Readiness probe
│   ├── health/live/route.ts         # Liveness probe
│   └── deployment/status/route.ts   # Deployment status endpoint
└── .github/workflows/deploy.yml     # Updated CI/CD pipeline
```

## Health Check Endpoints

### `/api/health`
Comprehensive health check with system metrics:
```json
{
  "status": "healthy|unhealthy|degraded",
  "timestamp": "2024-01-01T00:00:00Z",
  "uptime": 3600,
  "version": "1.0.0",
  "deployment": {
    "slot": "blue|green",
    "timestamp": "2024-01-01T00:00:00Z"
  },
  "checks": [...],
  "system": {
    "memory": {...},
    "cpu": {...}
  }
}
```

### `/api/health/ready`
Readiness probe for deployment readiness:
- Checks dependencies
- Validates memory availability
- Tests external API connectivity
- Confirms application warm-up

### `/api/health/live`
Liveness probe for ongoing health:
- Process responsiveness
- Memory leak detection
- Event loop lag monitoring
- Basic functionality tests

### `/api/deployment/status`
Deployment information:
```json
{
  "deployment": {
    "slot": "blue|green",
    "timestamp": "2024-01-01T00:00:00Z",
    "version": "1.0.0",
    "status": "active|inactive|deploying|failed"
  },
  "application": {...},
  "health": {...},
  "system": {...}
}
```

## Deployment Process

### 1. Automatic Deployment (GitHub Actions)

Triggered on push to `main` branch:

```yaml
# Manual trigger with custom version
gh workflow run deploy.yml -f deployment_version=v1.2.0
```

### 2. Manual Deployment

```bash
cd /opt/cakravia
./scripts/deploy-zero-downtime.sh [version]
```

### 3. Deployment Steps

1. **Determine Current State**: Identify active deployment (blue/green)
2. **Build New Container**: Build new image for inactive slot
3. **Start New Container**: Start container on alternate port
4. **Health Checks**: Wait for comprehensive health checks to pass
5. **Switch Traffic**: Update nginx upstream to point to new container
6. **Verify Switch**: Confirm traffic is flowing to new container
7. **Cleanup**: Remove old container and cleanup resources

## Monitoring

### Start Monitoring Service

```bash
sudo ./scripts/setup-monitoring.sh
```

### Monitor Commands

```bash
# View monitoring status
sudo systemctl status cakravia-monitor

# View monitoring logs
tail -f /var/log/cakravia-monitor.log

# Generate monitoring report
./scripts/monitor-deployment.sh report

# Check current deployment status
./scripts/monitor-deployment.sh status

# View recent alerts
./scripts/monitor-deployment.sh alerts

# View health history
./scripts/monitor-deployment.sh history
```

### Monitoring Dashboard

Access the monitoring dashboard at: `http://your-server/monitor.html`

The dashboard provides:
- Real-time container status
- Health check results
- Deployment information
- System resource usage
- Recent alerts and history

## Rollback

### Automatic Rollback

Rollback is automatically triggered if:
- Health checks fail after deployment
- Traffic switch verification fails
- Critical errors occur during deployment

### Manual Rollback

```bash
# Quick rollback to previous deployment
./scripts/rollback-deployment.sh rollback

# Rollback with reason and version
./scripts/rollback-deployment.sh rollback "Critical bug found" "v1.1.0"

# Check rollback status
./scripts/rollback-deployment.sh status

# View deployment history
./scripts/rollback-deployment.sh history
```

### Rollback Process

1. **Validate Prerequisites**: Check system state and requirements
2. **Start Previous Container**: Ensure previous deployment container is running
3. **Health Check**: Verify previous deployment is healthy
4. **Switch Traffic**: Update nginx to route traffic back
5. **Verify**: Confirm rollback was successful
6. **Cleanup**: Stop failed deployment container

## Testing

### Run Complete Test Suite

```bash
./scripts/test-zero-downtime.sh
```

### Individual Tests

```bash
# Load testing only
./scripts/test-zero-downtime.sh load 60

# Monitoring test only
./scripts/test-zero-downtime.sh monitor

# Rollback test only
./scripts/test-zero-downtime.sh rollback
```

### Test Coverage

- **Prerequisites Check**: Validates all required components
- **Health Endpoints**: Tests all health check endpoints
- **Load Testing**: Tests deployment under continuous load
- **Rollback Functionality**: Validates rollback process
- **Container Failover**: Tests nginx failover capabilities
- **Configuration Validation**: Validates all configurations
- **Monitoring**: Tests monitoring and alerting systems

## Troubleshooting

### Common Issues

#### 1. Deployment Fails with Health Check Errors
```bash
# Check container logs
docker-compose -f docker-compose.blue-green.yml logs app-blue
docker-compose -f docker-compose.blue-green.yml logs app-green

# Check nginx logs
docker-compose -f docker-compose.blue-green.yml logs nginx

# Manually test health endpoints
curl http://localhost:3000/api/health
curl http://localhost:3001/api/health
```

#### 2. Traffic Not Switching
```bash
# Check nginx configuration
docker exec cakravia-nginx nginx -t

# Check upstream configuration
cat nginx/upstream.conf

# Manually reload nginx
docker exec cakravia-nginx nginx -s reload
```

#### 3. Rollback Fails
```bash
# Check deployment status
./scripts/rollback-deployment.sh status

# Validate prerequisites
./scripts/rollback-deployment.sh validate

# Check container status
docker-compose -f docker-compose.blue-green.yml ps
```

#### 4. Monitoring Issues
```bash
# Check monitoring service
sudo systemctl status cakravia-monitor

# Check monitoring logs
tail -f /var/log/cakravia-monitor.log

# Restart monitoring
sudo systemctl restart cakravia-monitor
```

### Debug Commands

```bash
# Show current deployment state
./scripts/monitor-deployment.sh status

# Check all containers
docker-compose -f docker-compose.blue-green.yml ps

# Test health endpoints
curl -v http://localhost:8080/api/health
curl -v http://localhost:8080/api/health/ready
curl -v http://localhost:8080/api/health/live
curl -v http://localhost:8080/api/deployment/status

# Check nginx upstream
docker exec cakravia-nginx cat /etc/nginx/conf.d/upstream.conf

# View deployment history
cat deployment-history.log
```

## Performance Considerations

### Resource Usage

- **Memory**: Each container uses ~512MB, total ~1GB for blue-green setup
- **CPU**: Minimal impact during normal operation, brief spike during deployment
- **Disk**: ~2GB for Docker images, additional space for logs
- **Network**: Minimal overhead from health checks and monitoring

### Deployment Times

- **Build Time**: 2-5 minutes depending on changes
- **Health Check Time**: 30-60 seconds for comprehensive checks
- **Traffic Switch**: <1 second with nginx reload
- **Total Deployment**: 3-7 minutes with zero user-facing downtime

### Optimization Tips

1. **Pre-pull Images**: Use Docker image caching to reduce build times
2. **Health Check Tuning**: Adjust health check intervals for faster deployments
3. **Resource Limits**: Set appropriate memory/CPU limits for containers
4. **Monitoring Frequency**: Balance monitoring detail with system overhead

## Security Considerations

### Access Control
- Deployment scripts require appropriate user permissions
- SSH keys for CI/CD should be rotated regularly
- Monitor logs for unauthorized deployment attempts

### Network Security
- Internal container communication uses Docker networks
- Health check endpoints are publicly accessible but provide limited information
- Nginx configuration includes security headers

### Container Security
- Containers run with non-root users
- Resource limits prevent resource exhaustion attacks
- Regular base image updates for security patches

## Maintenance

### Regular Tasks

1. **Log Rotation**: Configured automatically via logrotate
2. **Image Cleanup**: `docker system prune` removes unused images
3. **Health Check**: Monitor deployment health daily
4. **Backup**: Backup deployment configurations and history

### Updates

1. **Script Updates**: Update deployment scripts through Git
2. **Configuration Changes**: Test in staging before production
3. **Health Check Updates**: Add new health checks as needed
4. **Monitoring Enhancements**: Expand monitoring as application grows

## Migration from Original Deployment

### 1. Backup Current Setup
```bash
# Backup current docker-compose.yml
cp docker-compose.yml docker-compose.yml.backup

# Backup nginx configuration
cp nginx/nginx.conf nginx/nginx.conf.backup
```

### 2. Setup Zero-Downtime System
```bash
# Run initial deployment with blue-green setup
./scripts/deploy-zero-downtime.sh initial

# Setup monitoring
sudo ./scripts/setup-monitoring.sh
```

### 3. Test and Validate
```bash
# Run comprehensive tests
./scripts/test-zero-downtime.sh

# Monitor for issues
./scripts/monitor-deployment.sh report
```

### 4. Update CI/CD
The updated GitHub Actions workflow automatically uses the zero-downtime system.

## Support and Contributing

For issues or improvements:
1. Check troubleshooting section
2. Review logs and monitoring data
3. Test with the provided test suite
4. Create detailed issue reports with logs and system information

This zero-downtime deployment system provides robust, reliable deployments while maintaining high availability for your users.