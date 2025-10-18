// Create Admin User in RDS Database
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createAdmin() {
  try {
    console.log('🔧 Creating admin user...')
    
    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 10)
    
    // Create admin
    const admin = await prisma.admin.create({
      data: {
        email: 'admin@kora.com',
        password: hashedPassword,
        name: 'Admin',
        role: 'admin',
        isActive: true
      }
    })
    
    console.log('✅ Admin created successfully!')
    console.log('📧 Email:', admin.email)
    console.log('🔑 Password: admin123')
    console.log('👤 Name:', admin.name)
    console.log('🆔 ID:', admin.id)
    
  } catch (error) {
    if (error.code === 'P2002') {
      console.log('⚠️  Admin already exists with this email!')
      
      // Update password instead
      const hashedPassword = await bcrypt.hash('admin123', 10)
      const updated = await prisma.admin.update({
        where: { email: 'admin@kora.com' },
        data: { password: hashedPassword }
      })
      console.log('✅ Password updated for existing admin!')
      console.log('📧 Email:', updated.email)
      console.log('🔑 New Password: admin123')
    } else {
      console.error('❌ Error:', error.message)
    }
  } finally {
    await prisma.$disconnect()
  }
}

createAdmin()

