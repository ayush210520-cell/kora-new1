const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrate() {
  try {
    console.log('🔄 Starting database migration...');
    
    // Add qrPaymentLink column to orders table
    console.log('📝 Adding qrPaymentLink column to orders table...');
    
    // For PostgreSQL, we'll use a raw SQL query
    await prisma.$executeRaw`
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS "qrPaymentLink" TEXT;
    `;
    
    console.log('✅ Migration completed successfully!');
    console.log('🔍 The qrPaymentLink field has been added to the orders table.');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrate()
    .then(() => {
      console.log('🎉 Migration script completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { migrate };
