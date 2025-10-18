const express = require('express');
const router = express.Router();

const {
  verifyRazorpayPayment,
  handleShiprocketWebhook,
} = require('../controllers/orderController');

// ========================
// WEBHOOK ROUTES (No authentication required)
// ========================

// Razorpay payment verification webhook (Razorpay expects /webhook)
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }), // Raw body for signature verification
  verifyRazorpayPayment
);

// Alternative route for backward compatibility
router.post(
  '/webhook/razorpay',
  express.raw({ type: 'application/json' }), // Raw body for signature verification
  verifyRazorpayPayment
);

// Shiprocket webhook for order status updates
router.post(
  '/webhook/shiprocket',
  handleShiprocketWebhook
);

module.exports = router;
