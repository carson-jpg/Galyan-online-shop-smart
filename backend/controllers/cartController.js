const Cart = require('../models/Cart');
const Product = require('../models/Product');

// @desc    Get user cart
// @route   GET /api/cart
// @access  Private
const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate({
      path: 'items.product',
      select: 'name price images stock',
    });

    if (cart) {
      res.json(cart);
    } else {
      res.json({ items: [], totalAmount: 0 });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add item to cart
// @route   POST /api/cart
// @access  Private
const addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ message: 'Insufficient stock' });
    }

    let cart = await Cart.findOne({ user: req.user._id });

    if (cart) {
      // Check if item already exists in cart
      const itemIndex = cart.items.findIndex(
        (item) => item.product.toString() === productId
      );

      if (itemIndex > -1) {
        // Update quantity of existing item
        cart.items[itemIndex].quantity += quantity;
        console.log(`Updated existing item ${cart.items[itemIndex]._id}: quantity now ${cart.items[itemIndex].quantity}`);
      } else {
        // Add new item
        cart.items.push({
          product: productId,
          quantity,
          price: product.price,
        });
        console.log(`Added new item for product ${productId}`);
      }
    } else {
      // Create new cart
      cart = new Cart({
        user: req.user._id,
        items: [
          {
            product: productId,
            quantity,
            price: product.price,
          },
        ],
      });
      console.log(`Created new cart for user ${req.user._id}`);
    }

    await cart.save();
    await cart.populate({
      path: 'items.product',
      select: 'name price images stock',
    });

    res.status(201).json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update cart item
// @route   PUT /api/cart/:itemId
// @access  Private
const updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item._id.toString() === req.params.itemId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    const product = await Product.findById(cart.items[itemIndex].product);

    if (product.stock < quantity) {
      return res.status(400).json({ message: 'Insufficient stock' });
    }

    cart.items[itemIndex].quantity = quantity;

    await cart.save();
    await cart.populate({
      path: 'items.product',
      select: 'name price images stock',
    });

    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/:itemId
// @access  Private
const removeFromCart = async (req, res) => {
  try {
    console.log('Removing item:', req.params.itemId);
    console.log('User ID:', req.user._id);

    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      console.log('Cart not found');
      return res.status(404).json({ message: 'Cart not found' });
    }

    console.log('Cart items before removal:', cart.items.map(item => ({ id: item._id.toString(), product: item.product })));

    const itemExists = cart.items.some(item => item._id.toString() === req.params.itemId);
    console.log('Item exists:', itemExists);
    console.log('Looking for item ID:', req.params.itemId);

    cart.items = cart.items.filter(
      (item) => {
        const keep = item._id.toString() !== req.params.itemId;
        console.log(`Item ${item._id.toString()}: keep=${keep}`);
        return keep;
      }
    );

    console.log('Cart items after removal:', cart.items.length);

    await cart.save();
    await cart.populate({
      path: 'items.product',
      select: 'name price images stock',
    });

    console.log('Cart saved successfully');
    res.json(cart);
  } catch (error) {
    console.error('Error removing item:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Clear cart
// @route   DELETE /api/cart
// @access  Private
const clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });

    if (cart) {
      cart.items = [];
      await cart.save();
    }

    res.json({ message: 'Cart cleared' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
};