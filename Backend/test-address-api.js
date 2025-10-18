// Using built-in fetch (Node.js 18+)

async function testAddressAPI() {
  try {
    console.log('🧪 Testing Address API...\n');

    // First, login to get a token
    console.log('1. Logging in...');
    const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }

    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Login successful, token received');

    // Now test address creation
    console.log('\n2. Creating address...');
    const addressResponse = await fetch('http://localhost:3001/api/addresses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name: 'Test User',
        phone: '9876543210',
        address: '123 Test Street',
        city: 'Test City',
        state: 'Test State',
        pincode: '123456',
        landmark: 'Test Landmark'
      })
    });

    console.log('Address response status:', addressResponse.status);
    
    if (!addressResponse.ok) {
      const errorText = await addressResponse.text();
      console.log('❌ Address creation failed:');
      console.log('Status:', addressResponse.status);
      console.log('Response:', errorText);
      return;
    }

    const addressData = await addressResponse.json();
    console.log('✅ Address created successfully:');
    console.log('Address ID:', addressData.address.id);
    console.log('Address:', addressData.address);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Wait a bit for server to start, then run test
setTimeout(testAddressAPI, 3000);
