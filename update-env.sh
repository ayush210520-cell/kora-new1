#!/bin/bash

# Script to update .env file on production server
# Usage: ./update-env.sh

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🔐 Updating Production .env file${NC}"
echo ""

# Check if .env exists locally
if [ ! -f "Backend/.env" ]; then
    echo -e "${RED}❌ Backend/.env file not found!${NC}"
    exit 1
fi

echo -e "${YELLOW}⚠️  This will update .env on production server${NC}"
echo -e "${YELLOW}⚠️  Current backend will be restarted${NC}"
echo ""
read -p "Continue? (y/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

echo ""
echo -e "${BLUE}📤 Uploading .env to server...${NC}"

# Backup existing .env on server
echo -e "${BLUE}💾 Creating backup of current .env...${NC}"
ssh ubuntu@server.korakagazindia.com "cd ~/kora/Backend && cp .env .env.backup-\$(date +%Y%m%d-%H%M%S)"

# Upload new .env
scp Backend/.env ubuntu@server.korakagazindia.com:~/kora/Backend/.env

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ .env file uploaded${NC}"
else
    echo -e "${RED}❌ Failed to upload .env${NC}"
    exit 1
fi

# Restart backend
echo ""
echo -e "${BLUE}🔄 Restarting backend...${NC}"
ssh ubuntu@server.korakagazindia.com "cd ~/kora/Backend && pm2 restart korakagaz-backend"

echo ""
echo -e "${GREEN}✅ Environment variables updated!${NC}"
echo ""
echo -e "${BLUE}🏥 Testing backend health...${NC}"
sleep 3
curl -s https://server.korakagazindia.com/health | jq '.' || curl -s https://server.korakagazindia.com/health

echo ""
echo ""
echo -e "${GREEN}✅ Done! Try uploading an image now.${NC}"
echo -e "${BLUE}🔗 Admin Panel: https://www.korakagazindia.com/admin${NC}"

