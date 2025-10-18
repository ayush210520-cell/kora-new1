#!/bin/bash

# Wait for EC2 Instance to be ready after reboot
# This script will automatically check every 10 seconds

EC2_IP="13.233.176.103"
KEY_FILE="/Users/ayushsolanki/Downloads/korakagaz-backend-key.pem"
MAX_ATTEMPTS=20  # 20 attempts × 10 seconds = 3.5 minutes max

echo "🔄 Waiting for server to come back online..."
echo "   IP: $EC2_IP"
echo "   This may take 2-3 minutes..."
echo ""

attempt=1
while [ $attempt -le $MAX_ATTEMPTS ]; do
    echo "[$attempt/$MAX_ATTEMPTS] Checking connection... ($(date +%H:%M:%S))"
    
    # Try to connect
    if ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no -o BatchMode=yes -i "$KEY_FILE" ubuntu@$EC2_IP "echo 'ready'" &> /dev/null; then
        echo ""
        echo "✅ SERVER IS READY!"
        echo ""
        echo "🚀 Connecting now..."
        ssh -i "$KEY_FILE" ubuntu@$EC2_IP
        exit 0
    else
        echo "   ⏳ Not ready yet, waiting 10 seconds..."
        sleep 10
    fi
    
    attempt=$((attempt + 1))
done

echo ""
echo "❌ Server did not come online within expected time"
echo "   Please check AWS Console for instance status"
echo "   Status should be: Running with 2/2 checks passed"

