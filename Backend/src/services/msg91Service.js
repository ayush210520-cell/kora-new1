const axios = require('axios');

class MSG91Service {
  constructor() {
    this.authKey = process.env.MSG91_AUTH_KEY;
    this.senderId = process.env.MSG91_SENDER_ID;
  }

  // Send OTP using Traditional SMS API
  async sendOTP(phoneNumber, otp) {
    try {
      const response = await axios.post('https://api.msg91.com/api/sendhttp.php', null, {
        params: {
          authkey: this.authKey,
          mobiles: `91${phoneNumber}`,
          message: `Your OTP for KORAKAGAZ is ${otp}. Valid for 5 minutes.`,
          sender: this.senderId,
          route: '4',
          country: '91'
        }
      });

      if (response.data && response.data.length > 0) {
        return { success: true, message: 'OTP sent successfully' };
      } else {
        throw new Error('Failed to send OTP');
      }
    } catch (error) {
      console.error('MSG91 OTP send error:', error.message);
      throw new Error(`Failed to send OTP: ${error.message}`);
    }
  }

  // Generate a random 6-digit OTP
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}

module.exports = new MSG91Service();