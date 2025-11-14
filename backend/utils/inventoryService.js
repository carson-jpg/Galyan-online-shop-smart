const Product = require('../models/Product');
const Order = require('../models/Order');

// AI-Powered Inventory Management Service
class InventoryService {
  // Analyze inventory levels and predict demand
  async analyzeInventory(productId) {
    try {
      const product = await Product.findById(productId);
      if (!product) return null;

      // Get sales data for the last 30 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const recentOrders = await Order.find({
        'orderItems.product': productId,
        createdAt: { $gte: thirtyDaysAgo },
        isPaid: true
      });

      // Calculate daily sales rate
      const totalSold = recentOrders.reduce((sum, order) => {
        const item = order.orderItems.find(item => item.product.toString() === productId.toString());
        return sum + (item ? item.quantity : 0);
      }, 0);

      const dailySalesRate = totalSold / 30;

      // Predict stock depletion
      const daysUntilDepletion = product.stock / dailySalesRate;

      // Determine stock status
      let status = 'normal';
      let recommendation = '';

      if (daysUntilDepletion <= 7) {
        status = 'critical';
        recommendation = `Stock critically low. Expected depletion in ${Math.ceil(daysUntilDepletion)} days. Urgent restock required.`;
      } else if (daysUntilDepletion <= 14) {
        status = 'low';
        recommendation = `Stock running low. Expected depletion in ${Math.ceil(daysUntilDepletion)} days. Consider restocking soon.`;
      } else if (daysUntilDepletion > 60) {
        status = 'overstock';
        recommendation = `Potential overstock. Current stock will last ${Math.ceil(daysUntilDepletion)} days. Consider reducing inventory.`;
      }

