const cloudinary = require('../config/cloudinary');

/**
 * Cloudinary service for image upload and management
 */

/**
 * Upload image to Cloudinary
 * @param {Buffer} fileBuffer - Image buffer
 * @param {string} folder - Folder name in Cloudinary
 * @returns {Promise<{url: string, public_id: string}>}
 */
const uploadImage = async (fileBuffer, folder = 'ecommerce-products') => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        resource_type: 'image',
        folder: folder,
      },
      (err, result) => {
        if (err) {
          console.error('❌ Cloudinary upload error:', err);
          return reject(err);
        }
        console.log(`✅ Image uploaded to Cloudinary: ${result.public_id}`);
        return resolve({
          url: result.secure_url,
          public_id: result.public_id,
        });
      }
    ).end(fileBuffer);
  });
};

/**
 * Delete image from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<boolean>}
 */
const deleteImage = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
    console.log(`✅ Image deleted from Cloudinary: ${publicId}`);
    return true;
  } catch (err) {
    console.error('❌ Cloudinary delete error:', err.message);
    throw new Error(`Failed to delete from Cloudinary: ${err.message}`);
  }
};

/**
 * Upload multiple images to Cloudinary
 * @param {Array<Buffer>} fileBuffers - Array of image buffers
 * @param {string} folder - Folder name in Cloudinary
 * @returns {Promise<Array<{url: string, public_id: string}>>}
 */
const uploadMultipleImages = async (fileBuffers, folder = 'ecommerce-products') => {
  const uploadPromises = fileBuffers.map(buffer => uploadImage(buffer, folder));
  return Promise.all(uploadPromises);
};

/**
 * Delete multiple images from Cloudinary
 * @param {Array<string>} publicIds - Array of Cloudinary public IDs
 * @returns {Promise<boolean>}
 */
const deleteMultipleImages = async (publicIds) => {
  const deletePromises = publicIds.map(id => deleteImage(id));
  await Promise.all(deletePromises);
  return true;
};

module.exports = {
  uploadImage,
  deleteImage,
  uploadMultipleImages,
  deleteMultipleImages,
};








