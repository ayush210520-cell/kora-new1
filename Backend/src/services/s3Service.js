const { 
  PutObjectCommand, 
  DeleteObjectCommand, 
  GetObjectCommand,
  ListObjectsV2Command,
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { s3Client, s3Config, getCDNUrl, optimizeImage } = require('../config/s3');
const crypto = require('crypto');
const path = require('path');

/**
 * Generate unique file name
 */
const generateFileName = (originalName, folder = '') => {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString('hex');
  const ext = path.extname(originalName);
  const baseName = path.basename(originalName, ext).replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
  const fileName = `${baseName}-${timestamp}-${randomString}${ext}`;
  
  return folder ? `${folder}/${fileName}` : fileName;
};

/**
 * Upload file to S3
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} originalName - Original file name
 * @param {string} mimeType - MIME type of file
 * @param {string} folder - Folder path in S3 (e.g., 'products', 'users/avatars')
 * @returns {Promise<{url: string, key: string}>}
 */
const uploadFile = async (fileBuffer, originalName, mimeType, folder = 'uploads') => {
  try {
    // ⚡ OPTIMIZE IMAGE before uploading - makes upload FASTER and fixes orientation!
    let finalBuffer = fileBuffer;
    let finalMimeType = mimeType;
    let finalExtension = path.extname(originalName);
    
    // Only optimize images (not other files)
    if (mimeType.startsWith('image/')) {
      const originalSize = (fileBuffer.length / 1024 / 1024).toFixed(2);
      console.log(`📤 Uploading image: ${originalName} (${originalSize} MB)`);
      console.log(`🎨 Optimizing and auto-rotating...`);
      
      // Optimize with Sharp - converts to WebP, compresses, and AUTO-ROTATES
      finalBuffer = await optimizeImage(fileBuffer, {
        maxWidth: 1920,
        maxHeight: 2880,
        quality: 85,
      });
      
      finalMimeType = 'image/webp'; // Update MIME type
      finalExtension = '.webp'; // Update extension
    }
    
    // Generate filename with correct extension
    const baseNameWithoutExt = path.basename(originalName, path.extname(originalName));
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const baseName = baseNameWithoutExt.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    const fileName = `${baseName}-${timestamp}-${randomString}${finalExtension}`;
    const key = folder ? `${folder}/${fileName}` : fileName;
    
    const command = new PutObjectCommand({
      Bucket: s3Config.bucket,
      Key: key,
      Body: finalBuffer,
      ContentType: finalMimeType,
      // Cache control for better performance
      CacheControl: 'max-age=31536000', // 1 year
      // Metadata
      Metadata: {
        'original-name': originalName,
        'upload-date': new Date().toISOString(),
        'optimized': mimeType.startsWith('image/') ? 'true' : 'false',
      },
    });

    await s3Client.send(command);
    
    const url = getCDNUrl(key);
    
    console.log(`✅ File uploaded to S3: ${key}`);
    
    return {
      url,
      key,
      bucket: s3Config.bucket,
      region: s3Config.region,
    };
  } catch (error) {
    console.error('❌ S3 upload error:', error);
    throw new Error(`Failed to upload file to S3: ${error.message}`);
  }
};

/**
 * Upload multiple files to S3
 * @param {Array<{buffer: Buffer, originalName: string, mimeType: string}>} files
 * @param {string} folder
 * @returns {Promise<Array<{url: string, key: string}>>}
 */
const uploadMultipleFiles = async (files, folder = 'uploads') => {
  try {
    const uploadPromises = files.map(file => 
      uploadFile(file.buffer, file.originalName, file.mimeType, folder)
    );
    
    const results = await Promise.all(uploadPromises);
    console.log(`✅ ${results.length} files uploaded to S3`);
    
    return results;
  } catch (error) {
    console.error('❌ S3 multiple upload error:', error);
    throw new Error(`Failed to upload files to S3: ${error.message}`);
  }
};

/**
 * Delete file from S3
 * @param {string} key - S3 object key
 * @returns {Promise<boolean>}
 */
const deleteFile = async (key) => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: s3Config.bucket,
      Key: key,
    });

    await s3Client.send(command);
    console.log(`✅ File deleted from S3: ${key}`);
    
    return true;
  } catch (error) {
    console.error('❌ S3 delete error:', error);
    throw new Error(`Failed to delete file from S3: ${error.message}`);
  }
};

/**
 * Delete multiple files from S3
 * @param {Array<string>} keys - Array of S3 object keys
 * @returns {Promise<boolean>}
 */
const deleteMultipleFiles = async (keys) => {
  try {
    const deletePromises = keys.map(key => deleteFile(key));
    await Promise.all(deletePromises);
    
    console.log(`✅ ${keys.length} files deleted from S3`);
    return true;
  } catch (error) {
    console.error('❌ S3 multiple delete error:', error);
    throw new Error(`Failed to delete files from S3: ${error.message}`);
  }
};

/**
 * Get presigned URL for temporary access
 * @param {string} key - S3 object key
 * @param {number} expiresIn - Expiration time in seconds (default: 1 hour)
 * @returns {Promise<string>}
 */
const getPresignedUrl = async (key, expiresIn = 3600) => {
  try {
    const command = new GetObjectCommand({
      Bucket: s3Config.bucket,
      Key: key,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn });
    console.log(`✅ Presigned URL generated for: ${key}`);
    
    return url;
  } catch (error) {
    console.error('❌ S3 presigned URL error:', error);
    throw new Error(`Failed to generate presigned URL: ${error.message}`);
  }
};

/**
 * List files in a folder
 * @param {string} prefix - Folder prefix (e.g., 'products/', 'users/avatars/')
 * @param {number} maxKeys - Maximum number of keys to return
 * @returns {Promise<Array<{key: string, size: number, lastModified: Date}>>}
 */
const listFiles = async (prefix = '', maxKeys = 1000) => {
  try {
    const command = new ListObjectsV2Command({
      Bucket: s3Config.bucket,
      Prefix: prefix,
      MaxKeys: maxKeys,
    });

    const response = await s3Client.send(command);
    
    const files = (response.Contents || []).map(item => ({
      key: item.Key,
      size: item.Size,
      lastModified: item.LastModified,
      url: getCDNUrl(item.Key),
    }));
    
    console.log(`✅ Listed ${files.length} files from S3 with prefix: ${prefix}`);
    
    return files;
  } catch (error) {
    console.error('❌ S3 list error:', error);
    throw new Error(`Failed to list files from S3: ${error.message}`);
  }
};

/**
 * Extract S3 key from URL
 * @param {string} url - Full S3 or CloudFront URL
 * @returns {string|null} - S3 key or null if not a valid S3/CloudFront URL
 */
const extractKeyFromUrl = (url) => {
  try {
    // Handle CloudFront URLs
    if (s3Config.cloudFrontDomain && url.includes(s3Config.cloudFrontDomain)) {
      const urlObj = new URL(url);
      return urlObj.pathname.substring(1); // Remove leading slash
    }
    
    // Handle S3 URLs
    if (url.includes('.s3.') && url.includes('.amazonaws.com')) {
      const urlObj = new URL(url);
      return urlObj.pathname.substring(1); // Remove leading slash
    }
    
    return null;
  } catch (error) {
    console.error('❌ Failed to extract key from URL:', error);
    return null;
  }
};

module.exports = {
  uploadFile,
  uploadMultipleFiles,
  deleteFile,
  deleteMultipleFiles,
  getPresignedUrl,
  listFiles,
  extractKeyFromUrl,
  getCDNUrl,
};

