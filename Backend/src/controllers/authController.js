const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const prisma = require("../config/db");
const emailService = require("../services/emailService");
const emailQueue = require("../services/emailQueue");
const crypto = require("crypto");

const tokenBlacklist = new Set();

// Generate JWT
const generateToken = (payload, expiresIn = "1d") =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });

const blacklistToken = (token) => {
  if (token) tokenBlacklist.add(token);
};

// Extract Bearer token from header
const getTokenFromHeader = (req) => {
  const auth = req.headers.authorization;
  return auth && auth.startsWith("Bearer ") ? auth.split(" ")[1] : null;
};

// Register User
const registerUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const { email, password, name, phone } = req.body;
    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser)
      return res.status(400).json({ error: "Email already in use" });

    // Clean phone number - remove all non-digit characters
    const cleanPhone = phone.replace(/\D/g, '');

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name, phone: cleanPhone },
    });

    const token = generateToken({ userId: user.id, role: "user" }, "7d");
    
    // Send welcome email for new users (async, don't wait)
    emailQueue.addToQueue(user, 'welcome');

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Login User
const loginUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;
    
    // First check if it's an admin login
    const admin = await prisma.admin.findUnique({ where: { email } });
    if (admin && await bcrypt.compare(password, admin.password)) {
      const token = generateToken({ adminId: admin.id, role: "admin" }, "7d");
      return res.status(200).json({
        message: "Admin login successful",
        token,
        user: {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          phone: '', // Admin doesn't have phone
          role: 'admin'
        },
      });
    }
    
    // If not admin, check regular user
    const user = await prisma.user.findFirst({
      where: { email, isActive: true },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const token = generateToken({ userId: user.id, role: "user" }, "7d");

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: 'user'
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Logout User
const logoutUser = async (req, res) => {
  try {
    const token = getTokenFromHeader(req);
    if (!token) return res.status(400).json({ error: "No token provided" });

    blacklistToken(token);
    res.status(200).json({ message: "User logged out successfully" });
  } catch (error) {
    console.error("Logout Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Update User
const updateUser = async (req, res) => {
  try {
    const userId = req.userId;
    const { name, phone } = req.body;

    const user = await prisma.user.update({
      where: { id: userId },
      data: { name, phone },
    });

    res.status(200).json({
      message: "User updated successfully",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error("Update Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Create Admin (max 2)
const createAdmin = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const { email, password, name } = req.body;
    const existingAdmin = await prisma.admin.findUnique({ where: { email } });

    if (existingAdmin)
      return res.status(400).json({ error: "Admin already exists" });

    const adminCount = await prisma.admin.count();
    if (adminCount >= 2)
      return res.status(403).json({ error: "Only 2 admins allowed" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = await prisma.admin.create({
      data: { email, password: hashedPassword, name, role: "admin" },
    });

    const token = generateToken({ adminId: admin.id, role: "admin" });

    res.status(201).json({
      message: "Admin created successfully",
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error("Create Admin Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Login Admin
const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await prisma.admin.findUnique({ where: { email } });

    if (!admin || !(await bcrypt.compare(password, admin.password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = generateToken({ adminId: admin.id, role: "admin" });

    res.status(200).json({
      message: "Admin login successful",
      token,
      admin: { id: admin.id, email: admin.email, name: admin.name },
    });
  } catch (error) {
    console.error("Admin Login Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Logout Admin
const logoutAdmin = async (req, res) => {
  try {
    const token = getTokenFromHeader(req);
    if (!token) return res.status(400).json({ error: "No token provided" });

    blacklistToken(token);
    res.status(200).json({ message: "Admin logged out successfully" });
  } catch (error) {
    console.error("Admin Logout Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get current user info
const getCurrentUser = async (req, res) => {
  try {
    const { userId, adminId, role } = req;
    
    if (role === 'admin') {
      const admin = await prisma.admin.findUnique({
        where: { id: adminId },
        select: { id: true, email: true, name: true, role: true }
      });
      
      if (!admin) {
        return res.status(404).json({ error: "Admin not found" });
      }
      
      return res.status(200).json(admin);
    } else {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, name: true, phone: true }
      });
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Add role field for frontend compatibility
      const userWithRole = { ...user, role: 'user' };
      return res.status(200).json(userWithRole);
    }
  } catch (error) {
    console.error("Get Current User Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Handle Google Authentication
const handleGoogleAuth = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { uid, email, name, phone } = req.body;

    // Check if user already exists by email
    let user = await prisma.user.findUnique({ where: { email } });
    let isNewUser = false;

    if (user) {
      // User exists, update Firebase UID if not set
      if (!user.firebaseUid) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { firebaseUid: uid }
        });
      }
    } else {
      // Create new user with Google data
      user = await prisma.user.create({
        data: {
          email,
          name,
          phone: phone || '', // Phone might be empty from Google
          firebaseUid: uid,
          isActive: true,
          // Generate a random password for Google users (they won't use it)
          password: await bcrypt.hash(Math.random().toString(36) + Date.now().toString(36), 10)
        }
      });
      isNewUser = true;
    }

    // Generate JWT token
    const token = generateToken({ userId: user.id, role: "user" }, "7d");

    // Send welcome email only for new users (async, don't wait)
    if (isNewUser) {
      emailQueue.addToQueue(user, 'welcome');
    }

    res.status(200).json({
      message: "Google authentication successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: 'user',
        authProvider: 'google'
      },
    });
  } catch (error) {
    console.error("Google Auth Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Check Email for Password Reset
const checkEmailForPasswordReset = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;
    
    // Check if user exists
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: "User not found with this email" });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    // Save reset token to database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry
      }
    });

    // Send reset email
    await emailService.sendPasswordResetEmail(user.email, resetToken);

    res.status(200).json({
      message: "Password reset email sent successfully"
    });

  } catch (error) {
    console.error("Check Email Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Reset Password
const resetPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { token, password } = req.body;
    
    // Find user with valid reset token
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gt: new Date() }
      }
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired reset token" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null
      }
    });

    res.status(200).json({
      message: "Password reset successfully"
    });

  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  // User
  registerUser,
  loginUser,
  logoutUser,
  updateUser,
  getCurrentUser,
  handleGoogleAuth,
  checkEmailForPasswordReset,
  resetPassword,
  // Admin
  createAdmin,
  loginAdmin,
  logoutAdmin,
  // (for middleware use)
  isTokenBlacklisted: (token) => tokenBlacklist.has(token),
};
