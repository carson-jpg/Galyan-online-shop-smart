const supportAutomationService = require('../utils/supportAutomationService');
const User = require('../models/User');

// @desc    Submit support request
// @route   POST /api/support/request
// @access  Private
const submitSupportRequest = async (req, res) => {
  try {
    const { type, orderId, productId, subject, description } = req.body;
    const userId = req.user._id;

    // Validate required fields
    if (!type || !description) {
      return res.status(400).json({
        message: 'Support type and description are required'
      });
    }

    // Process the support request with automation
    const result = await supportAutomationService.handleSupportRequest({
      type,
      userId,
      orderId,
      productId,
      description: subject ? `${subject}: ${description}` : description
    });

    if (!result.success) {
      return res.status(500).json({ message: result.message });
    }

    res.status(201).json({
      success: true,
      ticketId: `SUP-${Date.now()}`,
      response: result.response,
      actions: result.actions,
      message: 'Support request submitted successfully'
    });

  } catch (error) {
    console.error('Submit support request error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get support request types
// @route   GET /api/support/types
// @access  Public
const getSupportTypes = async (req, res) => {
  try {
    const supportTypes = [
      {
        id: 'order_status',
        name: 'Order Status Inquiry',
        description: 'Check the status of your order',
        icon: '📦'
      },
      {
        id: 'return_request',
        name: 'Return Request',
        description: 'Request to return an item',
        icon: '↩️'
      },
      {
        id: 'product_inquiry',
        name: 'Product Question',
        description: 'Ask about a product',
        icon: '❓'
      },
      {
        id: 'shipping_info',
        name: 'Shipping Information',
        description: 'Get shipping details',
        icon: '🚚'
      },
      {
        id: 'refund_request',
        name: 'Refund Request',
        description: 'Request a refund',
        icon: '💰'
      },
      {
        id: 'damaged_product',
        name: 'Damaged Product',
        description: 'Report a damaged item',
        icon: '⚠️'
      },
      {
        id: 'general',
        name: 'General Inquiry',
        description: 'Other questions or concerns',
        icon: '💬'
      }
    ];

    res.json({ supportTypes });
  } catch (error) {
    console.error('Get support types error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user's support history
// @route   GET /api/support/history
// @access  Private
const getSupportHistory = async (req, res) => {
  try {
    // For now, return empty history as we don't have a support ticket model
    // In a real implementation, you'd have a SupportTicket model
    const history = [];

    res.json({
      history,
      total: history.length
    });
  } catch (error) {
    console.error('Get support history error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get support analytics (admin only)
// @route   GET /api/support/analytics
// @access  Private/Admin
const getSupportAnalytics = async (req, res) => {
  try {
    // Mock analytics - in real implementation, you'd aggregate from support tickets
    const analytics = {
      totalRequests: 0,
      automatedResponses: 0,
      escalatedToHuman: 0,
      averageResponseTime: '2 hours',
      commonIssues: [
        { type: 'order_status', count: 0 },
        { type: 'return_request', count: 0 },
        { type: 'product_inquiry', count: 0 }
      ],
      satisfaction: {
        rating: 4.2,
        totalRatings: 0
      }
    };

    res.json(analytics);
  } catch (error) {
    console.error('Get support analytics error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  submitSupportRequest,
  getSupportTypes,
  getSupportHistory,
  getSupportAnalytics,
};