const express = require("express");
const { body } = require("express-validator");
const router = express.Router();
const prisma = require("../config/db");
 
const {
  registerUser,
  loginUser,
  logoutUser,
  updateUser,
  createAdmin,
  loginAdmin,
  logoutAdmin,
  getCurrentUser,
  handleGoogleAuth,
  checkEmailForPasswordReset,
  resetPassword,
} = require("../controllers/authController.js");
 
const { authenticate, authorizeRoles } = require("../middleware/auth.js");
 
// ========================
// USER AUTH ROUTES
// ========================
 
// Register User
router.post(
  "/register",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
    body("name").notEmpty().withMessage("Name is required"),
    body("phone")
      .notEmpty()
      .withMessage("Phone number is required")
      .custom((value) => {
        // Remove all non-digit characters and check if it's at least 10 digits
        const digitsOnly = value.replace(/\D/g, '');
        if (digitsOnly.length < 10) {
          throw new Error("Phone number must be at least 10 digits");
        }
        return true;
      })
      .withMessage("Phone number must be at least 10 digits"),
  ],
  registerUser
);
 
// Login User
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  loginUser
);

// Google Authentication
router.post(
  "/google",
  [
    body("uid").notEmpty().withMessage("Firebase UID is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("name").notEmpty().withMessage("Name is required"),
  ],
  handleGoogleAuth
);

// Forget Password - Check Email
router.post(
  "/check-email",
  [
    body("email").isEmail().withMessage("Valid email is required"),
  ],
  checkEmailForPasswordReset
);

// Reset Password
router.post(
  "/reset-password",
  [
    body("token").notEmpty().withMessage("Reset token is required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  ],
  resetPassword
);

// Get current user info
router.get("/me", authenticate, getCurrentUser);
 
// Logout User
router.post("/logout", authenticate, authorizeRoles("user"), logoutUser);
 
// Update User Info (Optional)
router.put("/update", authenticate, authorizeRoles("user"), updateUser);
 
// ========================
// ADMIN AUTH ROUTES
// ========================

// Create Admin (for initial setup)
router.post(
  "/admin/create",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
    body("name").notEmpty().withMessage("Name is required"),
  ],
  createAdmin
);

// Admin Login
router.post(
  "/admin/login",
  [
    body("email").isEmail().withMessage("Email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  loginAdmin
);
 
// Admin Logout
router.post("/admin/logout", authenticate, authorizeRoles("admin"), logoutAdmin);

// Get all users for admin
router.get(
  "/admin/users",
  authenticate,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          isActive: true,
          createdAt: true,
          addresses: {
            select: {
              id: true,
              address: true,
              city: true,
              state: true,
              pincode: true
            }
          },
          orders: {
            select: {
              id: true,
              orderNumber: true,
              totalAmount: true,
              orderStatus: true,
              createdAt: true
            },
            orderBy: {
              createdAt: 'desc'
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      res.json({ users });
    } catch (error) {
      console.error('Error fetching users for admin:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  }
);

// Get dashboard statistics for admin
router.get(
  "/admin/dashboard",
  authenticate,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      // Get current date for monthly calculations
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      // Get total counts
      const totalUsers = await prisma.user.count();
      const totalProducts = await prisma.product.count();
      const totalOrders = await prisma.order.count();
      
      // Get revenue data
      const revenueData = await prisma.order.aggregate({
        _sum: {
          totalAmount: true
        },
        where: {
          paymentStatus: 'COMPLETED'
        }
      });
      const totalRevenue = revenueData._sum.totalAmount || 0;

      // Get monthly stats
      const newUsersThisMonth = await prisma.user.count({
        where: {
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        }
      });

      const newOrdersThisMonth = await prisma.order.count({
        where: {
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        }
      });

      const revenueThisMonth = await prisma.order.aggregate({
        _sum: {
          totalAmount: true
        },
        where: {
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth
          },
          paymentStatus: 'COMPLETED'
        }
      });

      // Get top products
      const topProducts = await prisma.orderItem.groupBy({
        by: ['productId'],
        _sum: {
          quantity: true
        },
        _count: {
          id: true
        },
        orderBy: {
          _sum: {
            quantity: 'desc'
          }
        },
        take: 5
      });

      // Get product details for top products
      const topProductsWithDetails = await Promise.all(
        topProducts.map(async (item) => {
          const product = await prisma.product.findUnique({
            where: { id: item.productId },
            select: {
              id: true,
              name: true,
              price: true,
              images: true
            }
          });
          
          if (product) {
            return {
              id: product.id,
              name: product.name,
              sales: item._sum.quantity || 0,
              revenue: (product.price ? (typeof product.price === 'object' && product.price.toNumber ? product.price.toNumber() : Number(product.price)) : 0) * (item._sum.quantity || 0)
            };
          }
          return null;
        })
      );

      // Get recent orders
      const recentOrders = await prisma.order.findMany({
        take: 5,
        include: {
          user: {
            select: {
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      // Get monthly revenue for last 6 months
      const monthlyRevenue = [];
      for (let i = 5; i >= 0; i--) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        
        const monthData = await prisma.order.aggregate({
          _sum: {
            totalAmount: true
          },
          _count: {
            id: true
          },
          where: {
            createdAt: {
              gte: monthStart,
              lte: monthEnd
            },
            paymentStatus: 'COMPLETED'
          }
        });

        monthlyRevenue.push({
          month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
          revenue: monthData._sum.totalAmount ? (typeof monthData._sum.totalAmount === 'object' && monthData._sum.totalAmount.toNumber ? monthData._sum.totalAmount.toNumber() : Number(monthData._sum.totalAmount)) : 0,
          orders: monthData._count.id || 0
        });
      }

      const stats = {
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue: totalRevenue ? (typeof totalRevenue === 'object' && totalRevenue.toNumber ? totalRevenue.toNumber() : Number(totalRevenue)) : 0,
        newUsersThisMonth,
        newOrdersThisMonth,
        revenueThisMonth: revenueThisMonth._sum.totalAmount ? (typeof revenueThisMonth._sum.totalAmount === 'object' && revenueThisMonth._sum.totalAmount.toNumber ? revenueThisMonth._sum.totalAmount.toNumber() : Number(revenueThisMonth._sum.totalAmount)) : 0,
        topProducts: topProductsWithDetails.filter(p => p !== null),
        recentOrders: recentOrders.map(order => ({
          id: order.id,
          orderNumber: order.orderNumber,
          customerName: order.user.name,
          amount: order.totalAmount ? (typeof order.totalAmount === 'object' && order.totalAmount.toNumber ? order.totalAmount.toNumber() : Number(order.totalAmount)) : 0,
          status: order.orderStatus,
          date: order.createdAt
        })),
        monthlyRevenue
      };

      res.json({ stats });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
    }
  }
);
 
module.exports = router;