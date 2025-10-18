const axios = require('axios');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

async function testOrderAPI() {
  console.log('🧪 Testing Order Creation API...\n');
  
  try {
    // Step 1: Test server health
    console.log('🏥 Step 1: Testing server health...');
    try {
      const healthResponse = await axios.get(`${API_BASE_URL}/api/products`);
      console.log('✅ Server is running');
      console.log(`Products available: ${healthResponse.data.products?.length || 0}`);
    } catch (error) {
      console.log('❌ Server not responding:', error.message);
      return;
    }
    
    // Step 2: Test authentication (if needed)
    console.log('\n🔐 Step 2: Testing authentication...');
    console.log('Note: You need to authenticate first to create orders.');
    console.log('You can either:');
    console.log('  1. Use the frontend application to login and create orders');
    console.log('  2. Get an auth token and include it in the request headers');
    console.log('  3. Run the database test script instead');
    
    // Step 3: Show example API call
    console.log('\n📝 Step 3: Example API call for order creation...');
    console.log('POST /api/orders');
    console.log('Headers: {');
    console.log('  "Content-Type": "application/json",');
    console.log('  "Authorization": "Bearer YOUR_AUTH_TOKEN"');
    console.log('}');
    console.log('Body: {');
    console.log('  "addressId": "address_id_here",');
    console.log('  "orderItems": [');
    console.log('    {');
    console.log('      "productId": "product_id_here",');
    console.log('      "quantity": 1');
    console.log('    }');
    console.log('  ],');
    console.log('  "paymentMethod": "PREPAID",');
    console.log('  "notes": "Optional notes"');
    console.log('}');
    
    // Step 4: Test with curl command
    console.log('\n💻 Step 4: Test with curl command...');
    console.log('curl -X POST http://localhost:3001/api/orders \\');
    console.log('  -H "Content-Type: application/json" \\');
    console.log('  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \\');
    console.log('  -d \'{');
    console.log('    "addressId": "your_address_id",');
    console.log('    "orderItems": [');
    console.log('      {');
    console.log('        "productId": "your_product_id",');
    console.log('        "quantity": 1');
    console.log('      }');
    console.log('    ],');
    console.log('    "paymentMethod": "PREPAID"');
    console.log('  }\'');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testOrderAPI();
