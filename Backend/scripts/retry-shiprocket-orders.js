/**
 * Retry Shiprocket Order Creation
 * This script retries creating Shiprocket orders for orders that failed
 */

require('dotenv').config();
const prisma = require('../src/config/db');
const shiprocketService = require('../src/services/shiprocketService');

async function retryShiprocketOrders() {
  console.log('🔄 Retrying Shiprocket Order Creation\n');
  
  try {
    // Find PREPAID orders without Shiprocket ID
    const ordersToRetry = await prisma.order.findMany({
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
      take: 10
    });
    
    if (ordersToRetry.length === 0) {
      console.log('✅ No orders need Shiprocket retry');
      return;
    }
    
    console.log(`📋 Found ${ordersToRetry.length} order(s) to retry:\n`);
    
    let successCount = 0;
    let failCount = 0;
    
    for (const order of ordersToRetry) {
      console.log(`\n🔄 Processing Order: ${order.orderNumber}`);
      console.log(`   User: ${order.user?.name} (${order.user?.email})`);
      console.log(`   Amount: ₹${order.totalAmount}`);
      console.log(`   Current Shiprocket Status: ${order.shiprocketStatus || 'NULL'}`);
      
      try {
        // Create Shiprocket order with user object
        console.log('   📤 Creating Shiprocket order...');
        const shiprocketResp = await shiprocketService.createOrder(
          order,
          order.address,
          order.orderItems,
          order.user  // This is the fix - passing user object
        );
        
        console.log('   ✅ Shiprocket order created successfully!');
        console.log(`   Shiprocket Order ID: ${shiprocketResp.order_id}`);
        console.log(`   Shipment ID: ${shiprocketResp.shipment_id || 'N/A'}`);
        
        // Update order in database
        await prisma.order.update({
          where: { id: order.id },
          data: {
            shiprocketOrderId: shiprocketResp.order_id ? String(shiprocketResp.order_id) : null,
            delhiveryWaybill: shiprocketResp.shipment_id ? String(shiprocketResp.shipment_id) : null,
            trackingUrl: shiprocketResp.awb_code ? `https://shiprocket.co/tracking/${shiprocketResp.awb_code}` : null,
            shiprocketStatus: 'ORDER_CREATED'
          }
        });
        
        console.log('   ✅ Database updated successfully');
        successCount++;
        
      } catch (error) {
        console.error('   ❌ Failed to create Shiprocket order:', error.message);
        
        // Log detailed error for debugging
        if (error.response?.data) {
          console.error('   Error details:', JSON.stringify(error.response.data, null, 2));
        }
        
        // Update order status to FAILED
        await prisma.order.update({
          where: { id: order.id },
          data: {
            shiprocketStatus: 'FAILED',
            notes: (order.notes || '') + ` [Retry failed: ${error.message}]`
          }
        });
        
        failCount++;
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 Summary:');
    console.log(`   Total processed: ${ordersToRetry.length}`);
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Failed: ${failCount}`);
    console.log('='.repeat(50) + '\n');
    
    if (successCount > 0) {
      console.log('✅ Shiprocket orders successfully created for fixed orders!');
    }
    if (failCount > 0) {
      console.log('⚠️  Some orders failed. Check the error details above.');
    }
    
  } catch (error) {
    console.error('\n❌ Script error:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the retry
retryShiprocketOrders();

