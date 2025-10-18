#!/bin/bash

# Server Monitoring and Auto-Recovery Script
# This script monitors the Kora backend and ensures it stays running

LOG_FILE="$HOME/kora/Backend/logs/monitor.log"
HEALTH_URL="http://localhost:3001/health"
PING_URL="http://localhost:3001/ping"
MAX_FAILURES=3
FAILURE_COUNT=0

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

check_pm2_status() {
    pm2 describe kora-backend > /dev/null 2>&1
    return $?
}

check_health() {
    response=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$HEALTH_URL" 2>/dev/null)
    if [ "$response" = "200" ]; then
        return 0
    else
        return 1
    fi
}

check_ping() {
    response=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$PING_URL" 2>/dev/null)
    if [ "$response" = "200" ]; then
        return 0
    else
        return 1
    fi
}

restart_server() {
    log "${RED}⚠️  Attempting to restart server...${NC}"
    
    # Check if PM2 is running the app
    if check_pm2_status; then
        log "🔄 Restarting via PM2..."
        pm2 restart kora-backend
        sleep 5
        
        if check_ping; then
            log "${GREEN}✅ Server restarted successfully${NC}"
            FAILURE_COUNT=0
            return 0
        else
            log "${RED}❌ Restart failed - server not responding${NC}"
            return 1
        fi
    else
        log "${RED}❌ PM2 process not found - starting fresh...${NC}"
        cd ~/kora/Backend
        pm2 start ecosystem.config.js
        sleep 5
        
        if check_ping; then
            log "${GREEN}✅ Server started successfully${NC}"
            FAILURE_COUNT=0
            return 0
        else
            log "${RED}❌ Start failed - server not responding${NC}"
            return 1
        fi
    fi
}

check_database() {
    health_response=$(curl -s "$HEALTH_URL" 2>/dev/null)
    database_status=$(echo "$health_response" | grep -o '"database":"[^"]*"' | cut -d'"' -f4)
    
    if [ "$database_status" = "connected" ]; then
        return 0
    else
        log "${YELLOW}⚠️  Database disconnected - waiting for auto-reconnect${NC}"
        return 1
    fi
}

# Main monitoring loop
main() {
    log "${GREEN}🚀 Starting Kora Backend Monitor${NC}"
    
    while true; do
        # Check PM2 status
        if ! check_pm2_status; then
            log "${RED}❌ PM2 process not running${NC}"
            restart_server
            FAILURE_COUNT=$((FAILURE_COUNT + 1))
        # Check server ping
        elif ! check_ping; then
            log "${RED}❌ Server not responding to ping${NC}"
            FAILURE_COUNT=$((FAILURE_COUNT + 1))
        # Check health endpoint
        elif ! check_health; then
            log "${YELLOW}⚠️  Health check failed${NC}"
            # Don't increment failure count immediately - might be DB issue
            check_database
        else
            # All checks passed
            if [ $FAILURE_COUNT -gt 0 ]; then
                log "${GREEN}✅ Server recovered - all checks passing${NC}"
            fi
            FAILURE_COUNT=0
        fi
        
        # If too many failures, restart server
        if [ $FAILURE_COUNT -ge $MAX_FAILURES ]; then
            log "${RED}💥 Max failures reached ($FAILURE_COUNT/$MAX_FAILURES) - forcing restart${NC}"
            restart_server
            FAILURE_COUNT=0
        fi
        
        # Check memory usage
        mem_usage=$(pm2 jlist | grep -o '"memory":[0-9]*' | head -1 | cut -d':' -f2)
        if [ ! -z "$mem_usage" ] && [ "$mem_usage" -gt 524288000 ]; then
            mem_mb=$((mem_usage / 1024 / 1024))
            log "${YELLOW}⚠️  High memory usage: ${mem_mb}MB${NC}"
        fi
        
        # Wait before next check
        sleep 30
    done
}

# Run as daemon
if [ "$1" = "start" ]; then
    log "Starting monitor daemon..."
    nohup bash "$0" daemon >> "$LOG_FILE" 2>&1 &
    echo $! > ~/kora-monitor.pid
    echo "Monitor started with PID $(cat ~/kora-monitor.pid)"
elif [ "$1" = "stop" ]; then
    if [ -f ~/kora-monitor.pid ]; then
        kill $(cat ~/kora-monitor.pid) 2>/dev/null
        rm ~/kora-monitor.pid
        log "Monitor stopped"
    else
        echo "Monitor not running"
    fi
elif [ "$1" = "status" ]; then
    if [ -f ~/kora-monitor.pid ] && ps -p $(cat ~/kora-monitor.pid) > /dev/null 2>&1; then
        echo "Monitor is running with PID $(cat ~/kora-monitor.pid)"
        tail -20 "$LOG_FILE"
    else
        echo "Monitor is not running"
    fi
elif [ "$1" = "daemon" ]; then
    main
else
    echo "Usage: $0 {start|stop|status}"
    echo ""
    echo "  start  - Start monitoring in background"
    echo "  stop   - Stop monitoring"
    echo "  status - Check monitor status and show recent logs"
fi

