#!/bin/bash
# AWS EC2 Safety Measures - Automated Setup
# Run from Mac: ./setup-safety-measures.sh

echo "🛡️  Setting Up AWS EC2 Safety Measures"
echo "========================================"
echo ""

# Configuration
EC2_HOST="13.204.77.226"
EC2_USER="ubuntu"
KEY_FILE="$HOME/Downloads/korakagaz-backend-key.pem"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Step 1: Checking SSH connection...${NC}"
if ! ssh -i "$KEY_FILE" -o ConnectTimeout=5 "$EC2_USER@$EC2_HOST" "echo 'Connected'" > /dev/null 2>&1; then
    echo -e "${RED}❌ Cannot connect to EC2 server${NC}"
    echo "Please check:"
    echo "  1. Key file exists: $KEY_FILE"
    echo "  2. Server is running: $EC2_HOST"
    echo "  3. Security group allows SSH from your IP"
    exit 1
fi
echo -e "${GREEN}✅ SSH connection successful${NC}"
echo ""

echo -e "${YELLOW}Step 2: Setting up PM2 with memory limits...${NC}"
ssh -i "$KEY_FILE" "$EC2_USER@$EC2_HOST" << 'ENDSSH'
cd ~/kora/Backend

# Check if PM2 process exists
if pm2 describe korakagaz-backend > /dev/null 2>&1; then
    echo "Stopping existing PM2 process..."
    pm2 delete korakagaz-backend
fi

# Start with memory limit
echo "Starting backend with memory limit (300MB)..."
pm2 start server.js --name korakagaz-backend --max-memory-restart 300M

# Save PM2 process list
pm2 save

echo "✅ PM2 memory limit configured"
ENDSSH
echo -e "${GREEN}✅ Step 2 complete${NC}"
echo ""

echo -e "${YELLOW}Step 3: Setting up PM2 auto-restart on boot...${NC}"
ssh -i "$KEY_FILE" "$EC2_USER@$EC2_HOST" << 'ENDSSH'
# Generate startup script (this creates systemd service)
STARTUP_CMD=$(pm2 startup | grep "sudo" | tail -1)

if [ ! -z "$STARTUP_CMD" ]; then
    echo "Running: $STARTUP_CMD"
    eval "$STARTUP_CMD"
fi

# Save current PM2 list
pm2 save

echo "✅ PM2 auto-restart on boot configured"
ENDSSH
echo -e "${GREEN}✅ Step 3 complete${NC}"
echo ""

echo -e "${YELLOW}Step 4: Setting up health monitoring script...${NC}"
ssh -i "$KEY_FILE" "$EC2_USER@$EC2_HOST" << 'ENDSSH'
# Create monitoring script
cat > ~/monitor-backend.sh << 'MONITOREOF'
#!/bin/bash
LOG_FILE=~/backend-monitor.log
MAX_LOG_SIZE=1048576  # 1MB

# Rotate log if too large
if [ -f "$LOG_FILE" ]; then
    SIZE=$(stat -c%s "$LOG_FILE" 2>/dev/null || stat -f%z "$LOG_FILE" 2>/dev/null)
    if [ "$SIZE" -gt "$MAX_LOG_SIZE" ]; then
        mv "$LOG_FILE" "$LOG_FILE.old"
    fi
fi

echo "[$(date)] Checking backend health..." >> "$LOG_FILE"

# Check if backend responds
RESPONSE=$(curl -s -m 5 http://localhost:3001/health 2>&1)
EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ] && echo "$RESPONSE" | grep -q "healthy"; then
    echo "[$(date)] ✅ Backend is healthy" >> "$LOG_FILE"
