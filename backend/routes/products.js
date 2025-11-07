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

// Admin and Seller routes
router.post('/', protect, upload.array('images', 5), createProduct);
router.put('/:id', protect, updateProduct);
router.delete('/:id', protect, deleteProduct);

module.exports = router;