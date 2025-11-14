const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Seller = require('../models/Seller');
const User = require('../models/User');
const emailService = require('../utils/emailService');
const fraudDetectionService = require('../utils/fraudDetectionService');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res) => {
  try {
    const {
      orderItems,
      shippingAddress,
      paymentMethod,
      taxPrice,
      shippingPrice,
      totalPrice,
    } = req.body;

    if (orderItems && orderItems.length === 0) {
      return res.status(400).json({ message: 'No order items' });
    }

    // Check stock availability
    for (const item of orderItems) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ message: `Product ${item.name} not found` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for ${product.name}. Available: ${product.stock}`,
        });
      }
    }

    // Update product stock
    for (const item of orderItems) {
      const product = await Product.findById(item.product);
      product.stock -= item.quantity;
      await product.save();
    }

    const order = new Order({
      user: req.user._id,
      orderItems,
      shippingAddress,
      paymentMethod,
      taxPrice,
      shippingPrice,
      totalPrice,
    });

    // Perform fraud detection analysis
    const fraudAnalysis = await fraudDetectionService.analyzeOrder({
      ...order.toObject(),
      customer: req.user._id
    });

    // Add fraud analysis to order
    order.fraudAnalysis = fraudAnalysis;

    // If high risk, flag for manual review
    if (fraudAnalysis.riskLevel === 'high') {
      order.status = 'Under Review';
      order.fraudFlags = fraudAnalysis.flags;
    }

    const createdOrder = await order.save();

    // Clear user's cart after successful order
    await Cart.findOneAndUpdate(
      { user: req.user._id },
      { items: [], totalAmount: 0 }
    );

    // Send order confirmation email
    try {
      const user = await User.findById(req.user._id);
      await emailService.sendOrderConfirmationEmail(createdOrder, user);
    } catch (emailError) {
      console.error('Error sending order confirmation email:', emailError);
      // Don't fail the order creation if email fails
    }

    res.status(201).json(createdOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate(
      'user',
      'name email'
    );

    if (order) {
      // Check if user owns this order or is admin
      if (order.user._id.toString() === req.user._id.toString() || req.user.role === 'admin') {
        res.json(order);
      } else {
        res.status(401).json({ message: 'Not authorized to view this order' });
      }
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin or Private/Seller
const getOrders = async (req, res) => {
  try {
    let query = {};

    // If seller, filter orders to only show orders for their products
    if (req.user.role === 'seller') {
      try {
        const seller = await Seller.findOne({ user: req.user._id });
        if (!seller || !seller.isActive) {
          return res.status(403).json({ message: 'Seller account not approved' });
        }

        // Get all products by this seller
        const sellerProducts = await Product.find({ seller: seller._id }).select('_id');
        const productIds = sellerProducts.map(p => p._id);

        // Filter orders that contain seller's products
        query = {
          'orderItems.product': { $in: productIds }
        };
      } catch (sellerError) {
        console.error('Seller lookup error:', sellerError);
        return res.status(500).json({ message: 'Error processing seller orders' });
      }
    }

    const orders = await Order.find(query)
      .populate('user', 'id name email')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update order to delivered
// @route   PUT /api/orders/:id/deliver
// @access  Private/Admin
const updateOrderToDelivered = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (order) {
      order.isDelivered = true;
      order.deliveredAt = Date.now();
      order.status = 'Delivered';

      const updatedOrder = await order.save();

      // Send order status update email
      try {
        const user = await User.findById(order.user);
        await emailService.sendOrderStatusUpdateEmail(updatedOrder, user, status);
      } catch (emailError) {
        console.error('Error sending order status update email:', emailError);
        // Don't fail the status update if email fails
      }

      res.json(updatedOrder);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin or Private/Seller
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);

    if (order) {
      // If seller, check if they own products in this order
      if (req.user.role === 'seller') {
        try {
          const seller = await Seller.findOne({ user: req.user._id });
          if (!seller || !seller.isActive) {
            return res.status(403).json({ message: 'Seller account not approved' });
          }

          // Check if seller owns any products in this order
          const sellerProducts = await Product.find({ seller: seller._id }).select('_id');
          const productIds = sellerProducts.map(p => p._id);
          const hasSellerProducts = order.orderItems.some(item =>
            productIds.some(pid => pid.toString() === item.product.toString())
          );

          if (!hasSellerProducts) {
            return res.status(403).json({ message: 'Not authorized to update this order' });
          }
        } catch (sellerError) {
          console.error('Seller authorization error:', sellerError);
          return res.status(500).json({ message: 'Error checking seller authorization' });
        }
      }

      order.status = status;

      if (status === 'Delivered') {
        order.isDelivered = true;
        order.deliveredAt = Date.now();
      }

      const updatedOrder = await order.save();
      res.json(updatedOrder);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get seller stats
// @route   GET /api/orders/seller-stats
// @access  Private/Seller
const getSellerStats = async (req, res) => {
  try {
    const seller = await Seller.findOne({ user: req.user._id });
    if (!seller || !seller.isActive) {
      return res.status(403).json({ message: 'Seller account not approved' });
    }

    // Get all products by this seller
    const sellerProducts = await Product.find({ seller: seller._id }).select('_id');
    const productIds = sellerProducts.map(p => p._id);

    // Get orders containing seller's products
    const orders = await Order.find({
      'orderItems.product': { $in: productIds },
      isPaid: true
    }).populate('orderItems.product');

    let totalSales = 0;
    let totalEarnings = 0;
    const totalOrders = orders.length;

    orders.forEach(order => {
      order.orderItems.forEach(item => {
        if (productIds.some(pid => pid.toString() === item.product._id.toString())) {
          const itemTotal = item.price * item.quantity;
          totalSales += itemTotal;
          totalEarnings += itemTotal - (itemTotal * (seller.commissionRate / 100));
        }
      });
    });

    res.json({
      totalProducts: sellerProducts.length,
      totalOrders,
      totalSales,
      totalEarnings
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get fraud detection statistics
// @route   GET /api/orders/fraud-stats
// @access  Private/Admin
const getFraudStats = async (req, res) => {
  try {
    const timeframe = parseInt(req.query.days) || 30;
    const stats = await fraudDetectionService.getFraudStatistics(timeframe);

    res.json(stats);
  } catch (error) {
    console.error('Get fraud stats error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Review and approve/reject order under fraud review
// @route   PUT /api/orders/:id/fraud-review
// @access  Private/Admin
const reviewFraudOrder = async (req, res) => {
  try {
    const { action, notes } = req.body; // action: 'approve' or 'reject'
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (action === 'approve') {
      order.status = 'Processing';
      order.fraudReviewNotes = notes;
      order.fraudReviewStatus = 'approved';
    } else if (action === 'reject') {
      order.status = 'Cancelled';
      order.fraudReviewNotes = notes;
      order.fraudReviewStatus = 'rejected';

      // Restore product stock
      for (const item of order.orderItems) {
        const product = await Product.findById(item.product);
        if (product) {
          product.stock += item.quantity;
          await product.save();
        }
      }
    }

    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } catch (error) {
    console.error('Review fraud order error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createOrder,
  getOrderById,
  getMyOrders,
  getOrders,
  updateOrderToDelivered,
  updateOrderStatus,
  getSellerStats,
  getFraudStats,
  reviewFraudOrder,
};