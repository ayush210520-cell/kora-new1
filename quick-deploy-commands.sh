#!/bin/bash
# KORAKAGAZ AWS Deployment - Quick Commands
# Copy-paste these commands one by one

echo "🚀 KORAKAGAZ Backend Deployment Script"
echo "========================================"
echo ""

# Step 1: Update system
echo "📦 Step 1: Updating system..."
sudo apt update && sudo apt upgrade -y

# Step 2: Install Node.js
echo "🟢 Step 2: Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Step 3: Install essential tools
echo "🔧 Step 3: Installing Git, PM2, build tools..."
sudo apt install -y git build-essential
sudo npm install -g pm2

# Step 4: Clone repository
echo "📁 Step 4: Cloning repository..."
cd ~
git clone https://github.com/Ayushsolanki21/kora.git
cd kora/Backend

# Step 5: Create .env file
echo "🔑 Step 5: Creating .env file..."
cat > .env << 'EOF'
# ⚠️ IMPORTANT: Update these values with your actual credentials!

# Database (Update with your RDS endpoint and password!)
DATABASE_URL="postgresql://korakagaz_admin:YOUR-PASSWORD@YOUR-RDS-ENDPOINT:5432/korakagaz"

# Server
NODE_ENV="production"
PORT="3001"

# JWT (Update with a strong secret!)
JWT_SECRET="korakagaz-super-secret-jwt-key-2025-production"

# Razorpay (Add your actual keys!)
RAZORPAY_KEY_ID="rzp_live_xxxxxxxxxxxxx"
RAZORPAY_KEY_SECRET="xxxxxxxxxxxxxxxxxxxxxxxx"

# AWS S3 (Add your actual credentials!)
AWS_ACCESS_KEY_ID="AKIAxxxxxxxxxxxxx"
AWS_SECRET_ACCESS_KEY="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
AWS_REGION="ap-south-1"
AWS_S3_BUCKET="korakagazindia"

# CloudFront
CLOUDFRONT_DOMAIN="d22mx6u12sujnm.cloudfront.net"

# Email
EMAIL_FROM="noreply@korakagazindia.com"
SMTP_HOST="smtp.hostinger.com"
SMTP_PORT="465"
SMTP_USER="noreply@korakagazindia.com"
SMTP_PASSWORD="your-email-password"

# Frontend
FRONTEND_URL="https://korakagazindia.com"
EOF

echo "⚠️  IMPORTANT: Edit .env file and update all credentials!"
echo "Run: nano .env"
echo ""
read -p "Press Enter after you've updated .env file..."

# Step 6: Install dependencies
echo "📦 Step 6: Installing npm packages..."
npm install

# Step 7: Setup Prisma
echo "🗄️  Step 7: Setting up Prisma & Database..."
npx prisma generate
npx prisma migrate deploy

# Step 8: Test backend
echo "🧪 Step 8: Testing backend..."
echo "Starting server for 5 seconds..."
timeout 5 npm start || true

# Step 9: Start with PM2
echo "🚀 Step 9: Starting backend with PM2..."
pm2 start server.js --name korakagaz-backend
pm2 save
pm2 startup

echo ""
echo "✅ Backend deployment complete!"
echo ""
echo "📊 Check status: pm2 status"
echo "📝 View logs: pm2 logs korakagaz-backend"
echo ""

# Step 10: Install Nginx
echo "🌐 Step 10: Installing Nginx..."
sudo apt install -y nginx

# Get EC2 public IP
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)

# Step 11: Configure Nginx
echo "⚙️  Step 11: Configuring Nginx..."
sudo bash -c "cat > /etc/nginx/sites-available/korakagaz << 'NGINXEOF'
server {
    listen 80;
    server_name $PUBLIC_IP;

    client_max_body_size 50M;
    proxy_connect_timeout 600;
    proxy_send_timeout 600;
    proxy_read_timeout 600;
    send_timeout 600;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
NGINXEOF
"

sudo ln -s /etc/nginx/sites-available/korakagaz /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

echo ""
echo "✅ All steps complete!"
echo ""
echo "🎉 Your backend is now running on AWS!"
echo ""
echo "📍 Backend URL: http://$PUBLIC_IP"
echo "📍 API Test: curl http://$PUBLIC_IP/api/products"
echo ""
echo "Next steps:"
echo "1. Update frontend NEXT_PUBLIC_API_URL to: http://$PUBLIC_IP"
echo "2. Test all API endpoints"
echo "3. Setup domain (optional)"
echo ""

