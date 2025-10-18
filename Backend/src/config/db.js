const { PrismaClient } = require('@prisma/client');

// Enhanced database configuration with connection pooling and auto-reconnect
const prisma = new PrismaClient({
  log: ['info', 'warn', 'error'],
  errorFormat: 'pretty',
  datasources: {
    db: {
      url: process.env.DATABASE_URL + 
        '?connection_limit=10' + 
        '&pool_timeout=20' + 
        '&connect_timeout=60' + 
        '&socket_timeout=60' +
        '&sslmode=require'
    }
  }
});

// Connection state tracking
let isConnected = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

// Handle database connection errors
prisma.$on('error', (e) => {
  console.error('🔴 Prisma error:', e);
  isConnected = false;
});

// Enhanced connection function with retry logic
async function connectWithRetry(attempt = 1) {
  try {
    await prisma.$connect();
    isConnected = true;
    reconnectAttempts = 0;
    console.log('✅ Database connected successfully');
    return true;
  } catch (error) {
    console.error(`❌ Database connection attempt ${attempt} failed:`, error.message);
    isConnected = false;
    
    if (attempt < MAX_RECONNECT_ATTEMPTS) {
      const delay = Math.min(1000 * Math.pow(2, attempt), 30000); // Exponential backoff, max 30s
      console.log(`⏳ Retrying connection in ${delay/1000}s...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return connectWithRetry(attempt + 1);
    } else {
      console.error('💥 Max reconnection attempts reached. Database unavailable.');
      return false;
    }
  }
}

// Health check with auto-reconnect
async function healthCheck() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    if (!isConnected) {
      console.log('✅ Database connection restored');
      isConnected = true;
      reconnectAttempts = 0;
    }
    return true;
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    isConnected = false;
    
    // Attempt reconnection
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      reconnectAttempts++;
      console.log(`🔄 Attempting reconnection (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
      await connectWithRetry(1);
    }
    
    return false;
  }
}

// Run health checks every 30 seconds to prevent idle connection timeouts
setInterval(healthCheck, 30000);

// Initial connection with retry
connectWithRetry()
  .then((connected) => {
    if (!connected) {
      console.error('⚠️  Starting server with database unavailable - will retry in background');
    }
  });

// Graceful shutdown handling
const gracefulShutdown = async (signal) => {
  console.log(`\n🛑 ${signal} received. Closing database connections...`);
  try {
    await prisma.$disconnect();
    console.log('✅ Database disconnected cleanly');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('beforeExit', () => gracefulShutdown('beforeExit'));

// Export prisma client and connection status checker
module.exports = prisma;
module.exports.isConnected = () => isConnected;
module.exports.healthCheck = healthCheck;
