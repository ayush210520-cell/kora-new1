// Test webhook without signature verification
async function testWebhookBypass() {
  console.log('🧪 Testing Webhook Bypass (No Signature)...\n');
  
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
  
  console.log('📋 Test Details:');
  console.log(`Event: ${webhookPayload.event}`);
  console.log(`Order ID: ${webhookPayload.payload.payment.entity.order_id}`);
  console.log(`Amount: ${webhookPayload.payload.payment.entity.amount}`);
  
  try {
    const response = await fetch('https://kora-ygpq.onrender.com/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
        // No signature header - this should trigger bypass
      },
      body: JSON.stringify(webhookPayload)
    });
    
    const result = await response.text();
    console.log('\n📤 Response:');
    console.log(`Status: ${response.status}`);
    console.log(`Result: ${result}`);
    
    if (response.status === 200) {
      console.log('\n✅ SUCCESS! Webhook processed successfully');
    } else if (response.status === 404) {
      console.log('\n⚠️  Order not found - this is expected for test order');
      console.log('✅ Webhook endpoint is working correctly');
    } else {
      console.log('\n❌ FAILED! Webhook is not working');
    }
    
  } catch (error) {
    console.error('❌ Error testing webhook:', error.message);
  }
}

testWebhookBypass().catch(console.error);




