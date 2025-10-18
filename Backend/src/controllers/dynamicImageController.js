const { validationResult } = require('express-validator');
const prisma = require('../config/db');
const { uploadToCloudinary, deleteFromCloudinary } = require('../middleware/upload');
const uploadService = require('../services/uploadService');

// Get all dynamic images
const getAllDynamicImages = async (req, res) => {
  try {
    const { category, position, isActive } = req.query;
    
    const where = {};
    if (category) where.category = category;
    if (position) where.position = position;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const images = await prisma.dynamicImage.findMany({
      where,
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    res.json({ images });
  } catch (error) {
    console.error('Get dynamic images error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get dynamic images by position
const getImagesByPosition = async (req, res) => {
  try {
    const { position } = req.params;
    
    const images = await prisma.dynamicImage.findMany({
      where: {
        position: position,
        isActive: true
      },
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    res.json({ images });
  } catch (error) {
    console.error('Get images by position error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get single dynamic image
const getDynamicImageById = async (req, res) => {
  try {
    const { id } = req.params;

    const image = await prisma.dynamicImage.findUnique({
      where: { id }
    });

    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    res.json({ image });
  } catch (error) {
    console.error('Get dynamic image by ID error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create dynamic image
const createDynamicImage = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('Validation errors:', errors.array());
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array().map(e => ({ field: e.param, message: e.msg }))
      });
    }

    const { title, description, position, category, altText, linkUrl, sortOrder, isActive } = req.body;
    const file = req.file;

    console.log('Create dynamic image request:', { title, position, category, hasFile: !!file });

    if (!file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    let imageUrl = '';
    
    // Handle file upload to S3/CloudFront with optimization
    try {
      const originalSize = (file.buffer.length / 1024 / 1024).toFixed(2);
      console.log(`🎨 Uploading dynamic image: ${file.originalname} (${originalSize} MB)`);
      console.log(`⚡ Auto-optimizing, rotating, and uploading to S3/CloudFront...`);
      
      // Upload to S3 with auto-optimization (Sharp: compress + rotate + WebP)
      const uploadResult = await uploadService.uploadFile(
        file.buffer,
        file.originalname,
        file.mimetype,
        'dynamic-images' // Separate folder for banners/sliders
      );
      
      imageUrl = uploadResult.url;
      console.log(`✅ Dynamic image uploaded: ${imageUrl}`);
      console.log(`📊 Provider: ${uploadResult.provider} (S3/CloudFront)`);
    } catch (uploadError) {
      console.error('❌ Upload error:', uploadError);
      return res.status(500).json({ error: 'Failed to upload image', details: uploadError.message });
    }

    const dynamicImage = await prisma.dynamicImage.create({
      data: {
        title,
        description: description || null,
        imageUrl,
        position,
        category: category || null,
        altText: altText || null,
        linkUrl: linkUrl && linkUrl !== '' ? linkUrl : null,
        sortOrder: sortOrder ? parseInt(sortOrder) : 0,
        isActive: isActive === 'true' || isActive === true
      }
    });

    console.log('Dynamic image created:', dynamicImage.id);
    res.status(201).json({ message: 'Dynamic image created', image: dynamicImage });
  } catch (error) {
    console.error('Create dynamic image error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

// Update dynamic image
const updateDynamicImage = async (req, res) => {
  try {
    const { id } = req.params;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('Validation errors:', errors.array());
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array().map(e => ({ field: e.param, message: e.msg }))
      });
    }

    const { title, description, position, category, altText, linkUrl, sortOrder, isActive } = req.body;
    const file = req.file;

    console.log('Update dynamic image request:', { id, title, position, hasFile: !!file });

    // Get existing image
    const existingImage = await prisma.dynamicImage.findUnique({
      where: { id }
    });

    if (!existingImage) {
      return res.status(404).json({ error: 'Image not found' });
    }

    let imageUrl = existingImage.imageUrl;

    // Handle new file upload if provided
    if (file) {
      try {
        const originalSize = (file.buffer.length / 1024 / 1024).toFixed(2);
        console.log(`🎨 Updating dynamic image: ${file.originalname} (${originalSize} MB)`);
        console.log(`⚡ Auto-optimizing, rotating, and uploading to S3/CloudFront...`);
        
        // Upload to S3 with auto-optimization
        const uploadResult = await uploadService.uploadFile(
          file.buffer,
          file.originalname,
          file.mimetype,
          'dynamic-images'
        );
        
        imageUrl = uploadResult.url;
        console.log(`✅ New image uploaded: ${imageUrl}`);
        
        // Delete old image (works with both S3 and Cloudinary)
        try {
          const provider = uploadService.getProviderFromUrl(existingImage.imageUrl);
          const publicId = uploadService.extractPublicId(existingImage.imageUrl);
          
          if (publicId) {
            await uploadService.deleteFile(publicId, provider);
            console.log(`🗑️ Old image deleted from ${provider}`);
          }
        } catch (deleteError) {
          console.warn('⚠️ Failed to delete old image:', deleteError);
        }
      } catch (uploadError) {
        console.error('❌ Upload error:', uploadError);
        return res.status(500).json({ error: 'Failed to upload image', details: uploadError.message });
      }
    }

    const updateData = {
      title,
      description: description || null,
      imageUrl,
      position,
      category: category || null,
      altText: altText || null,
      linkUrl: linkUrl && linkUrl !== '' ? linkUrl : null,
      sortOrder: sortOrder ? parseInt(sortOrder) : existingImage.sortOrder,
      isActive: isActive !== undefined ? (isActive === 'true' || isActive === true) : existingImage.isActive
    };

    const dynamicImage = await prisma.dynamicImage.update({
      where: { id },
      data: updateData
    });

    console.log('Dynamic image updated:', dynamicImage.id);
    res.json({ message: 'Dynamic image updated', image: dynamicImage });
  } catch (error) {
    console.error('Update dynamic image error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

// Delete dynamic image
const deleteDynamicImage = async (req, res) => {
  try {
    const { id } = req.params;

    const existingImage = await prisma.dynamicImage.findUnique({
      where: { id }
    });

    if (!existingImage) {
      return res.status(404).json({ error: 'Image not found' });
    }

    // Delete image from S3/Cloudinary (auto-detects provider)
    if (existingImage.imageUrl) {
      try {
        const provider = uploadService.getProviderFromUrl(existingImage.imageUrl);
        const publicId = uploadService.extractPublicId(existingImage.imageUrl);
        
        if (publicId) {
          await uploadService.deleteFile(publicId, provider);
          console.log(`🗑️ Image deleted from ${provider}: ${publicId}`);
        }
      } catch (deleteError) {
        console.warn('⚠️ Failed to delete image:', deleteError);
        // Continue with database deletion even if file deletion fails
      }
    }

    await prisma.dynamicImage.delete({
      where: { id }
    });

    res.json({ message: 'Dynamic image deleted successfully' });
  } catch (error) {
    console.error('Delete dynamic image error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get available positions
const getAvailablePositions = async (req, res) => {
  try {
    const positions = [
      { value: 'hero-slider-1', label: 'Hero Slider 1' },
      { value: 'hero-slider-2', label: 'Hero Slider 2' },
      { value: 'hero-slider-3', label: 'Hero Slider 3' },
      { value: 'hero-slider-4', label: 'Hero Slider 4' },
      { value: 'hero-slider-5', label: 'Hero Slider 5' },
      { value: 'gallery-1', label: 'Gallery Image 1' },
      { value: 'gallery-2', label: 'Gallery Image 2' },
      { value: 'gallery-3', label: 'Gallery Image 3' },
      { value: 'gallery-4', label: 'Gallery Image 4' },
      { value: 'gallery-5', label: 'Gallery Image 5' },
      { value: 'gallery-6', label: 'Gallery Image 6' },
      { value: 'banner-top', label: 'Top Banner' },
      { value: 'banner-middle', label: 'Middle Banner' },
      { value: 'banner-bottom', label: 'Bottom Banner' }
    ];

    res.json({ positions });
  } catch (error) {
    console.error('Get available positions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getAllDynamicImages,
  getImagesByPosition,
  getDynamicImageById,
  createDynamicImage,
  updateDynamicImage,
  deleteDynamicImage,
  getAvailablePositions
};
