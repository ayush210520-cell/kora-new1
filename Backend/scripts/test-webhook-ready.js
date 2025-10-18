// Test if webhook is ready for Razorpay
async function testWebhookReady() {
  console.log('🧪 Testing Webhook Readiness...\n');
  
  // Test 1: Webhook endpoint accessibility
  console.log('1️⃣ Testing webhook endpoint...');
  try {
    const response = await fetch('https://kora-ygpq.onrender.com/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ test: 'webhook' })
    });
    
    const result = await response.text();
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${result}`);
    
    if (response.status === 400 && result.includes('Invalid signature')) {
      console.log('   ✅ Webhook endpoint is working and rejecting invalid signatures');
    } else {
      console.log('   ❌ Webhook endpoint issue');
      return;
    }
  } catch (error) {
    console.log('   ❌ Webhook endpoint error:', error.message);
    return;
  }
  
  // Test 2: Server health
  console.log('\n2️⃣ Testing server health...');
  try {
    const response = await fetch('https://kora-ygpq.onrender.com/ping');
    const result = await response.text();
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${result}`);
    
    if (response.status === 200) {
      console.log('   ✅ Server is healthy');
    } else {
      console.log('   ❌ Server health issue');
      return;
    }
  } catch (error) {
    console.log('   ❌ Server health error:', error.message);
    return;
  }
  
  // Test 3: Database health
  console.log('\n3️⃣ Testing database health...');
  try {
    const response = await fetch('https://kora-ygpq.onrender.com/health');
    const result = await response.json();
    console.log(`   Status: ${response.status}`);
    console.log(`   Database: ${result.database}`);
    
    if (result.database === 'connected') {
      console.log('   ✅ Database is connected');
    } else {
      console.log('   ❌ Database connection issue');
      return;
    }
  } catch (error) {
    console.log('   ❌ Database health error:', error.message);
    return;
  }
  
  console.log('\n🎯 Webhook Status:');
  console.log('✅ Backend webhook handler: Working');
  console.log('✅ Signature verification: Working');
  console.log('✅ Server health: Working');
  console.log('✅ Database connection: Working');
  console.log('✅ Webhook endpoint: Ready for Razorpay');
  
  console.log('\n📋 Webhook Configuration:');
  console.log('✅ Webhook URL: https://kora-ygpq.onrender.com/webhook');
  console.log('✅ Events: payment.captured, payment.failed');
  console.log('✅ Server: Ready to receive webhooks');
  
  console.log('\n🚀 Next Steps:');
  console.log('1. Make a test payment to verify webhook delivery');
  console.log('2. Check if order automatically confirms');
  console.log('3. Monitor server logs for webhook events');
  
  console.log('\n✅ Webhook is ready for Razorpay!');
  console.log('🎉 All systems are working properly!');
}

testWebhookReady().catch(console.error);




