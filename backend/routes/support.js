const express = require('express');
const { getSupportAutomationStats, getSupportTicketAnalytics, trainSupportModel } = require('../controllers/supportController');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

// All support routes require authentication and admin access
router.use(protect);
router.use(admin);

// Get support automation statistics
router.get('/automation-stats', getSupportAutomationStats);

// Get support ticket analytics
router.get('/ticket-analytics', getSupportTicketAnalytics);

// Train AI support model
router.post('/train-model', trainSupportModel);

module.exports = router;