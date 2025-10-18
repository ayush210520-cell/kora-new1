const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function monitorProducts() {
  try {
    console.log('🔍 Monitoring products for issues...\n');
    
    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        images: true,
        isActive: true,
        updatedAt: true
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });
    
    console.log(`📊 Total products: ${products.length}\n`);
    
    // Check for products with empty images
    const emptyImageProducts = products.filter(p => 
      !p.images || 
      (Array.isArray(p.images) && p.images.length === 0) ||
      (typeof p.images === 'string' && p.images === '[]')
    );
    
    // Check for inactive products
    const inactiveProducts = products.filter(p => !p.isActive);
    
    console.log(`⚠️  Products with empty images: ${emptyImageProducts.length}`);
    if (emptyImageProducts.length > 0) {
      emptyImageProducts.forEach(p => {
        console.log(`  - ${p.name} (${p.id}) - Updated: ${p.updatedAt}`);
      });
    }
    
    console.log(`\n❌ Inactive products: ${inactiveProducts.length}`);
    if (inactiveProducts.length > 0) {
      inactiveProducts.forEach(p => {
        console.log(`  - ${p.name} (${p.id}) - Updated: ${p.updatedAt}`);
      });
    }
    
    // Check for recently updated products (last 10 minutes)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const recentlyUpdated = products.filter(p => p.updatedAt > tenMinutesAgo);
    
    console.log(`\n🕐 Recently updated (last 10 minutes): ${recentlyUpdated.length}`);
    if (recentlyUpdated.length > 0) {
      recentlyUpdated.forEach(p => {
        console.log(`  - ${p.name} (${p.id}) - Images: ${Array.isArray(p.images) ? p.images.length : 0} - Active: ${p.isActive}`);
      });
    }
    
    // Summary
    const activeProducts = products.filter(p => p.isActive);
    const activeWithImages = activeProducts.filter(p => 
      p.images && 
      Array.isArray(p.images) && 
      p.images.length > 0
    );
    
    console.log(`\n📈 Summary:`);
    console.log(`  - Total products: ${products.length}`);
    console.log(`  - Active products: ${activeProducts.length}`);
    console.log(`  - Active with images: ${activeWithImages.length}`);
    console.log(`  - Empty image products: ${emptyImageProducts.length}`);
    console.log(`  - Inactive products: ${inactiveProducts.length}`);
    
    if (emptyImageProducts.length > 0 || inactiveProducts.length > products.length * 0.5) {
      console.log(`\n🚨 ALERT: Potential issue detected!`);
      console.log(`   - ${emptyImageProducts.length} products have empty images`);
      console.log(`   - ${inactiveProducts.length} products are inactive`);
    } else {
      console.log(`\n✅ All products look healthy!`);
    }
    
  } catch (error) {
    console.error('❌ Error monitoring products:', error);
  } finally {
    await prisma.$disconnect();
  }
}

monitorProducts();
