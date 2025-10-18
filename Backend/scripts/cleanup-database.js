const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupDatabase() {
  try {
    console.log('🧹 Starting database cleanup...');
    console.log('⚠️  This will delete all data EXCEPT admin accounts');
    console.log('');

    // Step 1: Delete OrderItems first (child of Order)
    const deletedOrderItems = await prisma.orderItem.deleteMany({});
    console.log(`✅ Deleted ${deletedOrderItems.count} order items`);

    // Step 2: Delete Orders
    const deletedOrders = await prisma.order.deleteMany({});
    console.log(`✅ Deleted ${deletedOrders.count} orders`);

    // Step 3: Delete Addresses
    const deletedAddresses = await prisma.address.deleteMany({});
    console.log(`✅ Deleted ${deletedAddresses.count} addresses`);

    // Step 4: Delete Products (child of Category)
    const deletedProducts = await prisma.product.deleteMany({});
    console.log(`✅ Deleted ${deletedProducts.count} products`);

    // Step 5: Delete Categories
    const deletedCategories = await prisma.category.deleteMany({});
    console.log(`✅ Deleted ${deletedCategories.count} categories`);

    // Step 6: Delete Users (NOT Admins)
    const deletedUsers = await prisma.user.deleteMany({});
    console.log(`✅ Deleted ${deletedUsers.count} users`);

    // Check remaining admins
    const remainingAdmins = await prisma.admin.count();
    console.log(`✅ Preserved ${remainingAdmins} admin account(s)`);

    console.log('');
    console.log('🎉 Database cleanup completed successfully!');
    console.log('📊 Summary:');
    console.log(`   - Order Items: ${deletedOrderItems.count} deleted`);
    console.log(`   - Orders: ${deletedOrders.count} deleted`);
    console.log(`   - Addresses: ${deletedAddresses.count} deleted`);
    console.log(`   - Products: ${deletedProducts.count} deleted`);
    console.log(`   - Categories: ${deletedCategories.count} deleted`);
    console.log(`   - Users: ${deletedUsers.count} deleted`);
    console.log(`   - Admins: ${remainingAdmins} preserved ✅`);
    console.log('');

  } catch (error) {
    console.error('❌ Database cleanup failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    console.log('🔌 Database connection closed');
  }
}

// Execute the cleanup
cleanupDatabase()
  .then(() => {
    console.log('✨ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });

