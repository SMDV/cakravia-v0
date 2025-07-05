#!/bin/bash

# Setup script for Cakravia deployment monitoring
# This script sets up monitoring as a system service

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

# Function to create systemd service
create_systemd_service() {
    log "Creating systemd service for Cakravia monitoring..."
    
    # Create service file
    sudo tee /etc/systemd/system/cakravia-monitor.service > /dev/null << EOF
[Unit]
Description=Cakravia Deployment Monitor
After=docker.service
Requires=docker.service
StartLimitIntervalSec=0

[Service]
Type=simple
Restart=always
RestartSec=10
User=root
WorkingDirectory=/opt/cakravia
ExecStart=/opt/cakravia/scripts/monitor-deployment.sh monitor
ExecReload=/bin/kill -HUP \$MAINPID
StandardOutput=append:/var/log/cakravia-monitor.log
StandardError=append:/var/log/cakravia-monitor.log

# Environment
Environment=PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
Environment=DOCKER_HOST=unix:///var/run/docker.sock

# Security
NoNewPrivileges=yes
PrivateTmp=yes
ProtectHome=yes
ProtectSystem=strict
ReadWritePaths=/opt/cakravia /var/log /tmp

[Install]
WantedBy=multi-user.target
EOF
    
    log_success "Systemd service created"
}

# Function to create log rotation
create_log_rotation() {
    log "Setting up log rotation..."
    
    sudo tee /etc/logrotate.d/cakravia-monitor > /dev/null << EOF
/var/log/cakravia-monitor.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 644 root root
    postrotate
        systemctl reload cakravia-monitor || true
    endscript
}

/tmp/cakravia-alerts.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 644 root root
}

/tmp/cakravia-health-history.json {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 644 root root
}
EOF
    
    log_success "Log rotation configured"
}

