const express = require('express');
const { getAIAnalyticsInsights, getDetailedAnalytics } = require('../controllers/analyticsController');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

// All analytics routes require authentication and admin access
router.use(protect);
router.use(admin);

// Get AI analytics insights
router.get('/ai-insights', getAIAnalyticsInsights);

// Get detailed analytics data
router.get('/detailed', getDetailedAnalytics);

module.exports = router;