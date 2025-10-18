const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function deleteAllProducts() {
  try {
    console.log('🗑️ Deleting all products...\n');
    
    // First, get all products to show what we're deleting
    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        sku: true,
        images: true
      }
    });
    
    console.log(`📊 Found ${products.length} products to delete:\n`);
    products.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name} (${product.sku})`);
      console.log(`   ID: ${product.id}`);
      console.log(`   Images: ${Array.isArray(product.images) ? product.images.length : 0}`);
      console.log('---');
    });
    
    // Delete all products
    const deleteResult = await prisma.product.deleteMany({});
    
    console.log(`\n✅ Successfully deleted ${deleteResult.count} products!`);
    
    // Verify deletion
    const remainingProducts = await prisma.product.count();
    console.log(`📊 Remaining products in database: ${remainingProducts}`);
    
    if (remainingProducts === 0) {
      console.log('🎉 All products have been successfully deleted!');
    } else {
      console.log('⚠️ Some products may still remain in the database');
    }
    
  } catch (error) {
    console.error('❌ Error deleting products:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteAllProducts();
