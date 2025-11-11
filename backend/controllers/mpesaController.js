const axios = require('axios');
const Order = require('../models/Order');
const User = require('../models/User');
const emailService = require('../utils/emailService');

// Generate M-Pesa access token
const generateAccessToken = async () => {
  const auth = Buffer.from(
    `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
  ).toString('base64');

  try {
    // Use production API for production credentials
    const isProduction = process.env.NODE_ENV === 'production' || process.env.MPESA_SHORTCODE !== '174379';
    const baseUrl = isProduction
      ? 'https://api.safaricom.co.ke'
      : 'https://sandbox.safaricom.co.ke';

    console.log('Using M-Pesa API:', baseUrl);
    console.log('Consumer Key exists:', !!process.env.MPESA_CONSUMER_KEY);
    console.log('Consumer Secret exists:', !!process.env.MPESA_CONSUMER_SECRET);

    const response = await axios.get(
      `${baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
      {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      }
    );
    return response.data.access_token;
  } catch (error) {
    console.error('Access token generation error:', error.response?.data || error.message);
    console.error('Status code:', error.response?.status);
    console.error('Response data:', error.response?.data);
    throw new Error('Failed to generate access token');
  }
};

// @desc    Initiate M-Pesa STK Push
// @route   POST /api/mpesa/stkpush
// @access  Private
const initiateSTKPush = async (req, res) => {
  try {
    const { orderId, phoneNumber, amount } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const accessToken = await generateAccessToken();

    const timestamp = new Date()
      .toISOString()
      .replace(/[^0-9]/g, '')
      .slice(0, -3);

    const password = Buffer.from(
      `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`
    ).toString('base64');

    const stkPushData = {
      BusinessShortCode: process.env.MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: amount,
      PartyA: phoneNumber,
      PartyB: process.env.MPESA_SHORTCODE,
      PhoneNumber: phoneNumber,
      CallBackURL: process.env.MPESA_CALLBACK_URL,
      AccountReference: `Order-${orderId}`,
      TransactionDesc: 'Payment for order',
    };

    const response = await axios.post(
      `${baseUrl}/mpesa/stkpush/v1/processrequest`,
      stkPushData,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // Update order with M-Pesa transaction details
    order.mpesaTransactionId = response.data.CheckoutRequestID;
    await order.save();

    res.json({
      message: 'STK Push initiated successfully',
      checkoutRequestId: response.data.CheckoutRequestID,
      responseCode: response.data.ResponseCode,
    });
  } catch (error) {
    console.error('M-Pesa STK Push Error:', error.response?.data || error.message);
    console.error('Full error:', error);
    res.status(500).json({
      message: 'Failed to initiate payment',
      error: error.response?.data || error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// @desc    M-Pesa STK Push Callback
// @route   POST /api/mpesa/callback
// @access  Public
const mpesaCallback = async (req, res) => {
  try {
    const callbackData = req.body;

    console.log('M-Pesa Callback:', JSON.stringify(callbackData, null, 2));

    if (callbackData.Body && callbackData.Body.stkCallback) {
      const { MerchantRequestID, CheckoutRequestID, ResultCode, CallbackMetadata } =
        callbackData.Body.stkCallback;

      if (ResultCode === 0) {
        // Payment successful
        const amount = CallbackMetadata.Item.find(
          (item) => item.Name === 'Amount'
        ).Value;
        const mpesaReceiptNumber = CallbackMetadata.Item.find(
          (item) => item.Name === 'MpesaReceiptNumber'
        ).Value;
        const transactionDate = CallbackMetadata.Item.find(
          (item) => item.Name === 'TransactionDate'
        ).Value;

        // Update order status
        const order = await Order.findOne({ mpesaTransactionId: CheckoutRequestID });

        if (order) {
          order.isPaid = true;
          order.paidAt = Date.now();
          order.mpesaReceiptNumber = mpesaReceiptNumber;
          order.status = 'Processing';
          await order.save();

          // Send payment confirmation email
          try {
            const user = await User.findById(order.user);
            await emailService.sendPaymentConfirmationEmail(order, user);
          } catch (emailError) {
            console.error('Error sending payment confirmation email:', emailError);
            // Don't fail the payment processing if email fails
          }
        }
      }
    }

    res.status(200).json({ message: 'Callback received successfully' });
  } catch (error) {
    console.error('M-Pesa Callback Error:', error);
    res.status(500).json({ message: 'Callback processing failed' });
  }
};

// @desc    Check payment status
// @route   GET /api/mpesa/status/:checkoutRequestId
// @access  Private
const checkPaymentStatus = async (req, res) => {
  try {
    const { checkoutRequestId } = req.params;

    const accessToken = await generateAccessToken();

    const timestamp = new Date()
      .toISOString()
      .replace(/[^0-9]/g, '')
      .slice(0, -3);

    const password = Buffer.from(
      `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`
    ).toString('base64');

    const queryData = {
      BusinessShortCode: process.env.MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId,
    };

    const response = await axios.post(
      `${baseUrl}/mpesa/stkpushquery/v1/query`,
      queryData,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('Payment Status Check Error:', error.response?.data || error.message);
    res.status(500).json({
      message: 'Failed to check payment status',
      error: error.response?.data || error.message,
    });
  }
};

module.exports = {
  initiateSTKPush,
  mpesaCallback,
  checkPaymentStatus,
};