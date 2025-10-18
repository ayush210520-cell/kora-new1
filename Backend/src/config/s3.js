const { S3Client } = require('@aws-sdk/client-s3');
const sharp = require('sharp');

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// S3 configuration
const s3Config = {
  bucket: process.env.AWS_S3_BUCKET || 'kora-static-assets',
  region: process.env.AWS_REGION || 'ap-south-1',
  cloudFrontDomain: process.env.CLOUDFRONT_DOMAIN || '',
};

// Check if S3 is configured
const isS3Configured = () => {
  return !!(
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.AWS_S3_BUCKET
  );
};

// Get CDN URL or S3 URL
const getCDNUrl = (key) => {
  if (s3Config.cloudFrontDomain) {
    return `https://${s3Config.cloudFrontDomain}/${key}`;
  }
  return `https://${s3Config.bucket}.s3.${s3Config.region}.amazonaws.com/${key}`;
};

// Optimize image with auto-rotation fix - makes S3 fast AND fixes horizontal images!
const optimizeImage = async (buffer, options = {}) => {
  try {
    const {
      maxWidth = 1920,
      maxHeight = 2880,
      quality = 85,
    } = options;

    console.log('🎨 Optimizing image with Sharp...');
    
    const optimizedBuffer = await sharp(buffer)
      .rotate() // ✅ AUTO-ROTATE based on EXIF - fixes horizontal images!
      .resize(maxWidth, maxHeight, {
        fit: 'inside', // Maintain aspect ratio
        withoutEnlargement: true // Don't upscale small images
      })
      .webp({ 
        quality: quality,
        effort: 6 // Maximum compression effort
      })
      .toBuffer();

    const originalSize = (buffer.length / 1024 / 1024).toFixed(2);
    const optimizedSize = (optimizedBuffer.length / 1024 / 1024).toFixed(2);
    const reduction = ((1 - optimizedBuffer.length / buffer.length) * 100).toFixed(1);

    console.log(`✅ Image optimized: ${originalSize}MB → ${optimizedSize}MB (${reduction}% reduction)`);
    console.log(`✅ Auto-rotated based on EXIF orientation`);

    return optimizedBuffer;
  } catch (error) {
    console.error('❌ Image optimization failed:', error);
    // Return original buffer if optimization fails
    return buffer;
  }
};

module.exports = {
  s3Client,
  s3Config,
  isS3Configured,
  getCDNUrl,
  optimizeImage,
};

