const express = require("express");
const axios = require("axios");
const router = express.Router();
const instagramService = require("../services/instagramService");
const instagramGraphService = require("../services/instagramGraphService");

// Get latest Instagram posts (using Basic Display API first, then fallback)
router.get("/posts", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 9;
    console.log('🔄 Fetching Instagram posts with Basic Display API...');
    
    // Try Basic Display API first (we know this works)
    const posts = await instagramService.getLatestPosts(limit);
    
    res.json({
      success: true,
      data: posts,
      message: "Instagram posts fetched successfully",
      source: posts.length > 0 && !posts[0].id.startsWith('fallback') ? "Basic Display API" : "Fallback"
    });
  } catch (error) {
    console.error("❌ Instagram posts fetch error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch Instagram posts",
      message: error.message
    });
  }
});

// Get latest Instagram posts (legacy Basic Display API)
router.get("/posts/basic", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 9;
    const posts = await instagramService.getLatestPosts(limit);
    
    res.json({
      success: true,
      data: posts,
      message: "Instagram posts fetched successfully (Basic Display)",
      source: "Basic Display API"
    });
  } catch (error) {
    console.error("❌ Instagram Basic Display posts fetch error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch Instagram posts",
      message: error.message
    });
  }
});

// Get Instagram user info
router.get("/user", async (req, res) => {
  try {
    const userInfo = await instagramService.getUserInfo();
    
    if (userInfo) {
      res.json({
        success: true,
        data: userInfo,
        message: "Instagram user info fetched successfully"
      });
    } else {
      res.status(400).json({
        success: false,
        error: "Failed to fetch user info"
      });
    }
  } catch (error) {
    console.error("❌ Instagram user info fetch error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch Instagram user info",
      message: error.message
    });
  }
});

// Test fallback posts
router.get("/fallback", async (req, res) => {
  try {
    const fallbackPosts = instagramService.getFallbackPosts();
    res.json({
      success: true,
      data: fallbackPosts,
      message: "Fallback posts fetched successfully",
      count: fallbackPosts.length
    });
  } catch (error) {
    console.error("❌ Fallback posts fetch error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch fallback posts",
      message: error.message
    });
  }
});

// Test Instagram connection and permissions
router.get("/test", async (req, res) => {
  try {
    console.log('🧪 Testing Instagram connection...');
    
    // Test 1: Check credentials
    const credentials = {
      accessToken: process.env.INSTAGRAM_ACCESS_TOKEN ? '✅ Set' : '❌ Not Set',
      userId: process.env.INSTAGRAM_USER_ID ? '✅ Set' : '❌ Not Set',
      appId: process.env.INSTAGRAM_APP_ID ? '✅ Set' : '❌ Not Set',
      appSecret: process.env.INSTAGRAM_APP_SECRET ? '✅ Set' : '❌ Not Set'
    };
    
    // Test 2: Try to get user info
    let userInfo = null;
    try {
      const userResponse = await axios.get(`https://graph.instagram.com/v12.0/me`, {
        params: {
          access_token: process.env.INSTAGRAM_ACCESS_TOKEN,
          fields: 'id,username,account_type,media_count'
        }
      });
      userInfo = userResponse.data;
      console.log('✅ User info test successful');
    } catch (userError) {
      console.log('❌ User info test failed:', userError.message);
    }
    
    // Test 3: Try to get media
    let mediaInfo = null;
    try {
      const mediaResponse = await axios.get(`https://graph.instagram.com/v12.0/${process.env.INSTAGRAM_USER_ID}/media`, {
        params: {
          access_token: process.env.INSTAGRAM_ACCESS_TOKEN,
          fields: 'id,caption,media_type',
          limit: 1
        }
      });
      mediaInfo = mediaResponse.data;
      console.log('✅ Media test successful');
    } catch (mediaError) {
      console.log('❌ Media test failed:', mediaError.message);
      if (mediaError.response) {
        console.log('📊 Media Error Status:', mediaError.response.status);
        console.log('📊 Media Error Data:', mediaError.response.data);
      }
    }
    
    res.json({
      success: true,
      message: "Instagram connection test completed",
      credentials,
      userInfo,
      mediaInfo,
      mediaAccess: mediaInfo ? '✅ Working' : '❌ Permission Issue'
    });
    
  } catch (error) {
    console.error("❌ Instagram test error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to test Instagram connection",
      message: error.message
    });
  }
});

// Get Instagram post by ID
router.get("/posts/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const posts = await instagramService.getLatestPosts(50); // Get more posts to find the specific one
    const post = posts.find(p => p.id === id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        error: "Post not found"
      });
    }
    
    res.json({
      success: true,
      data: post,
      message: "Instagram post fetched successfully"
    });
  } catch (error) {
    console.error("❌ Instagram post fetch error:", error);
    res.status(500).json({
      success: false,
        error: "Failed to fetch Instagram post",
        message: error.message
    });
  }
});

// Refresh Instagram access token
router.post("/refresh-token", async (req, res) => {
  try {
    const newToken = await instagramService.refreshAccessToken();
    
    if (newToken) {
      res.json({
        success: true,
        message: "Instagram access token refreshed successfully",
        token: newToken
      });
    } else {
      res.status(400).json({
        success: false,
        error: "Failed to refresh Instagram access token"
      });
    }
  } catch (error) {
    console.error("❌ Instagram token refresh error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to refresh Instagram access token",
      message: error.message
    });
  }
});

module.exports = router;
