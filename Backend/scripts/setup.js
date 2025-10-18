const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🚀 Starting setup...');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.admin.upsert({
      where: { email: 'admin@kora.com' },
      update: {},
      create: {
        email: 'admin@kora.com',
        password: adminPassword,
        name: 'Admin User',
        role: 'admin',
        isActive: true
      }
    });
    console.log('✅ Admin user created:', admin.email);

    // Create test user
    const userPassword = await bcrypt.hash('password123', 10);
    const user = await prisma.user.upsert({
      where: { email: 'test@example.com' },
      update: {},
      create: {
        email: 'test@example.com',
        password: userPassword,
        name: 'Test User',
        phone: '9876543210',
        isActive: true
      }
    });
    console.log('✅ Test user created:', user.email);

    // Create sample categories
    const categories = [
      { name: 'Kurti Sets', description: 'Beautiful kurti sets' },
      { name: 'Short Kurtis', description: 'Elegant short kurtis' },
      { name: 'Accessories', description: 'Traditional accessories' }
    ];

    for (const categoryData of categories) {
      const category = await prisma.category.upsert({
        where: { name: categoryData.name },
        update: {},
        create: {
          name: categoryData.name,
          description: categoryData.description,
          isActive: true
        }
      });
      console.log('✅ Category created:', category.name);
    }

    console.log('🎉 Setup completed successfully!');
    console.log('📧 Admin login: admin@kora.com');
    console.log('🔑 Admin password: admin123');
    console.log('📧 Test user login: test@example.com');
    console.log('🔑 Test user password: password123');

  } catch (error) {
    console.error('❌ Setup failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
