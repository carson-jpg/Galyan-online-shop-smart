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

    // Update product stock and sold count
    for (const item of orderItems) {
      const product = await Product.findById(item.product);
      product.stock -= item.quantity;
      product.soldCount = (product.soldCount || 0) + item.quantity;
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

    console.log('Getting orders for user:', req.user._id, 'role:', req.user.role);

    // If seller, filter orders to only show orders for their products
    if (req.user.role === 'seller') {
      try {
        const seller = await Seller.findOne({ user: req.user._id });
        if (!seller || !seller.isActive) {
          console.log('Seller not found or not active');
          return res.status(403).json({ message: 'Seller account not approved' });
        }

        console.log('Found seller:', seller._id);

        // Get all products by this seller
        const sellerProducts = await Product.find({ seller: seller._id }).select('_id');
        const productIds = sellerProducts.map(p => p._id);

        console.log('Seller products count:', productIds.length);
        console.log('Product IDs:', productIds);

        if (productIds.length === 0) {
          console.log('No products found for seller, returning empty array');
          return res.json([]);
        }

        // Filter orders that contain seller's products
        query = {
          'orderItems.product': { $in: productIds }
          // Removed isPaid filter so sellers can see all orders for their products
        };

        console.log('Query for seller orders:', query);
      } catch (sellerError) {
        console.error('Seller lookup error:', sellerError);
        return res.status(500).json({ message: 'Error processing seller orders' });
      }
    }

    const orders = await Order.find(query)
      .populate('user', 'id name email')
      .sort({ createdAt: -1 });

    console.log('Found orders count:', orders.length);

    // For sellers, also populate order items to show product details
    if (req.user.role === 'seller') {
      await Order.populate(orders, {
        path: 'orderItems.product',
        select: 'name images price'
      });
    }

    res.json(orders);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      message: 'Failed to get orders',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
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
    // Validate user authentication
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    console.log('Getting seller stats for user:', req.user._id);

    // Validate seller exists and is active
    const seller = await Seller.findOne({ user: req.user._id });
    if (!seller) {
      console.log('Seller profile not found');
      return res.status(404).json({ message: 'Seller profile not found' });
    }

    if (!seller.isActive) {
      console.log('Seller account not approved');
      return res.status(403).json({ message: 'Seller account not approved' });
    }

    console.log('Found seller:', seller._id);

    // Get all products by this seller
    let sellerProducts = [];
    try {
      sellerProducts = await Product.find({ seller: seller._id }).select('_id');
    } catch (productError) {
      console.error('Error fetching seller products:', productError);
      return res.status(500).json({ message: 'Error fetching seller products' });
    }

    const productIds = sellerProducts.map(p => p._id);
    console.log('Seller products:', productIds.length);

    // If no products, return zero stats
    if (productIds.length === 0) {
      console.log('No products found for seller');
      return res.json({
        totalProducts: 0,
        totalOrders: 0,
        totalSales: 0,
        totalEarnings: 0
      });
    }

    // Get orders containing seller's products (include both paid and unpaid for dashboard visibility)
    let orders = [];
    try {
      orders = await Order.find({
        'orderItems.product': { $in: productIds }
        // Removed isPaid: true filter so sellers can see all their orders
      });
    } catch (orderError) {
      console.error('Error fetching orders:', orderError);
      return res.status(500).json({ message: 'Error fetching order data' });
    }

    console.log('Orders found:', orders.length);

    let totalSales = 0;
    let totalEarnings = 0;
    const totalOrders = orders.length;

    // Calculate stats safely
    try {
      orders.forEach(order => {
        if (order && order.orderItems && Array.isArray(order.orderItems)) {
          order.orderItems.forEach(item => {
            if (item && item.product && productIds.some(pid => pid.toString() === item.product.toString())) {
              const itemTotal = (item.price || 0) * (item.quantity || 0);
              totalSales += itemTotal;
              totalEarnings += itemTotal - (itemTotal * ((seller.commissionRate || 10) / 100));

              // Update product soldCount
              try {
                Product.findByIdAndUpdate(item.product, { $inc: { soldCount: item.quantity } }).exec();
              } catch (updateError) {
                console.error('Error updating soldCount for product:', item.product, updateError);
              }
            }
          });
        }
      });
    } catch (calcError) {
      console.error('Error calculating stats:', calcError);
      return res.status(500).json({ message: 'Error calculating seller statistics' });
    }

    console.log('Stats calculated:', { totalSales, totalEarnings, totalOrders });

    res.json({
      totalProducts: sellerProducts.length,
      totalOrders,
      totalSales,
      totalEarnings
    });
  } catch (error) {
    console.error('Get seller stats error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    res.status(500).json({
      message: 'Failed to get seller stats',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
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

      // Restore product stock and decrement sold count
      for (const item of order.orderItems) {
        const product = await Product.findById(item.product);
        if (product) {
          product.stock += item.quantity;
          product.soldCount = Math.max(0, (product.soldCount || 0) - item.quantity);
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