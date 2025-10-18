const { validationResult } = require('express-validator');
const prisma = require('../config/db');
const { uploadToCloudinary,deleteFromCloudinary } = require('../middleware/upload'); // Ensure this uses buffer upload
const uploadService = require('../services/uploadService');



// create category
const createCategory = async (req, res) => {
  try {
    const { name } = req.body;

    const category = await prisma.category.create({
      data: { name },
    });

    res.status(201).json({ message: 'Category created', category });
  } catch (err) {
    res.status(500).json({ message: 'Error creating category', error: err });
  }
};

//get all categories
const getAllCategories = async (req, res) => {
  try {

    const categories = await prisma.category.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json({ categories });
  } catch (err) { 
    res.status(500).json({ message: 'Error fetching categories', error: err });
  }
};

// Update category
const updateCategory = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { id } = req.params;
    const { name, description } = req.body;
    const category = await prisma.category.update({
      where: { id },
      data: { name, description },
    }); 
    res.status(200).json({ message: 'Category updated', category });
  } catch (err) {
    res.status(500).json({ message: 'Error updating category', error: err });
  }
};

// Delete category
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if category has products
    const productsCount = await prisma.product.count({
      where: { categoryId: id }
    });
    
    if (productsCount > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete category with existing products. Please move or delete products first.' 
      });
    }
    
    const category = await prisma.category.delete({
      where: { id },
    }); 
    res.status(200).json({ message: 'Category deleted', category });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting category', error: err });
  }
};




