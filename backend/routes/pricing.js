const express = require('express');
const {
  analyzeProductPricing,
  getPricingRecommendations,
  applyDynamicPricing,
  getPricingDashboard,
  bulkApplyPricing,
} = require('../controllers/pricingController');
const { protect, seller, admin } = require('../middleware/auth');

const router = express.Router();

// All pricing routes require authentication
router.use(protect);

// Seller routes
router.get('/dashboard', seller, getPricingDashboard);
router.get('/recommendations', seller, getPricingRecommendations);
router.post('/bulk-apply', seller, bulkApplyPricing);

// Product-specific routes (seller or admin)
router.get('/products/:productId/analyze', analyzeProductPricing);
router.put('/products/:productId/apply', applyDynamicPricing);

module.exports = router;