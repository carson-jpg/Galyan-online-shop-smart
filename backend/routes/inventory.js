const express = require('express');
const {
  getInventoryInsights,
  getProductInventoryAnalysis,
  getReorderPrediction,
  generatePurchaseOrders,
  getStockAlerts,
  getInventoryDashboard,
} = require('../controllers/inventoryController');
const { protect, seller, admin } = require('../middleware/auth');

const router = express.Router();

// All inventory routes require authentication
router.use(protect);

// Seller routes
router.get('/insights', seller, getInventoryInsights);
router.get('/dashboard', seller, getInventoryDashboard);
router.get('/alerts', seller, getStockAlerts);
router.get('/purchase-orders/generate', seller, generatePurchaseOrders);

// Product-specific routes (seller or admin)
router.get('/products/:productId/analysis', getProductInventoryAnalysis);
router.get('/products/:productId/reorder', getReorderPrediction);

module.exports = router;