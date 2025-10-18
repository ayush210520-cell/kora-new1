const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateOrderStatus() {
  try {
    console.log('🔍 Searching for pending orders...');
    
    // Find the latest pending order
    const pendingOrder = await prisma.order.findFirst({
      where: {
        paymentStatus: 'PENDING',
        orderStatus: 'PENDING'
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    if (!pendingOrder) {
      console.log('❌ No pending orders found');
      return;
    }
    
    console.log('💰 Found pending order:', {
      id: pendingOrder.id,
      orderNumber: pendingOrder.orderNumber,
      razorpayOrderId: pendingOrder.razorpayOrderId,
      paymentStatus: pendingOrder.paymentStatus,
      orderStatus: pendingOrder.orderStatus
    });
    
    // Update the order status
    const updatedOrder = await prisma.order.update({
      where: { id: pendingOrder.id },
      data: {
        paymentStatus: 'COMPLETED',
        orderStatus: 'CONFIRMED',
        razorpayPaymentId: 'manual_update_' + Date.now()
      }
    });
    
    console.log('✅ Order updated successfully:', {
      orderNumber: updatedOrder.orderNumber,
      paymentStatus: updatedOrder.paymentStatus,
      orderStatus: updatedOrder.orderStatus
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateOrderStatus();




