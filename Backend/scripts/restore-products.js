const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function restoreProducts() {
  try {
    console.log('🔧 Restoring products...\n');
    
    // Get the working product to use its images as template
    const workingProduct = await prisma.product.findFirst({
      where: { isActive: true },
      select: { images: true }
    });
    
    if (!workingProduct || !workingProduct.images || !Array.isArray(workingProduct.images)) {
      console.log('❌ No working product found with images to use as template');
      return;
    }
    
    console.log(`📸 Using images from working product as template`);
    console.log(`Template images: ${workingProduct.images.length} images found\n`);
    
    // Get all products with empty images
    const productsWithEmptyImages = await prisma.product.findMany({
      where: {
        OR: [
          { images: { equals: [] } },
          { images: { equals: null } },
          { images: { equals: '[]' } }
        ]
      }
    });
    
    console.log(`📊 Found ${productsWithEmptyImages.length} products with empty images\n`);
    
    // Use the working product's images as template for all products
    const templateImages = workingProduct.images;
    
    for (const product of productsWithEmptyImages) {
      console.log(`Restoring product: ${product.name} (${product.id})`);
      
      // Update the product with template images and set as active
      await prisma.product.update({
        where: { id: product.id },
        data: {
          images: templateImages,
          isActive: true
        }
      });
      
      console.log(`✅ Restored: ${product.name}`);
    }
    
    console.log(`\n🎉 Successfully restored ${productsWithEmptyImages.length} products!`);
    
    // Verify the restoration
    const restoredProducts = await prisma.product.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        images: true,
        isActive: true
      }
    });
    
    console.log(`\n📊 Active products after restoration: ${restoredProducts.length}`);
    restoredProducts.forEach(p => {
      console.log(`  - ${p.name}: ${Array.isArray(p.images) ? p.images.length : 0} images`);
    });
    
  } catch (error) {
    console.error('❌ Error restoring products:', error);
  } finally {
    await prisma.$disconnect();
  }
}

restoreProducts();