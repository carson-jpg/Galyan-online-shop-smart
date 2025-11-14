const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');

// Fraud Detection Service
class FraudDetectionService {
  // Analyze order for potential fraud
  async analyzeOrder(orderData) {
    try {
      const riskFactors = {
        score: 0,
        flags: [],
        recommendations: []
      };

      // Check order amount anomalies
      const amountRisk = await this.checkOrderAmount(orderData);
      riskFactors.score += amountRisk.score;
      riskFactors.flags.push(...amountRisk.flags);

      // Check user behavior patterns
      const userRisk = await this.checkUserBehavior(orderData.customer);
      riskFactors.score += userRisk.score;
      riskFactors.flags.push(...userRisk.flags);

      // Check shipping address consistency
      const addressRisk = await this.checkShippingAddress(orderData);
      riskFactors.score += addressRisk.score;
      riskFactors.flags.push(...addressRisk.flags);

      // Check payment method risk
      const paymentRisk = await this.checkPaymentMethod(orderData);
      riskFactors.score += paymentRisk.score;
      riskFactors.flags.push(...paymentRisk.flags);

      // Check for unusual ordering patterns
      const patternRisk = await this.checkOrderingPatterns(orderData);
      riskFactors.score += patternRisk.score;
      riskFactors.flags.push(...patternRisk.flags);

      // Generate recommendations based on risk score
      riskFactors.recommendations = this.generateRecommendations(riskFactors.score, riskFactors.flags);

      return {
        riskLevel: this.getRiskLevel(riskFactors.score),
        score: riskFactors.score,
        flags: riskFactors.flags,
        recommendations: riskFactors.recommendations
      };

    } catch (error) {
      console.error('Fraud analysis error:', error);
      return {
        riskLevel: 'unknown',
        score: 0,
        flags: ['analysis_error'],
        recommendations: ['Manual review required due to analysis error']
      };
    }
  }

  // Check for unusual order amounts
  async checkOrderAmount(orderData) {
    const risk = { score: 0, flags: [] };

    const totalAmount = orderData.orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Very high order amounts
    if (totalAmount > 50000) { // Adjust threshold as needed
      risk.score += 30;
      risk.flags.push('unusually_high_amount');
    }

    // Round number amounts (potential fraud indicator)
    if (totalAmount % 1000 === 0 && totalAmount > 1000) {
      risk.score += 15;
      risk.flags.push('round_number_amount');
    }

    // Check user's average order value
    const userOrders = await Order.find({ customer: orderData.customer }).limit(10);
    if (userOrders.length > 0) {
      const avgOrderValue = userOrders.reduce((sum, order) =>
        sum + order.orderItems.reduce((itemSum, item) => itemSum + (item.price * item.quantity), 0), 0
      ) / userOrders.length;

      if (totalAmount > avgOrderValue * 3) {
        risk.score += 20;
        risk.flags.push('significant_amount_increase');
      }
    }

    return risk;
  }

  // Check user behavior patterns
  async checkUserBehavior(userId) {
    const risk = { score: 0, flags: [] };

    const user = await User.findById(userId);
    if (!user) return risk;

    // New user making large purchase
    const accountAge = Date.now() - new Date(user.createdAt).getTime();
    const accountAgeDays = accountAge / (1000 * 60 * 60 * 24);

    if (accountAgeDays < 7) {
      risk.score += 25;
      risk.flags.push('new_account_high_value_order');
    }

    // Check order frequency
    const recentOrders = await Order.find({
      customer: userId,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
    });

    if (recentOrders.length > 3) {
      risk.score += 20;
      risk.flags.push('multiple_orders_short_time');
    }

    // Check for failed payments
    const failedOrders = await Order.find({
      customer: userId,
      status: 'cancelled',
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
    });

    if (failedOrders.length > 2) {
      risk.score += 15;
      risk.flags.push('recent_failed_payments');
    }

    return risk;
  }

  // Check shipping address consistency
  async checkShippingAddress(orderData) {
    const risk = { score: 0, flags: [] };

    // Check if shipping address matches billing/user address
    if (orderData.shippingAddress) {
      const userOrders = await Order.find({ customer: orderData.customer }).limit(5);

      // Check for address variations
      const addresses = userOrders.map(order => order.shippingAddress?.street).filter(Boolean);
      const uniqueAddresses = [...new Set(addresses)];

      if (uniqueAddresses.length > 2) {
        risk.score += 15;
        risk.flags.push('multiple_shipping_addresses');
      }

      // International shipping from new user
      if (orderData.shippingAddress.country !== 'Kenya' && userOrders.length < 2) {
        risk.score += 20;
        risk.flags.push('international_shipping_new_user');
      }
    }

    return risk;
  }

