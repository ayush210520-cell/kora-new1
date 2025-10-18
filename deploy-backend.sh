#!/bin/bash

# Backend Deploy Script
# Deploys backend to production server

BLUE='\033[0;34m'
GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${BLUE}🔧 Deploying Backend...${NC}"
echo ""

# SSH and deploy
ssh ubuntu@server.korakagazindia.com << 'ENDSSH'
cd ~/kora/Backend
echo "📥 Pulling latest code..."
git pull origin main

echo "📦 Installing dependencies..."
npm install --production

echo "🗄️  Running migrations..."
npx prisma generate
npx prisma migrate deploy

echo "🔄 Restarting server..."
pm2 restart korakagaz-backend
pm2 save

echo "✅ Backend deployed!"
ENDSSH

echo ""
echo -e "${GREEN}✅ Backend deployment complete!${NC}"
echo ""
echo "🏥 Check health: https://server.korakagazindia.com/health"

