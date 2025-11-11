const SibApiV3Sdk = require('sib-api-v3-sdk');

class EmailService {
  constructor() {
    this.client = SibApiV3Sdk.ApiClient.instance;
    this.apiKey = this.client.authentications['api-key'];
    this.apiKey.apiKey = process.env.BREVO_API_KEY;

    this.apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
  }

  async sendOrderConfirmationEmail(order, user) {
    try {
      const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

      sendSmtpEmail.subject = "Order Confirmation - Galyan Shop";
      sendSmtpEmail.htmlContent = this.getOrderConfirmationTemplate(order, user);
      sendSmtpEmail.sender = {
        name: "Galyan Shop",
        email: process.env.EMAIL_FROM
      };
      sendSmtpEmail.to = [{
        email: user.email,
        name: user.name
      }];

      const data = await this.apiInstance.sendTransacEmail(sendSmtpEmail);
      console.log('Order confirmation email sent successfully:', data);
      return data;
    } catch (error) {
      console.error('Error sending order confirmation email:', error);
      throw error;
    }
  }

  async sendOrderStatusUpdateEmail(order, user, status) {
    try {
      const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

      sendSmtpEmail.subject = `Order ${status} - Galyan Shop`;
      sendSmtpEmail.htmlContent = this.getOrderStatusUpdateTemplate(order, user, status);
      sendSmtpEmail.sender = {
        name: "Galyan Shop",
        email: process.env.EMAIL_FROM
      };
      sendSmtpEmail.to = [{
        email: user.email,
        name: user.name
      }];

      const data = await this.apiInstance.sendTransacEmail(sendSmtpEmail);
      console.log(`Order ${status} email sent successfully:`, data);
      return data;
    } catch (error) {
      console.error(`Error sending order ${status} email:`, error);
      throw error;
    }
  }

  async sendPaymentConfirmationEmail(order, user) {
    try {
      const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

      sendSmtpEmail.subject = "Payment Confirmed - Galyan Shop";
      sendSmtpEmail.htmlContent = this.getPaymentConfirmationTemplate(order, user);
      sendSmtpEmail.sender = {
        name: "Galyan Shop",
        email: process.env.EMAIL_FROM
      };
      sendSmtpEmail.to = [{
        email: user.email,
        name: user.name
      }];

      const data = await this.apiInstance.sendTransacEmail(sendSmtpEmail);
      console.log('Payment confirmation email sent successfully:', data);
      return data;
    } catch (error) {
      console.error('Error sending payment confirmation email:', error);
      throw error;
    }
  }

  getOrderConfirmationTemplate(order, user) {
    const itemsHtml = order.orderItems.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">
          <img src="${item.image}" alt="${item.name}" style="width: 50px; height: 50px; object-fit: cover; margin-right: 10px;">
          ${item.name}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.qty}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">KSh ${item.price.toLocaleString()}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">KSh ${(item.qty * item.price).toLocaleString()}</td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Order Confirmation</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Order Confirmed!</h1>
            <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Thank you for shopping with Galyan Shop</p>
          </div>

          <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-bottom: 20px;">Order Details</h2>

            <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
              <p><strong>Order ID:</strong> ${order._id}</p>
              <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
              <p><strong>Status:</strong> ${order.orderStatus}</p>
              <p><strong>Payment Status:</strong> ${order.isPaid ? 'Paid' : 'Pending'}</p>
            </div>

            <h3 style="color: #333; margin-bottom: 15px;">Items Ordered</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <thead>
                <tr style="background: #f8f9fa;">
                  <th style="padding: 10px; text-align: left; border-bottom: 2px solid #dee2e6;">Product</th>
                  <th style="padding: 10px; text-align: center; border-bottom: 2px solid #dee2e6;">Qty</th>
                  <th style="padding: 10px; text-align: center; border-bottom: 2px solid #dee2e6;">Price</th>
                  <th style="padding: 10px; text-align: center; border-bottom: 2px solid #dee2e6;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
              <p style="margin: 0; font-size: 18px;"><strong>Total Amount: KSh ${order.totalPrice.toLocaleString()}</strong></p>
            </div>

            <div style="background: #e8f5e8; padding: 15px; border-radius: 5px; border-left: 4px solid #4caf50;">
              <h4 style="margin: 0 0 10px 0; color: #2e7d32;">What's Next?</h4>
              <ul style="margin: 0; padding-left: 20px;">
                <li>We'll process your order within 1-2 business days</li>
                <li>You'll receive shipping updates via email</li>
                <li>Delivery typically takes 3-7 business days</li>
              </ul>
            </div>

            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
              <p style="color: #666; margin: 0;">
                Questions about your order? Contact us at
                <a href="mailto:support@galyanshop.com" style="color: #667eea;">support@galyanshop.com</a>
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getOrderStatusUpdateTemplate(order, user, status) {
    const statusMessages = {
      'processing': {
        title: 'Order Processing Started',
        message: 'We have started processing your order and will ship it soon.',
        color: '#2196f3'
      },
      'shipped': {
        title: 'Order Shipped',
        message: 'Your order has been shipped and is on its way to you.',
        color: '#ff9800'
      },
      'delivered': {
        title: 'Order Delivered',
        message: 'Your order has been successfully delivered. Thank you for shopping with us!',
        color: '#4caf50'
      },
      'cancelled': {
        title: 'Order Cancelled',
        message: 'Your order has been cancelled. Please contact us if you have any questions.',
        color: '#f44336'
      }
    };

    const statusInfo = statusMessages[status.toLowerCase()] || {
      title: `Order ${status}`,
      message: `Your order status has been updated to ${status}.`,
      color: '#667eea'
    };

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Order Status Update</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, ${statusInfo.color} 0%, #667eea 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">${statusInfo.title}</h1>
          </div>

          <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
            <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
              <p><strong>Order ID:</strong> ${order._id}</p>
              <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
              <p><strong>Current Status:</strong> ${status}</p>
            </div>

            <div style="background: #e8f5e8; padding: 15px; border-radius: 5px; border-left: 4px solid ${statusInfo.color}; margin-bottom: 20px;">
              <p style="margin: 0; font-size: 16px;">${statusInfo.message}</p>
            </div>

            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
              <p style="color: #666; margin: 0;">
                Track your order or contact us at
                <a href="mailto:support@galyanshop.com" style="color: #667eea;">support@galyanshop.com</a>
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getPaymentConfirmationTemplate(order, user) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Payment Confirmed</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #4caf50 0%, #45a049 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Payment Confirmed!</h1>
            <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Your payment has been successfully processed</p>
          </div>

          <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
            <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
              <p><strong>Order ID:</strong> ${order._id}</p>
              <p><strong>Payment Date:</strong> ${new Date().toLocaleDateString()}</p>
              <p><strong>Amount Paid:</strong> KSh ${order.totalPrice.toLocaleString()}</p>
              <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
            </div>

            <div style="background: #e8f5e8; padding: 15px; border-radius: 5px; border-left: 4px solid #4caf50; margin-bottom: 20px;">
              <h4 style="margin: 0 0 10px 0; color: #2e7d32;">What's Next?</h4>
              <ul style="margin: 0; padding-left: 20px;">
                <li>Your order will be processed within 1-2 business days</li>
                <li>You'll receive a shipping confirmation email</li>
                <li>Track your order status in your account dashboard</li>
              </ul>
            </div>

            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
              <p style="color: #666; margin: 0;">
                Thank you for choosing Galyan Shop!
                <br>
                Questions? Contact us at
                <a href="mailto:support@galyanshop.com" style="color: #4caf50;">support@galyanshop.com</a>
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

module.exports = new EmailService();