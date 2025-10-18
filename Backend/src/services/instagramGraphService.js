const axios = require('axios');

class InstagramGraphService {
  constructor() {
    this.accessToken = process.env.INSTAGRAM_ACCESS_TOKEN || 'IGAAPmLIN2vZAJBZAFA2Qnh1R0dMOTdTSkIwTUZAYYXJKTnFMaWRmMDc5MlJYUjVWLTZAiTDVBQU1UWWI4aWU4ZAlVWYl9uWlY3MFVxNzN3V2phSWQ3RjJKcVNtVDEzbW1ZATEdVRmNsQ3p6cWJFR19mMVc2eXVhTDFrQl80NlQtT1NORQZDZD';
    this.userId = process.env.INSTAGRAM_USER_ID || '25673025935614954';
    this.appId = process.env.INSTAGRAM_APP_ID || '1097503788678546';
    this.appSecret = process.env.INSTAGRAM_APP_SECRET || '61e5c34334817a0a14299227c526b74b';
    this.baseUrl = 'https://graph.facebook.com/v18.0';
  }

  // Get Instagram business account info
  async getBusinessAccountInfo() {
    try {
      if (!this.accessToken) {
        console.log('⚠️ No access token available');
        return null;
      }

      // First get the user's Instagram business account
      const response = await axios.get(`${this.baseUrl}/me/accounts`, {
        params: {
          access_token: this.accessToken,
          fields: 'id,name,instagram_business_account'
        }
      });

      if (response.data && response.data.data && response.data.data.length > 0) {
        const page = response.data.data[0];
        if (page.instagram_business_account) {
          console.log('✅ Instagram business account found:', page.instagram_business_account.id);
          return page.instagram_business_account.id;
        }
      }

      console.log('⚠️ No Instagram business account found');
      return null;
    } catch (error) {
      console.error('❌ Failed to get business account info:', error.message);
      return null;
    }
  }

  // Get latest Instagram posts using Graph API
  async getLatestPosts(limit = 9) {
    try {
      if (!this.accessToken) {
        console.log('⚠️ No access token available, using fallback data');
        return this.getFallbackPosts();
      }

      // Try to get business account first
      const businessAccountId = await this.getBusinessAccountInfo();
      
      if (businessAccountId) {
        console.log('🔄 Fetching posts from Instagram business account...');
        
        const response = await axios.get(`${this.baseUrl}/${businessAccountId}/media`, {
          params: {
            access_token: this.accessToken,
            fields: 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count',
            limit: limit
          }
        });

        if (response.data && response.data.data) {
          console.log('✅ Instagram Graph API posts fetched successfully:', response.data.data.length);
          return this.formatInstagramPosts(response.data.data);
        }
      }

      // Fallback to Basic Display API
      console.log('🔄 Trying Instagram Basic Display API...');
      return await this.tryBasicDisplayAPI(limit);

    } catch (error) {
      console.error('❌ Instagram Graph API Error:', error.message);
      console.log('🔄 Falling back to Basic Display API...');
      return await this.tryBasicDisplayAPI(limit);
    }
  }

  // Try Instagram Basic Display API as fallback
  async tryBasicDisplayAPI(limit) {
    try {
      const basicDisplayUrl = 'https://graph.instagram.com/v12.0';
      const response = await axios.get(`${basicDisplayUrl}/${this.userId}/media`, {
        params: {
          access_token: this.accessToken,
          fields: 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count',
          limit: limit
        }
      });

      if (response.data && response.data.data) {
        console.log('✅ Instagram Basic Display API posts fetched:', response.data.data.length);
        return this.formatInstagramPosts(response.data.data);
      }
    } catch (basicError) {
      console.log('⚠️ Instagram Basic Display API also failed:', basicError.message);
    }

    // Final fallback to static posts
    console.log('🔄 Using fallback posts');
    return this.getFallbackPosts();
  }

  // Format Instagram API response
  formatInstagramPosts(posts) {
    return posts.map(post => ({
      id: post.id,
      image: post.media_url || post.thumbnail_url,
      caption: post.caption ? this.cleanCaption(post.caption) : 'KORAKAGAZ',
      likes: post.like_count || Math.floor(Math.random() * 200) + 50,
      comments: post.comments_count || Math.floor(Math.random() * 10) + 3,
      username: 'korakagazindiaa',
      userAvatar: '/placeholder-user.jpg',
      timestamp: this.formatTimestamp(post.timestamp),
      permalink: post.permalink,
      mediaType: post.media_type,
      commentsList: this.generateSampleComments()
    }));
  }

  // Clean caption text
  cleanCaption(caption) {
    if (!caption) return 'KORAKAGAZ';
    
    let cleanCaption = caption
      .replace(/#\w+/g, '') // Remove hashtags
      .replace(/@\w+/g, '') // Remove mentions
      .replace(/\n+/g, ' ') // Replace newlines with spaces
      .trim();
    
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

  // Generate sample comments
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

  // Fallback posts
  getFallbackPosts() {
    console.log('📸 Generating fallback posts...');
    const fallbackPosts = [
      {
        id: "fallback_1",
        image: "/SS2566.jpg",
        caption: "FOLLOW US ON INSTAGRAM @KORAKAGAZ",
        likes: 124,
        comments: 8,
        username: "ayush_1713",
        userAvatar: "/placeholder-user.jpg",
        timestamp: "2 hours ago",
        permalink: "https://instagram.com/ayush_1713",
        mediaType: "IMAGE",
        commentsList: this.generateSampleComments()
      },
      {
        id: "fallback_2",
        image: "/SS3081.jpg",
        caption: "STYLE WARS ft. Mustard Parna",
        likes: 89,
        comments: 5,
        username: "ayush_1713",
        userAvatar: "/placeholder-user.jpg",
        timestamp: "5 hours ago",
        permalink: "https://instagram.com/ayush_1713",
        mediaType: "IMAGE",
        commentsList: this.generateSampleComments()
      },
      {
        id: "fallback_3",
        image: "/SS6960.jpg",
        caption: "Everyday elegance with KORAKAGAZ",
        likes: 156,
        comments: 12,
        username: "ayush_1713",
        userAvatar: "/placeholder-user.jpg",
        timestamp: "1 day ago",
        permalink: "https://instagram.com/ayush_1713",
        mediaType: "IMAGE",
        commentsList: this.generateSampleComments()
      }
    ];
    console.log('📸 Fallback posts generated:', fallbackPosts.length);
    return fallbackPosts;
  }
}

module.exports = new InstagramGraphService();



