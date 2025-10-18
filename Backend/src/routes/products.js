const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();

const {
  createCategory,
  getAllCategories,
  updateCategory,
  deleteCategory,
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');

const { authenticate, authorizeRoles } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

// ========================
// CATEGORY ROUTES (Admin only)
// ========================

// Create category
router.post(
  '/categories',
  authenticate,
  authorizeRoles('admin'),
  [
    body('name').notEmpty().withMessage('Category name is required'),
  ],
  createCategory
);

// Get all categories (public)
router.get('/categories', getAllCategories);

// Update category
router.put(
  '/categories/:id',
  authenticate,
  authorizeRoles('admin'),
  [
    param('id').notEmpty().withMessage('Category ID is required'),
    body('name').notEmpty().withMessage('Category name is required'),
  ],
  updateCategory
);

// Delete category
router.delete(
  '/categories/:id',
  authenticate,
  authorizeRoles('admin'),
  [
    param('id').notEmpty().withMessage('Category ID is required'),
  ],
  deleteCategory
);

// ========================
// PRODUCT ROUTES
// ========================

// Get all products (public)
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('category').optional().isLength({ min: 20, max: 30 }).withMessage('Invalid category ID'),
    query('search').optional().isString().withMessage('Search must be a string'),
  ],
  getAllProducts
);

// Get single product (public)
router.get(
  '/:id',
  [
    param('id').isLength({ min: 20, max: 30 }).withMessage('Invalid product ID'),
  ],
  getProductById
);

// Create product (admin only)
router.post(
  '/',
  authenticate,
  authorizeRoles('admin'),
  upload.array('images', 5), // Allow up to 5 images
  [
    body('name').notEmpty().withMessage('Product name is required'),
    body('sku').notEmpty().withMessage('SKU is required'),
    body('description').notEmpty().withMessage('Product description is required'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
    body('categoryId').notEmpty().withMessage('Category ID is required'),
  ],
  createProduct
);

// Update product (admin only)
router.put(
  '/:id',
  authenticate,
  authorizeRoles('admin'),
  upload.array('images', 5),
  [
    param('id').notEmpty().withMessage('Product ID is required'),
    body('name').optional().notEmpty().withMessage('Product name cannot be empty'),
    body('description').optional().notEmpty().withMessage('Product description cannot be empty'),
    body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
    body('categoryId').optional().notEmpty().withMessage('Category ID cannot be empty'),
  ],
  updateProduct
);

// Delete product (admin only)
router.delete(
  '/:id',
  authenticate,
  authorizeRoles('admin'),
  [
    param('id').notEmpty().withMessage('Product ID is required'),
  ],
  deleteProduct
);

module.exports = router;
