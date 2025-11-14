const Review = require('../models/Review');
const Product = require('../models/Product');
const User = require('../models/User');

// @desc    Get all reviews for a product
// @route   GET /api/products/:productId/reviews
// @access  Public
const getProductReviews = async (req, res) => {
  try {
    const pageSize = 10;
    const page = Number(req.query.pageNumber) || 1;

    const reviews = await Review.find({ product: req.params.productId })
      .populate('user', 'name profilePicture')
      .sort({ createdAt: -1 })
      .limit(pageSize)
      .skip(pageSize * (page - 1));

    const count = await Review.countDocuments({ product: req.params.productId });

    // Get product info for context
    const product = await Product.findById(req.params.productId).select('name seller');
    if (product) {
      await product.populate('seller', 'businessName');
    }

    res.json({
      reviews,
      product: product ? {
        name: product.name,
        seller: product.seller?.businessName
      } : null,
      page,
      pages: Math.ceil(count / pageSize),
      total: count,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a review
// @route   POST /api/products/:productId/reviews
// @access  Private
const createReview = async (req, res) => {
  try {
    const { rating, title, comment } = req.body;
    const { productId } = req.params;
    const userId = req.user._id;

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if user has purchased this product (can only review purchased products)
    const hasPurchased = await Order.findOne({
      user: userId,
      'orderItems.product': productId,
      isPaid: true
    });

    if (!hasPurchased) {
      return res.status(403).json({ message: 'You can only review products you have purchased' });
    }

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({ user: userId, product: productId });
    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this product' });
    }

    // Create review
    const review = new Review({
      user: userId,
      product: productId,
      rating: Number(rating),
      title,
      comment,
    });

    const createdReview = await review.save();
    await createdReview.populate('user', 'name profilePicture');

    // Mark review as verified if user has purchased the product
    createdReview.isVerified = true;
    await createdReview.save();

    // Update product rating and numReviews
    const allReviews = await Review.find({ product: productId });
    const totalRating = allReviews.reduce((sum, rev) => sum + rev.rating, 0);
    const avgRating = totalRating / allReviews.length;

    await Product.findByIdAndUpdate(productId, {
      rating: Math.round(avgRating * 10) / 10, // Round to 1 decimal place
      numReviews: allReviews.length,
    });

    res.status(201).json(createdReview);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a review
// @route   PUT /api/reviews/:id
// @access  Private
const updateReview = async (req, res) => {
  try {
    const { rating, title, comment } = req.body;
    const reviewId = req.params.id;
    const userId = req.user._id;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Check if user owns the review
    if (review.user.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this review' });
    }

    review.rating = rating || review.rating;
    review.title = title || review.title;
    review.comment = comment || review.comment;

    const updatedReview = await review.save();
    await updatedReview.populate('user', 'name profilePicture');

    // Update product rating
    const allReviews = await Review.find({ product: review.product });
    const totalRating = allReviews.reduce((sum, rev) => sum + rev.rating, 0);
    const avgRating = totalRating / allReviews.length;

    await Product.findByIdAndUpdate(review.product, {
      rating: Math.round(avgRating * 10) / 10,
    });

    res.json(updatedReview);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a review
// @route   DELETE /api/reviews/:id
// @access  Private
const deleteReview = async (req, res) => {
  try {
    const reviewId = req.params.id;
    const userId = req.user._id;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Check if user owns the review or is admin
    if (review.user.toString() !== userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this review' });
    }

    await review.remove();

    // Update product rating and numReviews
    const allReviews = await Review.find({ product: review.product });
    const totalRating = allReviews.reduce((sum, rev) => sum + rev.rating, 0);
    const avgRating = allReviews.length > 0 ? totalRating / allReviews.length : 0;

    await Product.findByIdAndUpdate(review.product, {
      rating: Math.round(avgRating * 10) / 10,
      numReviews: allReviews.length,
    });

    res.json({ message: 'Review removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark review as helpful
// @route   PUT /api/reviews/:id/helpful
// @access  Private
const markReviewHelpful = async (req, res) => {
  try {
    const reviewId = req.params.id;
    const userId = req.user._id;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Check if user already marked as helpful
    const alreadyMarked = review.helpful.includes(userId);
    if (alreadyMarked) {
      // Remove from helpful
      review.helpful = review.helpful.filter(id => id.toString() !== userId.toString());
    } else {
      // Add to helpful
      review.helpful.push(userId);
    }

    await review.save();
    res.json({ helpful: review.helpful.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Report a review
// @route   PUT /api/reviews/:id/report
// @access  Private
const reportReview = async (req, res) => {
  try {
    const reviewId = req.params.id;
    const userId = req.user._id;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Check if user already reported
    const alreadyReported = review.reported.includes(userId);
    if (alreadyReported) {
      return res.status(400).json({ message: 'You have already reported this review' });
    }

    review.reported.push(userId);
    await review.save();

    res.json({ message: 'Review reported successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get reviews for seller's products
// @route   GET /api/reviews/seller
// @access  Private/Seller
const getSellerReviews = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get seller profile
    const Seller = require('../models/Seller');
    const seller = await Seller.findOne({ user: userId });
    if (!seller) {
      return res.status(404).json({ message: 'Seller profile not found' });
    }

    // Get all products by this seller
    const Product = require('../models/Product');
    const sellerProducts = await Product.find({ seller: seller._id }).select('_id name');

    if (sellerProducts.length === 0) {
      return res.json({ reviews: [], total: 0 });
    }

    const productIds = sellerProducts.map(p => p._id);

    // Get all reviews for seller's products
    const reviews = await Review.find({ product: { $in: productIds } })
      .populate('user', 'name profilePicture')
      .populate('product', 'name images')
      .sort({ createdAt: -1 });

    // Add product name to each review for easier display
    const reviewsWithProductInfo = reviews.map(review => ({
      ...review.toObject(),
      productName: review.product.name,
      productImage: review.product.images?.[0]
    }));

    res.json({
      reviews: reviewsWithProductInfo,
      total: reviews.length
    });
  } catch (error) {
    console.error('Get seller reviews error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getProductReviews,
  getSellerReviews,
  createReview,
  updateReview,
  deleteReview,
  markReviewHelpful,
  reportReview,
};