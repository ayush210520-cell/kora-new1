#!/bin/bash
# Auto-deployment script for EC2
# This runs when you push to GitHub

echo "🚀 Starting deployment..."
echo "================================"

# Navigate to backend directory
cd ~/kora/Backend

# Pull latest code from GitHub
echo "📥 Pulling latest code from GitHub..."
git pull origin main

# Check if pull was successful
if [ $? -eq 0 ]; then
    echo "✅ Code updated successfully"
else
    echo "❌ Git pull failed"
    exit 1
fi

# Install/update dependencies
echo "📦 Installing dependencies..."
npm install

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Run database migrations
echo "🗄️  Running database migrations..."
npx prisma migrate deploy

# Restart PM2 process
echo "🔄 Restarting backend..."
pm2 restart korakagaz-backend

# Show status
echo "📊 Backend status:"
pm2 status

echo "================================"
echo "✅ Deployment complete!"
echo "🌐 Backend URL: http://13.204.77.226"
echo "================================"

