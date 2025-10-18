const express = require('express');
const router = express.Router();
const emailService = require('../services/emailService');
const emailQueue = require('../services/emailQueue');

// Test email endpoint
router.post('/test-welcome-email', async (req, res) => {
  try {
    console.log('🧪 Testing welcome email in production...');
    
    const testUser = {
      name: 'Test User',
      email: req.body.email || 'test@example.com'
    };
    
    console.log('Sending welcome email to:', testUser.email);
    
    const result = await emailService.sendWelcomeEmail(testUser);
    
    if (result && result.success) {
      console.log('✅ Welcome email sent successfully!');
      res.json({
        success: true,
        message: 'Welcome email sent successfully',
        messageId: result.messageId
      });
    } else {
      console.log('❌ Welcome email failed:', result ? result.error : 'Unknown error');
      res.status(500).json({
        success: false,
        error: result ? result.error : 'Unknown error'
      });
    }
    
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Check environment variables
router.get('/check-env', (req, res) => {
  const envVars = {
    EMAIL_USER: process.env.EMAIL_USER ? 'SET' : 'NOT SET',
    EMAIL_PASS: process.env.EMAIL_PASS ? 'SET' : 'NOT SET',
    STORE_URL: process.env.STORE_URL || 'NOT SET',
    SUPPORT_EMAIL: process.env.SUPPORT_EMAIL || 'NOT SET',
    STORE_NAME: process.env.STORE_NAME || 'NOT SET',
    SMTP_HOST: process.env.SMTP_HOST || 'NOT SET',
    SMTP_PORT: process.env.SMTP_PORT || 'NOT SET',
    NODE_ENV: process.env.NODE_ENV || 'NOT SET'
  };
  
  res.json({
    environment: 'production',
    variables: envVars
  });
});

// Check email queue status
router.get('/queue-status', (req, res) => {
  const status = emailQueue.getQueueStatus();
  res.json({
    queueStatus: status,
    timestamp: new Date().toISOString()
  });
});

// Process email queue manually
router.post('/process-queue', async (req, res) => {
  try {
    await emailQueue.processQueue();
    res.json({
      success: true,
      message: 'Email queue processing started',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
