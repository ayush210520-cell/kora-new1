const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();
const { upload } = require('../middleware/upload');
const { authenticate, authorizeRoles } = require('../middleware/auth');
const {
  getAllDynamicImages,
  getImagesByPosition,
  getDynamicImageById,
  createDynamicImage,
  updateDynamicImage,
  deleteDynamicImage,
  getAvailablePositions
} = require('../controllers/dynamicImageController');

// Validation middleware
const validateDynamicImage = [
  body('title').notEmpty().withMessage('Title is required'),
  body('position').notEmpty().withMessage('Position is required'),
  body('category').optional().isString(),
  body('description').optional().isString(),
  body('altText').optional().isString(),
  body('linkUrl').optional().custom((value) => {
    // Allow empty string or valid URL
    if (!value || value === '') return true;
    // Basic URL validation
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }).withMessage('Link URL must be a valid URL'),
  body('sortOrder').optional().isInt({ min: 0 }).withMessage('Sort order must be a non-negative number'),
  body('isActive').optional().custom((value) => {
    if (typeof value === 'string') {
      return value === 'true' || value === 'false';
    }
    return typeof value === 'boolean';
  }).withMessage('isActive must be a boolean or string "true"/"false"')
];

// Get all dynamic images (public)
router.get(
  '/',
  [
    query('category').optional().isString(),
    query('position').optional().isString(),
    query('isActive').optional().isBoolean()
  ],
  getAllDynamicImages
);

// Get available positions (public)
router.get('/positions', getAvailablePositions);

// Get images by position (public)
router.get(
  '/position/:position',
  [
    param('position').notEmpty().withMessage('Position is required')
  ],
  getImagesByPosition
);

// Get single dynamic image (public)
router.get(
  '/:id',
  [
    param('id').isLength({ min: 20, max: 30 }).withMessage('Invalid image ID')
  ],
  getDynamicImageById
);

// Create dynamic image (admin only)
router.post(
  '/',
  authenticate,
  authorizeRoles('admin'),
  upload.single('image'),
  validateDynamicImage,
  createDynamicImage
);

// Update dynamic image (admin only)
router.put(
  '/:id',
  authenticate,
  authorizeRoles('admin'),
  upload.single('image'),
  [
    param('id').isLength({ min: 20, max: 30 }).withMessage('Invalid image ID'),
    ...validateDynamicImage
  ],
  updateDynamicImage
);

// Delete dynamic image (admin only)
router.delete(
  '/:id',
  authenticate,
  authorizeRoles('admin'),
  [
    param('id').isLength({ min: 20, max: 30 }).withMessage('Invalid image ID')
  ],
  deleteDynamicImage
);

module.exports = router;
