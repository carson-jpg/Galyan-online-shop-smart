const express = require('express');
const { getAnalyticsDashboard } = require('../controllers/analyticsController');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

// All analytics routes require authentication and admin access
router.use(protect);
router.use(admin);

router.get('/dashboard', getAnalyticsDashboard);

module.exports = router;