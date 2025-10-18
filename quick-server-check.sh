#!/bin/bash
echo "🔍 Quick Server Health Check"
echo "=============================="
echo ""

# Check if server responds
echo "1. Pinging server..."
if ping -c 2 server.korakagazindia.com > /dev/null 2>&1; then
    echo "✅ Server is reachable"
else
    echo "❌ Server is NOT reachable"
fi

echo ""
echo "2. Checking backend health..."
curl -m 3 https://server.korakagazindia.com/ping 2>&1 | head -5

echo ""
echo "3. Checking PM2 status..."
ssh -i ~/Downloads/korakagaz-backend-key.pem -o ConnectTimeout=5 ubuntu@server.korakagazindia.com 'pm2 status' 2>&1 | head -10

echo ""
echo "=============================="

