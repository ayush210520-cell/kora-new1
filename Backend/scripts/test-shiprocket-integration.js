/**
 * Test Shiprocket Integration
 * This script verifies that Shiprocket integration is working correctly
 */

require('dotenv').config();
const prisma = require('../src/config/db');
const shiprocketService = require('../src/services/shiprocketService');

async function testShiprocketIntegration() {
  console.log('🧪 Testing Shiprocket Integration\n');
  
  try {
    // 1. Check credentials
    console.log('1️⃣ Checking Shiprocket credentials...');
    if (!process.env.SHIPROCKET_EMAIL || !process.env.SHIPROCKET_PASSWORD) {
      console.error('❌ Shiprocket credentials not found in .env');
      process.exit(1);
    }
    console.log('✅ Credentials found');
    console.log(`   Email: ${process.env.SHIPROCKET_EMAIL}`);
    
    // 2. Test authentication
    console.log('\n2️⃣ Testing Shiprocket authentication...');
    try {
      await shiprocketService.authenticate();
      console.log('✅ Authentication successful');
    } catch (error) {
      console.error('❌ Authentication failed:', error.message);
      process.exit(1);
    }
    
    // 3. Check recent PREPAID orders without Shiprocket ID
    console.log('\n3️⃣ Checking recent PREPAID orders...');
    const ordersWithoutShiprocket = await prisma.order.findMany({
      where: {
        paymentMethod: 'PREPAID',
        paymentStatus: 'COMPLETED',
        OR: [
          { shiprocketOrderId: null },
          { shiprocketStatus: 'FAILED' }
        ]
      },
      include: {
        user: true,
        address: true,
        orderItems: {
          include: {
            product: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });
    
    if (ordersWithoutShiprocket.length === 0) {
      console.log('✅ No PREPAID orders found without Shiprocket integration');
    } else {
      console.log(`⚠️  Found ${ordersWithoutShiprocket.length} PREPAID order(s) without Shiprocket integration:\n`);
      
      for (const order of ordersWithoutShiprocket) {
        console.log(`   Order: ${order.orderNumber}`);
        console.log(`   Status: ${order.orderStatus}`);
        console.log(`   Payment: ${order.paymentStatus}`);
        console.log(`   Shiprocket Status: ${order.shiprocketStatus || 'NULL'}`);
        console.log(`   Shiprocket ID: ${order.shiprocketOrderId || 'NULL'}`);
        console.log(`   User Email: ${order.user?.email || 'NULL'}`);
        console.log(`   Created: ${order.createdAt.toISOString()}`);
        console.log('');
      }
      
      // Ask if user wants to retry these orders
      console.log('💡 You can retry creating Shiprocket orders for these using the fix.');
    }
    
    // 4. Check recent successful Shiprocket orders
    console.log('\n4️⃣ Checking recent successful Shiprocket integrations...');
    const successfulOrders = await prisma.order.findMany({
      where: {
        shiprocketStatus: 'ORDER_CREATED',
        shiprocketOrderId: {
          not: null
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5,
      select: {
        orderNumber: true,
        paymentMethod: true,
        shiprocketOrderId: true,
        shiprocketStatus: true,
        createdAt: true
      }
    });
    
    if (successfulOrders.length === 0) {
      console.log('⚠️  No successful Shiprocket integrations found yet');
    } else {
      console.log(`✅ Found ${successfulOrders.length} successful Shiprocket integration(s):\n`);
      successfulOrders.forEach(order => {
        console.log(`   ${order.orderNumber} - ${order.paymentMethod} - Shiprocket ID: ${order.shiprocketOrderId}`);
      });
    }
    
    console.log('\n✅ Shiprocket integration test completed!\n');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testShiprocketIntegration();

