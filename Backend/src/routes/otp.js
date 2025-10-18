const express = require('express');
const router = express.Router();
const msg91Service = require('../services/msg91Service');

// In-memory storage for OTPs and verified phones
const otpStore = new Map();
const verifiedPhones = new Set();

// Send OTP
router.post('/send', async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }

    // Generate OTP
    const otp = msg91Service.generateOTP();
    
    // Store OTP with timestamp
    otpStore.set(phone, {
      otp,
      timestamp: Date.now(),
      attempts: 0
    });

    console.log('📱 Sending OTP:', { phone, otp });

    // Send OTP via MSG91
    const result = await msg91Service.sendOTP(phone, otp);
    
    if (result.success) {
      res.json({ success: true, message: 'OTP sent successfully', phone });
    } else {
      res.status(500).json({ success: false, message: result.message });
    }
  } catch (error) {
    console.error('OTP send error:', error);
    res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
});

// Verify OTP
router.post('/verify', async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ success: false, message: 'Phone number and OTP are required' });
    }

    const storedData = otpStore.get(phone);
    
    if (!storedData) {
      return res.status(400).json({ success: false, message: 'OTP not found or expired' });
    }

    // Check if OTP is expired (5 minutes)
    const isExpired = Date.now() - storedData.timestamp > 5 * 60 * 1000;
    if (isExpired) {
      otpStore.delete(phone);
      return res.status(400).json({ success: false, message: 'OTP expired' });
    }

    // Check attempts
    if (storedData.attempts >= 3) {
      otpStore.delete(phone);
      return res.status(400).json({ success: false, message: 'Too many attempts' });
    }

    // Verify OTP
    if (storedData.otp === otp) {
      // Mark phone as verified
      verifiedPhones.add(phone);
      otpStore.delete(phone);
      res.json({ success: true, message: 'OTP verified successfully' });
    } else {
      // Increment attempts
      storedData.attempts++;
      res.status(400).json({ success: false, message: 'Invalid OTP' });
    }
  } catch (error) {
    console.error('OTP verify error:', error);
    res.status(500).json({ success: false, message: 'Failed to verify OTP' });
  }
});

// Resend OTP
router.post('/resend', async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }

    // Check if phone is already verified
    if (verifiedPhones.has(phone)) {
      return res.status(400).json({ success: false, message: 'Phone already verified' });
    }

    // Generate new OTP
    const otp = msg91Service.generateOTP();
    
    // Store OTP with timestamp
    otpStore.set(phone, {
      otp,
      timestamp: Date.now(),
      attempts: 0
    });

    console.log('📱 Resending OTP:', { phone, otp });

    // Send OTP via MSG91
    const result = await msg91Service.sendOTP(phone, otp);
    
    if (result.success) {
      res.json({ success: true, message: 'OTP resent successfully', phone });
    } else {
      res.status(500).json({ success: false, message: result.message });
    }
  } catch (error) {
    console.error('OTP resend error:', error);
    res.status(500).json({ success: false, message: 'Failed to resend OTP' });
  }
});

// Complete registration after phone verification
router.post('/complete-registration', async (req, res) => {
  try {
    const { phone, name, email, password } = req.body;

    if (!phone || !name || !email || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    // Check if phone is verified
    if (!verifiedPhones.has(phone)) {
      return res.status(400).json({ success: false, message: 'Phone number not verified' });
    }

    // Here you would typically create the user in your database
    // For now, we'll just remove the phone from verified list and return success
    verifiedPhones.delete(phone);

    // Generate a mock user and token (replace with actual user creation)
    const user = {
      id: Date.now(),
      phone,
      name,
      email,
      authProvider: 'phone'
    };

    const token = 'mock-jwt-token-' + Date.now();

    res.json({
      success: true,
      message: 'Registration completed successfully',
      user,
      token
    });
  } catch (error) {
    console.error('Complete registration error:', error);
    res.status(500).json({ success: false, message: 'Failed to complete registration' });
  }
});

module.exports = router;