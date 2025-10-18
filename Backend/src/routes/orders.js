const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const prisma = require('../config/db');

const {
  createOrder,
  getAllOrders,
  verifyRazorpayPayment,
  updateOrderStatus,
  handleShiprocketWebhook,
  getOrderDetailsWithTracking,
  confirmPayment,
} = require('../controllers/orderController');

const { authenticate, authorizeRoles } = require('../middleware/auth');

// ========================
// ORDER ROUTES
// ========================

// Create order (authenticated user)
router.post(
  '/',
  authenticate,
  authorizeRoles('user'),
  [
    body('addressId').isLength({ min: 20, max: 30 }).withMessage('Valid address ID is required'),
    body('orderItems').isArray({ min: 1 }).withMessage('Order items are required'),
    body('orderItems.*.productId').isLength({ min: 20, max: 30 }).withMessage('Valid product ID is required'),
    body('orderItems.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('paymentMethod').isIn(['PREPAID']).withMessage('Payment method must be PREPAID'),
    body('notes').optional().isString().withMessage('Notes must be a string'),
  ],
  createOrder
);

// Get all orders for the authenticated user
router.get(
  '/',
  authenticate,
  authorizeRoles('user'),
  getAllOrders
);

// Get all orders for admin (with user and address details)
router.get(
  '/admin/all',
  authenticate,
  authorizeRoles('admin'),
  async (req, res) => {
    try {
      const orders = await prisma.order.findMany({
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          },
          address: {
            select: {
              id: true,
              name: true,
              address: true,
              city: true,
              state: true,
              pincode: true
            }
          },
          orderItems: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  images: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      res.json({ orders });
    } catch (error) {
      console.error('Error fetching orders for admin:', error);
      res.status(500).json({ error: 'Failed to fetch orders' });
    }
  }
);

// Get order details with tracking (authenticated user or admin)
router.get(
  '/:id',
  authenticate,
  [
    param('id').isLength({ min: 20, max: 30 }).withMessage('Valid order ID is required'),
  ],
  getOrderDetailsWithTracking
);

// Update order status (admin only)
router.put(
  '/:id/status',
  authenticate,
  authorizeRoles('admin'),
  [
    param('id').isLength({ min: 20, max: 30 }).withMessage('Valid order ID is required'),
    body('status').isIn(['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'])
      .withMessage('Invalid order status'),
  ],
  updateOrderStatus
);

// Manual payment confirmation for PREPAID orders (fallback when webhook fails)
router.post(
  '/:orderNumber/confirm-payment',
  authenticate,
  authorizeRoles('admin'),
  confirmPayment
);

// ========================
// SHIPROCKET UTILITY ROUTES
// ========================

// Check delivery serviceability for a pincode
router.get(
  '/shipping/serviceability/:pincode',
  authenticate,
  [
    param('pincode').isLength({ min: 6, max: 6 }).withMessage('Valid 6-digit pincode is required'),
  ],
  async (req, res) => {
    try {
      const { pincode } = req.params;
      const shiprocketService = require('../services/shiprocketService');
      
      const serviceability = await shiprocketService.checkServiceability(pincode);
      
      if (!serviceability) {
        return res.status(400).json({ error: 'Unable to check serviceability' });
      }
      
      res.json({ serviceability });
    } catch (error) {
      console.error('Serviceability check error:', error);
      res.status(500).json({ error: 'Failed to check serviceability' });
    }
  }
);

// Get available couriers
router.get(
  '/shipping/couriers',
  authenticate,
  async (req, res) => {
    try {
      const shiprocketService = require('../services/shiprocketService');
      
      const couriers = await shiprocketService.getCourierList();
      
      if (!couriers) {
        return res.status(400).json({ error: 'Unable to fetch couriers' });
      }
      
      res.json({ couriers });
    } catch (error) {
      console.error('Courier fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch couriers' });
    }
  }
);

module.exports = router;
