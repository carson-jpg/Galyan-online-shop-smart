const User = require('../models/User');
const Seller = require('../models/Seller');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Order = require('../models/Order');

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
const getUsers = async (req, res) => {
  try {
    const pageSize = 10;
    const page = Number(req.query.pageNumber) || 1;
    const count = await User.countDocuments({});
    const users = await User.find({})
      .select('-password')
      .limit(pageSize)
      .skip(pageSize * (page - 1))
      .sort({ createdAt: -1 });

    res.json({
      users,
      page,
      pages: Math.ceil(count / pageSize),
      total: count,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      await user.remove();
      res.json({ message: 'User removed' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all categories
// @route   GET /api/admin/categories
// @access  Private/Admin
const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({})
      .populate('parent', 'name')
      .sort({ createdAt: -1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a category
// @route   POST /api/admin/categories
// @access  Private/Admin
const createCategory = async (req, res) => {
  try {
    const { name, description, image, parent } = req.body;

    const categoryExists = await Category.findOne({ name, parent: parent || null });

    if (categoryExists) {
      return res.status(400).json({ message: 'Category already exists' });
    }

    const category = new Category({
      name,
      description,
      image,
      parent: parent || null,
    });

    const createdCategory = await category.save();
    await createdCategory.populate('parent', 'name');
    res.status(201).json(createdCategory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update category
// @route   PUT /api/admin/categories/:id
// @access  Private/Admin
const updateCategory = async (req, res) => {
  try {
    const { name, description, image, isActive, parent } = req.body;

    const category = await Category.findById(req.params.id);

    if (category) {
      category.name = name || category.name;
      category.description = description || category.description;
      category.image = image || category.image;
      category.isActive = isActive !== undefined ? isActive : category.isActive;
      category.parent = parent !== undefined ? parent : category.parent;

      const updatedCategory = await category.save();
      await updatedCategory.populate('parent', 'name');
      res.json(updatedCategory);
    } else {
      res.status(404).json({ message: 'Category not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete category
// @route   DELETE /api/admin/categories/:id
// @access  Private/Admin
const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (category) {
      await category.remove();
      res.json({ message: 'Category removed' });
    } else {
      res.status(404).json({ message: 'Category not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all products (admin)
// @route   GET /api/admin/products
// @access  Private/Admin
const getAdminProducts = async (req, res) => {
  try {
    const pageSize = 20;
    const page = Number(req.query.pageNumber) || 1;
    const count = await Product.countDocuments({});
    const products = await Product.find({})
      .populate('category', 'name')
      .limit(pageSize)
      .skip(pageSize * (page - 1))
      .sort({ createdAt: -1 });

    res.json({
      products,
      page,
      pages: Math.ceil(count / pageSize),
      total: count,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all orders (admin)
// @route   GET /api/admin/orders
// @access  Private/Admin
const getAllOrders = async (req, res) => {
  try {
    const pageSize = 20;
    const page = Number(req.query.pageNumber) || 1;
    const count = await Order.countDocuments({});
    const orders = await Order.find({})
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 })
      .limit(pageSize)
      .skip(pageSize * (page - 1));

    res.json({
      orders,
      page,
      pages: Math.ceil(count / pageSize),
      total: count,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all payments/transactions (admin)
// @route   GET /api/admin/payments
// @access  Private/Admin
const getAllPayments = async (req, res) => {
  try {
    const pageSize = 20;
    const page = Number(req.query.pageNumber) || 1;

    // Get orders with payment information
    const matchConditions = {};
    if (req.query.status) {
      matchConditions.isPaid = req.query.status === 'paid';
    }

    const count = await Order.countDocuments(matchConditions);
    const payments = await Order.find(matchConditions)
      .populate('user', 'name email phone')
      .select('user paymentMethod paymentResult totalPrice isPaid paidAt mpesaTransactionId mpesaReceiptNumber createdAt')
      .sort({ createdAt: -1 })
      .limit(pageSize)
      .skip(pageSize * (page - 1));

    res.json({
      payments,
      page,
      pages: Math.ceil(count / pageSize),
      total: count,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get dashboard stats
// @route   GET /api/admin/dashboard
// @access  Private/Admin
const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({});
    const totalProducts = await Product.countDocuments({});
    const totalOrders = await Order.countDocuments({});
    const totalCategories = await Category.countDocuments({});

    const recentOrders = await Order.find({})
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);

    const monthlyRevenue = await Order.aggregate([
      {
        $match: {
          isPaid: true,
          createdAt: {
            $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalPrice' },
        },
      },
    ]);

    res.json({
      totalUsers,
      totalProducts,
      totalOrders,
      totalCategories,
      recentOrders,
      monthlyRevenue: monthlyRevenue[0]?.total || 0,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all sellers for approval
// @route   GET /api/admin/sellers
// @access  Private/Admin
const getSellers = async (req, res) => {
  try {
    const pageSize = 10;
    const page = Number(req.query.pageNumber) || 1;
    const status = req.query.status; // pending, approved, rejected

    // Build match conditions for Seller model
    const sellerMatchConditions = {};
    if (status) {
      // We need to match against the user's sellerStatus
      // Since we're querying Seller, we need to use aggregation or join
      const userIds = await User.find({ role: 'seller', sellerStatus: status }).select('_id');
      sellerMatchConditions.user = { $in: userIds.map(u => u._id) };
    }

    const count = await Seller.countDocuments(sellerMatchConditions);
    const sellers = await Seller.find(sellerMatchConditions)
      .populate({
        path: 'user',
        model: 'User',
        select: 'name email phone sellerStatus createdAt'
      })
      .limit(pageSize)
      .skip(pageSize * (page - 1))
      .sort({ createdAt: -1 });

    console.log('Sellers found:', sellers.length);
    console.log('First seller:', sellers[0] ? { businessName: sellers[0].businessName, user: sellers[0].user } : 'No sellers');

    res.json({
      sellers,
      page,
      pages: Math.ceil(count / pageSize),
      total: count,
    });
  } catch (error) {
    console.error('getSellers error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Approve or reject seller
// @route   PUT /api/admin/sellers/:id
// @access  Private/Admin
const updateSellerStatus = async (req, res) => {
  try {
    const { status, commissionRate } = req.body; // status: 'approved' or 'rejected'

    const user = await User.findById(req.params.id);

    if (!user || user.role !== 'seller') {
      return res.status(404).json({ message: 'Seller not found' });
    }

    user.sellerStatus = status;

    if (status === 'approved') {
      const seller = await Seller.findOne({ user: user._id });
      if (seller) {
        seller.isActive = true;
        seller.commissionRate = commissionRate || seller.commissionRate;
        await seller.save();
      }
    }

    await user.save();

    res.json({
      message: `Seller ${status}`,
      seller: user
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get seller details
// @route   GET /api/admin/sellers/:id
// @access  Private/Admin
const getSellerDetails = async (req, res) => {
  try {
    const seller = await Seller.findOne({ user: req.params.id }).populate('user', '-password');

    if (seller) {
      res.json(seller);
    } else {
      res.status(404).json({ message: 'Seller not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getUsers,
  deleteUser,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getAdminProducts,
  getAllOrders,
  getAllPayments,
  getDashboardStats,
  getSellers,
  updateSellerStatus,
  getSellerDetails,
};
