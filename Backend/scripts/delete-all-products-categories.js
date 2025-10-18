const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function deleteAllProductsAndCategories() {
  try {
    console.log('🗑️ Starting deletion of all products and categories...\n');

    // First, delete all order items (since they reference products)
    console.log('📦 Deleting order items...');
    const deletedOrderItems = await prisma.orderItem.deleteMany({});
    console.log(`✅ Deleted ${deletedOrderItems.count} order items`);

    // Delete all orders (since they reference products through order items)
    console.log('📋 Deleting orders...');
    const deletedOrders = await prisma.order.deleteMany({});
    console.log(`✅ Deleted ${deletedOrders.count} orders`);

    // Delete all addresses (since they reference users through orders)
    console.log('🏠 Deleting addresses...');
    const deletedAddresses = await prisma.address.deleteMany({});
    console.log(`✅ Deleted ${deletedAddresses.count} addresses`);

    // Delete all products
    console.log('🛍️ Deleting products...');
    const deletedProducts = await prisma.product.deleteMany({});
    console.log(`✅ Deleted ${deletedProducts.count} products`);

    // Delete all categories
    console.log('📂 Deleting categories...');
    const deletedCategories = await prisma.category.deleteMany({});
    console.log(`✅ Deleted ${deletedCategories.count} categories`);

    // Keep users and admins intact
    console.log('\n👥 Users and admins preserved');

    // Final verification
    console.log('\n📊 Final verification...');
    const finalCounts = await Promise.all([
      prisma.admin.count(),
      prisma.user.count(),
      prisma.category.count(),
      prisma.product.count(),
      prisma.order.count(),
      prisma.orderItem.count(),
      prisma.address.count()
    ]);

    console.log('\n🎉 Deletion completed successfully!');
    console.log('📊 Database Summary:');
    console.log(`  - Admins: ${finalCounts[0]}`);
    console.log(`  - Users: ${finalCounts[1]}`);
    console.log(`  - Categories: ${finalCounts[2]}`);
    console.log(`  - Products: ${finalCounts[3]}`);
    console.log(`  - Orders: ${finalCounts[4]}`);
    console.log(`  - Order Items: ${finalCounts[5]}`);
    console.log(`  - Addresses: ${finalCounts[6]}`);

  } catch (error) {
    console.error('❌ Deletion failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteAllProductsAndCategories();

