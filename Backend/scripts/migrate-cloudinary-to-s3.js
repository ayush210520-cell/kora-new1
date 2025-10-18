require('dotenv').config();
const fs = require('fs');
const path = require('path');
const https = require('https');
const s3Service = require('../src/services/s3Service');
const prisma = require('../src/config/db');

/**
 * Migration script to move Cloudinary images to S3
 */

// Download image from URL
const downloadImage = (url) => {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }
      
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
};

// Extract Cloudinary public ID from URL
const extractPublicId = (url) => {
  if (!url.includes('cloudinary.com')) return null;
  
  const parts = url.split('/');
  const uploadIndex = parts.indexOf('upload');
  if (uploadIndex !== -1 && uploadIndex < parts.length - 1) {
    const pathAfterUpload = parts.slice(uploadIndex + 2).join('/');
    return pathAfterUpload.replace(/\.[^/.]+$/, '');
  }
  return null;
};

// Get optimized Cloudinary URL for download
const getOptimizedCloudinaryUrl = (url) => {
  if (!url.includes('cloudinary.com')) return url;
  
  // Remove existing transformations and get original
  return url.replace(/\/upload\/[^\/]+\//, '/upload/');
};

// Migrate single product images
const migrateProductImages = async (product) => {
  console.log(`\n🔄 Migrating product: ${product.name}`);
  
  if (!product.images || !Array.isArray(product.images)) {
    console.log('❌ No images found for this product');
    return { success: 0, failed: 0 };
  }
  
  let successCount = 0;
  let failedCount = 0;
  const newImages = [];
  
  for (let i = 0; i < product.images.length; i++) {
    const image = product.images[i];
    const imageUrl = typeof image === 'string' ? image : image.url;
    
    if (!imageUrl || !imageUrl.includes('cloudinary.com')) {
      console.log(`⚠️  Skipping non-Cloudinary image: ${imageUrl}`);
      newImages.push(image);
      continue;
    }
    
    try {
      console.log(`📥 Downloading image ${i + 1}/${product.images.length}...`);
      
      // Get original image URL (without transformations)
      const originalUrl = getOptimizedCloudinaryUrl(imageUrl);
      const imageBuffer = await downloadImage(originalUrl);
      
      // Generate filename
      const publicId = extractPublicId(imageUrl) || `product-${product.id}-${i}`;
      const fileName = `${publicId}.jpg`;
      
      console.log(`⬆️  Uploading to S3: ${fileName}`);
      
      // Upload to S3
      const result = await s3Service.uploadFile(
        imageBuffer,
        fileName,
        'image/jpeg',
        'products'
      );
      
      console.log(`✅ Uploaded: ${result.url}`);
      
      // Store new image info
      newImages.push({
        url: result.url,
        public_id: result.key,
        provider: 'S3'
      });
      
      successCount++;
      
    } catch (error) {
      console.error(`❌ Failed to migrate image ${i + 1}:`, error.message);
      newImages.push(image); // Keep original if migration fails
      failedCount++;
    }
  }
  
  // Update product with new images
  if (successCount > 0) {
    try {
      await prisma.product.update({
        where: { id: product.id },
        data: { images: newImages }
      });
      console.log(`✅ Updated product in database`);
    } catch (error) {
      console.error(`❌ Failed to update database:`, error.message);
    }
  }
  
  return { success: successCount, failed: failedCount };
};

// Main migration function
const migrateAllImages = async () => {
  console.log('🚀 Starting Cloudinary to S3 migration...\n');
  
  try {
    // Get all products with Cloudinary images
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        images: {
          not: null
        }
      },
      select: {
        id: true,
        name: true,
        images: true
      }
    });
    
    console.log(`📊 Found ${products.length} products to migrate`);
    
    let totalSuccess = 0;
    let totalFailed = 0;
    
    for (const product of products) {
      const result = await migrateProductImages(product);
      totalSuccess += result.success;
      totalFailed += result.failed;
      
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n🎉 Migration completed!');
    console.log(`✅ Successfully migrated: ${totalSuccess} images`);
    console.log(`❌ Failed migrations: ${totalFailed} images`);
    
    if (totalFailed > 0) {
      console.log('\n⚠️  Some images failed to migrate. Check the logs above for details.');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

// Run migration
if (require.main === module) {
  migrateAllImages()
    .then(() => {
      console.log('\n✅ Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateAllImages, migrateProductImages };
