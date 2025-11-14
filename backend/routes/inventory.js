const express = require('express');
const { getInventoryInsights, getInventoryOptimization } = require('../controllers/inventoryController');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

// All inventory routes require authentication and admin access
router.use(protect);
router.use(admin);

// Get inventory insights
router.get('/insights', getInventoryInsights);

// Get inventory optimization suggestions
router.get('/optimization', getInventoryOptimization);

module.exports = router;