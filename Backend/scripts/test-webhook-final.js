const crypto = require('crypto');

async function testWebhookFinal() {
  console.log('🧪 Final Webhook Test...\n');
  
  // Test with the new secret
  const webhookSecret = 'whsec_61043f0cd84885f6b60b5e4db175a0137b85108be421b154c70cc129111ed0a8';
  const testPayload = {
    event: 'payment.captured',
    payload: {
      payment: {
        entity: {
          id: 'pay_final_test',
          order_id: 'order_RPMf6RGFPj9cCW',
          amount: 100,
          currency: 'INR',
          status: 'captured'
        }
      }
    }
  };
  
  const body = JSON.stringify(testPayload);
  const signature = crypto.createHmac('sha256', webhookSecret).update(body).digest('hex');
  
  console.log('📋 Test Details:');
  console.log('Secret:', webhookSecret.substring(0, 20) + '...');
  console.log('Signature:', signature);
  console.log('Order ID:', testPayload.payload.payment.entity.order_id);
  
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
    console.log('\n📤 Response:');
    console.log('Status:', response.status);
    console.log('Result:', result);
    
    if (response.ok) {
      console.log('\n🎉 SUCCESS! Webhook is working perfectly!');
      console.log('✅ Order status should be updated to CONFIRMED');
    } else {
      console.log('\n❌ FAILED! Webhook is not working');
      console.log('Possible issues:');
      console.log('1. Render backend not restarted with new secret');
      console.log('2. Webhook secret mismatch between Razorpay and backend');
      console.log('3. Razorpay webhook not properly configured');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  console.log('\n📋 Next Steps:');
  console.log('1. If webhook failed, restart Render backend service');
  console.log('2. Verify webhook secret in Render matches Razorpay');
  console.log('3. Test with a real payment to confirm everything works');
}

testWebhookFinal();
