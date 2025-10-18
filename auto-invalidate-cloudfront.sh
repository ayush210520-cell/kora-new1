#!/bin/bash

# Automatic CloudFront Cache Invalidation Script
# Run this after deploying changes for instant updates

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔄 CloudFront Cache Invalidation${NC}"
echo "================================"

# CloudFront Distribution ID
DISTRIBUTION_ID="EVCXJW5MPPLNF"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not installed!${NC}"
    echo "Install: brew install awscli"
    echo "Then configure: aws configure"
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS credentials not configured!${NC}"
    echo "Run: aws configure"
    echo "Enter your AWS Access Key ID and Secret Access Key"
    exit 1
fi

echo -e "${YELLOW}📡 Invalidating CloudFront cache...${NC}"

# Create invalidation
INVALIDATION_ID=$(aws cloudfront create-invalidation \
    --distribution-id $DISTRIBUTION_ID \
    --paths "/*" \
    --query 'Invalidation.Id' \
    --output text)

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Invalidation created successfully!${NC}"
    echo "Invalidation ID: $INVALIDATION_ID"
    echo ""
    echo -e "${YELLOW}⏳ Invalidation Status:${NC}"
    
    # Wait and check status
    sleep 2
    STATUS=$(aws cloudfront get-invalidation \
        --distribution-id $DISTRIBUTION_ID \
        --id $INVALIDATION_ID \
        --query 'Invalidation.Status' \
        --output text)
    
    echo "Status: $STATUS"
    echo ""
    echo -e "${GREEN}🎉 CloudFront cache will be cleared in 1-2 minutes!${NC}"
    echo ""
    echo "Your changes will be visible to all users immediately after completion."
else
    echo -e "${RED}❌ Failed to create invalidation${NC}"
    echo "Check your AWS credentials and permissions"
    exit 1
fi

