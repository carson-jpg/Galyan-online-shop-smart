const express = require('express');
const { getPricingAnalysis, optimizeProductPrice } = require('../controllers/pricingController');
const { protect, admin, seller } = require('../middleware/auth');

const router = express.Router();

// All pricing routes require authentication
router.use(protect);

// Get pricing analysis (admin or seller of the product)
router.get('/analysis/:id', getPricingAnalysis);

// Optimize product price (admin or seller of the product)
router.post('/optimize/:id', optimizeProductPrice);

module.exports = router;