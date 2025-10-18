#!/usr/bin/env node

/**
 * Production Email Debug Script
 * This script helps debug email issues in production
 */

require('dotenv').config();

console.log('🔍 Production Email Debug Script\n');

// Check environment
console.log('🌍 Environment Check:');
console.log(`NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
console.log(`PORT: ${process.env.PORT || 'not set'}`);
console.log('');

// Check email-related environment variables
console.log('📧 Email Environment Variables:');
const emailVars = [
  'EMAIL_USER',
  'EMAIL_PASS', 
  'SMTP_HOST',
  'SMTP_PORT',
  'STORE_URL',
  'SUPPORT_EMAIL',
  'STORE_NAME'
];

emailVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    // Mask sensitive data
    if (varName === 'EMAIL_PASS') {
      console.log(`✅ ${varName}: ${'*'.repeat(value.length)}`);
    } else {
      console.log(`✅ ${varName}: ${value}`);
    }
  } else {
    console.log(`❌ ${varName}: NOT SET`);
  }
});

console.log('');

// Test email service
async function testEmailService() {
  try {
    console.log('🧪 Testing Email Service...');
    
    const emailService = require('../src/services/emailService');
    
    // Test with dummy data
    const testUser = {
      name: 'Test User',
      email: 'test@example.com'
    };
    
    console.log('Sending test welcome email...');
    const result = await emailService.sendWelcomeEmail(testUser);
    
    if (result && result.success) {
      console.log('✅ Email service is working!');
      console.log(`📧 Message ID: ${result.messageId}`);
    } else {
      console.log('❌ Email service failed');
      console.log(`Error: ${result ? result.error : 'Unknown error'}`);
    }
    
  } catch (error) {
    console.log('❌ Email service error:');
    console.log(error.message);
    console.log('');
    console.log('Stack trace:');
    console.log(error.stack);
  }
}

// Test SMTP connection
async function testSMTPConnection() {
  try {
    console.log('🔌 Testing SMTP Connection...');
    
    const nodemailer = require('nodemailer');
    
    const transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'smtp.hostinger.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: parseInt(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    });
    
    await transporter.verify();
    console.log('✅ SMTP connection successful!');
    
  } catch (error) {
    console.log('❌ SMTP connection failed:');
    console.log(error.message);
    
    if (error.message.includes('authentication failed')) {
      console.log('');
      console.log('🔧 Authentication Error Solutions:');
      console.log('1. Check EMAIL_USER and EMAIL_PASS are correct');
      console.log('2. Verify email account exists in Hostinger');
      console.log('3. Try different SMTP port (587 or 465)');
      console.log('4. Check if email account password is correct');
    }
  }
}

// Main debug function
async function debugProductionEmail() {
  console.log('='.repeat(50));
  console.log('PRODUCTION EMAIL DEBUG REPORT');
  console.log('='.repeat(50));
  console.log('');
  
  await testSMTPConnection();
  console.log('');
  await testEmailService();
  
  console.log('');
  console.log('='.repeat(50));
  console.log('DEBUG COMPLETE');
  console.log('='.repeat(50));
}

// Run debug
debugProductionEmail().catch(console.error);
