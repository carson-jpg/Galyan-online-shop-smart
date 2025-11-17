const express = require('express');
const {
  createOrder,
  getOrderById,
  getMyOrders,
  getOrders,
  updateOrderToDelivered,
  updateOrderStatus,
  getSellerStats,
  getFraudStats,
  getFraudStatsSafe,
  reviewFraudOrder,
  calculateShipping,
  getShippingZones,
} = require('../controllers/orderController');
const { protect, admin, seller } = require('../middleware/auth');

const router = express.Router();

router.route('/').post(protect, createOrder).get(protect, getOrders);
router.route('/myorders').get(protect, getMyOrders);
router.route('/:id').get(protect, getOrderById);
router.route('/:id/deliver').put(protect, admin, updateOrderToDelivered);
router.route('/:id/status').put(protect, updateOrderStatus);
router.route('/seller-stats').get(protect, seller, getSellerStats);

// Shipping routes
router.route('/calculate-shipping').post(protect, calculateShipping);
router.route('/shipping-zones').get(getShippingZones);

// Admin routes for order management
router.get('/admin/orders', protect, admin, getOrders);
router.put('/admin/orders/:id/status', protect, admin, updateOrderStatus);

// Fraud detection routes
router.get('/fraud-stats', protect, admin, getFraudStats);
router.get('/fraud-stats-safe', protect, admin, getFraudStatsSafe);
router.put('/:id/fraud-review', protect, admin, reviewFraudOrder);

module.exports = router;