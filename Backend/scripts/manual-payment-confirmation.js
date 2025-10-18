const prisma = require('../src/config/db');

// Manual payment confirmation for pending orders
async function manualPaymentConfirmation() {
  console.log('🔧 Manual Payment Confirmation Script\n');
  
  try {
    // Find all pending PREPAID orders
    const pendingOrders = await prisma.order.findMany({
      where: {
        paymentMethod: 'PREPAID',
        paymentStatus: 'PENDING',
        orderStatus: 'PENDING'
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
      }
    });
    
    console.log(`📋 Found ${pendingOrders.length} pending PREPAID orders\n`);
    
    if (pendingOrders.length === 0) {
      console.log('✅ No pending orders found');
      return;
    }
    
    // Display pending orders
    pendingOrders.forEach((order, index) => {
      console.log(`${index + 1}. Order: ${order.orderNumber}`);
      console.log(`   Amount: ₹${order.totalAmount}`);
      console.log(`   Customer: ${order.user.name} (${order.user.email})`);
      console.log(`   Created: ${order.createdAt.toLocaleString()}`);
      console.log(`   Razorpay Order ID: ${order.razorpayOrderId || 'Not set'}`);
      console.log('');
    });
    
    // Confirm all pending orders
    console.log('🔄 Confirming payments for all pending orders...\n');
    
    for (const order of pendingOrders) {
      try {
        console.log(`💰 Confirming payment for order: ${order.orderNumber}`);
        
        // Update payment and order status
        await prisma.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: 'COMPLETED',
            orderStatus: 'CONFIRMED',
            notes: (order.notes || '') + ' [Manual payment confirmation - Webhook failed]'
          }
        });
        
        console.log(`✅ Order ${order.orderNumber} confirmed successfully`);
        
        // Send confirmation email
        try {
          const emailService = require('../src/services/emailService');
          await emailService.sendOrderConfirmationEmail({
            user: order.user,
            order: order,
            orderItems: order.orderItems,
            address: order.address
          });
          console.log(`📧 Confirmation email sent for order ${order.orderNumber}`);
        } catch (emailError) {
          console.log(`⚠️  Email failed for order ${order.orderNumber}: ${emailError.message}`);
        }
        
      } catch (error) {
        console.error(`❌ Failed to confirm order ${order.orderNumber}:`, error.message);
      }
    }
    
    console.log('\n🎉 Manual payment confirmation completed!');
    console.log('📋 Summary:');
    console.log(`   Total orders processed: ${pendingOrders.length}`);
    console.log(`   Orders confirmed: ${pendingOrders.length}`);
    
  } catch (error) {
    console.error('❌ Manual payment confirmation failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

manualPaymentConfirmation().catch(console.error);




