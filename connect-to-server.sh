#!/bin/bash

# Quick Connect Script for Kora Backend Server
# Instance IP: 13.204.77.226

echo "🔍 Searching for SSH key: korakagaz-backend-key.pem"
echo ""

# Search for key file in common locations
KEY_LOCATIONS=(
    ~/Downloads/korakagaz-backend-key.pem
    ~/Desktop/korakagaz-backend-key.pem
    ~/.ssh/korakagaz-backend-key.pem
    ./korakagaz-backend-key.pem
)

KEY_FOUND=""
for location in "${KEY_LOCATIONS[@]}"; do
    if [ -f "$location" ]; then
        KEY_FOUND="$location"
        echo "✅ Found key file at: $KEY_FOUND"
        break
    fi
done

if [ -z "$KEY_FOUND" ]; then
    echo "❌ Key file not found in common locations!"
    echo ""
    echo "Searching entire home directory (this may take a moment)..."
    KEY_FOUND=$(find ~ -name "korakagaz-backend-key.pem" 2>/dev/null | head -1)
    
    if [ -n "$KEY_FOUND" ]; then
        echo "✅ Found key file at: $KEY_FOUND"
    else
        echo "❌ Key file not found!"
        echo ""
        echo "Please download it from AWS Console:"
        echo "1. Go to EC2 → Key Pairs"
        echo "2. Find 'korakagaz-backend-key'"
        echo "3. If not available, you'll need to use AWS Session Manager"
        exit 1
    fi
fi

echo ""
echo "🔧 Setting correct permissions..."
chmod 400 "$KEY_FOUND"
echo "✅ Permissions set to 400"

echo ""
echo "🚀 Connecting to server..."
echo "   Elastic IP: 13.233.176.103"
echo "   User: ubuntu"
echo ""

# Try to connect
ssh -o StrictHostKeyChecking=no -i "$KEY_FOUND" ubuntu@13.233.176.103

# If connection failed
if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Connection failed!"
    echo ""
    echo "Common fixes:"
    echo ""
    echo "1️⃣ Check Security Group:"
    echo "   AWS Console → EC2 → Security Groups → launch-wizard-2"
    echo "   Inbound Rules में SSH (Port 22) allowed होना चाहिए"
    echo ""
    echo "2️⃣ Try with verbose mode:"
    echo "   ssh -vvv -i \"$KEY_FOUND\" ubuntu@13.233.176.103"
    echo ""
    echo "3️⃣ Use AWS Session Manager (Browser-based):"
    echo "   AWS Console → EC2 → Instance → Connect → Session Manager"
    echo ""
    echo "4️⃣ Add your IP to Security Group:"
    echo "   Security Groups → launch-wizard-2 → Edit Inbound Rules"
    echo "   Add Rule: SSH, Port 22, Source: My IP"
    echo ""
fi

