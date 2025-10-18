#!/usr/bin/env node

/**
 * Script to check Razorpay configuration
 * This helps verify if the correct credentials are being used
 */

require('dotenv').config();

console.log('🔍 Razorpay Configuration Check\n');

// Check environment variables
const keyId = process.env.RAZORPAY_KEY_ID;
const secret = process.env.RAZORPAY_SECRET;
const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

console.log('📋 Environment Variables:');
console.log(`RAZORPAY_KEY_ID: ${keyId ? keyId.substring(0, 8) + '...' : '❌ NOT SET'}`);
console.log(`RAZORPAY_SECRET: ${secret ? secret.substring(0, 8) + '...' : '❌ NOT SET'}`);
console.log(`RAZORPAY_WEBHOOK_SECRET: ${webhookSecret ? webhookSecret.substring(0, 8) + '...' : '❌ NOT SET'}`);

// Check if it's live or test mode
if (keyId) {
  if (keyId.startsWith('rzp_live_')) {
    console.log('\n✅ Live Mode Detected');
  } else if (keyId.startsWith('rzp_test_')) {
    console.log('\n⚠️  Test Mode Detected');
  } else {
    console.log('\n❓ Unknown Mode');
  }
}

// Test Razorpay connection
if (keyId && secret) {
  try {
    const Razorpay = require('razorpay');
    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: secret,
    });

    console.log('\n🔗 Testing Razorpay Connection...');
    
    // Try to get account details
    razorpay.accounts.fetch((err, account) => {
      if (err) {
        console.log('❌ Razorpay Connection Failed:', err.message);
      } else {
        console.log('✅ Razorpay Connection Successful');
        console.log(`Account ID: ${account.id}`);
        console.log(`Account Name: ${account.name}`);
        console.log(`Account Type: ${account.type}`);
      }
    });
  } catch (error) {
    console.log('❌ Error initializing Razorpay:', error.message);
  }
} else {
  console.log('\n❌ Cannot test Razorpay connection - missing credentials');
}

console.log('\n📝 Next Steps:');
console.log('1. Update RAZORPAY_KEY_ID and RAZORPAY_SECRET in Render backend');
console.log('2. Update NEXT_PUBLIC_RAZORPAY_KEY in Vercel frontend');
console.log('3. Add www.korakagazindia.com to Razorpay dashboard');
console.log('4. Wait for domain approval (48 hours)');













