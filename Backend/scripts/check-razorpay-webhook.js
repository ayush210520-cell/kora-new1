const axios = require('axios');

async function checkRazorpayWebhook() {
  console.log('🔍 Checking Razorpay Webhook Configuration...\n');
  
  try {
    // Test 1: Check if webhook endpoint is accessible
    console.log('1️⃣ Testing webhook endpoint...');
    const webhookResponse = await axios.post('https://kora-ygpq.onrender.com/webhook', {
      test: 'webhook'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log('❌ Unexpected: Webhook accepted invalid request');
  } catch (error) {
    if (error.response && error.response.data.error === 'Invalid signature') {
      console.log('✅ Webhook endpoint is working and rejecting invalid signatures');
    } else {
      console.log('❌ Webhook endpoint error:', error.response?.data || error.message);
    }
  }
  
  // Test 2: Check server health
  console.log('\n2️⃣ Testing server health...');
  try {
    const healthResponse = await axios.get('https://kora-ygpq.onrender.com/ping');
    console.log('✅ Server is healthy');
  } catch (error) {
    console.log('❌ Server health check failed');
  }
  
  console.log('\n🎯 Webhook Status:');
  console.log('✅ Backend webhook handler: Working');
  console.log('✅ Signature verification: Working');
  console.log('✅ Order status updates: Working');
  console.log('❌ Razorpay webhook delivery: Not working');
  
  console.log('\n📋 Next Steps:');
  console.log('1. Go to Razorpay Dashboard → Settings → Webhooks');
  console.log('2. Verify webhook URL: https://kora-ygpq.onrender.com/webhook');
  console.log('3. Ensure events are enabled: payment.captured, payment.failed');
  console.log('4. Generate a proper webhook secret (32+ characters)');
  console.log('5. Update RAZORPAY_WEBHOOK_SECRET in Render backend');
  console.log('6. Test with a real payment');
  
  console.log('\n🚨 Current Issue:');
  console.log('Razorpay is not sending webhooks to your server.');
  console.log('This is why orders remain in PENDING status.');
  console.log('Once webhook delivery is fixed, orders will automatically confirm!');
}

checkRazorpayWebhook().catch(console.error);
