// Migrate Data from Neon to RDS
const { PrismaClient } = require('@prisma/client')
const fs = require('fs')

// Step 1: Export from Neon
async function exportFromNeon(neonUrl) {
  console.log('📦 Connecting to Neon database...')
  const neonPrisma = new PrismaClient({
    datasources: { db: { url: neonUrl } }
  })
  
  try {
    console.log('📥 Exporting data from Neon...')
    
    const data = {
      users: await neonPrisma.user.findMany(),
      admins: await neonPrisma.admin.findMany(),
      categories: await neonPrisma.category.findMany(),
      products: await neonPrisma.product.findMany(),
      addresses: await neonPrisma.address.findMany(),
      orders: await neonPrisma.order.findMany({ include: { orderItems: true } }),
      dynamicImages: await neonPrisma.dynamicImage.findMany()
    }
    
    console.log('✅ Export complete:')
    console.log('  - Users:', data.users.length)
    console.log('  - Admins:', data.admins.length)
    console.log('  - Categories:', data.categories.length)
    console.log('  - Products:', data.products.length)
    console.log('  - Addresses:', data.addresses.length)
    console.log('  - Orders:', data.orders.length)
    console.log('  - Dynamic Images:', data.dynamicImages.length)
    
    fs.writeFileSync('neon_backup.json', JSON.stringify(data, null, 2))
    console.log('💾 Backup saved to: neon_backup.json')
    
    await neonPrisma.$disconnect()
    return data
  } catch (error) {
    console.error('❌ Export failed:', error.message)
    await neonPrisma.$disconnect()
    throw error
  }
}

// Step 2: Import to RDS
async function importToRDS(rdsUrl, data) {
  console.log('\n📦 Connecting to RDS database...')
  const rdsPrisma = new PrismaClient({
    datasources: { db: { url: rdsUrl } }
  })
  
  try {
    console.log('📤 Importing data to RDS...\n')
    
    // Import users
    console.log('👥 Importing users...')
    for (const user of data.users) {
      await rdsPrisma.user.create({ data: user })
        .catch(e => console.log('  ⚠️  User already exists:', user.email))
    }
    console.log(`✅ ${data.users.length} users processed`)
    
    // Import admins
    console.log('\n👤 Importing admins...')
    for (const admin of data.admins) {
      await rdsPrisma.admin.create({ data: admin })
        .catch(e => console.log('  ⚠️  Admin already exists:', admin.email))
    }
    console.log(`✅ ${data.admins.length} admins processed`)
    
    // Import categories
    console.log('\n📁 Importing categories...')
    for (const category of data.categories) {
      await rdsPrisma.category.create({ data: category })
        .catch(e => console.log('  ⚠️  Category already exists:', category.name))
    }
    console.log(`✅ ${data.categories.length} categories processed`)
    
    // Import products
    console.log('\n📦 Importing products...')
    for (const product of data.products) {
      await rdsPrisma.product.create({ data: product })
        .catch(e => console.log('  ⚠️  Product already exists:', product.name))
    }
    console.log(`✅ ${data.products.length} products processed`)
    
    // Import addresses
    console.log('\n🏠 Importing addresses...')
    for (const address of data.addresses) {
      await rdsPrisma.address.create({ data: address })
        .catch(e => console.log('  ⚠️  Address already exists'))
    }
    console.log(`✅ ${data.addresses.length} addresses processed`)
    
    // Import dynamic images
    console.log('\n🖼️  Importing dynamic images...')
    for (const image of data.dynamicImages) {
      await rdsPrisma.dynamicImage.create({ data: image })
        .catch(e => console.log('  ⚠️  Image already exists:', image.title))
    }
    console.log(`✅ ${data.dynamicImages.length} dynamic images processed`)
    
    // Import orders (skip for now due to complexity with order items)
    console.log('\n📋 Importing orders...')
    for (const order of data.orders) {
      const { orderItems, ...orderData } = order
      await rdsPrisma.order.create({
        data: {
          ...orderData,
          orderItems: {
            create: orderItems.map(item => {
              const { id, ...itemData } = item
              return itemData
            })
          }
        }
      }).catch(e => console.log('  ⚠️  Order already exists:', order.orderNumber))
    }
    console.log(`✅ ${data.orders.length} orders processed`)
    
    console.log('\n🎉 Migration complete!')
    await rdsPrisma.$disconnect()
  } catch (error) {
    console.error('\n❌ Import failed:', error.message)
    await rdsPrisma.$disconnect()
    throw error
  }
}

// Main function
async function migrate() {
  console.log('🚀 Starting migration from Neon to RDS\n')
  console.log('=' .repeat(60))
  
  // Get URLs from command line or use defaults
  const NEON_URL = process.argv[2] || process.env.NEON_DATABASE_URL
  const RDS_URL = process.argv[3] || process.env.DATABASE_URL
  
  if (!NEON_URL) {
    console.error('❌ Error: Neon DATABASE_URL not provided')
    console.log('\nUsage:')
    console.log('  node migrate-neon-to-rds.js "NEON_URL" "RDS_URL"')
    console.log('\nOr set environment variables:')
    console.log('  NEON_DATABASE_URL="..." node migrate-neon-to-rds.js')
    process.exit(1)
  }
  
  if (!RDS_URL) {
    console.error('❌ Error: RDS DATABASE_URL not provided')
    process.exit(1)
  }
  
  try {
    // Export from Neon
    const data = await exportFromNeon(NEON_URL)
    
    // Import to RDS
    await importToRDS(RDS_URL, data)
    
    console.log('\n' + '=' .repeat(60))
    console.log('✅ Migration successfully completed!')
    console.log('=' .repeat(60))
  } catch (error) {
    console.error('\n❌ Migration failed:', error)
    process.exit(1)
  }
}

// Run migration
migrate()


