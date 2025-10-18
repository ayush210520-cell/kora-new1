#!/bin/bash

# EC2 Connection Diagnostic Script
# यह script run करें अपनी local machine पर

echo "🔍 EC2 Connection Diagnostic Tool"
echo "=================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get user inputs
echo "📝 Please provide the following details:"
echo ""
read -p "Enter EC2 Public IP: " EC2_IP
read -p "Enter path to your .pem key file: " KEY_FILE
read -p "Enter SSH user (usually 'ubuntu' or 'ec2-user'): " SSH_USER

echo ""
echo "🔧 Running diagnostics..."
echo ""

# Test 1: Check if key file exists
echo "1️⃣ Checking key file..."
if [ -f "$KEY_FILE" ]; then
    echo -e "${GREEN}✅ Key file exists${NC}"
    
    # Check permissions
    PERMS=$(stat -f "%OLp" "$KEY_FILE" 2>/dev/null || stat -c "%a" "$KEY_FILE" 2>/dev/null)
    if [ "$PERMS" = "400" ] || [ "$PERMS" = "600" ]; then
        echo -e "${GREEN}✅ Key permissions are correct ($PERMS)${NC}"
    else
        echo -e "${RED}❌ Key permissions are wrong ($PERMS)${NC}"
        echo -e "${YELLOW}   Fix: chmod 400 $KEY_FILE${NC}"
    fi
else
    echo -e "${RED}❌ Key file not found: $KEY_FILE${NC}"
    exit 1
fi

echo ""

# Test 2: Check if IP is reachable
echo "2️⃣ Testing network connectivity to EC2..."
if ping -c 2 -W 2 $EC2_IP &> /dev/null; then
    echo -e "${GREEN}✅ EC2 instance is reachable via ping${NC}"
else
    echo -e "${YELLOW}⚠️  EC2 instance is not responding to ping (ICMP might be blocked)${NC}"
fi

echo ""

# Test 3: Check if port 22 is open
echo "3️⃣ Testing SSH port (22)..."
if nc -z -w 5 $EC2_IP 22 2>/dev/null; then
    echo -e "${GREEN}✅ Port 22 is open${NC}"
else
    echo -e "${RED}❌ Port 22 is closed or blocked${NC}"
    echo -e "${YELLOW}   Possible fixes:${NC}"
    echo -e "${YELLOW}   - Check Security Group inbound rules${NC}"
    echo -e "${YELLOW}   - Ensure SSH (Port 22) is allowed from your IP${NC}"
    echo -e "${YELLOW}   - Instance might be stopped${NC}"
fi

echo ""

# Test 4: Try SSH connection
echo "4️⃣ Attempting SSH connection..."
ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no -i "$KEY_FILE" ${SSH_USER}@${EC2_IP} "echo '✅ SSH connection successful!'" 2>&1 | head -20

SSH_EXIT=$?

echo ""

# Test 5: Summary
echo "=================================="
echo "📊 DIAGNOSTIC SUMMARY"
echo "=================================="

if [ $SSH_EXIT -eq 0 ]; then
    echo -e "${GREEN}🎉 CONNECTION SUCCESSFUL!${NC}"
    echo ""
    echo "Your SSH command:"
    echo -e "${GREEN}ssh -i $KEY_FILE ${SSH_USER}@${EC2_IP}${NC}"
else
    echo -e "${RED}❌ CONNECTION FAILED${NC}"
    echo ""
    echo "Common solutions:"
    echo ""
    echo "1️⃣ ${YELLOW}Check if Public IP changed:${NC}"
    echo "   - EC2 reboot के बाद IP change हो जाता है"
    echo "   - AWS Console में नया IP check करें"
    echo ""
    echo "2️⃣ ${YELLOW}Check Security Group:${NC}"
    echo "   - Port 22 (SSH) allowed होना चाहिए"
    echo "   - Source: 0.0.0.0/0 या आपका current IP"
    echo ""
    echo "3️⃣ ${YELLOW}Check Instance Status:${NC}"
    echo "   - Instance 'Running' state में होना चाहिए"
    echo "   - Status Checks: 2/2 passed"
    echo ""
    echo "4️⃣ ${YELLOW}Fix Key Permissions:${NC}"
    echo "   chmod 400 $KEY_FILE"
    echo ""
    echo "5️⃣ ${YELLOW}Use AWS Session Manager (Alternative):${NC}"
    echo "   - AWS Console → EC2 → Connect → Session Manager"
fi

echo ""
echo "📖 For detailed troubleshooting guide:"
echo "   Read: Backend/TROUBLESHOOT-SSH.md"
echo ""

