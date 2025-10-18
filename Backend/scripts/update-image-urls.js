require('dotenv').config();
const prisma = require('../src/config/db');

/**
 * Script to update image URLs from Cloudinary to S3
 * This should be run after migrating images to S3
 */

// Update product images
const updateProductImages = async () => {
  console.log('🔄 Updating product images...');
  
  try {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        images: {
          not: null
        }
      }
    });
    
    let updatedCount = 0;
    
    for (const product of products) {
      if (!product.images || !Array.isArray(product.images)) continue;
      
      let hasChanges = false;
      const updatedImages = product.images.map(image => {
        if (typeof image === 'string') {
          // String URL - check if it's Cloudinary
          if (image.includes('cloudinary.com')) {
            hasChanges = true;
            // Convert to S3 URL format
            return {
              url: image.replace('cloudinary.com', 'd22mx6u12sujnm.cloudfront.net'),
              public_id: `migrated-${Date.now()}`,
              provider: 'S3'
            };
          }
          return image;
        } else if (image.url && image.url.includes('cloudinary.com')) {
          // Object with Cloudinary URL
          hasChanges = true;
          return {
            ...image,
            url: image.url.replace('cloudinary.com', 'd22mx6u12sujnm.cloudfront.net'),
            provider: 'S3'
          };
        }
        return image;
      });
      
      if (hasChanges) {
        await prisma.product.update({
          where: { id: product.id },
          data: { images: updatedImages }
        });
        updatedCount++;
        console.log(`✅ Updated product: ${product.name}`);
      }
    }
    
    console.log(`\n✅ Updated ${updatedCount} products`);
    
  } catch (error) {
    console.error('❌ Error updating product images:', error);
  }
};

// Update static images in components
const updateStaticImages = () => {
  console.log('🔄 Updating static image references...');
  
  const filesToUpdate = [
    'Code/components/image-gallery.tsx',
    'Code/components/hero-slider.tsx',
    'Code/components/instagram-feed.tsx'
  ];
  
  filesToUpdate.forEach(filePath => {
    try {
      const fullPath = path.join(__dirname, '..', '..', filePath);
      if (fs.existsSync(fullPath)) {
        let content = fs.readFileSync(fullPath, 'utf8');
        
        // Replace Cloudinary URLs with S3 URLs
        content = content.replace(
          /https:\/\/res\.cloudinary\.com\/[^\/]+\/image\/upload\/[^"']+/g,
          (match) => {
            // Extract the path after /upload/
            const pathMatch = match.match(/\/upload\/(.+)$/);
            if (pathMatch) {
              return `https://d22mx6u12sujnm.cloudfront.net/${pathMatch[1]}`;
            }
            return match;
          }
        );
        
        fs.writeFileSync(fullPath, content);
        console.log(`✅ Updated: ${filePath}`);
      }
    } catch (error) {
      console.error(`❌ Error updating ${filePath}:`, error.message);
    }
  });
};

// Main update function
const updateAllImageUrls = async () => {
  console.log('🚀 Starting image URL updates...\n');
  
  try {
    await updateProductImages();
    updateStaticImages();
    
    console.log('\n🎉 All image URLs updated successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Test the website to ensure images load correctly');
    console.log('2. Check that S3 images are accessible');
    console.log('3. Monitor for any broken image links');
    
  } catch (error) {
    console.error('❌ Update failed:', error);
    process.exit(1);
  }
};

// Run update
if (require.main === module) {
  updateAllImageUrls()
    .then(() => {
      console.log('\n✅ URL update script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ URL update script failed:', error);
      process.exit(1);
    });
}

module.exports = { updateAllImageUrls, updateProductImages };
