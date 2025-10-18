const { validationResult } = require('express-validator');
const prisma = require('../config/db');
const Razorpay = require('razorpay');
const generateQRCode = require('../services/qrCodeService');
const mailService = require('../services/emailService');
const shiprocketService = require('../services/shiprocketService');
const Logger = require('../utils/logger');

// Initialize Razorpay
if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_SECRET) {
  throw new Error('Razorpay credentials not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_SECRET environment variables.');
}

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});

// Create Razorpay order helper
const createRazorpayOrder = async (amountInPaise, currency = 'INR', receipt) => {
  return new Promise((resolve, reject) => {
    razorpay.orders.create(
      {
        amount: amountInPaise,
        currency,
        receipt,
        payment_capture: 1,
      },
      (err, order) => {
        if (err) reject(err);
        else resolve(order);
      }
    );
  });
};

// Order creation handler - NEW FLOW
// For PREPAID: Only create Razorpay order, actual DB order created after payment in webhook
// For COD: Create DB order immediately (COD doesn't need payment gateway)
const createOrder = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const userId = req.userId;
    const { addressId, orderItems, paymentMethod, notes } = req.body;

    if (!Array.isArray(orderItems) || orderItems.length === 0) {
      return res.status(400).json({ error: 'Order items required' });
    }

    const address = await prisma.address.findFirst({ where: { id: addressId, userId } });
    if (!address) return res.status(404).json({ error: 'Invalid address' });

    const productIds = orderItems.map((i) => i.productId);
    const products = await prisma.product.findMany({ where: { id: { in: productIds }, isActive: true } });

    if (products.length !== productIds.length) {
      return res.status(400).json({ error: 'Some products are invalid or inactive' });
    }

    let totalAmount = 0;
    for (const item of orderItems) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) return res.status(400).json({ error: `Product ${item.productId} not found` });
      
      // Check stock availability based on stock type
      if (product.sizeStock && item.size) {
        // Size-wise stock check
        if (!product.sizeStock[item.size] || product.sizeStock[item.size] < item.quantity) {
          return res.status(400).json({ 
            error: `Insufficient stock for product ${product.name} in size ${item.size}` 
          });
        }
      } else {
        // Traditional single stock check
        if (product.stock < item.quantity) {
          return res.status(400).json({ error: `Insufficient stock for product ${product.name}` });
        }
      }
      
      totalAmount += product.price.toNumber() * item.quantity;
    }

    const isPrepaid = paymentMethod === 'PREPAID';

    // ========== NEW FLOW FOR PREPAID ==========
    if (isPrepaid) {
      Logger.info('PREPAID order - Creating Razorpay order only (DB order will be created after payment)');
      
      try {
        const amountInPaise = Math.round(totalAmount * 100);
        
        // Store order data in Razorpay notes for webhook to use
        const orderMetadata = {
          userId,
          addressId,
          orderItems: JSON.stringify(orderItems),
          paymentMethod,
          notes: notes || '',
          totalAmount: totalAmount.toString()
        };
        
        Logger.info('Creating Razorpay order with metadata', { amount: amountInPaise });
        
        const razorpayOrder = await new Promise((resolve, reject) => {
          razorpay.orders.create(
            {
              amount: amountInPaise,
              currency: 'INR',
              receipt: `TEMP_${Date.now()}`, // Temporary receipt, actual order number will be generated after payment
              payment_capture: 1,
              notes: orderMetadata
            },
            (err, order) => {
              if (err) reject(err);
              else resolve(order);
            }
          );
        });
        
        Logger.success('Razorpay order created (DB order will be created after payment)', razorpayOrder);

        // Generate QR code for UPI payment
        let qrPaymentLink = null;
        try {
          qrPaymentLink = await generateQRCode(
            `upi://pay?pa=merchant@upi&pn=KORAKAGAZ&tr=${razorpayOrder.id}&am=${totalAmount.toFixed(2)}&cu=INR`
          );
        } catch (qrError) {
          Logger.warn('QR code generation failed', qrError);
        }

        return res.status(201).json({
          message: 'Razorpay order created successfully. Complete payment to create order.',
          order: {
            razorpayOrderId: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            totalAmount,
            paymentMethod: 'PREPAID',
            qrPaymentLink,
            // No DB order created yet
            pendingPayment: true
          },
        });
      } catch (razorpayError) {
        Logger.error('Razorpay order creation failed', razorpayError);
        return res.status(500).json({ 
          error: 'Failed to create payment order',
          details: process.env.NODE_ENV === 'development' ? razorpayError.message : undefined
        });
      }
    }

    // ========== COD FLOW (Original logic) ==========
    Logger.info('COD order - Creating database order immediately');

    // Generate order number for COD
    const lastOrder = await prisma.order.findFirst({
      where: {
        orderNumber: {
          startsWith: 'KK'
        }
      },
      orderBy: {
        orderNumber: 'desc'
      },
      select: {
        orderNumber: true
      }
    });
    
    let nextNumber = 1;
    if (lastOrder && lastOrder.orderNumber) {
      const lastNumber = parseInt(lastOrder.orderNumber.replace('KK', ''));
      nextNumber = lastNumber + 1;
    }
    
    const orderNumber = `KK${nextNumber.toString().padStart(5, '0')}`;

    Logger.info('Creating COD database order', {
      orderNumber,
      totalAmount,
      paymentMethod,
      userId,
      addressId
    });

    const order = await prisma.order.create({
      data: {
        orderNumber,
        totalAmount,
        paymentMethod,
        paymentStatus: 'PENDING',
        orderStatus: 'PENDING',
        razorpayOrderId: null,
        userId,
        addressId,
        notes: notes || null,
      },
    });
    Logger.success('COD database order created:', order.orderNumber);

    const orderItemsData = orderItems.map((item) => ({
      orderId: order.id,
      productId: item.productId,
      quantity: item.quantity,
      price: products.find((p) => p.id === item.productId).price,
      size: item.size || null,
    }));

    Logger.info('Creating order items', { count: orderItemsData.length });
    await prisma.orderItem.createMany({ data: orderItemsData });
    Logger.success('Order items created successfully');

    // Shiprocket integration for COD
    let shiprocketResp = null;
    let shiprocketAvailable = true;
    if (!process.env.SHIPROCKET_EMAIL || !process.env.SHIPROCKET_PASSWORD) {
      Logger.warn('Shiprocket not configured, skipping integration');
      shiprocketAvailable = false;
    }
    
    if (shiprocketAvailable) {
      try {
        Logger.info('Fetching order items for Shiprocket');
        const fullOrderItems = await prisma.orderItem.findMany({ 
          where: { orderId: order.id }, 
          include: { product: true } 
        });
        
        // Fetch user for email
        const user = await prisma.user.findUnique({ where: { id: userId } });
        
        Logger.info('Creating COD Shiprocket order with user email', { email: user?.email });
        shiprocketResp = await shiprocketService.createOrder(order, address, fullOrderItems, user);
        Logger.shiprocket('Shiprocket order created', shiprocketResp);

        await prisma.order.update({
          where: { id: order.id },
          data: {
            delhiveryWaybill: shiprocketResp.shipment_id ? String(shiprocketResp.shipment_id) : null,
            trackingUrl: shiprocketResp.awb_code ? `https://shiprocket.co/tracking/${shiprocketResp.awb_code}` : null,
            orderStatus: 'CONFIRMED',
            shiprocketOrderId: shiprocketResp.order_id ? String(shiprocketResp.order_id) : null,
            shiprocketStatus: 'ORDER_CREATED'
          },
        });
        Logger.success('COD order confirmed with Shiprocket details');
        
      } catch (shiprocketError) {
        Logger.error('Shiprocket order creation failed for COD', shiprocketError);
        await prisma.order.update({
          where: { id: order.id },
          data: {
            orderStatus: 'CONFIRMED',
            shiprocketStatus: 'FAILED',
            notes: (notes || '') + ' [COD Order - Manual processing required due to Shiprocket failure]'
          }
        });
        shiprocketResp = { error: 'Manual processing required', details: shiprocketError.message };
      }
    } else {
      Logger.warn('Shiprocket not available, processing COD order manually');
      await prisma.order.update({
        where: { id: order.id },
        data: {
          orderStatus: 'CONFIRMED',
          notes: (notes || '') + ' [Manual processing - Shiprocket not configured]'
        }
      });
      shiprocketResp = { error: 'Manual processing - Shiprocket not configured' };
    }

    res.status(201).json({
      message: 'COD Order created successfully',
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
        shiprocketDetails: shiprocketResp,
      },
    });
  } catch (error) {
    Logger.error('Create order error', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Razorpay webhook for payment confirmation (Prepaid) - NEW FLOW
// Creates database order AFTER payment is successful
const verifyRazorpayPayment = async (req, res) => {
  console.log('🔔 Webhook received - NEW FLOW: Create order after payment');

  try {
    // Step 1: Parse webhook data
    let webhookData;
    try {
      if (Buffer.isBuffer(req.body)) {
        webhookData = JSON.parse(req.body.toString('utf8'));
      } else {
        webhookData = req.body;
      }
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError.message);
      return res.status(400).json({ error: 'Invalid JSON' });
    }

    console.log('🔔 Event:', webhookData.event);

    if (webhookData.event === 'payment.captured') {
      console.log('💰 Processing payment.captured - Creating order in database');
      
      const paymentEntity = webhookData.payload.payment.entity;
      const razorpayOrderId = paymentEntity.order_id;
      
      console.log('💰 Razorpay Order ID:', razorpayOrderId);
      console.log('💰 Payment ID:', paymentEntity.id);

      // Step 2: Check if order already exists (avoid duplicate creation)
      try {
        await prisma.$connect();
        console.log('✅ Database connected');
        
        const existingOrder = await prisma.order.findFirst({
          where: { razorpayOrderId },
        });
        
        if (existingOrder) {
          console.log('⚠️ Order already exists for this payment:', existingOrder.orderNumber);
          return res.json({ 
            status: 'ok',
            message: 'Payment already processed',
            order: {
              orderNumber: existingOrder.orderNumber,
              paymentStatus: existingOrder.paymentStatus,
              orderStatus: existingOrder.orderStatus
            }
          });
        }

        // Step 3: Fetch Razorpay order to get metadata
        console.log('📦 Fetching Razorpay order details...');
        const razorpayOrderDetails = await new Promise((resolve, reject) => {
          razorpay.orders.fetch(razorpayOrderId, (err, order) => {
            if (err) reject(err);
            else resolve(order);
          });
        });
        
        console.log('📦 Razorpay order fetched:', razorpayOrderDetails.id);
        console.log('📝 Metadata notes:', razorpayOrderDetails.notes);

        // Step 4: Extract order data from Razorpay notes
        const { userId, addressId, orderItems: orderItemsJson, notes } = razorpayOrderDetails.notes;
        
        if (!userId || !addressId || !orderItemsJson) {
          console.error('❌ Missing required data in Razorpay order notes');
          return res.status(400).json({ error: 'Invalid order metadata in Razorpay order' });
        }

        const orderItems = JSON.parse(orderItemsJson);
        console.log('📋 Order items:', orderItems.length);

        // Step 5: Fetch user and address
        const user = await prisma.user.findUnique({ where: { id: userId } });
        const address = await prisma.address.findUnique({ where: { id: addressId } });
        
        if (!user || !address) {
          console.error('❌ User or address not found');
          return res.status(404).json({ error: 'User or address not found' });
        }

        // Step 6: Fetch products and validate
        const productIds = orderItems.map((i) => i.productId);
        const products = await prisma.product.findMany({ 
          where: { id: { in: productIds }, isActive: true } 
        });

        if (products.length !== productIds.length) {
          console.error('❌ Some products are invalid or inactive');
          return res.status(400).json({ error: 'Some products are invalid or inactive' });
        }

        // Step 7: Calculate total and validate stock
        let totalAmount = 0;
        for (const item of orderItems) {
          const product = products.find((p) => p.id === item.productId);
          if (!product) {
            console.error(`❌ Product ${item.productId} not found`);
            return res.status(400).json({ error: `Product ${item.productId} not found` });
          }
          
          // Check stock availability
          if (product.sizeStock && item.size) {
            if (!product.sizeStock[item.size] || product.sizeStock[item.size] < item.quantity) {
              console.error(`❌ Insufficient stock for ${product.name} size ${item.size}`);
              return res.status(400).json({ 
                error: `Insufficient stock for product ${product.name} in size ${item.size}` 
              });
            }
          } else {
            if (product.stock < item.quantity) {
              console.error(`❌ Insufficient stock for ${product.name}`);
              return res.status(400).json({ error: `Insufficient stock for product ${product.name}` });
            }
          }
          
          totalAmount += product.price.toNumber() * item.quantity;
        }

        console.log('💵 Total amount:', totalAmount);

        // Step 8: Generate order number
        const lastOrder = await prisma.order.findFirst({
          where: {
            orderNumber: {
              startsWith: 'KK'
            }
          },
          orderBy: {
            orderNumber: 'desc'
          },
          select: {
            orderNumber: true
          }
        });
        
        let nextNumber = 1;
        if (lastOrder && lastOrder.orderNumber) {
          const lastNumber = parseInt(lastOrder.orderNumber.replace('KK', ''));
          nextNumber = lastNumber + 1;
        }
        
        const orderNumber = `KK${nextNumber.toString().padStart(5, '0')}`;
        console.log('🔢 Generated order number:', orderNumber);

        // Step 9: Create order in database
        Logger.info('Creating order in database after successful payment');
        const order = await prisma.order.create({
          data: {
            orderNumber,
            totalAmount,
            paymentMethod: 'PREPAID',
            paymentStatus: 'COMPLETED', // Payment already captured
            orderStatus: 'CONFIRMED', // Order confirmed immediately
            razorpayOrderId: razorpayOrderId,
            razorpayPaymentId: paymentEntity.id,
            userId,
            addressId,
            notes: notes || null,
          },
        });
        Logger.success('Order created in database:', order.orderNumber);

        // Step 10: Create order items
        const orderItemsData = orderItems.map((item) => ({
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          price: products.find((p) => p.id === item.productId).price,
          size: item.size || null,
        }));

        await prisma.orderItem.createMany({ data: orderItemsData });
        Logger.success('Order items created:', orderItemsData.length);

        // Step 11: Reduce stock
        Logger.info('Reducing stock for confirmed order');
        for (const item of orderItems) {
          const product = products.find((p) => p.id === item.productId);
          
          if (product.sizeStock && item.size) {
            // Size-wise stock reduction
            const currentSizeStock = product.sizeStock;
            if (currentSizeStock[item.size] !== undefined) {
              const newSizeStock = { ...currentSizeStock };
              newSizeStock[item.size] = Math.max(0, currentSizeStock[item.size] - item.quantity);
              
              const totalStock = Object.values(newSizeStock).reduce((sum, sizeStock) => {
                return sum + (parseInt(sizeStock) || 0);
              }, 0);
              
              await prisma.product.update({
                where: { id: product.id },
                data: { 
                  sizeStock: newSizeStock,
                  stock: totalStock
                }
              });
              
              Logger.info(`Reduced size stock: ${product.name} ${item.size}: ${currentSizeStock[item.size]} → ${newSizeStock[item.size]}`);
            }
          } else {
            // Traditional single stock reduction
            const newStock = Math.max(0, product.stock - item.quantity);
            await prisma.product.update({
              where: { id: product.id },
              data: { stock: newStock }
            });
            
            Logger.info(`Reduced stock: ${product.name}: ${product.stock} → ${newStock}`);
          }
        }
        Logger.success('Stock reduction completed');

        // Step 12: Create Shiprocket order
        let shiprocketAvailable = true;
        if (!process.env.SHIPROCKET_EMAIL || !process.env.SHIPROCKET_PASSWORD) {
          Logger.warn('Shiprocket not configured');
          shiprocketAvailable = false;
        }

        if (shiprocketAvailable) {
          try {
            const fullOrderItems = await prisma.orderItem.findMany({ 
              where: { orderId: order.id }, 
              include: { product: true } 
            });
            
            Logger.info('Creating Shiprocket order with user email', { email: user.email });
            const shiprocketResp = await shiprocketService.createOrder(order, address, fullOrderItems, user);
            Logger.shiprocket('Shiprocket order created', shiprocketResp);

            await prisma.order.update({
              where: { id: order.id },
              data: {
                delhiveryWaybill: shiprocketResp.shipment_id ? String(shiprocketResp.shipment_id) : null,
                trackingUrl: shiprocketResp.awb_code ? `https://shiprocket.co/tracking/${shiprocketResp.awb_code}` : null,
                shiprocketOrderId: shiprocketResp.order_id ? String(shiprocketResp.order_id) : null,
                shiprocketStatus: 'ORDER_CREATED'
              },
            });
            Logger.success('Shiprocket integration completed');
          } catch (shiprocketError) {
            Logger.error('Shiprocket integration failed', shiprocketError);
            await prisma.order.update({
              where: { id: order.id },
              data: {
                shiprocketStatus: 'FAILED',
                notes: (notes || '') + ' [Shiprocket failed - Manual processing required]'
              }
            });
          }
        }

        // Step 13: Send order confirmation email
        Logger.info('Sending order confirmation email');
        const fullOrderItems = await prisma.orderItem.findMany({ 
          where: { orderId: order.id }, 
          include: { product: true } 
        });
        
        mailService
          .sendOrderConfirmationEmail({ user, order, orderItems: fullOrderItems, address })
          .then(result => {
            Logger.success('Order confirmation email sent', result);
          })
          .catch(error => {
            Logger.error('Order confirmation email failed', error);
          });

        console.log('✅ Order created successfully after payment');
        return res.json({ 
          status: 'ok',
          message: 'Payment processed and order created',
          order: {
            id: order.id,
            orderNumber: order.orderNumber,
            paymentStatus: 'COMPLETED',
            orderStatus: 'CONFIRMED'
          }
        });
      } catch (dbError) {
        console.error('❌ Database/Processing error:', dbError);
        Logger.error('Order creation failed in webhook', dbError);
        return res.status(500).json({ 
          error: 'Failed to create order', 
          details: process.env.NODE_ENV === 'development' ? dbError.message : undefined
        });
      }
    }

    console.log('ℹ️ Event ignored:', webhookData.event);
    res.json({ message: 'Event ignored', event: webhookData.event });
  } catch (error) {
    console.error('❌ Webhook error:', error);
    Logger.error('Webhook processing error', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
};

// Original webhook handler (commented out for debugging)
const verifyRazorpayPaymentOriginal = async (req, res) => {
  try {
    console.log('🔔 Webhook received');

    // Simple body parsing
    let webhookData;
    try {
      if (Buffer.isBuffer(req.body)) {
        webhookData = JSON.parse(req.body.toString('utf8'));
      } else {
        webhookData = req.body;
      }
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError.message);
      return res.status(400).json({ error: 'Invalid JSON' });
    }
    
    // Basic validation
    if (!webhookData || !webhookData.event) {
      console.error('❌ Invalid webhook data');
      return res.status(400).json({ error: 'Invalid webhook data' });
    }
    
    console.log('🔔 Event:', webhookData.event);
    
    // Skip signature verification for now
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret || secret === 'your_webhook_secret_here') {
      console.warn('⚠️ Skipping signature verification');
    }

    const event = webhookData.event;

    if (event === 'payment.captured') {
      console.log('💰 Processing payment.captured');
      
      // Basic validation
      if (!webhookData.payload?.payment?.entity) {
        console.error('❌ Invalid payment structure');
        return res.status(400).json({ error: 'Invalid payment structure' });
      }
      
      const paymentEntity = webhookData.payload.payment.entity;
      const razorpayOrderId = paymentEntity.order_id;
      
      if (!razorpayOrderId) {
        console.error('❌ Missing order ID');
        return res.status(400).json({ error: 'Missing order ID' });
      }
      
      console.log('💰 Order ID:', razorpayOrderId);

      // Find order by Razorpay Order ID
      const order = await prisma.order.findFirst({
        where: { razorpayOrderId },
        include: { user: true, address: true, orderItems: { include: { product: true } } },
      });
      
      if (!order) {
        console.error('❌ Order not found for Razorpay Order ID:', razorpayOrderId);
        
        // Try to find orders with similar order numbers or IDs
        const similarOrders = await prisma.order.findMany({
          where: {
            OR: [
              { orderNumber: { contains: razorpayOrderId } },
              { id: { contains: razorpayOrderId } }
            ]
          },
          select: { id: true, orderNumber: true, razorpayOrderId: true }
        });
        console.log('🔍 Similar orders found:', similarOrders);
        
        return res.status(404).json({ 
          error: 'Order not found',
          razorpayOrderId,
          similarOrders: similarOrders.length > 0 ? similarOrders : null
        });
      }

      console.log('💰 Payment confirmed for PREPAID order:', {
        orderNumber: order.orderNumber,
        shiprocketStatus: order.shiprocketStatus,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus
      });
      
      // Check if payment is already processed
      if (order.paymentStatus === 'COMPLETED') {
        console.log('✅ Payment already processed for this order');
        return res.json({ 
          status: 'ok', 
          message: 'Payment already processed',
          order: {
            orderNumber: order.orderNumber,
            paymentStatus: order.paymentStatus,
            orderStatus: order.orderStatus
          }
        });
      }

      console.log('🔄 Updating payment status to COMPLETED and order status to CONFIRMED');
      // Update payment status and order status
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'COMPLETED',
          orderStatus: 'CONFIRMED',
          razorpayPaymentId: paymentEntity.id,
        },
      });
      console.log('✅ Payment status updated successfully');

      // Reduce stock after payment confirmation
      Logger.info('Reducing stock for confirmed order');
      for (const orderItem of order.orderItems) {
        const product = orderItem.product;
        
        if (product.sizeStock && orderItem.size) {
          // Size-wise stock reduction
          const currentSizeStock = product.sizeStock;
          if (currentSizeStock[orderItem.size] !== undefined) {
            const newSizeStock = { ...currentSizeStock };
            newSizeStock[orderItem.size] = Math.max(0, currentSizeStock[orderItem.size] - orderItem.quantity);
            
            // Calculate total stock from updated size-wise stock
            const totalStock = Object.values(newSizeStock).reduce((sum, sizeStock) => {
              return sum + (parseInt(sizeStock) || 0);
            }, 0);
            
            await prisma.product.update({
              where: { id: product.id },
              data: { 
                sizeStock: newSizeStock,
                stock: totalStock // Update total stock
              }
            });
            
            Logger.info(`Reduced size-wise stock for product ${product.name}, size ${orderItem.size}: ${currentSizeStock[orderItem.size]} → ${newSizeStock[orderItem.size]}`);
          }
        } else {
          // Traditional single stock reduction
          const newStock = Math.max(0, product.stock - orderItem.quantity);
          await prisma.product.update({
            where: { id: product.id },
            data: { stock: newStock }
          });
          
          Logger.info(`Reduced single stock for product ${product.name}: ${product.stock} → ${newStock}`);
        }
      }
      Logger.success('Stock reduction completed');

      // Check if Shiprocket order needs to be created or retried
      if (!order.delhiveryWaybill || order.shiprocketStatus === 'PENDING_RETRY') {
        Logger.shiprocket('Creating/Retrying Shiprocket order for confirmed payment');
        Logger.debug('Shiprocket status check', {
          hasWaybill: !!order.delhiveryWaybill,
          shiprocketStatus: order.shiprocketStatus,
          needsCreation: !order.delhiveryWaybill || order.shiprocketStatus === 'PENDING_RETRY'
        });
        
        try {
          Logger.info('Creating Shiprocket order for PREPAID payment with user email', { email: order.user?.email });
          const shiprocketResp = await shiprocketService.createOrder(order, order.address, order.orderItems, order.user);
          Logger.shiprocket('Order created successfully after payment', shiprocketResp);

          // Update order with Shiprocket details and confirm status
          await prisma.order.update({
            where: { id: order.id },
            data: {
              orderStatus: 'CONFIRMED',
              delhiveryWaybill: shiprocketResp.shipment_id ? String(shiprocketResp.shipment_id) : null,
              trackingUrl: shiprocketResp.awb_code ? `https://shiprocket.co/tracking/${shiprocketResp.awb_code}` : null,
              shiprocketOrderId: shiprocketResp.order_id ? String(shiprocketResp.order_id) : null,
              shiprocketStatus: 'ORDER_CREATED',
              notes: order.notes ? order.notes.replace(' [Shiprocket order creation failed - will retry after payment]', '') : order.notes
            },
          });

          Logger.success('Order status updated to CONFIRMED with Shiprocket details');
        } catch (shiprocketError) {
          Logger.error('Shiprocket order creation failed after payment confirmation', shiprocketError);
          
          // Update order status but mark Shiprocket as failed
          await prisma.order.update({
            where: { id: order.id },
            data: {
              orderStatus: 'CONFIRMED', // Payment is confirmed, so order is confirmed
              shiprocketStatus: 'FAILED',
              notes: (order.notes || '') + ' [Shiprocket order creation failed after payment]'
            },
          });
          
          Logger.warn('Order confirmed but Shiprocket integration failed. Manual intervention required.');
        }
      } else {
        // Shiprocket order already exists, just update status
        Logger.info('Shiprocket order already exists, updating order status only');
        await prisma.order.update({
          where: { id: order.id },
          data: {
            orderStatus: 'CONFIRMED',
          },
        });
        Logger.success('Order status updated to CONFIRMED. Shiprocket order already exists.');
      }

      // Send order confirmation email after payment is completed
      Logger.info('Sending order confirmation email after payment');
      mailService
        .sendOrderConfirmationEmail({ user: order.user, order, orderItems: order.orderItems, address: order.address })
        .then(result => {
          Logger.success('Order confirmation email sent', result);
        })
        .catch(error => {
          Logger.error('Order confirmation email failed', error);
        });

      console.log('✅ Webhook processing completed successfully');
      return res.json({ 
        status: 'ok',
        message: 'Payment processed and order confirmed',
        order: {
          orderNumber: order.orderNumber,
          paymentStatus: 'COMPLETED',
          orderStatus: 'CONFIRMED'
        }
      });
    }

    console.log('ℹ️ Event ignored:', { event });
    res.json({ message: 'Event ignored', event });
  } catch (error) {
    console.error('❌ Razorpay webhook error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Shiprocket webhook handler for automatic COD payment confirmation & shipment status updates
const handleShiprocketWebhook = async (req, res) => {
  try {
    const { payload } = req.body;

    if (!payload || !payload.shipment) return res.status(400).json({ error: 'Invalid webhook payload' });

    const shipment = payload.shipment;
    const orderId = shipment.order_id;
    const orderStatus = shipment.status;

    const order = await prisma.order.findUnique({ where: { id: orderId }, include: { user: true, orderItems: true, address: true } });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    let updatedFields = {};

    if (order.paymentMethod === 'COD') {
      // These fields depend on Shiprocket's actual webhook payload structure
      const paymentCollected =
        shipment.cod_amount_collected ||
        shipment.payment_status === 'Paid' ||
        shipment.payment_status === 'COD Collected';

      if (paymentCollected) {
        updatedFields.paymentStatus = 'COMPLETED';
        updatedFields.orderStatus = 'CONFIRMED'; // Or adjust to DELIVERED if shipped/delivered
      }

      if (orderStatus) {
        const normalizedStatus = orderStatus.toLowerCase();
        if (normalizedStatus === 'delivered') updatedFields.orderStatus = 'DELIVERED';
        else if (normalizedStatus === 'shipped') updatedFields.orderStatus = 'SHIPPED';
        else if (normalizedStatus === 'cancelled') updatedFields.orderStatus = 'CANCELLED';
      }

      if (Object.keys(updatedFields).length > 0) {
        await prisma.order.update({ where: { id: orderId }, data: updatedFields });

        if (updatedFields.orderStatus) {
          const fullOrderItems = await prisma.orderItem.findMany({
            where: { orderId: orderId },
            include: { product: true },
          });

          if (updatedFields.orderStatus === 'DELIVERED') {
            mailService.sendOrderDeliveredEmail({ user: order.user, order, orderItems: fullOrderItems }).catch(console.error);
          } else {
            mailService
              .sendOrderStatusUpdateEmail({ user: order.user, order, orderItems: fullOrderItems, address: order.address }, updatedFields.orderStatus)
              .catch(console.error);
          }
        }
      }
    }

    res.json({ status: 'success' });
  } catch (error) {
    console.error('Shiprocket webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Fetch order details + live Shiprocket tracking info
const fetchTrackingInfo = async (awbCode) => {
  try {
    return await shiprocketService.getTrackingInfo(awbCode);
  } catch (error) {
    console.error('Shiprocket tracking fetch failed:', error);
    return null;
  }
};

// Get order details including shipment tracking info
const getOrderDetailsWithTracking = async (req, res) => {
  try {
    const orderId = req.params.id;
    const userId = req.userId;
    const role = req.role;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: { include: { product: true } },
        address: true,
        user: true,
      },
    });

    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (role === 'user' && order.userId !== userId) return res.status(403).json({ error: 'Access denied' });

    let trackingInfo = null;
    if (order.delhiveryWaybill) trackingInfo = await fetchTrackingInfo(order.delhiveryWaybill);

    res.json({
      order,
      trackingInfo,
    });
  } catch (error) {
    console.error('Get order with tracking error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Manual order status update by admin
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status' });

    const order = await prisma.order.findUnique({
      where: { id },
      include: { user: true, address: true, orderItems: { include: { product: true } } },
    });

    if (!order) return res.status(404).json({ error: 'Order not found' });

    await prisma.order.update({ where: { id }, data: { orderStatus: status } });

    if (['CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'].includes(status)) {
      try {
        await mailService.sendOrderStatusUpdateEmail({ user: order.user, order, orderItems: order.orderItems, address: order.address }, status);
        Logger.success('Order status update email sent', { orderNumber: order.orderNumber, status });
      } catch (emailError) {
        Logger.error('Order status update email failed', emailError);
      }
    }

    if (status === 'DELIVERED') {
      try {
        await mailService.sendOrderDeliveredEmail({ user: order.user, order, orderItems: order.orderItems });
        Logger.success('Order delivered email sent', { orderNumber: order.orderNumber });
      } catch (emailError) {
        Logger.error('Order delivered email failed', emailError);
      }
    }

    res.json({ message: `Order status updated to ${status}` });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all orders for the authenticated user
const getAllOrders = async (req, res) => {
  try {
    const userId = req.userId;
    
    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                images: true,
              }
            }
          }
        },
        address: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({ orders });
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Manual payment confirmation for PREPAID orders (fallback when webhook fails)
const confirmPayment = async (req, res) => {
  try {
    const { orderNumber } = req.params;
    
    console.log('🔧 Manual payment confirmation for order:', orderNumber);
    
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: { user: true, address: true, orderItems: { include: { product: true } } },
    });
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    if (order.paymentMethod !== 'PREPAID') {
      return res.status(400).json({ error: 'Only PREPAID orders can be manually confirmed' });
    }
    
    if (order.paymentStatus === 'COMPLETED') {
      return res.status(400).json({ error: 'Payment already confirmed' });
    }
    
    console.log('💰 Confirming payment for order:', order.orderNumber);
    
    // Update payment status
    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: 'COMPLETED',
        razorpayPaymentId: 'manual_confirmation_' + Date.now(),
      },
    });
    
    // Check if Shiprocket order needs to be created or retried
    if (!order.delhiveryWaybill || order.shiprocketStatus === 'PENDING_RETRY') {
      console.log('🚀 Creating/Retrying Shiprocket order for confirmed payment...');
      
      try {
        console.log('Creating Shiprocket order with user email:', order.user?.email);
        const shiprocketResp = await shiprocketService.createOrder(order, order.address, order.orderItems, order.user);
        console.log('✅ Shiprocket order created successfully after payment:', shiprocketResp);

        // Update order with Shiprocket details and confirm status
        await prisma.order.update({
          where: { id: order.id },
          data: {
            orderStatus: 'CONFIRMED',
            delhiveryWaybill: shiprocketResp.shipment_id ? String(shiprocketResp.shipment_id) : null,
            trackingUrl: shiprocketResp.awb_code ? `https://shiprocket.co/tracking/${shiprocketResp.awb_code}` : null,
            shiprocketOrderId: shiprocketResp.order_id ? String(shiprocketResp.order_id) : null,
            shiprocketStatus: 'ORDER_CREATED',
            notes: order.notes ? order.notes.replace(' [Shiprocket order creation failed - will retry after payment]', '') : order.notes
          },
        });

        console.log('✅ Order status updated to CONFIRMED with Shiprocket details');
      } catch (shiprocketError) {
        console.error('❌ Shiprocket order creation failed after payment confirmation:', shiprocketError);
        
        // Update order status but mark Shiprocket as failed
        await prisma.order.update({
          where: { id: order.id },
          data: {
            orderStatus: 'CONFIRMED', // Payment is confirmed, so order is confirmed
            shiprocketStatus: 'FAILED',
            notes: (order.notes || '') + ' [Shiprocket order creation failed after payment]'
          },
        });
        
        console.log('⚠️ Order confirmed but Shiprocket integration failed. Manual intervention required.');
      }
    } else {
      // Shiprocket order already exists, just update status
      await prisma.order.update({
        where: { id: order.id },
        data: {
          orderStatus: 'CONFIRMED',
        },
      });
      console.log('✅ Order status updated to CONFIRMED. Shiprocket order already exists.');
    }

    // Send order confirmation email after payment is completed
    mailService
      .sendOrderConfirmationEmail({ user: order.user, order, orderItems: order.orderItems, address: order.address })
      .catch(console.error);

    res.json({ 
      message: 'Payment confirmed successfully',
      order: {
        orderNumber: order.orderNumber,
        paymentStatus: 'COMPLETED',
        orderStatus: 'CONFIRMED'
      }
    });
  } catch (error) {
    console.error('Manual payment confirmation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  createOrder,
  getAllOrders,
  verifyRazorpayPayment,
  updateOrderStatus,
  handleShiprocketWebhook,
  getOrderDetailsWithTracking,
  confirmPayment,
};
