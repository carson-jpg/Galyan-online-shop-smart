const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const emailService = require('./emailService');
const aiService = require('./aiService');

// Customer Support Automation Service
class SupportAutomationService {
  // Automatically handle common support requests
  async handleSupportRequest(requestData) {
    try {
      const { type, userId, orderId, productId, description } = requestData;

      const user = await User.findById(userId);
      if (!user) return { success: false, message: 'User not found' };

      let response = null;
      let actions = [];

      switch (type) {
        case 'order_status':
          response = await this.handleOrderStatusInquiry(userId, orderId);
          break;

        case 'return_request':
          response = await this.handleReturnRequest(userId, orderId, description);
          actions.push('flag_for_review');
          break;

        case 'product_inquiry':
          response = await this.handleProductInquiry(productId, description);
          break;

        case 'shipping_info':
          response = await this.handleShippingInquiry(orderId);
          break;

        case 'refund_request':
          response = await this.handleRefundRequest(userId, orderId, description);
          actions.push('escalate_to_human');
          break;

        case 'damaged_product':
          response = await this.handleDamagedProduct(userId, orderId, description);
          actions.push('flag_for_review');
          break;

        default:
          response = await this.handleGeneralInquiry(description);
      }

      // Send automated response email
      if (response && response.emailContent) {
        try {
          await emailService.sendEmail({
            to: user.email,
            subject: response.subject,
            html: response.emailContent
          });
          actions.push('email_sent');
        } catch (emailError) {
          console.error('Failed to send support email:', emailError);
        }
      }

      return {
        success: true,
        response,
        actions,
        handledBy: 'automation',
        timestamp: new Date()
      };

    } catch (error) {
      console.error('Support automation error:', error);
      return {
        success: false,
        message: 'Failed to process support request',
        error: error.message
      };
    }
  }

  // Handle order status inquiries
  async handleOrderStatusInquiry(userId, orderId) {
    try {
      const order = await Order.findById(orderId).populate('orderItems.product', 'name');

      if (!order) {
        return {
          subject: 'Order Not Found',
          message: 'We could not find the order you\'re looking for.',
          emailContent: this.generateOrderNotFoundEmail()
        };
      }

      // Check if user owns this order
      if (order.user.toString() !== userId.toString()) {
        return {
          subject: 'Order Access Denied',
          message: 'You do not have permission to view this order.',
          emailContent: this.generateAccessDeniedEmail()
        };
      }

      const statusMessage = this.getOrderStatusMessage(order.status);
      const estimatedDelivery = this.calculateEstimatedDelivery(order);

      return {
        subject: `Order Status Update - ${order._id}`,
        message: statusMessage,
        emailContent: this.generateOrderStatusEmail(order, statusMessage, estimatedDelivery),
        orderDetails: {
          id: order._id,
          status: order.status,
          estimatedDelivery
        }
      };

    } catch (error) {
      console.error('Order status inquiry error:', error);
      return {
        subject: 'Order Status Inquiry',
        message: 'We encountered an issue retrieving your order status. Please try again later.',
        emailContent: this.generateErrorEmail()
      };
    }
  }

  // Handle return requests
  async handleReturnRequest(userId, orderId, reason) {
    try {
      const order = await Order.findById(orderId);

      if (!order || order.user.toString() !== userId.toString()) {
        return {
          subject: 'Return Request - Invalid Order',
          message: 'We could not process your return request.',
          emailContent: this.generateInvalidReturnEmail()
        };
      }

      // Check if order is eligible for return (delivered within 7 days)
      const deliveredDate = order.deliveredAt || order.createdAt;
      const daysSinceDelivery = (Date.now() - new Date(deliveredDate).getTime()) / (1000 * 60 * 60 * 24);

      if (daysSinceDelivery > 7) {
        return {
          subject: 'Return Request - Not Eligible',
          message: 'Your order is not eligible for return (more than 7 days since delivery).',
          emailContent: this.generateReturnNotEligibleEmail()
        };
      }

      return {
        subject: 'Return Request Received',
        message: 'Your return request has been received and is being reviewed.',
        emailContent: this.generateReturnRequestReceivedEmail(order, reason),
        requiresReview: true
      };

    } catch (error) {
      console.error('Return request error:', error);
      return {
        subject: 'Return Request Error',
        message: 'We encountered an issue processing your return request.',
        emailContent: this.generateErrorEmail()
      };
    }
  }

