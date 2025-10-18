const cloudinaryService = require('./cloudinaryService');
const s3Service = require('./s3Service');
const { isS3Configured } = require('../config/s3');

/**
 * Unified upload service that can use either Cloudinary or S3
 * Priority: S3 (if configured) > Cloudinary (fallback)
 */

const UPLOAD_PROVIDER = isS3Configured() ? 'S3' : 'CLOUDINARY';

console.log(`📦 Upload provider: ${UPLOAD_PROVIDER}`);

/**
 * Upload single file
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} originalName - Original file name
 * @param {string} mimeType - MIME type
 * @param {string} folder - Folder/category for organization
 * @returns {Promise<{url: string, publicId: string, provider: string}>}
 */
const uploadFile = async (fileBuffer, originalName, mimeType, folder = 'uploads') => {
  try {
    if (UPLOAD_PROVIDER === 'S3') {
      const result = await s3Service.uploadFile(fileBuffer, originalName, mimeType, folder);
      return {
        url: result.url,
        publicId: result.key,
        provider: 'S3',
        bucket: result.bucket,
        region: result.region,
      };
    } else {
      // Fallback to Cloudinary
      const result = await cloudinaryService.uploadImage(fileBuffer, folder);
      return {
        url: result.url,
        publicId: result.public_id,
        provider: 'CLOUDINARY',
      };
    }
  } catch (error) {
    console.error('❌ Upload error:', error);
    throw error;
  }
};

/**
 * Upload multiple files
 * @param {Array<{buffer: Buffer, originalName: string, mimeType: string}>} files
 * @param {string} folder
 * @returns {Promise<Array<{url: string, publicId: string, provider: string}>>}
 */
const uploadMultipleFiles = async (files, folder = 'uploads') => {
  try {
    if (UPLOAD_PROVIDER === 'S3') {
      const results = await s3Service.uploadMultipleFiles(files, folder);
      return results.map(result => ({
        url: result.url,
        publicId: result.key,
        provider: 'S3',
        bucket: result.bucket,
        region: result.region,
      }));
    } else {
      // Fallback to Cloudinary
      const uploadPromises = files.map(file => 
        cloudinaryService.uploadImage(file.buffer, folder)
      );
      const results = await Promise.all(uploadPromises);
      return results.map(result => ({
        url: result.url,
        publicId: result.public_id,
        provider: 'CLOUDINARY',
      }));
    }
  } catch (error) {
    console.error('❌ Multiple upload error:', error);
    throw error;
  }
};

/**
 * Delete file
 * @param {string} publicId - Public ID or S3 key
 * @param {string} provider - Provider ('S3' or 'CLOUDINARY')
 * @returns {Promise<boolean>}
 */
const deleteFile = async (publicId, provider = UPLOAD_PROVIDER) => {
  try {
    if (provider === 'S3') {
      return await s3Service.deleteFile(publicId);
    } else {
      return await cloudinaryService.deleteImage(publicId);
    }
  } catch (error) {
    console.error('❌ Delete error:', error);
    throw error;
  }
};

/**
 * Delete multiple files
 * @param {Array<{publicId: string, provider: string}>} files
 * @returns {Promise<boolean>}
 */
const deleteMultipleFiles = async (files) => {
  try {
    // Group files by provider
    const s3Files = files.filter(f => f.provider === 'S3').map(f => f.publicId);
    const cloudinaryFiles = files.filter(f => f.provider === 'CLOUDINARY').map(f => f.publicId);
    
    const promises = [];
    
    if (s3Files.length > 0) {
      promises.push(s3Service.deleteMultipleFiles(s3Files));
    }
    
    if (cloudinaryFiles.length > 0) {
      promises.push(
        Promise.all(cloudinaryFiles.map(id => cloudinaryService.deleteImage(id)))
      );
    }
    
    await Promise.all(promises);
    return true;
  } catch (error) {
    console.error('❌ Multiple delete error:', error);
    throw error;
  }
};

/**
 * Extract public ID from URL
 * @param {string} url - Image URL
 * @returns {string|null} - Public ID/Key or null
 */
const extractPublicId = (url) => {
  // Try S3 first
  const s3Key = s3Service.extractKeyFromUrl(url);
  if (s3Key) {
    return s3Key;
  }
  
  // Try Cloudinary
  if (url.includes('cloudinary.com')) {
    const parts = url.split('/');
    const uploadIndex = parts.indexOf('upload');
    if (uploadIndex !== -1 && uploadIndex < parts.length - 1) {
      // Get everything after /upload/ but remove file extension
      const pathAfterUpload = parts.slice(uploadIndex + 2).join('/');
      return pathAfterUpload.replace(/\.[^/.]+$/, '');
    }
  }
  
  return null;
};

/**
 * Get provider from URL
 * @param {string} url - Image URL
 * @returns {string} - 'S3', 'CLOUDINARY', or 'UNKNOWN'
 */
const getProviderFromUrl = (url) => {
  if (url.includes('cloudfront.net') || url.includes('.s3.') && url.includes('.amazonaws.com')) {
    return 'S3';
  }
  if (url.includes('cloudinary.com')) {
    return 'CLOUDINARY';
  }
  return 'UNKNOWN';
};

module.exports = {
  uploadFile,
  uploadMultipleFiles,
  deleteFile,
  deleteMultipleFiles,
  extractPublicId,
  getProviderFromUrl,
  UPLOAD_PROVIDER,
};

