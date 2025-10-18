const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function triggerManualWebhook() {
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
    
    // Simulate webhook payload
    const webhookPayload = {
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            order_id: pendingOrder.razorpayOrderId,
            id: 'pay_manual_' + Date.now(),
            amount: pendingOrder.totalAmount * 100, // Convert to paise
            currency: 'INR',
            status: 'captured'
          }
        }
      }
    };
    
    console.log('🔔 Triggering manual webhook...');
    
    // Update the order status
    const updatedOrder = await prisma.order.update({
      where: { id: pendingOrder.id },
      data: {
        paymentStatus: 'COMPLETED',
        orderStatus: 'CONFIRMED',
        razorpayPaymentId: webhookPayload.payload.payment.entity.id
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

triggerManualWebhook();




