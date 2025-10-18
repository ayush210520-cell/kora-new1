#!/usr/bin/env node

/**
 * Email Service Test Script
 * This script tests if the email service is working properly
 */

require('dotenv').config();
const emailService = require('../src/services/emailService');

async function testEmailService() {
  console.log('🧪 Testing Email Service...\n');

  // Check environment variables
  console.log('📋 Environment Variables Check:');
  const requiredVars = ['EMAIL_USER', 'EMAIL_PASS', 'STORE_URL', 'SUPPORT_EMAIL', 'STORE_NAME'];
  
  let allSet = true;
  requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (value && value.trim() !== '') {
      console.log(`✅ ${varName}: ${value.substring(0, 30)}${value.length > 30 ? '...' : ''}`);
    } else {
      console.log(`❌ ${varName}: NOT SET`);
      allSet = false;
    }
  });

  if (!allSet) {
    console.log('\n❌ Some required environment variables are missing!');
    console.log('Please set all required variables before testing email service.');
    process.exit(1);
  }

  console.log('\n📧 Testing Email Service...');

  // Test data
  const testUser = {
    name: 'Test User',
    email: process.env.TEST_EMAIL || 'test@example.com'
  };

  try {
    console.log('Sending test welcome email...');
    const result = await emailService.sendWelcomeEmail(testUser);
    
    if (result.success) {
      console.log('✅ Welcome email sent successfully!');
      console.log(`📧 Message ID: ${result.messageId}`);
    } else {
      console.log('❌ Failed to send welcome email');
      console.log(`Error: ${result.error}`);
    }
  } catch (error) {
    console.log('❌ Error testing email service:');
    console.log(error.message);
  }

  console.log('\n🔍 Email Service Test Complete');
}

// Run the test
testEmailService().catch(console.error);
