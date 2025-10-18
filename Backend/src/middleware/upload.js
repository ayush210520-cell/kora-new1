// file: utils/fileUploader.js
const multer = require('multer');
const cloudinary = require('../config/cloudinary');

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed!'), false);
  },
});

const uploadToCloudinary = async (fileBuffer) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        resource_type: 'image',
        folder: 'ecommerce-products',
      },
      (err, result) => {
        if (err) return reject(err);
        return resolve({
          url: result.secure_url,
          public_id: result.public_id,
        });
      }
    ).end(fileBuffer);
  });
};

const deleteFromCloudinary = async (public_id) => {
  try {
    await cloudinary.uploader.destroy(public_id);
  } catch (err) {
    console.error('Failed to delete from Cloudinary:', err.message);
  }
};

module.exports = {
  upload,
  uploadToCloudinary,
  deleteFromCloudinary,
};
