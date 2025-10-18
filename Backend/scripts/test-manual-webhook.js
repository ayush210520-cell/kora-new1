const crypto = require('crypto');

// Test manual webhook with proper signature
async function testManualWebhook() {
  console.log('🧪 Testing Manual Webhook...\n');
  
  // Sample webhook payload (payment.captured event)
  const webhookPayload = {
    event: "payment.captured",
    payload: {
      payment: {
        entity: {
          id: "pay_test123",
          order_id: "order_test123", 
          amount: 1000,
          currency: "INR",
          status: "captured"
        }
      }
    }
  };
  
  const body = JSON.stringify(webhookPayload);
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'test_secret';
  const signature = crypto.createHmac('sha256', webhookSecret).update(body).digest('hex');
  
  console.log('📋 Test Details:');
  console.log(`Secret: ${webhookSecret.substring(0, 8)}...`);
  console.log(`Signature: ${signature}`);
  console.log(`Order ID: ${webhookPayload.payload.payment.entity.order_id}`);
  
  try {
    const response = await fetch('https://kora-ygpq.onrender.com/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Razorpay-Signature': signature
      },
      body: body
    });
    
    const result = await response.text();
    console.log('\n📤 Response:');
    console.log(`Status: ${response.status}`);
    console.log(`Result: ${result}`);
    
    if (response.status === 200) {
      console.log('\n✅ SUCCESS! Webhook is working');
    } else {
      console.log('\n❌ FAILED! Webhook is not working');
      console.log('Possible issues:');
      console.log('1. Webhook secret mismatch');
      console.log('2. Order not found in database');
      console.log('3. Server configuration issue');
    }
    
  } catch (error) {
    console.error('❌ Error testing webhook:', error.message);
  }
}

testManualWebhook().catch(console.error);




