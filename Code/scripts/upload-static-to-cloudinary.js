const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'diamvptiv',
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Static images to upload (from gallery)
const staticImages = [
  'SS2566.jpg',
  'SS3081.jpg', 
  'BLACK.JPG',
  'gulaab2.png',
  'morni3.png',
  'YELLO.JPG',
  'SS7015.jpg',
  'SS7010.jpg',
  'SS7041.jpg',
  'SS6960.jpg'
];

async function uploadStaticImages() {
  console.log('🚀 Starting upload of static images to Cloudinary...\n');
  
  const uploadResults = [];
  
  for (const imageName of staticImages) {
    try {
      const imagePath = path.join(__dirname, '../public', imageName);
      
      if (!fs.existsSync(imagePath)) {
        console.log(`❌ File not found: ${imageName}`);
        continue;
      }
      
      console.log(`📤 Uploading: ${imageName}`);
      
      const result = await cloudinary.uploader.upload(imagePath, {
        folder: 'ecommerce-static',
        public_id: imageName.replace(/\.[^/.]+$/, ""), // Remove extension
        resource_type: 'auto',
        quality: 'auto',
        fetch_format: 'auto'
      });
      
      uploadResults.push({
        original: imageName,
        url: result.secure_url,
        public_id: result.public_id
      });
      
      console.log(`✅ Uploaded: ${imageName} -> ${result.secure_url}`);
      
    } catch (error) {
      console.error(`❌ Error uploading ${imageName}:`, error.message);
    }
  }
  
  console.log('\n📊 Upload Summary:');
  console.log(`✅ Successfully uploaded: ${uploadResults.length} images`);
  
  console.log('\n🔗 Cloudinary URLs:');
  uploadResults.forEach(result => {
    console.log(`${result.original}: ${result.url}`);
  });
  
  // Generate optimized URLs
  console.log('\n⚡ Optimized URLs (for gallery):');
  uploadResults.forEach(result => {
    const optimizedUrl = result.url.replace('/upload/', '/upload/w_400,h_600,c_fill,f_auto,q_auto/');
    console.log(`${result.original}: ${optimizedUrl}`);
  });
  
  return uploadResults;
}

// Run the upload
uploadStaticImages()
  .then(() => {
    console.log('\n🎉 Upload completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Upload failed:', error);
    process.exit(1);
  });
