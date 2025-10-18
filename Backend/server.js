require('dotenv').config();
const express = require('express');
const cors = require('cors');
const prisma = require('./src/config/db.js');

// Import routes
const authRoutes = require('./src/routes/auth.js');
const productRoutes = require('./src/routes/products.js');
const orderRoutes = require('./src/routes/orders.js');
const webhookRoutes = require('./src/routes/webhooks.js');
const addressRoutes = require('./src/routes/address.js');
const instagramRoutes = require('./src/routes/instagram.js');
const otpRoutes = require('./src/routes/otp.js');
const testEmailRoutes = require('./src/routes/testEmail.js');
const imageProxyRoutes = require('./src/routes/image-proxy.js');
const dynamicImageRoutes = require('./src/routes/dynamicImages.js');

const app = express();
const PORT = process.env.PORT || 3001;

app.get("/ping", (req, res) => {
  res.send("Server is live 🚀");
});

// Database health check
app.get("/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ 
      status: "healthy", 
      database: "connected",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database health check failed:', error);
    res.status(500).json({ 
      status: "unhealthy", 
      database: "disconnected",
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// CORS configuration
const corsOptions = {
  origin: [
    // Local development added vercel domains
    'http://localhost:3000', 
    'http://localhost:3001', 
    'http://localhost:3002',
    'http://localhost:3003',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:3002',
    'http://127.0.0.1:3003',
    // Production - Vercel frontend
    'https://kora-sigma.vercel.app',
    // Production - AWS Amplify
    'https://main.dzqci8qp7p2ot.amplifyapp.com',
    'https://main.d369hxt07r8wc4.amplifyapp.com',
    // Production - Custom domain
    'https://www.korakagazindia.com',
    'https://korakagazindia.com',
    // Production - Backend domain (for webhooks and callbacks)
    'https://server.korakagazindia.com',
    // Add any other production domains here
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Direct webhook routes (no /api prefix for Razorpay compatibility)
app.use("/", webhookRoutes);

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/instagram", instagramRoutes);
app.use("/api/otp", otpRoutes);
app.use("/api/test", testEmailRoutes);
app.use("/api/proxy", imageProxyRoutes);
app.use("/api/dynamic-images", dynamicImageRoutes);

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error:', error);

  if (error.type === 'entity.too.large') {
    return res.status(413).json({ error: 'File too large. Maximum size allowed is 20MB.' });
  }
  
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'File too large. Maximum size allowed is 20MB.' });
  }

  res.status(500).json({
    error: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { details: error.message })
  });
});

// Start server with resilient database connection handling
const server = app.listen(PORT, async () => {
  console.log('🚀 Starting server...');
  console.log(`📡 Port: ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/ping`);
  console.log(`💊 Database health: http://localhost:${PORT}/health`);
  
  // Test database connection (non-blocking)
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connected successfully');
    console.log('✅ Database query test successful');
  } catch (error) {
    console.error('⚠️  Database connection issue on startup:', error.message);
    console.log('⚠️  Server will continue running - database will auto-reconnect');
  }
});

// Prevent server from crashing on port already in use
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
    process.exit(1);
  } else {
    console.error('❌ Server error:', error);
  }
});

// Graceful shutdown with proper cleanup
const gracefulShutdown = async (signal) => {
  console.log(`\n🛑 ${signal} received. Shutting down gracefully...`);
  
  // Stop accepting new connections
  server.close(async () => {
    console.log('✅ HTTP server closed');
    
    try {
      await prisma.$disconnect();
      console.log('✅ Database disconnected');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error disconnecting database:', error);
      process.exit(1);
    }
  });
  
  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('⚠️  Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// Handle uncaught exceptions (log but keep server running)
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  console.error('Stack:', error.stack);
  // Don't exit - let PM2 handle restarts if needed
});

// Handle unhandled promise rejections (log but keep server running)
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise);
  console.error('Reason:', reason);
  // Don't exit - let PM2 handle restarts if needed
});

// Keep alive interval to prevent idle timeout
setInterval(() => {
  // This keeps the Node.js event loop active
  const memUsage = process.memoryUsage();
  if (memUsage.heapUsed > memUsage.heapTotal * 0.9) {
    console.warn('⚠️  Memory usage high:', Math.round(memUsage.heapUsed / 1024 / 1024), 'MB');
  }
}, 300000); // Every 5 minutes