      return {
        productId,
        currentStock: product.stock,
        dailySalesRate: Math.round(dailySalesRate * 100) / 100,
        daysUntilDepletion: Math.ceil(daysUntilDepletion),
        status,
        recommendation,
        lastUpdated: new Date()
      };

    } catch (error) {
      console.error('Inventory analysis error:', error);
      return null;
    }
  }

  // Get inventory insights for all products
  async getInventoryInsights(sellerId = null) {
    try {
      const query = { isActive: true };
      if (sellerId) {
        query.seller = sellerId;
      }

      const products = await Product.find(query).populate('seller', 'businessName');

      const insights = {
        totalProducts: products.length,
        criticalStock: 0,
        lowStock: 0,
        overstock: 0,
        normalStock: 0,
        totalValue: 0,
        recommendations: []
      };

      for (const product of products) {
        const analysis = await this.analyzeInventory(product._id);
        if (analysis) {
          insights.totalValue += product.price * product.stock;

          switch (analysis.status) {
            case 'critical':
              insights.criticalStock++;
              break;
            case 'low':
              insights.lowStock++;
              break;
            case 'overstock':
              insights.overstock++;
              break;
            default:
              insights.normalStock++;
          }

          if (analysis.recommendation) {
            insights.recommendations.push({
              productName: product.name,
              productId: product._id,
              recommendation: analysis.recommendation,
              status: analysis.status
            });
          }
        }
      }

      return insights;

    } catch (error) {
      console.error('Get inventory insights error:', error);
      return {
        totalProducts: 0,
        criticalStock: 0,
        lowStock: 0,
        overstock: 0,
        normalStock: 0,
        totalValue: 0,
        recommendations: []
      };
    }
  }

  // Predict optimal reorder quantity
  async predictReorderQuantity(productId) {
    try {
      const product = await Product.findById(productId);
      if (!product) return null;

      // Get sales data for the last 90 days
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      const orders = await Order.find({
        'orderItems.product': productId,
        createdAt: { $gte: ninetyDaysAgo },
        isPaid: true
      }).sort({ createdAt: -1 });

      if (orders.length < 7) {
        return {
          recommendedQuantity: Math.max(product.stock, 10),
          confidence: 'low',
          reason: 'Insufficient sales data'
        };
      }

      // Calculate average daily sales
      const totalSold = orders.reduce((sum, order) => {
        const item = order.orderItems.find(item => item.product.toString() === productId.toString());
        return sum + (item ? item.quantity : 0);
      }, 0);

      const avgDailySales = totalSold / 90;

      // Calculate lead time (assume 7 days for demo)
      const leadTime = 7;

      // Safety stock (assume 50% of lead time demand)
      const safetyStock = avgDailySales * leadTime * 0.5;

      // Reorder point
      const reorderPoint = (avgDailySales * leadTime) + safetyStock;

      // Economic order quantity (simplified)
      const holdingCost = product.price * 0.2; // Assume 20% annual holding cost
      const orderCost = 100; // Assume fixed ordering cost
      const annualDemand = avgDailySales * 365;

      const eoq = Math.sqrt((2 * orderCost * annualDemand) / holdingCost);

      // Recommended quantity
      const recommendedQuantity = Math.max(
        Math.ceil(reorderPoint - product.stock),
        Math.ceil(eoq / 12), // Monthly order
        1
      );

      return {
        currentStock: product.stock,
        avgDailySales: Math.round(avgDailySales * 100) / 100,
        reorderPoint: Math.ceil(reorderPoint),
        recommendedQuantity: Math.ceil(recommendedQuantity),
        confidence: orders.length > 30 ? 'high' : 'medium',
        estimatedLeadTime: leadTime
      };

    } catch (error) {
      console.error('Predict reorder quantity error:', error);
      return null;
    }
  }

  // Generate automated purchase orders
  async generatePurchaseOrders(sellerId) {
    try {
      const insights = await this.getInventoryInsights(sellerId);

      const purchaseOrders = [];

      for (const recommendation of insights.recommendations) {
        if (recommendation.status === 'critical' || recommendation.status === 'low') {
          const prediction = await this.predictReorderQuantity(recommendation.productId);

          if (prediction && prediction.recommendedQuantity > 0) {
            purchaseOrders.push({
              productId: recommendation.productId,
              productName: recommendation.productName,
              recommendedQuantity: prediction.recommendedQuantity,
              urgency: recommendation.status,
              reason: recommendation.recommendation
            });
          }
        }
      }

      return {
        generatedAt: new Date(),
        totalRecommendations: insights.recommendations.length,
        purchaseOrders: purchaseOrders,
        summary: {
          criticalItems: purchaseOrders.filter(po => po.urgency === 'critical').length,
          lowStockItems: purchaseOrders.filter(po => po.urgency === 'low').length,
          totalValue: purchaseOrders.reduce((sum, po) => sum + po.recommendedQuantity, 0)
        }
      };

    } catch (error) {
      console.error('Generate purchase orders error:', error);
      return {
        generatedAt: new Date(),
        totalRecommendations: 0,
        purchaseOrders: [],
        summary: { criticalItems: 0, lowStockItems: 0, totalValue: 0 }
      };
    }
  }

  // Monitor stock levels and send alerts
  async checkStockAlerts(sellerId) {
    try {
      const insights = await this.getInventoryInsights(sellerId);

      const alerts = [];

      if (insights.criticalStock > 0) {
        alerts.push({
          type: 'critical',
          message: `${insights.criticalStock} products are critically low on stock`,
          action: 'Urgent restock required'
        });
      }

      if (insights.lowStock > 0) {
        alerts.push({
          type: 'warning',
          message: `${insights.lowStock} products are running low on stock`,
          action: 'Consider restocking soon'
        });
      }

      if (insights.overstock > 0) {
        alerts.push({
          type: 'info',
          message: `${insights.overstock} products may be overstocked`,
          action: 'Review inventory levels'
        });
      }

      return {
        alerts,
        totalAlerts: alerts.length,
        insights
      };

    } catch (error) {
      console.error('Check stock alerts error:', error);
      return { alerts: [], totalAlerts: 0, insights: null };
    }
  }
}

module.exports = new InventoryService();