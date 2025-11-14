const express = require('express');
const {
  submitSupportRequest,
  getSupportTypes,
  getSupportHistory,
  getSupportAnalytics,
} = require('../controllers/supportController');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/types', getSupportTypes);

// Protected routes
router.use(protect);
router.post('/request', submitSupportRequest);
router.get('/history', getSupportHistory);

// Admin routes
router.get('/analytics', admin, getSupportAnalytics);

module.exports = router;