# Function to create monitoring dashboard script
create_dashboard_script() {
    log "Creating monitoring dashboard script..."
    
    cat > /opt/cakravia/scripts/dashboard.sh << 'EOF'
#!/bin/bash

# Simple web dashboard for monitoring
# This creates a basic HTML dashboard

DASHBOARD_FILE="/var/www/html/monitor.html"
REFRESH_INTERVAL=30

generate_dashboard() {
    local timestamp=$(date)
    local active_slot=$(/opt/cakravia/scripts/rollback-deployment.sh status | grep "Current Active Deployment" | cut -d: -f2 | xargs)
    
    cat > "$DASHBOARD_FILE" << HTML
<!DOCTYPE html>
<html>
<head>
    <title>Cakravia Deployment Monitor</title>
    <meta http-equiv="refresh" content="$REFRESH_INTERVAL">
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { background-color: #2c3e50; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .card { background-color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .status-healthy { color: #27ae60; font-weight: bold; }
        .status-unhealthy { color: #e74c3c; font-weight: bold; }
        .status-degraded { color: #f39c12; font-weight: bold; }
        pre { background-color: #ecf0f1; padding: 15px; border-radius: 4px; overflow-x: auto; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        @media (max-width: 768px) { .grid { grid-template-columns: 1fr; } }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Cakravia Deployment Monitor</h1>
            <p>Last updated: $timestamp</p>
            <p>Active Deployment: <span class="status-healthy">$active_slot</span></p>
        </div>
        
        <div class="grid">
            <div class="card">
                <h2>📊 Container Status</h2>
                <pre>$(cd /opt/cakravia && docker-compose -f docker-compose.blue-green.yml ps 2>/dev/null || echo "Could not fetch container status")</pre>
            </div>
            
            <div class="card">
                <h2>🏥 Health Status</h2>
                <pre>$(/opt/cakravia/scripts/monitor-deployment.sh status 2>/dev/null | head -20 || echo "Could not fetch health status")</pre>
            </div>
        </div>
        
        <div class="card">
            <h2>📈 Deployment Status</h2>
            <pre>$(curl -s http://localhost:8080/api/deployment/status 2>/dev/null | jq '.' || echo "Could not fetch deployment status")</pre>
        </div>
        
        <div class="grid">
            <div class="card">
                <h2>⚠️ Recent Alerts</h2>
                <pre>$(/opt/cakravia/scripts/monitor-deployment.sh alerts 2>/dev/null || echo "No recent alerts")</pre>
            </div>
            
            <div class="card">
                <h2>📚 Deployment History</h2>
                <pre>$(/opt/cakravia/scripts/rollback-deployment.sh history 2>/dev/null || echo "No deployment history")</pre>
            </div>
        </div>
        
        <div class="card">
            <h2>💻 System Resources</h2>
            <pre>$(free -h && echo "" && df -h /opt/cakravia 2>/dev/null)</pre>
        </div>
    </div>
</body>
</html>
HTML
}

# Main function
case "${1:-generate}" in
    generate)
        generate_dashboard
        ;;
    start)
        while true; do
            generate_dashboard
            sleep $REFRESH_INTERVAL
        done
        ;;
    *)
        echo "Usage: $0 [generate|start]"
        ;;
esac
EOF
    
    chmod +x /opt/cakravia/scripts/dashboard.sh
    log_success "Dashboard script created"
}

# Function to create monitoring cron jobs
create_cron_jobs() {
    log "Setting up cron jobs..."
    
    # Create cron job for dashboard updates
    (crontab -l 2>/dev/null || echo "") | grep -v "cakravia-dashboard" | crontab -
    (crontab -l 2>/dev/null; echo "*/5 * * * * /opt/cakravia/scripts/dashboard.sh generate >/dev/null 2>&1 # cakravia-dashboard") | crontab -
    
    # Create cron job for health reports
    (crontab -l 2>/dev/null || echo "") | grep -v "cakravia-report" | crontab -
    (crontab -l 2>/dev/null; echo "0 */6 * * * /opt/cakravia/scripts/monitor-deployment.sh report >> /var/log/cakravia-reports.log 2>&1 # cakravia-report") | crontab -
    
    log_success "Cron jobs configured"
}

# Function to setup alerts (placeholder for future integrations)
setup_alerts() {
    log "Setting up alert integrations..."
    
    # Create alert configuration template
    cat > /opt/cakravia/config/alerts.conf << EOF
# Cakravia Alert Configuration
# Configure external alert integrations here

# Slack webhook (optional)
SLACK_WEBHOOK_URL=""

# Email settings (optional)
SMTP_HOST=""
SMTP_PORT="587"
SMTP_USERNAME=""
SMTP_PASSWORD=""
ALERT_EMAIL=""

# PagerDuty (optional)
PAGERDUTY_INTEGRATION_KEY=""

# Custom webhook (optional)
CUSTOM_WEBHOOK_URL=""
EOF
    
    log_success "Alert configuration template created"
}

# Main setup function
main() {
    echo -e "${GREEN}🚀 Setting up Cakravia deployment monitoring...${NC}"
    
    # Check if running as root
    if [ "$EUID" -ne 0 ]; then
        log_error "This script must be run as root (use sudo)"
        exit 1
    fi
    
    # Ensure we're in the correct directory
    if [ ! -d "/opt/cakravia" ]; then
        log_error "/opt/cakravia directory not found"
        exit 1
    fi
    
    cd /opt/cakravia
    
    # Create required directories
    mkdir -p config
    mkdir -p /var/www/html
    
    # Setup components
    create_systemd_service
    create_log_rotation
    create_dashboard_script
    create_cron_jobs
    setup_alerts
    
    # Reload systemd
    systemctl daemon-reload
    
    # Enable and start the monitoring service
    systemctl enable cakravia-monitor
    systemctl start cakravia-monitor
    
    # Generate initial dashboard
    /opt/cakravia/scripts/dashboard.sh generate
    
    log_success "Monitoring setup completed!"
    echo ""
    echo -e "${GREEN}🎉 Setup Summary:${NC}"
    echo -e "${GREEN}   ✅ Systemd service: cakravia-monitor${NC}"
    echo -e "${GREEN}   ✅ Log rotation configured${NC}"
    echo -e "${GREEN}   ✅ Dashboard available at: http://your-server/monitor.html${NC}"
    echo -e "${GREEN}   ✅ Cron jobs for automated reporting${NC}"
    echo -e "${GREEN}   ✅ Alert configuration template created${NC}"
    echo ""
    echo -e "${BLUE}Commands:${NC}"
    echo -e "${BLUE}   sudo systemctl status cakravia-monitor${NC}"
    echo -e "${BLUE}   sudo systemctl restart cakravia-monitor${NC}"
    echo -e "${BLUE}   tail -f /var/log/cakravia-monitor.log${NC}"
    echo -e "${BLUE}   /opt/cakravia/scripts/monitor-deployment.sh report${NC}"
    echo -e "${BLUE}   /opt/cakravia/scripts/rollback-deployment.sh status${NC}"
}

# Handle different commands
case "${1:-setup}" in
    setup)
        main
        ;;
    uninstall)
        log "Uninstalling monitoring..."
        systemctl stop cakravia-monitor || true
        systemctl disable cakravia-monitor || true
        rm -f /etc/systemd/system/cakravia-monitor.service
        rm -f /etc/logrotate.d/cakravia-monitor
        crontab -l 2>/dev/null | grep -v "cakravia-" | crontab - || true
        systemctl daemon-reload
        log_success "Monitoring uninstalled"
        ;;
    status)
        systemctl status cakravia-monitor
        ;;
    help|*)
        echo "Cakravia Monitoring Setup Script"
        echo ""
        echo "Usage: sudo $0 [command]"
        echo ""
        echo "Commands:"
        echo "  setup      Setup monitoring system (default)"
        echo "  uninstall  Remove monitoring system"
        echo "  status     Show monitoring service status"
        echo "  help       Show this help message"
        ;;
esac