require('dotenv').config();
const fs = require('fs');
const path = require('path');
const s3Service = require('../src/services/s3Service');
const { isS3Configured } = require('../src/config/s3');

/**
 * Test script to verify S3 configuration and upload
 */

async function testS3Upload() {
  console.log('🧪 Testing S3 Configuration...\n');

  // Check if S3 is configured
  if (!isS3Configured()) {
    console.error('❌ S3 is not configured!');
    console.log('\n📋 Required environment variables:');
    console.log('   - AWS_ACCESS_KEY_ID');
    console.log('   - AWS_SECRET_ACCESS_KEY');
    console.log('   - AWS_S3_BUCKET');
    console.log('   - AWS_REGION (optional, defaults to ap-south-1)');
    console.log('   - CLOUDFRONT_DOMAIN (optional)');
    process.exit(1);
  }

  console.log('✅ S3 Configuration found\n');

  // Display configuration (without secrets)
  console.log('📋 S3 Configuration:');
  console.log(`   Bucket: ${process.env.AWS_S3_BUCKET}`);
  console.log(`   Region: ${process.env.AWS_REGION || 'ap-south-1'}`);
  console.log(`   Access Key: ${process.env.AWS_ACCESS_KEY_ID?.substring(0, 8)}...`);
  console.log(`   CloudFront: ${process.env.CLOUDFRONT_DOMAIN || 'Not configured'}`);
  console.log('');

  try {
    // Create a test file
    console.log('📝 Creating test file...');
    const testContent = `Test upload at ${new Date().toISOString()}`;
    const testBuffer = Buffer.from(testContent, 'utf-8');
    const testFileName = 'test-upload.txt';

    // Upload test file
    console.log('⬆️  Uploading test file to S3...\n');
    const result = await s3Service.uploadFile(
      testBuffer,
      testFileName,
      'text/plain',
      'test'
    );

    console.log('✅ Upload successful!\n');
    console.log('📊 Upload Result:');
    console.log(`   URL: ${result.url}`);
    console.log(`   Key: ${result.key}`);
    console.log(`   Bucket: ${result.bucket}`);
    console.log(`   Region: ${result.region}`);
    console.log('');

    // Test listing files
    console.log('📂 Listing files in "test/" folder...\n');
    const files = await s3Service.listFiles('test/');
    
    console.log(`✅ Found ${files.length} file(s):\n`);
    files.slice(0, 5).forEach((file, index) => {
      console.log(`   ${index + 1}. ${file.key}`);
      console.log(`      Size: ${(file.size / 1024).toFixed(2)} KB`);
      console.log(`      URL: ${file.url}`);
      console.log('');
    });

    if (files.length > 5) {
      console.log(`   ... and ${files.length - 5} more file(s)\n`);
    }

    // Test presigned URL
    console.log('🔐 Generating presigned URL...\n');
    const presignedUrl = await s3Service.getPresignedUrl(result.key, 300); // 5 minutes
    console.log(`✅ Presigned URL (valid for 5 minutes):`);
    console.log(`   ${presignedUrl}\n`);

    // Test URL extraction
    console.log('🔍 Testing URL key extraction...\n');
    const extractedKey = s3Service.extractKeyFromUrl(result.url);
    console.log(`   Original key: ${result.key}`);
    console.log(`   Extracted key: ${extractedKey}`);
    console.log(`   Match: ${extractedKey === result.key ? '✅' : '❌'}\n`);

    // Optional: Clean up test file
    const shouldDelete = process.argv.includes('--cleanup');
    if (shouldDelete) {
      console.log('🗑️  Cleaning up test file...\n');
      await s3Service.deleteFile(result.key);
      console.log('✅ Test file deleted\n');
    } else {
      console.log('ℹ️  Test file kept (use --cleanup flag to delete)\n');
    }

    console.log('🎉 All S3 tests passed!\n');
    console.log('📋 Next steps:');
    console.log('   1. Test the URL in your browser');
    console.log('   2. If using CloudFront, wait 5-15 minutes for distribution');
    console.log('   3. Update your application to use S3 for uploads');
    console.log('   4. Run: node scripts/test-s3-upload.js --cleanup (to clean up)');

  } catch (error) {
    console.error('❌ S3 Test failed:', error.message);
    console.error('\n🔍 Debug info:', error);
    process.exit(1);
  }
}

// Run the test
testS3Upload();

