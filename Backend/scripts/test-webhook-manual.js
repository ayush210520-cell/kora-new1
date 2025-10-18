const crypto = require('crypto');

// Test webhook with proper signature
async function testWebhookManually() {
  console.log('🧪 Testing Webhook Manually...\n');
  
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'ayushone...';
  const testPayload = {
    event: 'payment.captured',
    payload: {
      payment: {
        entity: {
          id: 'pay_test123',
          order_id: 'order_RPMtNN38aPOWVN', // Use actual order ID from database
          amount: 100,
          currency: 'INR',
          status: 'captured'
        }
      }
    }
  };
  
  const body = JSON.stringify(testPayload);
  const signature = crypto.createHmac('sha256', webhookSecret).update(body).digest('hex');
  
  console.log('📋 Test Webhook Data:');
  console.log('Payload:', JSON.stringify(testPayload, null, 2));
  console.log('Signature:', signature);
  console.log('Secret:', webhookSecret.substring(0, 8) + '...');
  
  try {
    const response = await fetch('https://kora-ygpq.onrender.com/api/orders/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Razorpay-Signature': signature
      },
      body: body
    });
    
    const result = await response.text();
    console.log('\n📤 Webhook Response:');
    console.log('Status:', response.status);
    console.log('Response:', result);
    
    if (response.ok) {
      console.log('\n✅ Webhook test successful!');
    } else {
      console.log('\n❌ Webhook test failed!');
    }
    
  } catch (error) {
    console.error('❌ Error testing webhook:', error.message);
  }
}

testWebhookManually();
