#!/usr/bin/env node

/**
 * Environment Variables Checker for Production
 * This script checks if all required environment variables are set
 */

const requiredVars = [
  // Database
  'DATABASE_URL',
  
  // Razorpay
  'RAZORPAY_KEY_ID',
  'RAZORPAY_SECRET',
  'RAZORPAY_WEBHOOK_SECRET',
  
  // Shiprocket
  'SHIPROCKET_EMAIL',
  'SHIPROCKET_PASSWORD',
  'SHIPROCKET_PICKUP_LOCATION',
  'SHIPROCKET_COMPANY_NAME',
  'SHIPROCKET_RESELLER_NAME',
  
  // Email (Critical for welcome emails)
  'EMAIL_USER',
  'EMAIL_PASS',
  'SUPPORT_EMAIL',
  'STORE_NAME',
  'STORE_URL',
  
  // JWT
  'JWT_SECRET',
  
  // Server
  'NODE_ENV',
  'PORT'
];

const optionalVars = [
  'SMTP_HOST',
  'SMTP_PORT'
];

console.log('🔍 Checking Environment Variables...\n');

let allRequired = true;
let missingVars = [];
let presentVars = [];

// Check required variables
console.log('📋 Required Variables:');
requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value && value.trim() !== '') {
    console.log(`✅ ${varName}: ${value.substring(0, 20)}${value.length > 20 ? '...' : ''}`);
    presentVars.push(varName);
  } else {
    console.log(`❌ ${varName}: NOT SET`);
    missingVars.push(varName);
    allRequired = false;
  }
});

console.log('\n📋 Optional Variables:');
optionalVars.forEach(varName => {
  const value = process.env[varName];
  if (value && value.trim() !== '') {
    console.log(`✅ ${varName}: ${value}`);
  } else {
    console.log(`⚠️  ${varName}: NOT SET (using default)`);
  }
});

console.log('\n📊 Summary:');
console.log(`✅ Present: ${presentVars.length}/${requiredVars.length}`);
console.log(`❌ Missing: ${missingVars.length}`);

if (missingVars.length > 0) {
  console.log('\n🚨 Missing Required Variables:');
  missingVars.forEach(varName => {
    console.log(`   - ${varName}`);
  });
}

// Check specific email configuration
console.log('\n📧 Email Configuration Check:');
const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASS;
const storeUrl = process.env.STORE_URL;
const supportEmail = process.env.SUPPORT_EMAIL;
const storeName = process.env.STORE_NAME;

if (emailUser && emailPass) {
  console.log('✅ Email credentials are set');
} else {
  console.log('❌ Email credentials missing - Welcome emails will not work');
}

if (storeUrl) {
  console.log(`✅ Store URL: ${storeUrl}`);
} else {
  console.log('❌ Store URL not set - Email links will be broken');
}

if (supportEmail) {
  console.log(`✅ Support Email: ${supportEmail}`);
} else {
  console.log('❌ Support Email not set - Using default');
}

if (storeName) {
  console.log(`✅ Store Name: ${storeName}`);
} else {
  console.log('❌ Store Name not set - Using default');
}

// Check if we're in production
const nodeEnv = process.env.NODE_ENV;
console.log(`\n🌍 Environment: ${nodeEnv || 'not set'}`);

if (nodeEnv === 'production') {
  console.log('✅ Running in production mode');
} else {
  console.log('⚠️  Not running in production mode');
}

// Final result
console.log('\n' + '='.repeat(50));
if (allRequired) {
  console.log('🎉 All required environment variables are set!');
  console.log('✅ Welcome emails should work properly');
} else {
  console.log('❌ Some required environment variables are missing!');
  console.log('🚨 Welcome emails will NOT work until all variables are set');
  console.log('\nTo fix this:');
  console.log('1. Go to your Render dashboard');
  console.log('2. Navigate to your service');
  console.log('3. Go to Environment tab');
  console.log('4. Add the missing variables');
  console.log('5. Redeploy your service');
}
console.log('='.repeat(50));

// Exit with appropriate code
process.exit(allRequired ? 0 : 1);