  // Check payment method risk
  async checkPaymentMethod(orderData) {
    const risk = { score: 0, flags: [] };

    // M-Pesa payments have lower risk for local transactions
    if (orderData.paymentMethod === 'mpesa') {
      risk.score -= 10; // Reduce risk for M-Pesa
    }

    // Check for payment method changes
    const userOrders = await Order.find({ customer: orderData.customer }).limit(5);
    const paymentMethods = userOrders.map(order => order.paymentMethod);
    const uniqueMethods = [...new Set(paymentMethods)];

    if (uniqueMethods.length > 2 && !uniqueMethods.includes(orderData.paymentMethod)) {
      risk.score += 10;
      risk.flags.push('unusual_payment_method');
    }

    return risk;
  }

  // Check for unusual ordering patterns
  async checkOrderingPatterns(orderData) {
    const risk = { score: 0, flags: [] };

    // Check time of order (unusual hours)
    const orderHour = new Date(orderData.createdAt || new Date()).getHours();
    if (orderHour < 6 || orderHour > 22) {
      risk.score += 10;
      risk.flags.push('unusual_order_time');
    }

    // Check for bulk ordering of same product
    const productQuantities = orderData.orderItems.reduce((acc, item) => {
      acc[item.product] = (acc[item.product] || 0) + item.quantity;
      return acc;
    }, {});

    const highQuantityItems = Object.values(productQuantities).filter(qty => qty > 10);
    if (highQuantityItems.length > 0) {
      risk.score += 15;
      risk.flags.push('bulk_quantity_order');
    }

    // Check for high-value items from new/low-activity users
    const highValueProducts = await Product.find({
      _id: { $in: orderData.orderItems.map(item => item.product) },
      price: { $gt: 10000 } // Adjust threshold
    });

    if (highValueProducts.length > 0) {
      const userOrders = await Order.find({ customer: orderData.customer });
      if (userOrders.length < 3) {
        risk.score += 20;
        risk.flags.push('high_value_items_new_user');
      }
    }

    return risk;
  }

  // Generate risk level
  getRiskLevel(score) {
    if (score >= 70) return 'high';
    if (score >= 40) return 'medium';
    if (score >= 20) return 'low';
    return 'very_low';
  }

  // Generate recommendations based on risk
  generateRecommendations(score, flags) {
    const recommendations = [];

    if (score >= 70) {
      recommendations.push('Require additional verification (ID, phone confirmation)');
      recommendations.push('Consider manual review before fulfillment');
      recommendations.push('Monitor this order closely');
    } else if (score >= 40) {
      recommendations.push('Send additional verification email');
      recommendations.push('Consider calling customer for confirmation');
    } else if (score >= 20) {
      recommendations.push('Monitor order progress');
      recommendations.push('Flag for potential review if issues arise');
    }

    // Specific recommendations based on flags
    if (flags.includes('new_account_high_value_order')) {
      recommendations.push('Verify account legitimacy');
    }

    if (flags.includes('multiple_orders_short_time')) {
      recommendations.push('Check for account compromise');
    }

    if (flags.includes('international_shipping_new_user')) {
      recommendations.push('Verify shipping address and identity');
    }

    return recommendations;
  }

  // Get fraud statistics
  async getFraudStatistics(timeframe = 30) {
    try {
      const startDate = new Date(Date.now() - timeframe * 24 * 60 * 60 * 1000);

      const orders = await Order.find({
        createdAt: { $gte: startDate }
      }).populate('customer');

      let highRisk = 0;
      let mediumRisk = 0;
      let lowRisk = 0;
      let totalAnalyzed = 0;

      for (const order of orders) {
        const analysis = await this.analyzeOrder(order);
        totalAnalyzed++;

        switch (analysis.riskLevel) {
          case 'high':
            highRisk++;
            break;
          case 'medium':
            mediumRisk++;
            break;
          case 'low':
            lowRisk++;
            break;
        }
      }

      return {
        totalOrders: orders.length,
        analyzedOrders: totalAnalyzed,
        highRiskOrders: highRisk,
        mediumRiskOrders: mediumRisk,
        lowRiskOrders: lowRisk,
        fraudRate: totalAnalyzed > 0 ? ((highRisk + mediumRisk) / totalAnalyzed * 100).toFixed(2) : 0
      };

    } catch (error) {
      console.error('Fraud statistics error:', error);
      return {
        totalOrders: 0,
        analyzedOrders: 0,
        highRiskOrders: 0,
        mediumRiskOrders: 0,
        lowRiskOrders: 0,
        fraudRate: 0
      };
    }
  }
}

module.exports = new FraudDetectionService();