const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();

const {
  getUserAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
} = require('../controllers/adressController');

const { authenticate, authorizeRoles } = require('../middleware/auth');

// ========================
// ADDRESS ROUTES (Authenticated users only)
// ========================

// Get all addresses for the authenticated user
router.get(
  '/',
  authenticate,
  authorizeRoles('user'),
  getUserAddresses
);

// Create new address
router.post(
  '/',
  authenticate,
  authorizeRoles('user'),
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('phone').isLength({ min: 10 }).withMessage('Valid phone number is required'),
    body('address').notEmpty().withMessage('Address is required'),
    body('city').notEmpty().withMessage('City is required'),
    body('state').notEmpty().withMessage('State is required'),
    body('pincode').isLength({ min: 6, max: 6 }).withMessage('Pincode must be 6 digits'),
    body('landmark').optional().isString().withMessage('Landmark must be a string'),
  ],
  createAddress
);

// Update address
router.put(
  '/:id',
  authenticate,
  authorizeRoles('user'),
  [
    param('id').isLength({ min: 20, max: 30 }).withMessage('Valid address ID is required'),
    body('name').notEmpty().withMessage('Name is required'),
    body('phone').isLength({ min: 10 }).withMessage('Valid phone number is required'),
    body('address').notEmpty().withMessage('Address is required'),
    body('city').notEmpty().withMessage('City is required'),
    body('state').notEmpty().withMessage('State is required'),
    body('pincode').isLength({ min: 6, max: 6 }).withMessage('Pincode must be 6 digits'),
    body('landmark').optional().isString().withMessage('Landmark must be a string'),
  ],
  updateAddress
);

// Delete address
router.delete(
  '/:id',
  authenticate,
  authorizeRoles('user'),
  [
    param('id').isLength({ min: 20, max: 30 }).withMessage('Valid address ID is required'),
  ],
  deleteAddress
);

module.exports = router;
