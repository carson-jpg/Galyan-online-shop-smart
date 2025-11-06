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
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/', getActiveFlashSales);
router.get('/:id', getFlashSaleById);
router.post('/:id/purchase', protect, purchaseFlashSale);

// Admin routes
router.post('/', protect, admin, createFlashSale);
router.put('/:id', protect, admin, updateFlashSale);
router.delete('/:id', protect, admin, deleteFlashSale);
router.get('/admin/all', protect, admin, getAllFlashSales);

module.exports = router;