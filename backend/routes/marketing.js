const express = require('express');
const { getPersonalizedMarketing, getMarketingCampaigns, createMarketingCampaign } = require('../controllers/marketingController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All marketing routes require authentication
router.use(protect);

// Get personalized marketing content
router.get('/personalized', getPersonalizedMarketing);

// Get marketing campaigns (admin only)
router.get('/campaigns', getMarketingCampaigns);

// Create marketing campaign (admin only)
router.post('/campaigns', createMarketingCampaign);

module.exports = router;