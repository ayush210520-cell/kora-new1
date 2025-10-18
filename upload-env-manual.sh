#!/bin/bash

# Manual .env upload script
# If SSH keys are not set up, this provides manual instructions

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🔐 Upload .env File to Production${NC}"
echo ""
echo "Since SSH might not be configured, here are manual steps:"
echo ""
echo -e "${YELLOW}=== Option 1: Use SFTP (Recommended) ===${NC}"
echo ""
echo "1. Open FileZilla or Cyberduck"
echo "2. Connect to: server.korakagazindia.com"
echo "3. Username: ubuntu"
echo "4. Upload Backend/.env to /home/ubuntu/kora/Backend/.env"
echo "5. SSH and restart: ssh ubuntu@server.korakagazindia.com 'pm2 restart korakagaz-backend'"
echo ""
echo -e "${YELLOW}=== Option 2: Copy-Paste .env Content ===${NC}"
echo ""
echo "1. Copy .env file content:"
echo "   cat Backend/.env | pbcopy"
echo ""
echo "2. SSH to server:"
echo "   ssh ubuntu@server.korakagazindia.com"
echo ""
echo "3. Edit .env file:"
echo "   nano ~/kora/Backend/.env"
echo ""
echo "4. Paste content (Cmd+V), save (Ctrl+X, Y, Enter)"
echo ""
echo "5. Restart backend:"
echo "   pm2 restart korakagaz-backend"
echo ""
echo -e "${YELLOW}=== Option 3: Direct Edit on Server ===${NC}"
echo ""
echo "1. SSH to server:"
echo "   ssh ubuntu@server.korakagazindia.com"
echo ""
echo "2. Edit .env:"
echo "   cd ~/kora/Backend"
echo "   nano .env"
echo ""
echo "3. Add missing variables (AWS credentials, etc.)"
echo ""
echo "4. Restart:"
echo "   pm2 restart korakagaz-backend"
echo ""
echo -e "${GREEN}Choose the option that works best for you!${NC}"

