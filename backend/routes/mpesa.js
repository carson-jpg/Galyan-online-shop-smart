const express = require('express');
const {
  initiateSTKPush,
  mpesaCallback,
  checkPaymentStatus,
} = require('../controllers/mpesaController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/stkpush', protect, initiateSTKPush);
router.post('/callback', mpesaCallback);
router.get('/status/:checkoutRequestId', protect, checkPaymentStatus);

module.exports = router;