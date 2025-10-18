const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function restoreAllData() {
  try {
    console.log('🚀 Starting complete data restoration...\n');

    // 1. Create admin user
    console.log('👤 Creating admin user...');
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

    // 2. Create test users
    console.log('\n👥 Creating test users...');
    const users = [
      {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        phone: '9876543210'
      },
      {
        email: 'customer@kora.com',
        password: 'password123',
        name: 'Customer User',
        phone: '9876543211'
      }
    ];

    for (const userData of users) {
      const userPassword = await bcrypt.hash(userData.password, 10);
      const user = await prisma.user.upsert({
        where: { email: userData.email },
        update: {},
        create: {
          email: userData.email,
          password: userPassword,
          name: userData.name,
          phone: userData.phone,
          isActive: true
        }
      });
      console.log('✅ User created:', user.email);
    }

    // 3. Create categories
    console.log('\n📂 Creating categories...');
    const categories = [
      { name: 'Kurti Sets', description: 'Beautiful kurti sets for every occasion' },
      { name: 'Short Kurtis', description: 'Elegant short kurtis for casual wear' },
      { name: 'Accessories', description: 'Traditional accessories and jewelry' },
      { name: 'Ethnic Wear', description: 'Traditional ethnic wear collection' },
      { name: 'Party Wear', description: 'Stylish party wear collection' }
    ];

    const createdCategories = [];
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
      createdCategories.push(category);
      console.log('✅ Category created:', category.name);
    }

    // 4. Create sample products
    console.log('\n🛍️ Creating sample products...');
    const products = [
      {
        name: 'Elegant Pink Kurti Set',
        description: 'Beautiful pink kurti set with matching dupatta. Perfect for festive occasions.',
        price: 1299,
        stock: 50,
        category: 'Kurti Sets',
        images: [
          { url: '/A.JPG', public_id: 'kurti-pink-1' },
          { url: '/B.JPG', public_id: 'kurti-pink-2' }
        ],
        sku: 'KK-PINK-001'
      },
      {
        name: 'Royal Blue Kurti Set',
        description: 'Stunning royal blue kurti set with intricate embroidery work.',
        price: 1599,
        stock: 30,
        category: 'Kurti Sets',
        images: [
          { url: '/C.JPG', public_id: 'kurti-blue-1' },
          { url: '/D.JPG', public_id: 'kurti-blue-2' }
        ],
        sku: 'KK-BLUE-001'
      },
      {
        name: 'Black Elegant Kurti',
        description: 'Classic black kurti perfect for formal occasions and office wear.',
        price: 999,
        stock: 40,
        category: 'Short Kurtis',
        images: [
          { url: '/BLACK.JPG', public_id: 'kurti-black-1' }
        ],
        sku: 'KK-BLACK-001'
      },
      {
        name: 'Yellow Sunshine Kurti',
        description: 'Bright yellow kurti that brings sunshine to your wardrobe.',
        price: 1199,
        stock: 25,
        category: 'Short Kurtis',
        images: [
          { url: '/YELLO.JPG', public_id: 'kurti-yellow-1' }
        ],
        sku: 'KK-YELLOW-001'
      },
      {
        name: 'Designer Kurti Set - SS2566',
        description: 'Exclusive designer kurti set with beautiful patterns and comfortable fit.',
        price: 1899,
        stock: 20,
        category: 'Ethnic Wear',
        images: [
          { url: '/SS2566.jpg', public_id: 'kurti-ss2566-1' },
          { url: '/SS25661.jpg', public_id: 'kurti-ss2566-2' }
        ],
        sku: 'KK-SS2566-001'
      },
      {
        name: 'Party Wear Kurti - SS3081',
        description: 'Gorgeous party wear kurti perfect for celebrations and special events.',
        price: 2199,
        stock: 15,
        category: 'Party Wear',
        images: [
          { url: '/SS3081.jpg', public_id: 'kurti-ss3081-1' },
          { url: '/SS30811.jpg', public_id: 'kurti-ss3081-2' }
        ],
        sku: 'KK-SS3081-001'
      },
      {
        name: 'Elegant Kurti - SS6960',
        description: 'Sophisticated kurti with modern design and traditional touch.',
        price: 1499,
        stock: 35,
        category: 'Ethnic Wear',
        images: [
          { url: '/SS6960.jpg', public_id: 'kurti-ss6960-1' }
        ],
        sku: 'KK-SS6960-001'
      },
      {
        name: 'Festive Kurti - SS7010',
        description: 'Beautiful festive kurti perfect for Diwali, Eid, and other celebrations.',
        price: 1799,
        stock: 28,
        category: 'Party Wear',
        images: [
          { url: '/SS7010.jpg', public_id: 'kurti-ss7010-1' }
        ],
        sku: 'KK-SS7010-001'
      },
      {
        name: 'Designer Collection - SS7015',
        description: 'Premium designer kurti with intricate work and premium fabric.',
        price: 2499,
        stock: 12,
        category: 'Ethnic Wear',
        images: [
          { url: '/SS7015.jpg', public_id: 'kurti-ss7015-1' }
        ],
        sku: 'KK-SS7015-001'
      },
      {
        name: 'Casual Wear Kurti - SS7041',
        description: 'Comfortable casual kurti perfect for daily wear and office.',
        price: 899,
        stock: 45,
        category: 'Short Kurtis',
        images: [
          { url: '/SS7041.jpg', public_id: 'kurti-ss7041-1' }
        ],
        sku: 'KK-SS7041-001'
      }
    ];

    for (const productData of products) {
      const category = createdCategories.find(c => c.name === productData.category);
      if (!category) {
        console.log(`❌ Category not found: ${productData.category}`);
        continue;
      }

      const product = await prisma.product.upsert({
        where: { sku: productData.sku },
        update: {},
        create: {
          name: productData.name,
          description: productData.description,
          price: productData.price,
          stock: productData.stock,
          images: productData.images,
          sku: productData.sku,
          categoryId: category.id,
          isActive: true
        }
      });
      console.log('✅ Product created:', product.name);
    }

    // 5. Create sample addresses for test users
    console.log('\n🏠 Creating sample addresses...');
    const testUser = await prisma.user.findUnique({ where: { email: 'test@example.com' } });
    if (testUser) {
      const address = await prisma.address.create({
        data: {
          name: 'Home Address',
          phone: '9876543210',
          address: '123 Main Street, Sector 15',
          city: 'New Delhi',
          state: 'Delhi',
          pincode: '110015',
          landmark: 'Near Metro Station',
          userId: testUser.id
        }
      });
      console.log('✅ Address created for test user');
    }

    // 6. Create sample orders (optional - for testing)
    console.log('\n📦 Creating sample orders...');
    const sampleProducts = await prisma.product.findMany({ take: 3 });
    const customerUser = await prisma.user.findUnique({ where: { email: 'customer@kora.com' } });
    
    if (customerUser && sampleProducts.length > 0) {
      // Create address for customer
      const customerAddress = await prisma.address.create({
        data: {
          name: 'Home Address',
          phone: '9876543211',
          address: '456 Park Avenue, Sector 22',
          city: 'Gurgaon',
          state: 'Haryana',
          pincode: '122001',
          landmark: 'Near Shopping Mall',
          userId: customerUser.id
        }
      });

      // Create sample order
      const order = await prisma.order.create({
        data: {
          orderNumber: 'KK00001',
          totalAmount: sampleProducts.reduce((sum, p) => sum + Number(p.price), 0),
          paymentMethod: 'COD',
          paymentStatus: 'COMPLETED',
          orderStatus: 'DELIVERED',
          userId: customerUser.id,
          addressId: customerAddress.id,
          notes: 'Sample order for testing'
        }
      });

      // Create order items
      for (const product of sampleProducts) {
        await prisma.orderItem.create({
          data: {
            orderId: order.id,
            productId: product.id,
            quantity: 1,
            price: product.price,
            size: 'M' // Sample size
          }
        });
      }
      console.log('✅ Sample order created:', order.orderNumber);
    }

    // 7. Final verification
    console.log('\n📊 Final verification...');
    const finalCounts = await Promise.all([
      prisma.admin.count(),
      prisma.user.count(),
      prisma.category.count(),
      prisma.product.count(),
      prisma.order.count(),
      prisma.orderItem.count()
    ]);

    console.log('\n🎉 Complete restoration successful!');
    console.log('📊 Database Summary:');
    console.log(`  - Admins: ${finalCounts[0]}`);
    console.log(`  - Users: ${finalCounts[1]}`);
    console.log(`  - Categories: ${finalCounts[2]}`);
    console.log(`  - Products: ${finalCounts[3]}`);
    console.log(`  - Orders: ${finalCounts[4]}`);
    console.log(`  - Order Items: ${finalCounts[5]}`);
    
    console.log('\n🔑 Login Credentials:');
    console.log('  Admin: admin@kora.com / admin123');
    console.log('  Test User: test@example.com / password123');
    console.log('  Customer: customer@kora.com / password123');

  } catch (error) {
    console.error('❌ Restoration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

restoreAllData();
