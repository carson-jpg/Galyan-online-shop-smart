const express = require('express');
const {
  getProducts,
  getProductById,
  getProductsByCategory,
  createProduct,
  updateProduct,
  deleteProduct,
  getTopProducts,
} = require('../controllers/productController');
const { protect, admin, seller } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');

const router = express.Router();

// Public routes
router.get('/', getProducts);
router.get('/top', getTopProducts);
router.get('/category/:categoryId', getProductsByCategory);
router.get('/:id', getProductById);

// Categories route
router.get('/api/categories', async (req, res) => {
  try {
    const Category = require('../models/Category');
    const categories = await Category.find({}).select('name');
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin and Seller routes
router.post('/', protect, upload.array('images', 5), createProduct);
router.put('/:id', protect, updateProduct);
router.delete('/:id', protect, deleteProduct);

module.exports = router;