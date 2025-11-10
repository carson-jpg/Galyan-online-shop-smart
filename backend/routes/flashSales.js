const express = require('express');
const {
  getActiveFlashSales,
  getFlashSaleById,
  createFlashSale,
  updateFlashSale,
  deleteFlashSale,
  getAllFlashSales,
  purchaseFlashSale,
} = require('../controllers/flashSaleController');
const { protect, admin, seller } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/', getActiveFlashSales);
router.get('/:id', getFlashSaleById);
router.post('/:id/purchase', protect, purchaseFlashSale);

// Admin and Seller routes
router.post('/', protect, admin, createFlashSale);
router.put('/:id', protect, admin, updateFlashSale);
router.delete('/:id', protect, admin, deleteFlashSale);
router.get('/admin/all', protect, admin, getAllFlashSales);

// Seller routes for managing their own flash sales
router.post('/seller', protect, seller, createFlashSale);
router.put('/seller/:id', protect, seller, updateFlashSale);
router.delete('/seller/:id', protect, seller, deleteFlashSale);

module.exports = router;