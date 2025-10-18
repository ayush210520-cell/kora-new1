#!/bin/bash

# Backend Monitoring & Auto-Restart Setup
# This script needs to run on EC2 server

cat > ~/monitor-backend.sh << 'SCRIPT_END'
#!/bin/bash

# Backend Health Monitor
# Checks if backend is responding, restarts if not

LOG_FILE=~/backend-monitor.log
MAX_LOG_SIZE=1048576  # 1MB

# Rotate log if too large
if [ -f "$LOG_FILE" ] && [ $(stat -f%z "$LOG_FILE" 2>/dev/null || stat -c%s "$LOG_FILE" 2>/dev/null) -gt $MAX_LOG_SIZE ]; then
    mv "$LOG_FILE" "$LOG_FILE.old"
fi

echo "[$(date)] Checking backend health..." >> "$LOG_FILE"

# Check if backend responds
RESPONSE=$(curl -s -m 5 http://localhost:3001/health)

if [ $? -eq 0 ] && echo "$RESPONSE" | grep -q "healthy"; then
    echo "[$(date)] ✅ Backend is healthy" >> "$LOG_FILE"
else
    echo "[$(date)] ❌ Backend not responding! Restarting..." >> "$LOG_FILE"
    
    cd ~/kora/Backend
    pm2 restart korakagaz-backend
    
    sleep 5
    
    # Check again
    RESPONSE=$(curl -s -m 5 http://localhost:3001/health)
    if [ $? -eq 0 ]; then
        echo "[$(date)] ✅ Backend restarted successfully" >> "$LOG_FILE"
    else
        echo "[$(date)] ⚠️ Backend restart failed, trying full restart..." >> "$LOG_FILE"
        pm2 delete korakagaz-backend
        pm2 start server.js --name korakagaz-backend --max-memory-restart 300M
        pm2 save
    fi
fi
SCRIPT_END

chmod +x ~/monitor-backend.sh

# Add to crontab (runs every 5 minutes)
(crontab -l 2>/dev/null | grep -v monitor-backend.sh; echo "*/5 * * * * ~/monitor-backend.sh") | crontab -

echo "✅ Monitoring script installed!"
echo "✅ Will check backend every 5 minutes and auto-restart if needed"
echo ""
echo "View logs: tail -f ~/backend-monitor.log"

