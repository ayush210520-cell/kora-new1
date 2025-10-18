const jwt = require('jsonwebtoken');
const {isTokenBlacklisted} = require("../controllers/authController");
const prisma = require('../config/db');

// Middleware to verify JWT and attach user/admin info
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    console.log('🔐 Auth middleware - Authorization header:', authHeader ? 'Present' : 'Missing');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ Auth middleware - No valid authorization header');
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];
    console.log('🔑 Auth middleware - Token extracted:', token ? 'Present' : 'Missing');

    // Check blacklist
    if (isTokenBlacklisted(token)) {
      console.log('❌ Auth middleware - Token is blacklisted');
      return res.status(401).json({ error: 'Unauthorized: Token has been logged out' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Auth middleware - Token decoded successfully:', {
      userId: decoded.userId,
      adminId: decoded.adminId,
      role: decoded.role
    });

    // Attach to request
    if (decoded.role === 'user') {
      req.userId = decoded.userId;
      req.role = 'user';
      console.log('👤 Auth middleware - User authenticated:', decoded.userId);
    } else if (decoded.role === 'admin') {
      req.adminId = decoded.adminId;
      req.role = 'admin';
      console.log('👨‍💼 Auth middleware - Admin authenticated:', decoded.adminId);
    } else {
      console.log('❌ Auth middleware - Invalid role:', decoded.role);
      return res.status(403).json({ error: 'Forbidden: Invalid role' });
    }

    next();
  } catch (error) {
    console.error('❌ Auth middleware error:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      expiredAt: error.expiredAt
    });
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

// Middleware to check roles
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.role || !allowedRoles.includes(req.role)) {
      return res.status(403).json({ error: 'Forbidden: Access denied' });
    }
    next();
  };
};

module.exports = {
  authenticate,
  authorizeRoles
};
