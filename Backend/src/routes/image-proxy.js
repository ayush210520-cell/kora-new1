const express = require('express');
const axios = require('axios');
const router = express.Router();

// Proxy Instagram images to avoid 402 Payment Required errors
router.get('/instagram/:encodedUrl', async (req, res) => {
  try {
    const { encodedUrl } = req.params;
    const imageUrl = decodeURIComponent(encodedUrl);
    
    console.log('🖼️ Proxying Instagram image:', imageUrl);
    
    // Validate that it's a valid URL
    if (!imageUrl || typeof imageUrl !== 'string') {
      console.log('❌ Invalid image URL:', imageUrl);
      return res.status(400).json({ error: 'Invalid image URL' });
    }
    
    // Allow Instagram CDN URLs and other valid image URLs
    const isValidImageUrl = imageUrl.includes('scontent-') && imageUrl.includes('cdninstagram.com') ||
                          imageUrl.includes('instagram.com') ||
                          imageUrl.startsWith('http') && (imageUrl.includes('.jpg') || imageUrl.includes('.jpeg') || imageUrl.includes('.png') || imageUrl.includes('.webp'));
    
    if (!isValidImageUrl) {
      console.log('❌ Invalid image URL format:', imageUrl);
      return res.status(400).json({ error: 'Invalid image URL format' });
    }
    
    // Fetch the image from Instagram CDN
    const response = await axios.get(imageUrl, {
      responseType: 'stream',
      timeout: 10000, // 10 second timeout
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Referer': 'https://www.instagram.com/',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache'
      },
      maxRedirects: 5,
      validateStatus: function (status) {
        return status >= 200 && status < 300; // Accept only 2xx status codes
      }
    });
    
    console.log('✅ Image fetched successfully, status:', response.status);
    
    // Set appropriate headers
    res.set({
      'Content-Type': response.headers['content-type'] || 'image/jpeg',
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      'Access-Control-Allow-Origin': '*'
    });
    
    // Pipe the image stream to response
    response.data.pipe(res);
    
  } catch (error) {
    console.error('❌ Image proxy error:', error.message);
    console.error('Error details:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      code: error.code
    });
    
    // Return appropriate status code based on error type
    if (error.response) {
      // Server responded with error status
      res.status(error.response.status).json({ 
        error: 'Failed to fetch image', 
        details: error.message,
        status: error.response.status
      });
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      // Network/connection errors
      res.status(503).json({ 
        error: 'Service unavailable', 
        details: 'Unable to connect to image source'
      });
    } else {
      // Other errors
      res.status(500).json({ 
        error: 'Failed to fetch image', 
        details: error.message 
      });
    }
  }
});

module.exports = router;
