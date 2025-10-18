#!/bin/bash
echo "🔍 Testing Backend Server..."
echo ""

# Test backend health
echo "Testing: https://server.korakagazindia.com/health"
curl -s -m 5 https://server.korakagazindia.com/health | python3 -m json.tool 2>/dev/null || echo "❌ Backend not responding"

echo ""
echo "Testing: https://server.korakagazindia.com/ping"
curl -s -m 5 https://server.korakagazindia.com/ping || echo "❌ Backend not responding"

echo ""
echo ""
echo "If you see healthy status above, backend is working! ✅"

