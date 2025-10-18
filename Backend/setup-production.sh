#!/bin/bash

# Kora Backend Production Setup Script
# यह script EC2 पर run करें

echo "🚀 Starting Kora Backend Production Setup..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running on EC2
if [ ! -f "/etc/cloud/cloud.cfg" ]; then
    echo -e "${YELLOW}⚠️  Warning: This doesn't look like an EC2 instance${NC}"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Get the directory where script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd $SCRIPT_DIR

echo -e "${GREEN}📁 Working directory: $SCRIPT_DIR${NC}"

# Step 1: Check if PM2 is installed
echo -e "\n${YELLOW}Step 1: Checking PM2...${NC}"
if ! command -v pm2 &> /dev/null; then
    echo "PM2 not found. Installing..."
    npm install -g pm2
    echo -e "${GREEN}✅ PM2 installed${NC}"
else
    echo -e "${GREEN}✅ PM2 already installed${NC}"
fi

# Step 2: Create logs directory
echo -e "\n${YELLOW}Step 2: Creating logs directory...${NC}"
mkdir -p logs
echo -e "${GREEN}✅ Logs directory created${NC}"

# Step 3: Stop old processes
echo -e "\n${YELLOW}Step 3: Stopping old processes...${NC}"
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
pkill -f "node server.js" 2>/dev/null || true
echo -e "${GREEN}✅ Old processes stopped${NC}"

# Step 4: Install dependencies
echo -e "\n${YELLOW}Step 4: Installing dependencies...${NC}"
npm install
echo -e "${GREEN}✅ Dependencies installed${NC}"

# Step 5: Generate Prisma client
echo -e "\n${YELLOW}Step 5: Generating Prisma client...${NC}"
npx prisma generate
echo -e "${GREEN}✅ Prisma client generated${NC}"

# Step 6: Check database connection
echo -e "\n${YELLOW}Step 6: Checking database connection...${NC}"
if node -e "const prisma = require('./src/config/db.js'); prisma.\$connect().then(() => { console.log('Database OK'); process.exit(0); }).catch(() => process.exit(1));" 2>/dev/null; then
    echo -e "${GREEN}✅ Database connection successful${NC}"
else
    echo -e "${RED}❌ Database connection failed. Please check DATABASE_URL in .env${NC}"
    exit 1
fi

# Step 7: Start server with PM2
echo -e "\n${YELLOW}Step 7: Starting server with PM2...${NC}"
pm2 start ecosystem.config.js
echo -e "${GREEN}✅ Server started${NC}"

# Step 8: Setup PM2 startup
echo -e "\n${YELLOW}Step 8: Setting up PM2 startup...${NC}"
pm2 save
echo -e "${GREEN}✅ PM2 configuration saved${NC}"
echo -e "${YELLOW}Run the following command to enable PM2 on system boot:${NC}"
pm2 startup | grep "sudo"

# Step 9: Setup health monitor cron job
echo -e "\n${YELLOW}Step 9: Setting up health monitor...${NC}"
chmod +x health-monitor.sh
# Check if cron job already exists
if ! crontab -l 2>/dev/null | grep -q "health-monitor.sh"; then
    # Add cron job to run every 5 minutes
    (crontab -l 2>/dev/null; echo "*/5 * * * * $SCRIPT_DIR/health-monitor.sh") | crontab -
    echo -e "${GREEN}✅ Health monitor cron job added (runs every 5 minutes)${NC}"
else
    echo -e "${GREEN}✅ Health monitor cron job already exists${NC}"
fi

# Step 10: Create monitoring log file
echo -e "\n${YELLOW}Step 10: Setting up monitoring...${NC}"
sudo touch /var/log/kora-health-monitor.log
sudo chmod 666 /var/log/kora-health-monitor.log
echo -e "${GREEN}✅ Monitoring log file created${NC}"

# Final status
echo -e "\n${GREEN}🎉 Setup Complete!${NC}"
echo -e "\n${YELLOW}Server Status:${NC}"
pm2 status

echo -e "\n${YELLOW}View logs:${NC}"
echo -e "  pm2 logs kora-backend"

echo -e "\n${YELLOW}Monitor server:${NC}"
echo -e "  pm2 monit"

echo -e "\n${YELLOW}Health monitor logs:${NC}"
echo -e "  tail -f /var/log/kora-health-monitor.log"

echo -e "\n${YELLOW}Test server:${NC}"
echo -e "  curl http://localhost:3001/health"

echo -e "\n${GREEN}✅ Server is now running with:${NC}"
echo -e "  - Auto-restart on crash"
echo -e "  - Memory limit: 500MB"
echo -e "  - Connection pool: 5 connections"
echo -e "  - Health check: Every 5 minutes"
echo -e "  - Logs: ./logs/ directory"

echo -e "\n${YELLOW}⚠️  Don't forget to run the PM2 startup command shown above!${NC}"

