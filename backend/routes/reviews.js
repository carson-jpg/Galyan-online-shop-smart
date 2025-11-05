const express = require('express');
const {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
  markReviewHelpful,
  reportReview,
} = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');

const router = express.Router({ mergeParams: true });

// Public routes
router.get('/', getProductReviews);

// Protected routes
router.post('/', protect, createReview);
router.put('/:id', protect, updateReview);
router.delete('/:id', protect, deleteReview);
router.put('/:id/helpful', protect, markReviewHelpful);
router.put('/:id/report', protect, reportReview);

module.exports = router;