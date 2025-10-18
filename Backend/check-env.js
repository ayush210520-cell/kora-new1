// Environment Variables Checker
// Run this to see what's missing in your .env file

require('dotenv').config();

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';

console.log(`${BLUE}🔍 Checking Environment Variables...${RESET}\n`);

const requiredVars = {
  'Database': [
    'DATABASE_URL'
  ],
  'JWT': [
    'JWT_SECRET'
  ],
  'AWS S3 (for image upload)': [
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'AWS_REGION',
    'AWS_S3_BUCKET'
  ],
  'AWS CloudFront (optional but recommended)': [
    'AWS_CLOUDFRONT_DOMAIN'
  ],
  'Razorpay': [
    'RAZORPAY_KEY_ID',
    'RAZORPAY_KEY_SECRET'
  ],
  'Email': [
    'EMAIL_HOST',
    'EMAIL_PORT',
    'EMAIL_USER',
    'EMAIL_PASSWORD',
    'EMAIL_FROM'
  ],
  'Shiprocket': [
    'SHIPROCKET_EMAIL',
    'SHIPROCKET_PASSWORD'
  ],
  'MSG91 (OTP)': [
    'MSG91_AUTH_KEY',
    'MSG91_TEMPLATE_ID',
    'MSG91_SENDER_ID'
  ],
  'Frontend': [
    'FRONTEND_URL'
  ]
};

let allGood = true;
let criticalMissing = false;

Object.entries(requiredVars).forEach(([category, vars]) => {
  console.log(`${BLUE}📦 ${category}${RESET}`);
  
  vars.forEach(varName => {
    const value = process.env[varName];
    const isCritical = ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_S3_BUCKET', 'DATABASE_URL', 'JWT_SECRET'].includes(varName);
    
    if (!value || value === '' || value === 'your_value_here') {
      if (isCritical) {
        console.log(`   ${RED}❌ ${varName} - MISSING (CRITICAL for image upload!)${RESET}`);
        criticalMissing = true;
      } else {
        console.log(`   ${YELLOW}⚠️  ${varName} - Missing${RESET}`);
      }
      allGood = false;
    } else {
      // Mask sensitive values
      let displayValue = value;
      if (varName.includes('SECRET') || varName.includes('PASSWORD') || varName.includes('KEY')) {
        displayValue = value.substring(0, 4) + '***' + value.substring(value.length - 4);
      } else if (varName.includes('URL')) {
        displayValue = value.substring(0, 30) + '...';
      }
      console.log(`   ${GREEN}✅ ${varName} - Set (${displayValue})${RESET}`);
    }
  });
  console.log('');
});

console.log(`${BLUE}${'='.repeat(60)}${RESET}\n`);

if (criticalMissing) {
  console.log(`${RED}❌ CRITICAL ISSUE: Missing AWS S3 credentials!${RESET}`);
  console.log(`${YELLOW}Image upload will NOT work without these.${RESET}\n`);
  console.log(`${BLUE}Quick Fix:${RESET}`);
  console.log('1. Add to Backend/.env file:');
  console.log('');
  console.log('   AWS_ACCESS_KEY_ID=your_access_key_here');
  console.log('   AWS_SECRET_ACCESS_KEY=your_secret_key_here');
  console.log('   AWS_REGION=ap-south-1');
  console.log('   AWS_S3_BUCKET=korakagazindia');
  console.log('   AWS_CLOUDFRONT_DOMAIN=d22mx6u12sujnm.cloudfront.net');
  console.log('');
  console.log('2. Get AWS credentials from AWS Console:');
  console.log('   https://console.aws.amazon.com/iam/home#/security_credentials');
  console.log('');
  console.log('3. After updating, restart backend:');
  console.log('   pm2 restart korakagaz-backend');
  console.log('');
} else if (!allGood) {
  console.log(`${YELLOW}⚠️  Some optional variables are missing${RESET}`);
  console.log('   App will work but some features may not be available\n');
} else {
  console.log(`${GREEN}✅ All environment variables are set!${RESET}\n`);
}

// Test S3 connection if AWS vars are present
if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  console.log(`${BLUE}🧪 Testing S3 connection...${RESET}`);
  
  const { S3Client, ListBucketsCommand } = require('@aws-sdk/client-s3');
  
  const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'ap-south-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });
  
  s3Client.send(new ListBucketsCommand({}))
    .then(() => {
      console.log(`${GREEN}✅ S3 connection successful!${RESET}`);
      console.log(`${GREEN}   Image upload should work.${RESET}\n`);
    })
    .catch((error) => {
      console.log(`${RED}❌ S3 connection failed!${RESET}`);
      console.log(`${RED}   Error: ${error.message}${RESET}`);
      console.log(`${YELLOW}   Check your AWS credentials.${RESET}\n`);
    });
} else {
  console.log(`${RED}⚠️  Cannot test S3 - AWS credentials missing${RESET}\n`);
}

