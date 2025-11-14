const express = require('express');
const {
  generateMarketingCampaign,
  sendMarketingEmails,
  getMarketingAnalytics,
} = require('../controllers/marketingController');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

// All marketing routes require authentication and admin access
router.use(protect);
router.use(admin);

// Marketing campaign routes
router.post('/campaigns/generate', generateMarketingCampaign);
router.post('/campaigns/send', sendMarketingEmails);
router.get('/analytics', getMarketingAnalytics);

module.exports = router;