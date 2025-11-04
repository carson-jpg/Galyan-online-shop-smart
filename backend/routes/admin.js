const express = require('express');
const {
  getUsers,
  deleteUser,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getAdminProducts,
  getAllOrders,
  getAllPayments,
  getDashboardStats,
} = require('../controllers/adminController');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

// User management routes
router.route('/users').get(protect, admin, getUsers);
router.route('/users/:id').delete(protect, admin, deleteUser);

// Category management routes
router.route('/categories').get(protect, admin, getCategories).post(protect, admin, createCategory);
router.route('/categories/:id').put(protect, admin, updateCategory).delete(protect, admin, deleteCategory);

// Product management routes (admin view)
router.route('/products').get(protect, admin, getAdminProducts);

// Order management routes (admin view)
router.route('/orders').get(protect, admin, getAllOrders);

// Payment management routes (admin view)
router.route('/payments').get(protect, admin, getAllPayments);

// Dashboard stats
router.route('/dashboard').get(protect, admin, getDashboardStats);

module.exports = router;