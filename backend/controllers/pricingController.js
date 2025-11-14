const Product = require('../models/Product');
const Order = require('../models/Order');
const aiService = require('../utils/aiService');

// @desc    Get pricing analysis for a product
// @route   GET /api/products/pricing-analysis/:id
// @access  Private/Admin or Private/Seller
const getPricingAnalysis = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id).populate('category', 'name');

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if user is authorized (admin or product seller)
    if (req.user.role !== 'admin') {
      const sellerProducts = await Product.find({ seller: req.user._id });
      const isOwner = sellerProducts.some(p => p._id.toString() === id);
      if (!isOwner) {
        return res.status(403).json({ message: 'Not authorized to view pricing analysis for this product' });
      }
    }

    // Get current pricing data
    const currentPrice = product.price;
    const originalPrice = product.originalPrice || currentPrice;

    // Get competitor pricing (mock data - in real implementation, this would come from market data)
    const competitors = [
      { name: 'Shop A', price: currentPrice * 0.95 },
      { name: 'Shop B', price: currentPrice * 1.05 },
      { name: 'Shop C', price: currentPrice * 0.98 },
      { name: 'Shop D', price: currentPrice * 1.12 }
    ];

    // Calculate price range based on competitors and costs
    const competitorPrices = competitors.map(c => c.price);
    const minCompetitorPrice = Math.min(...competitorPrices);
    const maxCompetitorPrice = Math.max(...competitorPrices);

    // Assume cost is 60% of current price (rough estimate)
    const estimatedCost = currentPrice * 0.6;
    const minPrice = Math.max(estimatedCost * 1.1, minCompetitorPrice * 0.9);
    const maxPrice = Math.min(currentPrice * 1.5, maxCompetitorPrice * 1.2);

    const priceRange = {
      min: Math.round(minPrice),
      max: Math.round(maxPrice)
    };

    // Get sales data for the product
    const productOrders = await Order.find({
      'orderItems.product': product._id,
      isPaid: true
    });

    const totalSold = productOrders.reduce((sum, order) => {
      const item = order.orderItems.find(i => i.product.toString() === product._id);
      return sum + (item ? item.quantity : 0);
    }, 0);

    // Calculate demand score based on sales velocity
    const daysSinceCreation = Math.max(1, (Date.now() - new Date(product.createdAt)) / (1000 * 60 * 60 * 24));
    const dailySalesRate = totalSold / daysSinceCreation;

    let demandScore = 5; // default medium demand
    if (dailySalesRate > 5) demandScore = 9; // high demand
    else if (dailySalesRate > 2) demandScore = 7; // good demand
    else if (dailySalesRate < 0.5) demandScore = 3; // low demand

    // Calculate profit margin (rough estimate)
    const profitMargin = Math.round(((currentPrice - estimatedCost) / currentPrice) * 100);

    // AI recommended price (simple algorithm for now)
    let recommendedPrice = currentPrice;
    let reasoning = '';

    if (demandScore >= 8 && currentPrice < maxPrice * 0.9) {
      // High demand, can increase price
      recommendedPrice = Math.min(currentPrice * 1.15, maxPrice);
      reasoning = 'High demand detected - consider price increase';
    } else if (demandScore <= 4 && currentPrice > minPrice * 1.1) {
      // Low demand, consider discount
      recommendedPrice = Math.max(currentPrice * 0.9, minPrice);
      reasoning = 'Low demand - consider competitive pricing';
    } else if (competitorPrices.some(p => p < currentPrice * 0.95)) {
      // Competitors are cheaper
      recommendedPrice = Math.max(currentPrice * 0.95, minPrice);
      reasoning = 'Competitors offer lower prices - consider matching';
    } else {
      reasoning = 'Current price appears optimal based on market conditions';
    }

    recommendedPrice = Math.round(recommendedPrice);

    // Market analysis insights
    const marketAnalysis = {
      insights: [
        demandScore >= 8 ? 'High demand product - pricing power available' : 'Moderate demand - monitor competitor pricing',
        profitMargin > 30 ? 'Healthy profit margins maintained' : 'Profit margins could be optimized',
        totalSold > 50 ? 'Proven product performance' : 'New product - monitor sales trends',
        `Price positioned ${currentPrice > recommendedPrice ? 'above' : 'below'} market average`
      ]
    };

    // Confidence score based on data availability
    const confidence = Math.min(95, Math.max(70, totalSold * 2 + demandScore * 5));

    res.json({
      currentPrice,
      recommendedPrice,
      priceRange,
      marketAnalysis,
      competitorPrices: competitors,
      demandScore,
      profitMargin,
      confidence,
      reasoning,
      salesData: {
        totalSold,
        dailySalesRate: Math.round(dailySalesRate * 100) / 100,
        daysSinceLaunch: Math.round(daysSinceCreation)
      }
    });

  } catch (error) {
    console.error('Pricing Analysis Error:', error);
    res.status(500).json({
      message: 'Failed to get pricing analysis',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Apply AI recommended pricing
// @route   POST /api/products/optimize-price/:id
// @access  Private/Admin or Private/Seller
const optimizeProductPrice = async (req, res) => {
  try {
    const { id } = req.params;
    const { customPrice } = req.body;

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check authorization
    if (req.user.role !== 'admin') {
      const sellerProducts = await Product.find({ seller: req.user._id });
      const isOwner = sellerProducts.some(p => p._id.toString() === id);
      if (!isOwner) {
        return res.status(403).json({ message: 'Not authorized to modify this product' });
      }
    }

    // Get pricing analysis
    const analysisResponse = await getPricingAnalysis({
      params: { id },
      user: req.user
    }, {
      json: () => {},
      status: () => ({ json: () => {} })
    });

    // For now, use the recommended price or custom price
    const newPrice = customPrice || analysisResponse.recommendedPrice || product.price;

    // Update product price
    product.price = newPrice;
    await product.save();

    res.json({
      success: true,
      message: 'Product price optimized successfully',
      newPrice,
      previousPrice: product.price,
      priceChange: ((newPrice - product.price) / product.price) * 100
    });

  } catch (error) {
    console.error('Price Optimization Error:', error);
    res.status(500).json({
      message: 'Failed to optimize product price',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getPricingAnalysis,
  optimizeProductPrice
};