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
const { protect, admin } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');

const router = express.Router();

// Public routes
router.get('/', getProducts);
router.get('/top', getTopProducts);
router.get('/category/:categoryId', getProductsByCategory);
router.get('/:id', getProductById);

// Admin routes
router.post('/', protect, admin, upload.array('images', 5), createProduct);
router.put('/:id', protect, admin, updateProduct);
router.delete('/:id', protect, admin, deleteProduct);

module.exports = router;