const express = require('express');
const {
  getProductReviews,
  getSellerReviews,
  createReview,
  updateReview,
  deleteReview,
  markReviewHelpful,
  reportReview,
} = require('../controllers/reviewController');
const { protect, seller } = require('../middleware/auth');

const router = express.Router({ mergeParams: true });

// Public routes
router.get('/', getProductReviews);

// Protected routes
router.post('/', protect, createReview);
router.put('/:id', protect, updateReview);
router.delete('/:id', protect, deleteReview);
router.put('/:id/helpful', protect, markReviewHelpful);
router.put('/:id/report', protect, reportReview);

// Seller routes
router.get('/seller', protect, seller, getSellerReviews);

module.exports = router;