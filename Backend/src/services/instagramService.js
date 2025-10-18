const axios = require('axios');

class InstagramService {
  constructor() {
    // Use hardcoded credentials for testing
    this.accessToken = process.env.INSTAGRAM_ACCESS_TOKEN || 'IGAAPmLIN2vZAJBZAFA2Qnh1R0dMOTdTSkIwTUZAYYXJKTnFMaWRmMDc5MlJYUjVWLTZAiTDVBQU1UWWI4aWU4ZAlVWYl9uWlY3MFVxNzN3V2phSWQ3RjJKcVNtVDEzbW1ZATEdVRmNsQ3p6cWJFR19mMVc2eXVhTDFrQl80NlQtT1NORQZDZD';
    this.userId = process.env.INSTAGRAM_USER_ID || '25673025935614954'; // Use environment variable
    this.appId = process.env.INSTAGRAM_APP_ID || '1097503788678546';
    this.appSecret = process.env.INSTAGRAM_APP_SECRET || '61e5c34334817a0a14299227c526b74b';
    this.baseUrl = 'https://graph.instagram.com/v12.0';
  }

  // Get latest Instagram posts
  async getLatestPosts(limit = 9) {
    try {
      if (!this.accessToken || !this.userId) {
        console.log('⚠️ Instagram credentials not configured, using fallback data');
        return this.getFallbackPosts();
      }

      console.log('🔄 Attempting Instagram Basic Display API...');
      console.log('🔑 Access Token:', this.accessToken ? '✅ Set' : '❌ Not Set');
      console.log('👤 User ID:', this.userId ? '✅ Set' : '❌ Not Set');
      console.log('🌐 Using User ID:', this.userId);

      // Try Instagram Basic Display API with proper error handling
      try {
        console.log('📡 Making API call to:', `${this.baseUrl}/${this.userId}/media`);
        
        const response = await axios.get(`${this.baseUrl}/${this.userId}/media`, {
          params: {
            access_token: this.accessToken,
            fields: 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count',
            limit: limit
          },
          timeout: 10000 // 10 second timeout
        });

        if (response.data && response.data.data) {
          console.log('✅ Instagram posts fetched successfully:', response.data.data.length);
          return this.formatInstagramPosts(response.data.data);
        } else {
          console.log('⚠️ Instagram API response empty, using fallback');
          return this.getFallbackPosts();
        }
      } catch (basicError) {
        console.log('⚠️ Instagram Basic Display API failed:', basicError.message);
        
        if (basicError.response) {
          console.log('📊 Error Status:', basicError.response.status);
          console.log('📊 Error Data:', JSON.stringify(basicError.response.data, null, 2));
        } else {
          console.log('📊 Error Details:', basicError);
        }
        
        // Try to get user info as fallback
        try {
          console.log('🔄 Trying to get user info...');
          const userResponse = await axios.get(`${this.baseUrl}/me`, {
            params: {
              access_token: this.accessToken,
              fields: 'id,username,account_type,media_count'
            },
            timeout: 10000
          });
          
          if (userResponse.data) {
            console.log('✅ Instagram user info fetched:', userResponse.data);
            console.log('🔄 Using fallback posts due to media permissions');
            return this.getFallbackPosts();
          }
        } catch (userError) {
          console.log('⚠️ Instagram user info also failed:', userError.message);
        }
      }

      console.log('🔄 All Instagram API attempts failed, using fallback posts');
      return this.getFallbackPosts();
    } catch (error) {
      console.error('❌ Instagram API Error:', error.message);
      console.log('🔄 Falling back to static posts');
      return this.getFallbackPosts();
    }
  }

  // Format Instagram API response
  formatInstagramPosts(posts) {
    return posts.map(post => {
      console.log('📝 Formatting post:', { id: post.id, media_type: post.media_type, has_media_url: !!post.media_url, has_thumbnail: !!post.thumbnail_url });
      
      return {
        id: post.id,
        image: post.media_type === 'VIDEO' ? (post.thumbnail_url || post.media_url) : (post.media_url || post.thumbnail_url),
        videoUrl: post.media_type === 'VIDEO' ? post.media_url : null,
        caption: post.caption ? this.cleanCaption(post.caption) : 'KORAKAGAZ',
        likes: post.like_count || Math.floor(Math.random() * 200) + 50,
        comments: post.comments_count || Math.floor(Math.random() * 10) + 3,
        username: 'korakagaz.india',
        userAvatar: '/placeholder-user.jpg',
        timestamp: this.formatTimestamp(post.timestamp),
        permalink: post.permalink,
        mediaType: post.media_type,
        commentsList: this.generateSampleComments()
      };
    });
  }

