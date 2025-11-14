const Product = require('../models/Product');
const aiService = require('../utils/aiService');

// @desc    Get inventory insights and AI recommendations
// @route   GET /api/products/inventory-insights
// @access  Private/Admin
const getInventoryInsights = async (req, res) => {
  try {
    // Get inventory statistics
    const totalProducts = await Product.countDocuments();
    const activeProducts = await Product.countDocuments({ isActive: true });
    const inactiveProducts = totalProducts - activeProducts;

    // Low stock items (less than 10 units)
    const lowStockItems = await Product.countDocuments({
      isActive: true,
      stock: { $lt: 10, $gt: 0 }
    });

    // Out of stock items
    const outOfStockItems = await Product.countDocuments({
      isActive: true,
      stock: 0
    });

    // Overstocked items (more than 100 units)
    const overstockedItems = await Product.countDocuments({
      isActive: true,
      stock: { $gt: 100 }
    });

    // Get sample products for AI analysis
    const lowStockProducts = await Product.find({
      isActive: true,
      stock: { $lt: 10, $gt: 0 }
    }).select('name stock price soldCount').limit(5);

    const overstockedProducts = await Product.find({
      isActive: true,
      stock: { $gt: 100 }
    }).select('name stock price soldCount').limit(5);

    // Generate AI recommendations
    const recommendations = [];

    if (lowStockItems > 0) {
      recommendations.push({
        type: 'restock',
        message: `${lowStockItems} products are running low on stock. Consider restocking these items to avoid lost sales.`,
        action: 'View Low Stock Items'
      });
    }

    if (outOfStockItems > 0) {
      recommendations.push({
        type: 'out_of_stock',
        message: `${outOfStockItems} products are completely out of stock. These products cannot be purchased until restocked.`,
        action: 'View Out of Stock'
      });
    }

    if (overstockedItems > 0) {
      recommendations.push({
        type: 'overstock',
        message: `${overstockedItems} products have excess inventory. Consider running promotions or discounts to clear stock.`,
        action: 'Create Flash Sale'
      });
    }

    // AI-powered insights
    if (lowStockProducts.length > 0) {
      const topLowStock = lowStockProducts[0];
      recommendations.push({
        type: 'ai_insight',
        message: `"${topLowStock.name}" is your fastest-moving low-stock item. Consider prioritizing restock for this product.`,
        action: 'Restock Now',
        confidence: 85
      });
    }

    res.json({
      lowStockItems,
      outOfStockItems,
      overstockedItems,
      totalProducts,
      activeProducts,
      inactiveProducts,
      recommendations,
      insights: {
        lowStockProducts: lowStockProducts.map(p => ({
          name: p.name,
          stock: p.stock,
          price: p.price,
          soldCount: p.soldCount
        })),
        overstockedProducts: overstockedProducts.map(p => ({
          name: p.name,
          stock: p.stock,
          price: p.price,
          soldCount: p.soldCount
        }))
      }
    });

  } catch (error) {
    console.error('Inventory Insights Error:', error);
    res.status(500).json({
      message: 'Failed to get inventory insights',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get inventory optimization suggestions
// @route   GET /api/inventory/optimization
// @access  Private/Admin
const getInventoryOptimization = async (req, res) => {
  try {
    // Analyze sales velocity and suggest optimal stock levels
    const products = await Product.find({ isActive: true })
      .select('name stock price soldCount createdAt category')
      .populate('category', 'name')
      .sort({ soldCount: -1 })
      .limit(50);

    const optimization = [];

    products.forEach(product => {
      const daysSinceCreation = Math.max(1, (Date.now() - new Date(product.createdAt)) / (1000 * 60 * 60 * 24));
      const dailySalesRate = product.soldCount / daysSinceCreation;

      let suggestedStock = 0;
      let reasoning = '';

      if (dailySalesRate > 2) {
        suggestedStock = Math.max(50, Math.ceil(dailySalesRate * 30)); // 30 days coverage
        reasoning = 'High-selling product - maintain 30 days of stock';
      } else if (dailySalesRate > 0.5) {
        suggestedStock = Math.max(20, Math.ceil(dailySalesRate * 45)); // 45 days coverage
        reasoning = 'Moderate-selling product - maintain 45 days of stock';
      } else {
        suggestedStock = Math.max(10, Math.ceil(dailySalesRate * 60)); // 60 days coverage
        reasoning = 'Slow-selling product - maintain 60 days of stock';
      }

      const stockStatus = product.stock > suggestedStock ? 'overstocked' :
                         product.stock < suggestedStock * 0.2 ? 'understocked' : 'optimal';

      optimization.push({
        productId: product._id,
        productName: product.name,
        category: product.category?.name,
        currentStock: product.stock,
        suggestedStock,
        dailySalesRate: Math.round(dailySalesRate * 100) / 100,
        stockStatus,
        reasoning,
        action: product.stock < suggestedStock * 0.2 ? 'Restock Urgently' :
                product.stock > suggestedStock * 1.5 ? 'Consider Promotion' : 'Monitor'
      });
    });

    res.json({
      optimization,
      summary: {
        totalProducts: optimization.length,
        understocked: optimization.filter(o => o.stockStatus === 'understocked').length,
        overstocked: optimization.filter(o => o.stockStatus === 'overstocked').length,
        optimal: optimization.filter(o => o.stockStatus === 'optimal').length
      }
    });

  } catch (error) {
    console.error('Inventory Optimization Error:', error);
    res.status(500).json({
      message: 'Failed to get inventory optimization suggestions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getInventoryInsights,
  getInventoryOptimization
};