  // Handle product inquiries
  async handleProductInquiry(productId, question) {
    try {
      const product = await Product.findById(productId);

      if (!product) {
        return {
          subject: 'Product Inquiry',
          message: 'Product not found.',
          emailContent: this.generateProductNotFoundEmail()
        };
      }

      // Use AI to generate response based on product info and question
      let aiResponse;
      try {
        aiResponse = await aiService.generateChatResponse(
          `Product inquiry: ${question}`,
          {
            product: {
              name: product.name,
              description: product.description,
              price: product.price,
              category: product.category,
              stock: product.stock
            }
          }
        );
      } catch (aiError) {
        console.error('AI Response Error in support automation:', aiError.message);
        aiResponse = "Thank you for your product inquiry. Our team will get back to you with detailed information about this product.";
      }

      return {
        subject: `Product Inquiry - ${product.name}`,
        message: aiResponse,
        emailContent: this.generateProductInquiryEmail(product, question, aiResponse)
      };

    } catch (error) {
      console.error('Product inquiry error:', error);
      return {
        subject: 'Product Inquiry',
        message: 'We encountered an issue answering your product question.',
        emailContent: this.generateErrorEmail()
      };
    }
  }

  // Handle shipping inquiries
  async handleShippingInquiry(orderId) {
    try {
      const order = await Order.findById(orderId);

      if (!order) {
        return {
          subject: 'Shipping Information',
          message: 'Order not found.',
          emailContent: this.generateOrderNotFoundEmail()
        };
      }

      const shippingInfo = this.getShippingInformation(order);
      const trackingInfo = this.getTrackingInformation(order);

      return {
        subject: 'Shipping Information',
        message: shippingInfo.message,
        emailContent: this.generateShippingInfoEmail(order, shippingInfo, trackingInfo)
      };

    } catch (error) {
      console.error('Shipping inquiry error:', error);
      return {
        subject: 'Shipping Information',
        message: 'We encountered an issue retrieving shipping information.',
        emailContent: this.generateErrorEmail()
      };
    }
  }

  // Handle refund requests
  async handleRefundRequest(userId, orderId, reason) {
    return {
      subject: 'Refund Request Received',
      message: 'Your refund request has been received and will be reviewed by our team.',
      emailContent: this.generateRefundRequestEmail(orderId, reason),
      requiresEscalation: true
    };
  }

  // Handle damaged product reports
  async handleDamagedProduct(userId, orderId, description) {
    return {
      subject: 'Damaged Product Report',
      message: 'Your damaged product report has been received and will be reviewed.',
      emailContent: this.generateDamagedProductEmail(orderId, description),
      requiresReview: true
    };
  }

  // Handle general inquiries
  async handleGeneralInquiry(description) {
    try {
      const aiResponse = await aiService.generateChatResponse(description);

      return {
        subject: 'Support Inquiry',
        message: aiResponse,
        emailContent: this.generateGeneralInquiryEmail(description, aiResponse)
      };

    } catch (error) {
      console.error('AI Response Error in general inquiry:', error.message);
      const fallbackResponse = 'Thank you for your inquiry. Our support team will get back to you soon.';
      return {
        subject: 'Support Inquiry',
        message: fallbackResponse,
        emailContent: this.generateGeneralInquiryEmail(description, fallbackResponse)
      };
    }
  }

  // Helper methods for status and information
  getOrderStatusMessage(status) {
    const messages = {
      'Processing': 'Your order is being processed and will be shipped soon.',
      'Shipped': 'Your order has been shipped and is on its way.',
      'Delivered': 'Your order has been delivered successfully.',
      'Cancelled': 'Your order has been cancelled.',
      'Under Review': 'Your order is under review due to security concerns.'
    };
    return messages[status] || 'Your order status is being updated.';
  }

  calculateEstimatedDelivery(order) {
    if (order.status === 'Delivered') return 'Already delivered';

    const shippedDate = order.updatedAt;
    const deliveryDays = 3; // Assume 3-day delivery
    const estimatedDate = new Date(shippedDate);
    estimatedDate.setDate(estimatedDate.getDate() + deliveryDays);

    return estimatedDate.toDateString();
  }

