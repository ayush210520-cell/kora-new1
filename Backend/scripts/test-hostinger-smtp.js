#!/usr/bin/env node

/**
 * Hostinger SMTP Test Script
 * Tests different SMTP configurations for Hostinger
 */

require('dotenv').config();
const nodemailer = require('nodemailer');

const configurations = [
  {
    name: 'Port 587 (TLS)',
    config: {
      host: 'smtp.hostinger.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      tls: {
        rejectUnauthorized: false
      },
      connectionTimeout: 30000,
      greetingTimeout: 15000,
      socketTimeout: 30000
    }
  },
  {
    name: 'Port 465 (SSL)',
    config: {
      host: 'smtp.hostinger.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      tls: {
        rejectUnauthorized: false
      },
      connectionTimeout: 30000,
      greetingTimeout: 15000,
      socketTimeout: 30000
    }
  },
  {
    name: 'Alternative Host (mail.yourdomain.com)',
    config: {
      host: 'mail.yourdomain.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      tls: {
        rejectUnauthorized: false
      },
      connectionTimeout: 30000,
      greetingTimeout: 15000,
      socketTimeout: 30000
    }
  },
  {
    name: 'Alternative Host with SSL',
    config: {
      host: 'mail.yourdomain.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      tls: {
        rejectUnauthorized: false
      },
      connectionTimeout: 30000,
      greetingTimeout: 15000,
      socketTimeout: 30000
    }
  }
];

async function testSMTPConfiguration(config) {
  console.log(`\n🧪 Testing: ${config.name}`);
  console.log(`Host: ${config.config.host}:${config.config.port}`);
  
  try {
    const transporter = nodemailer.createTransporter(config.config);
    
    // Test connection
    await transporter.verify();
    console.log('✅ Connection successful!');
    
    // Test sending email
    const testMail = {
      from: process.env.EMAIL_USER,
      to: 'test@example.com',
      subject: 'Test Email',
      text: 'This is a test email'
    };
    
    const info = await transporter.sendMail(testMail);
    console.log('✅ Email sending successful!');
    console.log(`Message ID: ${info.messageId}`);
    
    return { success: true, config: config.name };
    
  } catch (error) {
    console.log('❌ Failed:', error.message);
    return { success: false, config: config.name, error: error.message };
  }
}

async function testAllConfigurations() {
  console.log('🔍 Testing Hostinger SMTP Configurations...\n');
  
  const results = [];
  
  for (const config of configurations) {
    const result = await testSMTPConfiguration(config);
    results.push(result);
  }
  
  console.log('\n📊 Results Summary:');
  console.log('='.repeat(50));
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  if (successful.length > 0) {
    console.log('✅ Working Configurations:');
    successful.forEach(result => {
      console.log(`   - ${result.config}`);
    });
  }
  
  if (failed.length > 0) {
    console.log('\n❌ Failed Configurations:');
    failed.forEach(result => {
      console.log(`   - ${result.config}: ${result.error}`);
    });
  }
  
  if (successful.length === 0) {
    console.log('\n🚨 All configurations failed!');
    console.log('Possible issues:');
    console.log('1. Email credentials are wrong');
    console.log('2. Email account is not active');
    console.log('3. Firewall is blocking SMTP ports');
    console.log('4. Hostinger SMTP server is down');
  }
  
  console.log('\n' + '='.repeat(50));
}

// Run tests
testAllConfigurations().catch(console.error);


