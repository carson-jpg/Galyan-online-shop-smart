const FlashSale = require('../models/FlashSale');
const Product = require('../models/Product');

// @desc    Get all active flash sales
// @route   GET /api/flash-sales
// @access  Public
const getActiveFlashSales = async (req, res) => {
  try {
    // Update expired and sold out sales first
    await FlashSale.updateExpiredSales();
    await FlashSale.updateSoldOutSales();

    const flashSales = await FlashSale.find({ status: 'active' })
      .populate('product', 'name images price stock')
      .sort({ createdAt: -1 });

    res.json(flashSales);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get flash sale by ID
// @route   GET /api/flash-sales/:id
// @access  Public
const getFlashSaleById = async (req, res) => {
  try {
    const flashSale = await FlashSale.findById(req.params.id)
      .populate('product')
      .populate('createdBy', 'name');

    if (flashSale) {
      res.json(flashSale);
    } else {
      res.status(404).json({ message: 'Flash sale not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a flash sale
// @route   POST /api/flash-sales
// @access  Private/Admin
const createFlashSale = async (req, res) => {
  try {
    const { productId, flashPrice, quantity } = req.body;
    const createdBy = req.user._id;

    // Validate product exists and is active
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (!product.isActive) {
      return res.status(400).json({ message: 'Product is not active' });
    }

    // Check if product already has an active flash sale
    const existingFlashSale = await FlashSale.findOne({
      product: productId,
      status: 'active'
    });

    if (existingFlashSale) {
      return res.status(400).json({ message: 'Product already has an active flash sale' });
    }

    // Validate flash price is lower than original price
    if (flashPrice >= product.price) {
      return res.status(400).json({ message: 'Flash sale price must be lower than regular price' });
    }

    // Validate quantity
    if (quantity > product.stock) {
      return res.status(400).json({ message: 'Flash sale quantity cannot exceed product stock' });
    }

    const flashSale = new FlashSale({
      product: productId,
      flashPrice,
      quantity,
      createdBy
    });

    const createdFlashSale = await flashSale.save();

    // Update product to reference the flash sale
    await Product.findByIdAndUpdate(productId, { flashSale: createdFlashSale._id });

    await createdFlashSale.populate('product', 'name images price stock');
    await createdFlashSale.populate('createdBy', 'name');

    res.status(201).json(createdFlashSale);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update flash sale
// @route   PUT /api/flash-sales/:id
// @access  Private/Admin
const updateFlashSale = async (req, res) => {
  try {
    const { flashPrice, quantity } = req.body;

    const flashSale = await FlashSale.findById(req.params.id);

    if (!flashSale) {
      return res.status(404).json({ message: 'Flash sale not found' });
    }

    // Only allow updates if flash sale is still active
    if (flashSale.status !== 'active') {
      return res.status(400).json({ message: 'Cannot update expired or sold out flash sale' });
    }

    // Validate new quantity against product stock
    if (quantity) {
      const product = await Product.findById(flashSale.product);
      if (quantity > product.stock) {
        return res.status(400).json({ message: 'Flash sale quantity cannot exceed product stock' });
      }
      flashSale.quantity = quantity;
    }

    if (flashPrice) {
      const product = await Product.findById(flashSale.product);
      if (flashPrice >= product.price) {
        return res.status(400).json({ message: 'Flash sale price must be lower than regular price' });
      }
      flashSale.flashPrice = flashPrice;
    }

    const updatedFlashSale = await flashSale.save();
    await updatedFlashSale.populate('product', 'name images price stock');
    await updatedFlashSale.populate('createdBy', 'name');

    res.json(updatedFlashSale);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete flash sale
// @route   DELETE /api/flash-sales/:id
// @access  Private/Admin
const deleteFlashSale = async (req, res) => {
  try {
    const flashSale = await FlashSale.findById(req.params.id);

    if (!flashSale) {
      return res.status(404).json({ message: 'Flash sale not found' });
    }

    // Remove flash sale reference from product
    await Product.findByIdAndUpdate(flashSale.product, { $unset: { flashSale: 1 } });

    await flashSale.remove();
    res.json({ message: 'Flash sale removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all flash sales (admin)
// @route   GET /api/flash-sales/admin/all
// @access  Private/Admin
const getAllFlashSales = async (req, res) => {
  try {
    const pageSize = 10;
    const page = Number(req.query.pageNumber) || 1;

    const count = await FlashSale.countDocuments({});
    const flashSales = await FlashSale.find({})
      .populate('product', 'name images price stock')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .limit(pageSize)
      .skip(pageSize * (page - 1));

    res.json({
      flashSales,
      page,
      pages: Math.ceil(count / pageSize),
      total: count,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Purchase flash sale item
// @route   POST /api/flash-sales/:id/purchase
// @access  Private
const purchaseFlashSale = async (req, res) => {
  try {
    const { quantity = 1 } = req.body;
    const userId = req.user._id;

    const flashSale = await FlashSale.findById(req.params.id).populate('product');

    if (!flashSale) {
      return res.status(404).json({ message: 'Flash sale not found' });
    }

    if (flashSale.status !== 'active') {
      return res.status(400).json({ message: 'Flash sale is not active' });
    }

    if (flashSale.isExpired) {
      flashSale.status = 'expired';
      await flashSale.save();
      return res.status(400).json({ message: 'Flash sale has expired' });
    }

    if (flashSale.isSoldOut || flashSale.soldQuantity + quantity > flashSale.quantity) {
      return res.status(400).json({ message: 'Flash sale is sold out' });
    }

    // Check product stock
    if (flashSale.product.stock < quantity) {
      return res.status(400).json({ message: 'Insufficient product stock' });
    }

    // Update flash sale sold quantity
    flashSale.soldQuantity += quantity;

    // Check if now sold out
    if (flashSale.soldQuantity >= flashSale.quantity) {
      flashSale.status = 'sold_out';
    }

    await flashSale.save();

    // Update product stock
    flashSale.product.stock -= quantity;
    await flashSale.product.save();

    res.json({
      message: 'Purchase successful',
      remainingQuantity: flashSale.quantity - flashSale.soldQuantity,
      isSoldOut: flashSale.status === 'sold_out'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getActiveFlashSales,
  getFlashSaleById,
  createFlashSale,
  updateFlashSale,
  deleteFlashSale,
  getAllFlashSales,
  purchaseFlashSale,
};