  getShippingInformation(order) {
    return {
      message: 'Your order is being processed for shipping.',
      method: 'Standard Delivery',
      cost: 'Free for orders over KSh 2,000'
    };
  }

  getTrackingInformation(order) {
    return {
      trackingNumber: order.trackingNumber || 'Not available yet',
      carrier: 'Local Courier Service'
    };
  }

  // Email template generators
  generateOrderStatusEmail(order, statusMessage, estimatedDelivery) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Order Status Update</h2>
        <p>Dear Customer,</p>
        <p><strong>Order ID:</strong> ${order._id}</p>
        <p><strong>Status:</strong> ${order.status}</p>
        <p>${statusMessage}</p>
        ${estimatedDelivery ? `<p><strong>Estimated Delivery:</strong> ${estimatedDelivery}</p>` : ''}
        <p>Thank you for shopping with Galyan Shop!</p>
      </div>
    `;
  }

  generateReturnRequestReceivedEmail(order, reason) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Return Request Received</h2>
        <p>Your return request for order ${order._id} has been received.</p>
        <p><strong>Reason:</strong> ${reason}</p>
        <p>Our team will review your request within 1-2 business days.</p>
      </div>
    `;
  }

  generateProductInquiryEmail(product, question, response) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Product Inquiry Response</h2>
        <p><strong>Product:</strong> ${product.name}</p>
        <p><strong>Your Question:</strong> ${question}</p>
        <p><strong>Our Response:</strong></p>
        <p>${response}</p>
      </div>
    `;
  }

  generateShippingInfoEmail(order, shippingInfo, trackingInfo) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Shipping Information</h2>
        <p><strong>Order ID:</strong> ${order._id}</p>
        <p><strong>Shipping Method:</strong> ${shippingInfo.method}</p>
        <p><strong>Shipping Cost:</strong> ${shippingInfo.cost}</p>
        ${trackingInfo.trackingNumber !== 'Not available yet' ?
          `<p><strong>Tracking Number:</strong> ${trackingInfo.trackingNumber}</p>
           <p><strong>Carrier:</strong> ${trackingInfo.carrier}</p>` :
          '<p>Tracking information will be available once your order ships.</p>'}
      </div>
    `;
  }

  generateErrorEmail() {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Support Request</h2>
        <p>We encountered an issue processing your request. Our support team will contact you shortly.</p>
        <p>Please try again or contact us directly if the issue persists.</p>
      </div>
    `;
  }

  generateOrderNotFoundEmail() {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Order Not Found</h2>
        <p>We could not find the order you're looking for. Please check your order ID and try again.</p>
      </div>
    `;
  }

  generateAccessDeniedEmail() {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Access Denied</h2>
        <p>You do not have permission to access this order information.</p>
      </div>
    `;
  }

  generateInvalidReturnEmail() {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Invalid Return Request</h2>
        <p>We could not process your return request. Please check your order details and try again.</p>
      </div>
    `;
  }

  generateReturnNotEligibleEmail() {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Return Not Eligible</h2>
        <p>Your order is not eligible for return as it has been more than 7 days since delivery.</p>
      </div>
    `;
  }

  generateProductNotFoundEmail() {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Product Not Found</h2>
        <p>The product you're inquiring about could not be found.</p>
      </div>
    `;
  }

  generateRefundRequestEmail(orderId, reason) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Refund Request Received</h2>
        <p><strong>Order ID:</strong> ${orderId}</p>
        <p><strong>Reason:</strong> ${reason}</p>
        <p>Your refund request has been received and will be reviewed by our team.</p>
      </div>
    `;
  }

  generateDamagedProductEmail(orderId, description) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Damaged Product Report</h2>
        <p><strong>Order ID:</strong> ${orderId}</p>
        <p><strong>Description:</strong> ${description}</p>
        <p>Your report has been received and will be reviewed by our quality team.</p>
      </div>
    `;
  }

  generateGeneralInquiryEmail(question, response = null) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Support Inquiry</h2>
        <p><strong>Your Question:</strong> ${question}</p>
        ${response ? `<p><strong>Our Response:</strong></p><p>${response}</p>` : '<p>Thank you for your inquiry. Our support team will get back to you soon.</p>'}
      </div>
    `;
  }
}

module.exports = new SupportAutomationService();