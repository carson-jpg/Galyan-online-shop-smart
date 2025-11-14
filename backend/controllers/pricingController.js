const pricingService = require('../utils/pricingService');
const Product = require('../models/Product');
const Seller = require('../models/Seller');

// @desc    Analyze pricing for a product
// @route   GET /api/pricing/products/:productId/analyze
// @access  Private/Seller or Admin
const analyzeProductPricing = async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if user is authorized
    if (req.user.role === 'seller') {
      const seller = await Seller.findOne({ user: req.user._id });
      if (!seller || product.seller.toString() !== seller._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to analyze this product' });
      }
    }

    const analysis = await pricingService.analyzePricing(productId);

    if (!analysis) {
      return res.status(404).json({ message: 'Pricing analysis not available' });
    }

    res.json(analysis);
  } catch (error) {
    console.error('Analyze product pricing error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get pricing recommendations for seller
// @route   GET /api/pricing/recommendations
// @access  Private/Seller
const getPricingRecommendations = async (req, res) => {
  try {
    const seller = await Seller.findOne({ user: req.user._id });
    if (!seller || !seller.isActive) {
      return res.status(403).json({ message: 'Seller account not approved' });
    }

    const recommendations = await pricingService.getPricingRecommendations(seller._id);
    res.json(recommendations);
  } catch (error) {
    console.error('Get pricing recommendations error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Apply dynamic pricing
// @route   PUT /api/pricing/products/:productId/apply
// @access  Private/Seller or Admin
const applyDynamicPricing = async (req, res) => {
  try {
    const { productId } = req.params;
    const { newPrice, reason } = req.body;

    if (!newPrice || isNaN(newPrice) || newPrice <= 0) {
      return res.status(400).json({ message: 'Valid new price is required' });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if user is authorized
    if (req.user.role === 'seller') {
      const seller = await Seller.findOne({ user: req.user._id });
      if (!seller || product.seller.toString() !== seller._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to modify this product' });
      }
    }

    const result = await pricingService.applyDynamicPricing(productId, newPrice, reason || 'AI optimization');

    if (!result.success) {
      return res.status(400).json({ message: result.error });
    }

    res.json(result);
  } catch (error) {
    console.error('Apply dynamic pricing error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get pricing dashboard data
// @route   GET /api/pricing/dashboard
// @access  Private/Seller
const getPricingDashboard = async (req, res) => {
  try {
    const seller = await Seller.findOne({ user: req.user._id });
    if (!seller || !seller.isActive) {
      return res.status(403).json({ message: 'Seller account not approved' });
    }

    const recommendations = await pricingService.getPricingRecommendations(seller._id);

    // Calculate dashboard metrics
    const totalProducts = recommendations.totalProducts;
    const opportunities = recommendations.recommendations.filter(r => r.priceDifference > 5);
    const risks = recommendations.recommendations.filter(r => r.priceDifference < -5);

    const potentialRevenueIncrease = opportunities.reduce((sum, r) => {
      // Estimate revenue impact (simplified)
      return sum + (r.priceDifference / 100) * r.currentPrice;
    }, 0);

    res.json({
      summary: {
        totalProducts,
        pricingOpportunities: opportunities.length,
        pricingRisks: risks.length,
        potentialRevenueIncrease: Math.round(potentialRevenueIncrease)
      },
      recommendations: recommendations.recommendations.slice(0, 10), // Top 10
      generatedAt: new Date()
    });
  } catch (error) {
    console.error('Get pricing dashboard error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Bulk apply pricing recommendations
// @route   POST /api/pricing/bulk-apply
// @access  Private/Seller
const bulkApplyPricing = async (req, res) => {
  try {
    const { recommendations } = req.body;

    if (!Array.isArray(recommendations) || recommendations.length === 0) {
      return res.status(400).json({ message: 'Valid recommendations array is required' });
    }

    const seller = await Seller.findOne({ user: req.user._id });
    if (!seller || !seller.isActive) {
      return res.status(403).json({ message: 'Seller account not approved' });
    }

    const results = [];
    let successCount = 0;
    let failureCount = 0;

    for (const rec of recommendations.slice(0, 10)) { // Limit bulk operations
      try {
        // Verify product ownership
        const product = await Product.findById(rec.productId);
        if (product && product.seller.toString() === seller._id.toString()) {
          const result = await pricingService.applyDynamicPricing(
            rec.productId,
            rec.recommendedPrice,
            'Bulk AI optimization'
          );

          if (result.success) {
            successCount++;
            results.push(result);
          } else {
            failureCount++;
            results.push({ ...result, productId: rec.productId });
          }
        } else {
          failureCount++;
          results.push({
            productId: rec.productId,
            success: false,
            error: 'Product not found or not owned by seller'
          });
        }
      } catch (error) {
        failureCount++;
        results.push({
          productId: rec.productId,
          success: false,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      results,
      summary: {
        total: recommendations.length,
        successful: successCount,
        failed: failureCount
      }
    });
  } catch (error) {
    console.error('Bulk apply pricing error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  analyzeProductPricing,
  getPricingRecommendations,
  applyDynamicPricing,
  getPricingDashboard,
  bulkApplyPricing,
};