  // Clean caption text
  cleanCaption(caption) {
    if (!caption) return 'KORAKAGAZ';
    
    // Remove hashtags and mentions, keep main text
    let cleanCaption = caption
      .replace(/#\w+/g, '') // Remove hashtags
      .replace(/@\w+/g, '') // Remove mentions
      .replace(/\n+/g, ' ') // Replace newlines with spaces
      .trim();
    
    // Limit length
    if (cleanCaption.length > 100) {
      cleanCaption = cleanCaption.substring(0, 100) + '...';
    }
    
    return cleanCaption || 'KORAKAGAZ';
  }

  // Format timestamp
  formatTimestamp(timestamp) {
    if (!timestamp) return '2 hours ago';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
  }

  // Generate sample comments for fallback
  generateSampleComments() {
    const sampleComments = [
      { username: 'fashion_lover', comment: 'Love this style! 😍' },
      { username: 'style_queen', comment: 'Where can I get this?' },
      { username: 'trendy_girl', comment: 'Perfect for summer!' },
      { username: 'fashionista', comment: 'This is amazing! 🔥' },
      { username: 'style_enthusiast', comment: 'Love the energy!' },
      { username: 'elegant_lady', comment: 'So beautiful and elegant!' },
      { username: 'fashion_forward', comment: 'This is exactly what I need!' },
      { username: 'style_maven', comment: 'Perfect for office wear!' }
    ];

    return sampleComments
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.floor(Math.random() * 4) + 2)
      .map((comment, index) => ({
        id: (index + 1).toString(),
        username: comment.username,
        comment: comment.comment,
        timestamp: `${Math.floor(Math.random() * 60) + 1} min ago`
      }));
  }

  // Fallback posts when Instagram API is not available
  getFallbackPosts() {
    console.log('📸 Generating fallback posts...');
    const fallbackPosts = [
      {
        id: "fallback_1",
        image: "/SS2566.jpg",
        caption: "FOLLOW US ON INSTAGRAM @KORAKAGAZ",
        likes: 124,
        comments: 8,
        username: "korakagaz.india",
        userAvatar: "/placeholder-user.jpg",
        timestamp: "2 hours ago",
        permalink: "https://instagram.com/korakagaz",
        mediaType: "IMAGE",
        commentsList: this.generateSampleComments()
      },
      {
        id: "fallback_2",
        image: "/SS3081.jpg",
        caption: "STYLE WARS ft. Mustard Parna",
        likes: 89,
        comments: 5,
        username: "korakagaz.india",
        userAvatar: "/placeholder-user.jpg",
        timestamp: "5 hours ago",
        permalink: "https://instagram.com/korakagaz",
        mediaType: "IMAGE",
        commentsList: this.generateSampleComments()
      },
      {
        id: "fallback_3",
        image: "/SS6960.jpg",
        caption: "Everyday elegance with KORAKAGAZ",
        likes: 156,
        comments: 12,
        username: "korakagaz.india",
        userAvatar: "/placeholder-user.jpg",
        timestamp: "1 day ago",
        permalink: "https://instagram.com/korakagaz",
        mediaType: "IMAGE",
        commentsList: this.generateSampleComments()
      }
    ];
    console.log('📸 Fallback posts generated:', fallbackPosts.length);
    return fallbackPosts;
  }

  // Get user info using app credentials
  async getUserInfo() {
    try {
      if (!this.accessToken) {
        console.log('⚠️ No access token available');
        return null;
      }

      const response = await axios.get(`${this.baseUrl}/me`, {
        params: {
          access_token: this.accessToken,
          fields: 'id,username,account_type,media_count'
        }
      });

      if (response.data) {
        console.log('✅ Instagram user info fetched:', response.data);
        return response.data;
      }
    } catch (error) {
      console.error('❌ Failed to fetch user info:', error.message);
    }
    return null;
  }

  // Refresh access token (Instagram tokens expire)
  async refreshAccessToken() {
    try {
      const response = await axios.get(`${this.baseUrl}/refresh_access_token`, {
        params: {
          grant_type: 'ig_refresh_token',
          access_token: this.accessToken
        }
      });

      if (response.data && response.data.access_token) {
        console.log('✅ Instagram access token refreshed');
        return response.data.access_token;
      }
    } catch (error) {
      console.error('❌ Failed to refresh Instagram token:', error.message);
    }
    return null;
  }
}

module.exports = new InstagramService();
