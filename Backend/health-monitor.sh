#!/bin/bash

# Health Monitor Script for Kora Backend
# यह script हर minute run होगा और server health check करेगा

LOG_FILE="/var/log/kora-health-monitor.log"
HEALTH_URL="http://localhost:3001/health"
MAX_RETRIES=3

echo "[$(date)] Starting health check..." >> $LOG_FILE

# Function to check server health
check_health() {
    response=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 $HEALTH_URL)
    echo $response
}

# Function to restart server
restart_server() {
    echo "[$(date)] ❌ Server not responding. Restarting..." >> $LOG_FILE
    pm2 restart kora-backend
    sleep 5
    echo "[$(date)] ✅ Server restarted" >> $LOG_FILE
}

# Check health with retries
retry_count=0
while [ $retry_count -lt $MAX_RETRIES ]; do
    http_code=$(check_health)
    
    if [ "$http_code" == "200" ]; then
        echo "[$(date)] ✅ Server is healthy (HTTP $http_code)" >> $LOG_FILE
        exit 0
    else
        echo "[$(date)] ⚠️  Server check failed (HTTP $http_code), retry $((retry_count + 1))/$MAX_RETRIES" >> $LOG_FILE
        retry_count=$((retry_count + 1))
        sleep 2
    fi
done

# If all retries failed, restart the server
restart_server

# Send notification (optional - uncomment if you want email alerts)
# echo "Kora backend server was down and has been restarted at $(date)" | mail -s "Server Auto-Restart Alert" your-email@example.com

