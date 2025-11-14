const inventoryService = require('../utils/inventoryService');
const Product = require('../models/Product');
const Seller = require('../models/Seller');

// @desc    Get inventory insights for seller
// @route   GET /api/inventory/insights
// @access  Private/Seller
const getInventoryInsights = async (req, res) => {
  try {
    const seller = await Seller.findOne({ user: req.user._id });
    if (!seller || !seller.isActive) {
      return res.status(403).json({ message: 'Seller account not approved' });
    }

    const insights = await inventoryService.getInventoryInsights(seller._id);
    res.json(insights);
  } catch (error) {
    console.error('Get inventory insights error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get inventory analysis for specific product
// @route   GET /api/inventory/products/:productId/analysis
// @access  Private/Seller or Admin
const getProductInventoryAnalysis = async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if user is authorized (seller owns product or is admin)
    if (req.user.role === 'seller') {
      const seller = await Seller.findOne({ user: req.user._id });
      if (!seller || product.seller.toString() !== seller._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to view this product' });
      }
    }

    const analysis = await inventoryService.analyzeInventory(productId);
    if (!analysis) {
      return res.status(404).json({ message: 'Analysis not available' });
    }

    res.json(analysis);
  } catch (error) {
    console.error('Get product inventory analysis error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get reorder quantity prediction
// @route   GET /api/inventory/products/:productId/reorder
// @access  Private/Seller or Admin
const getReorderPrediction = async (req, res) => {
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
        return res.status(403).json({ message: 'Not authorized to view this product' });
      }
    }

    const prediction = await inventoryService.predictReorderQuantity(productId);
    if (!prediction) {
      return res.status(404).json({ message: 'Prediction not available' });
    }

    res.json(prediction);
  } catch (error) {
    console.error('Get reorder prediction error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Generate purchase orders
// @route   GET /api/inventory/purchase-orders/generate
// @access  Private/Seller
const generatePurchaseOrders = async (req, res) => {
  try {
    const seller = await Seller.findOne({ user: req.user._id });
    if (!seller || !seller.isActive) {
      return res.status(403).json({ message: 'Seller account not approved' });
    }

    const purchaseOrders = await inventoryService.generatePurchaseOrders(seller._id);
    res.json(purchaseOrders);
  } catch (error) {
    console.error('Generate purchase orders error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get stock alerts
// @route   GET /api/inventory/alerts
// @access  Private/Seller
const getStockAlerts = async (req, res) => {
  try {
    const seller = await Seller.findOne({ user: req.user._id });
    if (!seller || !seller.isActive) {
      return res.status(403).json({ message: 'Seller account not approved' });
    }

    const alerts = await inventoryService.checkStockAlerts(seller._id);
    res.json(alerts);
  } catch (error) {
    console.error('Get stock alerts error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get inventory dashboard data
// @route   GET /api/inventory/dashboard
// @access  Private/Seller
const getInventoryDashboard = async (req, res) => {
  try {
    const seller = await Seller.findOne({ user: req.user._id });
    if (!seller || !seller.isActive) {
      return res.status(403).json({ message: 'Seller account not approved' });
    }

    const [insights, alerts, purchaseOrders] = await Promise.all([
      inventoryService.getInventoryInsights(seller._id),
      inventoryService.checkStockAlerts(seller._id),
      inventoryService.generatePurchaseOrders(seller._id)
    ]);

    res.json({
      insights,
      alerts,
      purchaseOrders,
      dashboard: {
        totalProducts: insights.totalProducts,
        stockHealth: {
          healthy: insights.normalStock,
          warning: insights.lowStock,
          critical: insights.criticalStock,
          overstock: insights.overstock
        },
        totalValue: insights.totalValue,
        pendingOrders: purchaseOrders.purchaseOrders.length
      }
    });
  } catch (error) {
    console.error('Get inventory dashboard error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getInventoryInsights,
  getProductInventoryAnalysis,
  getReorderPrediction,
  generatePurchaseOrders,
  getStockAlerts,
  getInventoryDashboard,
};