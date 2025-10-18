require('dotenv').config();
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_URL = process.env.API_URL || 'http://localhost:3001';

async function testDynamicImagesAPI() {
  console.log('🧪 Testing Dynamic Images API...\n');
  
  // Step 1: Test getting positions
  console.log('1️⃣ Testing GET /api/dynamic-images/positions');
  try {
    const response = await fetch(`${API_URL}/api/dynamic-images/positions`);
    const data = await response.json();
    console.log('✅ Positions:', data.positions?.length || 0, 'positions available');
  } catch (error) {
    console.error('❌ Failed:', error.message);
  }
  
  // Step 2: Test getting all images
  console.log('\n2️⃣ Testing GET /api/dynamic-images');
  try {
    const response = await fetch(`${API_URL}/api/dynamic-images`);
    const data = await response.json();
    console.log('✅ Images:', data.images?.length || 0, 'images found');
  } catch (error) {
    console.error('❌ Failed:', error.message);
  }
  
  // Step 3: Test authentication (should fail without token)
  console.log('\n3️⃣ Testing POST /api/dynamic-images (without auth - should fail)');
  try {
    const formData = new FormData();
    formData.append('title', 'Test Image');
    formData.append('position', 'hero-slider-1');
    
    const response = await fetch(`${API_URL}/api/dynamic-images`, {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders()
    });
    
    if (response.status === 401) {
      console.log('✅ Correctly returns 401 (Unauthorized)');
    } else {
      const data = await response.json();
      console.log('⚠️ Unexpected response:', response.status, data);
    }
  } catch (error) {
    console.error('❌ Failed:', error.message);
  }
  
  // Step 4: Test with admin token (if available)
  const adminToken = process.env.ADMIN_TOKEN;
  if (adminToken) {
    console.log('\n4️⃣ Testing POST /api/dynamic-images (with auth)');
    try {
      // Create a test image (using a placeholder)
      const testImagePath = path.join(__dirname, 'test-image.txt');
      fs.writeFileSync(testImagePath, 'Test image content');
      
      const formData = new FormData();
      formData.append('title', 'Test Image ' + Date.now());
      formData.append('position', 'hero-slider-1');
      formData.append('description', 'Test description');
      formData.append('category', 'slider');
      formData.append('isActive', 'true');
      formData.append('sortOrder', '0');
      formData.append('image', fs.createReadStream(testImagePath), {
        filename: 'test.jpg',
        contentType: 'image/jpeg'
      });
      
      const response = await fetch(`${API_URL}/api/dynamic-images`, {
        method: 'POST',
        body: formData,
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${adminToken}`
        }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        console.log('✅ Image created successfully:', data.image?.id);
      } else {
        console.log('❌ Failed to create image:', response.status);
        console.log('Error:', data);
      }
      
      // Cleanup
      fs.unlinkSync(testImagePath);
    } catch (error) {
      console.error('❌ Failed:', error.message);
    }
  } else {
    console.log('\n⚠️ Skipping authenticated tests (ADMIN_TOKEN not set)');
    console.log('   To test with authentication, set ADMIN_TOKEN in .env');
  }
  
  console.log('\n✨ Tests completed!');
}

// Run the tests
testDynamicImagesAPI().catch(console.error);

