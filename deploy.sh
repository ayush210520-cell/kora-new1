#!/bin/bash

# Quick Deploy Script - Push changes and they go live!
# Usage: ./deploy.sh "your commit message"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🚀 Kora Deploy${NC}"
echo ""

# Check if there are changes
if ! git diff-index --quiet HEAD --; then
    # Get commit message
    if [ -z "$1" ]; then
        read -p "Enter commit message: " MSG
    else
        MSG="$1"
    fi
    
    echo -e "${BLUE}📦 Committing changes...${NC}"
    git add .
    git commit -m "$MSG"
fi

# Push to GitHub
echo -e "${BLUE}📤 Pushing to GitHub...${NC}"
git push origin main

echo ""
echo -e "${GREEN}✅ Pushed to GitHub!${NC}"
echo ""
echo -e "${BLUE}🎯 Next steps:${NC}"
echo "   1. AWS Amplify will auto-deploy frontend (~2 min)"
echo "   2. Manually deploy backend on server (see below)"
echo ""
echo -e "${BLUE}📋 Backend Deploy Command:${NC}"
echo -e "${YELLOW}ssh ubuntu@server.korakagazindia.com 'cd ~/kora/Backend && git pull && pm2 restart korakagaz-backend'${NC}"
echo ""
echo -e "${BLUE}🏥 After deployment:${NC}"
echo "   Frontend: https://www.korakagazindia.com"
echo "   Backend: https://server.korakagazindia.com/health"

