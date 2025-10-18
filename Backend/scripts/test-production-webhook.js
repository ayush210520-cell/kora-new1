#!/usr/bin/env node

/**
 * Script to test production webhook endpoint
 */

const crypto = require('crypto');

console.log('🧪 Testing Production Webhook\n');

// Test webhook signature generation
function generateWebhookSignature(body, secret) {
  return crypto.createHmac('sha256', secret).update(JSON.stringify(body)).digest('hex');
}

// Sample webhook payload (payment.captured event)
const sampleWebhookPayload = {
  event: 'payment.captured',
  payload: {
    payment: {
      entity: {
        id: 'pay_test123',
        order_id: 'order_RPJJLk4m7J8CeJ', // Your actual order ID
        amount: 100,
        currency: 'INR',
        status: 'captured'
      }
    }
  }
};

const webhookSecret = 'ayushone';
const signature = generateWebhookSignature(sampleWebhookPayload, webhookSecret);

console.log('📋 Test Configuration:');
console.log(`Webhook Secret: ${webhookSecret}`);
console.log(`Sample Order ID: ${sampleWebhookPayload.payload.payment.entity.order_id}`);
console.log(`Generated Signature: ${signature}`);

console.log('\n🔗 Testing Production Webhook:');
console.log('URL: https://kora-ygpq.onrender.com/webhook');
console.log('Method: POST');
console.log('Headers:');
console.log(`  Content-Type: application/json`);
console.log(`  X-Razorpay-Signature: ${signature}`);
console.log('\nBody:');
console.log(JSON.stringify(sampleWebhookPayload, null, 2));

console.log('\n📝 Next Steps:');
console.log('1. Update Razorpay Dashboard webhook URL to: https://kora-ygpq.onrender.com/webhook');
console.log('2. Set webhook secret to: ayushone');
console.log('3. Enable payment.captured event');
console.log('4. Test with a real payment');

console.log('\n⚠️  Important:');
console.log('- Make sure the webhook URL is accessible from the internet');
console.log('- The webhook secret must match what you set in Razorpay dashboard');
console.log('- Test with a real payment to verify it works');