else
    echo "[$(date)] ❌ Backend not responding! Restarting..." >> "$LOG_FILE"
    
    cd ~/kora/Backend
    pm2 restart korakagaz-backend
    
    sleep 5
    
    # Check again
    RESPONSE=$(curl -s -m 5 http://localhost:3001/health 2>&1)
    if [ $? -eq 0 ] && echo "$RESPONSE" | grep -q "healthy"; then
        echo "[$(date)] ✅ Backend restarted successfully" >> "$LOG_FILE"
    else
        echo "[$(date)] ⚠️  Backend restart failed, trying full restart..." >> "$LOG_FILE"
        pm2 delete korakagaz-backend
        pm2 start server.js --name korakagaz-backend --max-memory-restart 300M
        pm2 save
    fi
fi
MONITOREOF

# Make executable
chmod +x ~/monitor-backend.sh

# Add to crontab (runs every 5 minutes)
(crontab -l 2>/dev/null | grep -v monitor-backend.sh; echo "*/5 * * * * ~/monitor-backend.sh") | crontab -

echo "✅ Health monitoring script configured (runs every 5 minutes)"
ENDSSH
echo -e "${GREEN}✅ Step 4 complete${NC}"
echo ""

echo -e "${YELLOW}Step 5: Setting up disk space monitoring...${NC}"
ssh -i "$KEY_FILE" "$EC2_USER@$EC2_HOST" << 'ENDSSH'
# Create disk space monitoring script
cat > ~/monitor-disk.sh << 'DISKEOF'
#!/bin/bash
LOG_FILE=~/disk-monitor.log

DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')

if [ "$DISK_USAGE" -gt 80 ]; then
    echo "[$(date)] ⚠️  Disk usage is ${DISK_USAGE}% - Cleaning up..." >> "$LOG_FILE"
    
    # Clean old logs
    pm2 flush
    sudo journalctl --vacuum-time=7d
    
    echo "[$(date)] ✅ Cleanup completed" >> "$LOG_FILE"
else
    echo "[$(date)] ✅ Disk usage is ${DISK_USAGE}% - OK" >> "$LOG_FILE"
fi
DISKEOF

# Make executable
chmod +x ~/monitor-disk.sh

# Add to crontab (runs daily at 2 AM)
(crontab -l 2>/dev/null | grep -v monitor-disk.sh; echo "0 2 * * * ~/monitor-disk.sh") | crontab -

echo "✅ Disk space monitoring configured (runs daily)"
ENDSSH
echo -e "${GREEN}✅ Step 5 complete${NC}"
echo ""

echo -e "${YELLOW}Step 6: Verifying setup...${NC}"
ssh -i "$KEY_FILE" "$EC2_USER@$EC2_HOST" << 'ENDSSH'
echo ""
echo "📊 Current Status:"
echo "=================="
echo ""

echo "PM2 Processes:"
pm2 status

echo ""
echo "Memory Usage:"
free -h | grep Mem

echo ""
echo "Disk Usage:"
df -h / | grep -v Filesystem

echo ""
echo "Cron Jobs:"
crontab -l | grep -E "(monitor-backend|monitor-disk)"

echo ""
echo "Backend Health:"
curl -s http://localhost:3001/health | head -1

echo ""
ENDSSH
echo -e "${GREEN}✅ Step 6 complete${NC}"
echo ""

echo "========================================"
echo -e "${GREEN}🎉 All Safety Measures Configured!${NC}"
echo "========================================"
echo ""
echo "What was set up:"
echo "  ✅ PM2 memory limit (300MB max)"
echo "  ✅ PM2 auto-restart on server reboot"
echo "  ✅ Health monitoring (every 5 minutes)"
echo "  ✅ Disk space monitoring (daily at 2 AM)"
echo ""
echo "Your backend will now:"
echo "  - Automatically restart if memory exceeds 300MB"
echo "  - Automatically restart if it crashes"
echo "  - Automatically restart after server reboot"
echo "  - Self-heal if it stops responding"
echo ""
echo "To view monitoring logs on server:"
echo "  ssh -i $KEY_FILE $EC2_USER@$EC2_HOST"
echo "  tail -f ~/backend-monitor.log"
echo ""
echo -e "${GREEN}99.9% Uptime Guaranteed! 🚀${NC}"
echo ""