// Get all products
const getAllProducts = async (req, res) => {
  try {
    console.log('Getting products...');
    
    const { page = 1, limit = 10, category, search } = req.query;
    const skip = (page - 1) * limit;

    const where = {
      isActive: true,
      ...(category && { categoryId: category }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    console.log('Query where clause:', where);

    // Use raw query to handle null SKU values
    const query = `
      SELECT 
        p.id,
        p.name,
        COALESCE(p.sku, CONCAT('SKU-', SUBSTRING(p.id, -8))) as sku,
        p.description,
        p.price,
        p.stock,
        p."sizeStock",
        p.images,
        p."isActive",
        p."createdAt",
        p."updatedAt",
        p."categoryId",
        c.id as "category_id",
        c.name as "category_name"
      FROM products p
      LEFT JOIN categories c ON p."categoryId" = c.id
      WHERE p."isActive" = true
      ORDER BY p."createdAt" DESC
      LIMIT $1 OFFSET $2
    `;

    const products = await prisma.$queryRawUnsafe(query, parseInt(limit), parseInt(skip));

    // Process the raw query results
    const processedProducts = products.map(product => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      description: product.description,
      price: product.price,
      stock: product.stock,
      sizeStock: product.sizeStock || null,
      images: product.images,
      isActive: product.isActive,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      categoryId: product.categoryId,
      category: {
        id: product.category_id,
        name: product.category_name
      }
    }));

    console.log('Products found:', products.length);

    const total = await prisma.product.count({ where });

    console.log('Total products:', total);

    res.json({
      products: processedProducts,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get products error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack
    });
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
};

// Get single product
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true } },
      },
    });

    if (!product || !product.isActive) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ product });
  } catch (error) {
    console.error('Get product by ID error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create product
const createProduct = async (req, res) => {
  try {
    console.log('🚀 Product creation request received');
    console.log('📝 Request body:', req.body);
    console.log('📁 Request files:', req.files);
    console.log('🔐 Auth headers:', req.headers.authorization);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({ error: errors.array() });
    }

    const { name, sku, description, price, stock, categoryId, sizeStock, useSizeStock, imageUrls } = req.body;
    const files = req.files;
    
    console.log('📦 Product creation request data:', {
      name, sku, description, price, stock, categoryId, 
      sizeStock, useSizeStock, imageUrls: imageUrls ? (Array.isArray(imageUrls) ? imageUrls : [imageUrls]) : 'none'
    });

    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) return res.status(400).json({ error: 'Invalid category ID' });

    let images = [];
    
    // Handle file uploads
    if (files && files.length > 0) {
      try {
        console.log(`📤 Uploading ${files.length} files using ${uploadService.UPLOAD_PROVIDER}...`);
        
        // Use unified upload service (S3 or Cloudinary)
        const uploadPromises = files.map(file => 
          uploadService.uploadFile(file.buffer, file.originalname, file.mimetype, 'products')
        );
        
        const uploadResults = await Promise.allSettled(uploadPromises);
        
        // Filter out failed uploads
        images = uploadResults
          .filter(result => result.status === 'fulfilled')
          .map(result => result.value);
        
        console.log(`✅ Successfully uploaded ${images.length} images`);
        
        if (images.length === 0) {
          return res.status(500).json({ error: 'All image uploads failed' });
        }
      } catch (uploadError) {
        console.error('❌ Image upload error:', uploadError);
        return res.status(500).json({ error: 'Failed to upload images' });
      }
    }
    
    // Handle image URLs (for simple URL-based images)
    if (imageUrls) {
      const urlArray = Array.isArray(imageUrls) ? imageUrls : [imageUrls];
      const urlImages = urlArray.map(url => ({
        url: url,
        public_id: `url-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` // Generate a fake public_id for URLs
      }));
      images = [...images, ...urlImages];
    }

    // Prepare product data based on stock type
    let productData = {
      name,
      sku: sku,
      description,
      price: parseFloat(price),
      categoryId,
      images, // storing [{ url, public_id }]
    };

    // Handle stock based on useSizeStock flag
    if (useSizeStock === 'true' && sizeStock) {
      // Parse sizeStock JSON if it's a string
      let parsedSizeStock;
      try {
        parsedSizeStock = typeof sizeStock === 'string' ? JSON.parse(sizeStock) : sizeStock;
      } catch (parseError) {
        console.error('❌ SizeStock JSON parse error:', parseError);
        return res.status(400).json({ error: 'Invalid sizeStock JSON format' });
      }
      
      // Validate sizeStock object
      if (typeof parsedSizeStock === 'object' && parsedSizeStock !== null) {
        // Validate that at least one size has stock
        const sizeValues = Object.values(parsedSizeStock);
        const totalStock = sizeValues.reduce((sum, sizeStock) => {
          return sum + (parseInt(sizeStock) || 0);
        }, 0);
        
        if (totalStock === 0) {
          return res.status(400).json({ error: 'At least one size must have stock quantity' });
        }
        
        productData.sizeStock = parsedSizeStock;
        productData.stock = totalStock; // Set total stock from size-wise stock
      } else {
        return res.status(400).json({ error: 'sizeStock must be a valid object' });
      }
    } else {
      // Traditional single stock management
      productData.stock = parseInt(stock) || 0;
      productData.sizeStock = null;
    }

    // Generate unique SKU if there's a conflict
    let finalSku = sku;
    let counter = 1;
    
    while (true) {
      try {
        const product = await prisma.product.create({
          data: {
            ...productData,
            sku: finalSku,
          },
          include: {
            category: { select: { id: true, name: true } },
          },
        });
        
        res.status(201).json({ message: 'Product created successfully', product });
        return;
      } catch (skuError) {
        if (skuError.code === 'P2002' && skuError.meta?.target?.includes('sku')) {
          // SKU conflict, try with a suffix
          finalSku = `${sku}-${counter}`;
          counter++;
        } else {
          throw skuError; // Re-throw if it's not a SKU conflict
        }
      }
    }
  } catch (err) {
    console.error('Create product error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update product
const updateProduct = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { name, sku, description, price, stock, categoryId, sizeStock, useSizeStock } = req.body;
    const files = req.files;
    
    // Log the update request for debugging
    console.log(`🔄 Product update request for ID: ${id}`);
    console.log(`📝 Update data:`, { name, sku, description, price, stock, categoryId });
    console.log(`📁 Files provided:`, files ? files.length : 0);
    console.log(`🔗 Request headers:`, req.headers);

    const existingProduct = await prisma.product.findUnique({ where: { id } });
    if (!existingProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (categoryId) {
      const categoryExists = await prisma.category.findUnique({ where: { id: categoryId } });
      if (!categoryExists) {
        return res.status(400).json({ error: 'Invalid category ID' });
      }
    }

    let updatedImages = existingProduct.images || [];
    console.log(`📸 Existing images:`, updatedImages);
    
    // Only update images if new files are provided
    if (files && files.length > 0) {
      try {
        console.log(`📤 Uploading ${files.length} new files using ${uploadService.UPLOAD_PROVIDER}...`);
        
        // Use unified upload service (S3 or Cloudinary)
        const uploadPromises = files.map(file => 
          uploadService.uploadFile(file.buffer, file.originalname, file.mimetype, 'products')
        );
        
        const newImages = await Promise.all(uploadPromises);
        updatedImages = [...updatedImages, ...newImages];
        console.log('✅ Added new images:', newImages.length);
        console.log('📸 Updated images array:', updatedImages);
      } catch (uploadError) {
        console.error('❌ Image upload error during update:', uploadError);
        return res.status(500).json({ error: 'Failed to upload new images' });
      }
    } else {
      console.log('ℹ️ No new images provided, keeping existing images');
    }

    // Only update the fields that are provided
    const updateData = {};
    if (name) updateData.name = name;
    if (sku) updateData.sku = sku;
    if (description) updateData.description = description;
    if (price) updateData.price = parseFloat(price);
    if (categoryId) updateData.categoryId = categoryId;
    
    // Handle stock based on useSizeStock flag
    if (useSizeStock !== undefined) {
      if (useSizeStock === 'true' && sizeStock) {
        // Parse sizeStock JSON if it's a string
        let parsedSizeStock;
        try {
          parsedSizeStock = typeof sizeStock === 'string' ? JSON.parse(sizeStock) : sizeStock;
        } catch (parseError) {
          return res.status(400).json({ error: 'Invalid sizeStock JSON format' });
        }
        
        // Validate sizeStock object
        if (typeof parsedSizeStock === 'object' && parsedSizeStock !== null) {
          updateData.sizeStock = parsedSizeStock;
          
          // Calculate total stock from size-wise stock
          const totalStock = Object.values(parsedSizeStock).reduce((sum, sizeStock) => {
            return sum + (parseInt(sizeStock) || 0);
          }, 0);
          
          updateData.stock = totalStock; // Set total stock from size-wise stock
        } else {
          return res.status(400).json({ error: 'sizeStock must be a valid object' });
        }
      } else if (useSizeStock === 'false') {
        // Traditional single stock management
        if (stock !== undefined) updateData.stock = parseInt(stock);
        updateData.sizeStock = null;
      }
    } else {
      // If useSizeStock is not provided, update stock normally
      if (stock !== undefined) updateData.stock = parseInt(stock);
    }
    
    // Only update images if we have new ones - preserve existing images if no new ones
    if (files && files.length > 0) {
      updateData.images = updatedImages;
      console.log('📸 Will update images in database');
    } else {
      console.log('ℹ️ Will NOT update images in database (preserving existing)');
    }
    
    console.log('💾 Database update data:', updateData);

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        category: { select: { id: true, name: true } }
      }
    });

    res.json({
      message: 'Product updated successfully',
      product: updatedProduct
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete product 
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) return res.status(404).json({ error: 'Product not found' });

    // Delete each image using unified upload service
    if (product.images && Array.isArray(product.images)) {
      try {
        const deletePromises = product.images.map(img => {
          // Determine provider from URL or use default
          const provider = uploadService.getProviderFromUrl(img.url);
          return uploadService.deleteFile(img.public_id, provider);
        });
        
        await Promise.all(deletePromises);
        console.log(`✅ Deleted ${product.images.length} images from ${uploadService.UPLOAD_PROVIDER}`);
      } catch (deleteError) {
        console.error('❌ Error deleting images:', deleteError);
        // Continue with product deletion even if image deletion fails
      }
    }

    await prisma.product.update({
      where: { id },
      data: { isActive: false, images: [] }, // soft delete + clear images
    });

    res.json({ message: 'Product and its images deleted successfully' });
  } catch (err) {
    console.error('Delete product error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};


module.exports = {
  createCategory,
  getAllCategories,
  updateCategory,
  deleteCategory,
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
