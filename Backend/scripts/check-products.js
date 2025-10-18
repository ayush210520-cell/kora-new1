const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkProducts() {
  try {
    console.log('🔍 Checking products in database...\n');
    
    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        sku: true,
        images: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });
    
    console.log(`📊 Total products found: ${products.length}\n`);
    
    products.forEach((product, index) => {
      console.log(`Product ${index + 1}:`);
      console.log(`  ID: ${product.id}`);
      console.log(`  Name: ${product.name}`);
      console.log(`  SKU: ${product.sku}`);
      console.log(`  Images: ${JSON.stringify(product.images)}`);
      console.log(`  Is Active: ${product.isActive}`);
      console.log(`  Created: ${product.createdAt}`);
      console.log(`  Updated: ${product.updatedAt}`);
      console.log('---');
    });
    
    // Check for products with empty images
    const emptyImageProducts = products.filter(p => 
      !p.images || 
      (Array.isArray(p.images) && p.images.length === 0) ||
      (typeof p.images === 'string' && p.images === '[]')
    );
    
    console.log(`\n⚠️  Products with empty images: ${emptyImageProducts.length}`);
    emptyImageProducts.forEach(p => {
      console.log(`  - ${p.name} (${p.id})`);
    });
    
  } catch (error) {
    console.error('❌ Error checking products:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProducts();
