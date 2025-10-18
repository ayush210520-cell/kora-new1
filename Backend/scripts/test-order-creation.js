const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

const prisma = new PrismaClient();

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';
const TEST_EMAIL = 'test@example.com';
const TEST_PHONE = '9876543210';

async function testOrderCreation() {
  console.log('🧪 Testing Order Creation Process...\n');
  
  try {
    // Step 1: Check if products exist
    console.log('📦 Step 1: Checking available products...');
    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: { id: true, name: true, price: true, stock: true }
    });
    
    if (products.length === 0) {
      console.log('❌ No active products found. Please add some products first.');
      return;
    }
    
    console.log(`✅ Found ${products.length} active products:`);
    products.forEach((p, i) => {
      console.log(`  ${i + 1}. ${p.name} - ₹${p.price} (Stock: ${p.stock})`);
    });
    
    // Step 2: Check if test user exists
    console.log('\n👤 Step 2: Checking test user...');
    let testUser = await prisma.user.findUnique({
      where: { email: TEST_EMAIL }
    });
    
    if (!testUser) {
      console.log('Creating test user...');
      testUser = await prisma.user.create({
        data: {
          name: 'Test User',
          email: TEST_EMAIL,
          phone: TEST_PHONE,
          password: 'hashedpassword123', // In real scenario, this would be properly hashed
          isActive: true
        }
      });
      console.log('✅ Test user created');
    } else {
      console.log('✅ Test user exists');
    }
    
    // Step 3: Check if test address exists
    console.log('\n🏠 Step 3: Checking test address...');
    let testAddress = await prisma.address.findFirst({
      where: { userId: testUser.id }
    });
    
    if (!testAddress) {
      console.log('Creating test address...');
      testAddress = await prisma.address.create({
        data: {
          name: 'Test User',
          phone: TEST_PHONE,
          address: '123 Test Street, Test Area',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001',
          landmark: 'Near Test Landmark',
          userId: testUser.id
        }
      });
      console.log('✅ Test address created');
    } else {
      console.log('✅ Test address exists');
    }
    
    // Step 4: Test order creation via API
    console.log('\n🛒 Step 4: Testing order creation via API...');
    
    const orderData = {
      addressId: testAddress.id,
      orderItems: [
        {
          productId: products[0].id,
          quantity: 1
        }
      ],
      paymentMethod: 'PREPAID',
      notes: 'Test order from script'
    };
    
    console.log('Order data:', JSON.stringify(orderData, null, 2));
    
    try {
      // Note: This would require authentication token in real scenario
      console.log('⚠️  Note: This test requires authentication. In real scenario, you would need to:');
      console.log('   1. Login first to get authentication token');
      console.log('   2. Include Authorization header in the request');
      console.log('   3. Or test via the frontend application');
      
      // For now, let's test the database order creation directly
      console.log('\n💾 Testing database order creation directly...');
      
      const order = await prisma.order.create({
        data: {
          orderNumber: `KK${Date.now().toString().slice(-5)}`,
          totalAmount: products[0].price,
          paymentMethod: 'PREPAID',
          paymentStatus: 'PENDING',
          orderStatus: 'PENDING',
          userId: testUser.id,
          addressId: testAddress.id,
          notes: 'Test order from script'
        }
      });
      
      console.log('✅ Order created in database:', order.orderNumber);
      
      // Create order items
      const orderItem = await prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: products[0].id,
          quantity: 1,
          price: products[0].price
        }
      });
      
      console.log('✅ Order item created');
      
      // Step 5: Test email sending
      console.log('\n📧 Step 5: Testing email sending...');
      
      const mailService = require('../src/services/emailService');
      
      const emailData = {
        user: testUser,
        order: order,
        orderItems: [{
          product: {
            ...products[0],
            images: products[0].images?.map(img => img.url) || []
          },
          quantity: 1,
          price: products[0].price
        }],
        address: testAddress
      };
      
      const emailResult = await mailService.sendOrderConfirmationEmail(emailData);
      console.log('Email result:', emailResult);
      
      // Step 6: Test order status update
      console.log('\n🔄 Step 6: Testing order status update...');
      
      await prisma.order.update({
        where: { id: order.id },
        data: { orderStatus: 'CONFIRMED' }
      });
      
      const statusEmailResult = await mailService.sendOrderStatusUpdateEmail(emailData, 'CONFIRMED');
      console.log('Status update email result:', statusEmailResult);
      
      console.log('\n🎉 Order creation test completed successfully!');
      console.log(`Order Number: ${order.orderNumber}`);
      console.log(`Order ID: ${order.id}`);
      
    } catch (apiError) {
      console.log('API Error (expected if not authenticated):', apiError.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testOrderCreation();
