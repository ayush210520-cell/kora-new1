const mailService = require('./src/services/emailService');

// Test email functionality
async function testEmail() {
  console.log('🧪 Testing email functionality...');
  
  // Test data
  const testData = {
    user: {
      name: 'Test User',
      email: 'test@example.com'
    },
    order: {
      orderNumber: 'KK00001',
      createdAt: new Date(),
      totalAmount: 1000.00,
      paymentMethod: 'PREPAID',
      paymentStatus: 'COMPLETED',
      trackingUrl: 'https://example.com/track'
    },
    orderItems: [{
      product: {
        name: 'Test Product',
        images: ['https://example.com/image.jpg']
      },
      quantity: 2,
      price: 500.00
    }],
    address: {
      name: 'Test User',
      phone: '1234567890',
      address: '123 Test Street',
      city: 'Test City',
      state: 'Test State',
      pincode: '123456',
      landmark: 'Near Test Landmark'
    }
  };

  try {
    console.log('📧 Testing order confirmation email...');
    const result = await mailService.sendOrderConfirmationEmail(testData);
    console.log('✅ Order confirmation email test result:', result);
    
    console.log('📧 Testing order status update email...');
    const statusResult = await mailService.sendOrderStatusUpdateEmail(testData, 'CONFIRMED');
    console.log('✅ Order status update email test result:', statusResult);
    
    console.log('📧 Testing order delivered email...');
    const deliveredResult = await mailService.sendOrderDeliveredEmail(testData);
    console.log('✅ Order delivered email test result:', deliveredResult);
    
    console.log('🎉 All email tests completed successfully!');
  } catch (error) {
    console.error('❌ Email test failed:', error);
  }
}

// Run the test
testEmail();
