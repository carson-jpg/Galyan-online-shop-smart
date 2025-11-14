const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Seller = require('../models/Seller');

// AI-Powered Analytics Dashboard Controller
class AnalyticsController {
  // Get comprehensive analytics dashboard data
  async getAnalyticsDashboard(req, res) {
    try {
      const timeframe = req.query.days || 30;
      const startDate = new Date(Date.now() - timeframe * 24 * 60 * 60 * 1000);

      // Get all analytics data in parallel
      const [
        salesAnalytics,
        productAnalytics,
        customerAnalytics,
        inventoryAnalytics,
        marketingAnalytics
      ] = await Promise.all([
        this.getSalesAnalytics(startDate),
        this.getProductAnalytics(startDate),
        this.getCustomerAnalytics(startDate),
        this.getInventoryAnalytics(),
        this.getMarketingAnalytics(startDate)
      ]);

      // Generate AI insights
      const insights = await this.generateAIInsights({
        salesAnalytics,
        productAnalytics,
        customerAnalytics,
        inventoryAnalytics,
        marketingAnalytics
      });

      res.json({
        timeframe,
        salesAnalytics,
        productAnalytics,
        customerAnalytics,
        inventoryAnalytics,
        marketingAnalytics,
        insights,
        generatedAt: new Date()
      });

    } catch (error) {
      console.error('Get analytics dashboard error:', error);
      res.status(500).json({ message: error.message });
    }
  }

  // Sales analytics
  async getSalesAnalytics(startDate) {
    try {
      const orders = await Order.find({
        createdAt: { $gte: startDate },
        isPaid: true
      }).populate('orderItems.product');

      const totalRevenue = orders.reduce((sum, order) =>
        sum + order.orderItems.reduce((itemSum, item) => itemSum + (item.price * item.quantity), 0), 0
      );

      const totalOrders = orders.length;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Revenue by day
      const revenueByDay = {};
      orders.forEach(order => {
        const day = order.createdAt.toISOString().split('T')[0];
        const orderTotal = order.orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        revenueByDay[day] = (revenueByDay[day] || 0) + orderTotal;
      });

      // Top selling products
      const productSales = {};
      orders.forEach(order => {
        order.orderItems.forEach(item => {
          const productId = item.product?._id?.toString();
          if (productId) {
            productSales[productId] = {
              name: item.product?.name || 'Unknown',
              quantity: (productSales[productId]?.quantity || 0) + item.quantity,
              revenue: (productSales[productId]?.revenue || 0) + (item.price * item.quantity)
            };
          }
        });
      });

      const topProducts = Object.values(productSales)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      return {
        totalRevenue,
        totalOrders,
        averageOrderValue,
        revenueByDay,
        topProducts,
        conversionRate: 0 // Would need more data for this
      };

    } catch (error) {
      console.error('Sales analytics error:', error);
      return {
        totalRevenue: 0,
        totalOrders: 0,
        averageOrderValue: 0,
        revenueByDay: {},
        topProducts: []
      };
    }
  }

  // Product analytics
  async getProductAnalytics(startDate) {
    try {
      const products = await Product.find({ isActive: true });

      // Calculate product performance metrics
      const productMetrics = await Promise.all(products.map(async (product) => {
        const orders = await Order.find({
          'orderItems.product': product._id,
          createdAt: { $gte: startDate },
          isPaid: true
        });

        const totalSold = orders.reduce((sum, order) => {
          const item = order.orderItems.find(item => item.product.toString() === product._id.toString());
          return sum + (item ? item.quantity : 0);
        }, 0);

        const totalRevenue = orders.reduce((sum, order) => {
          const item = order.orderItems.find(item => item.product.toString() === product._id.toString());
          return sum + (item ? item.price * item.quantity : 0);
        }, 0);

        return {
          id: product._id,
          name: product.name,
          category: product.category,
          stock: product.stock,
          soldCount: totalSold,
          revenue: totalRevenue,
          rating: product.rating || 0,
          reviewCount: product.reviewCount || 0
        };
      }));

      // Category performance
      const categoryPerformance = {};
      productMetrics.forEach(product => {
        if (!categoryPerformance[product.category]) {
          categoryPerformance[product.category] = {
            totalProducts: 0,
            totalSold: 0,
            totalRevenue: 0
          };
        }
        categoryPerformance[product.category].totalProducts++;
        categoryPerformance[product.category].totalSold += product.soldCount;
        categoryPerformance[product.category].totalRevenue += product.revenue;
      });

      return {
        totalProducts: products.length,
        productMetrics: productMetrics.sort((a, b) => b.revenue - a.revenue),
        categoryPerformance,
        lowStockProducts: productMetrics.filter(p => p.stock < 10),
        topRatedProducts: productMetrics.filter(p => p.rating >= 4.5).sort((a, b) => b.rating - a.rating)
      };

    } catch (error) {
      console.error('Product analytics error:', error);
      return {
        totalProducts: 0,
        productMetrics: [],
        categoryPerformance: {},
        lowStockProducts: [],
        topRatedProducts: []
      };
    }
  }

  // Customer analytics
  async getCustomerAnalytics(startDate) {
    try {
      const customers = await User.find({ role: 'user' });

      const customerMetrics = await Promise.all(customers.map(async (customer) => {
        const orders = await Order.find({
          user: customer._id,
          createdAt: { $gte: startDate },
          isPaid: true
        });

        const totalSpent = orders.reduce((sum, order) =>
          sum + order.orderItems.reduce((itemSum, item) => itemSum + (item.price * item.quantity), 0), 0
        );

        const orderCount = orders.length;
        const averageOrderValue = orderCount > 0 ? totalSpent / orderCount : 0;

        // Calculate customer lifetime value (CLV)
        const allOrders = await Order.find({
          user: customer._id,
          isPaid: true
        });

        const lifetimeValue = allOrders.reduce((sum, order) =>
          sum + order.orderItems.reduce((itemSum, item) => itemSum + (item.price * item.quantity), 0), 0
        );

        return {
          id: customer._id,
          name: customer.name,
          email: customer.email,
          joinDate: customer.createdAt,
          totalSpent,
          orderCount,
          averageOrderValue,
          lifetimeValue,
          lastOrderDate: orders.length > 0 ? orders[orders.length - 1].createdAt : null
        };
      }));

      // Customer segments
      const segments = {
        highValue: customerMetrics.filter(c => c.lifetimeValue > 50000),
        regular: customerMetrics.filter(c => c.lifetimeValue > 10000 && c.lifetimeValue <= 50000),
        new: customerMetrics.filter(c => {
          const accountAge = (Date.now() - new Date(c.joinDate).getTime()) / (1000 * 60 * 60 * 24);
          return accountAge < 30;
        }),
        inactive: customerMetrics.filter(c => !c.lastOrderDate || (Date.now() - new Date(c.lastOrderDate).getTime()) > (90 * 24 * 60 * 60 * 1000))
      };

      return {
        totalCustomers: customers.length,
        customerMetrics: customerMetrics.sort((a, b) => b.lifetimeValue - a.lifetimeValue),
        segments,
        retentionRate: 0, // Would need more complex calculation
        churnRate: 0
      };

    } catch (error) {
      console.error('Customer analytics error:', error);
      return {
        totalCustomers: 0,
        customerMetrics: [],
        segments: { highValue: [], regular: [], new: [], inactive: [] }
      };
    }
  }

  // Inventory analytics
  async getInventoryAnalytics() {
    try {
      const products = await Product.find({ isActive: true });

      const inventoryMetrics = {
        totalProducts: products.length,
        totalValue: products.reduce((sum, product) => sum + (product.price * product.stock), 0),
        stockDistribution: {
          inStock: products.filter(p => p.stock > 10).length,
          lowStock: products.filter(p => p.stock > 0 && p.stock <= 10).length,
          outOfStock: products.filter(p => p.stock === 0).length
        },
        topSellingProducts: products
          .filter(p => p.soldCount > 0)
          .sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0))
          .slice(0, 10)
      };

      return inventoryMetrics;

    } catch (error) {
      console.error('Inventory analytics error:', error);
      return {
        totalProducts: 0,
        totalValue: 0,
        stockDistribution: { inStock: 0, lowStock: 0, outOfStock: 0 },
        topSellingProducts: []
      };
    }
  }

  // Marketing analytics
  async getMarketingAnalytics(startDate) {
    try {
      // Mock marketing analytics - in real implementation, you'd aggregate from email campaigns
      return {
        campaignsSent: 0,
        totalOpens: 0,
        totalClicks: 0,
        conversionRate: 0,
        topPerformingCampaigns: [],
        customerAcquisitionCost: 0,
        returnOnAdSpend: 0
      };

    } catch (error) {
      console.error('Marketing analytics error:', error);
      return {
        campaignsSent: 0,
        totalOpens: 0,
        totalClicks: 0,
        conversionRate: 0,
        topPerformingCampaigns: [],
        customerAcquisitionCost: 0,
        returnOnAdSpend: 0
      };
    }
  }

  // Generate AI-powered insights
  async generateAIInsights(data) {
    try {
      const insights = [];

      // Sales insights
      if (data.salesAnalytics.totalRevenue > 0) {
        if (data.salesAnalytics.averageOrderValue > 10000) {
          insights.push({
            type: 'positive',
            title: 'High Average Order Value',
            description: `Your average order value of KSh ${data.salesAnalytics.averageOrderValue.toLocaleString()} indicates strong customer spending power.`,
            recommendation: 'Consider introducing premium products or loyalty programs to further increase order values.'
          });
        }

        const topProduct = data.salesAnalytics.topProducts[0];
        if (topProduct) {
          insights.push({
            type: 'info',
            title: 'Top Performing Product',
            description: `${topProduct.name} is your best-selling product with ${topProduct.quantity} units sold.`,
            recommendation: 'Consider creating similar products or running targeted promotions for this category.'
          });
        }
      }

      // Inventory insights
      if (data.inventoryAnalytics.stockDistribution.lowStock > 0) {
        insights.push({
          type: 'warning',
          title: 'Low Stock Alert',
          description: `${data.inventoryAnalytics.stockDistribution.lowStock} products are running low on stock.`,
          recommendation: 'Review inventory levels and consider restocking to avoid stockouts.'
        });
      }

      // Customer insights
      const highValueCustomers = data.customerAnalytics.segments.highValue.length;
      if (highValueCustomers > 0) {
        insights.push({
          type: 'positive',
          title: 'High-Value Customers',
          description: `You have ${highValueCustomers} high-value customers contributing significantly to revenue.`,
          recommendation: 'Implement VIP programs or personalized services for these customers.'
        });
      }

      const inactiveCustomers = data.customerAnalytics.segments.inactive.length;
      if (inactiveCustomers > data.customerAnalytics.totalCustomers * 0.3) {
        insights.push({
          type: 'warning',
          title: 'Customer Retention Concern',
          description: `${inactiveCustomers} customers haven't made recent purchases.`,
          recommendation: 'Launch re-engagement campaigns with special offers for inactive customers.'
        });
      }

      // Product insights
      const topRatedProducts = data.productAnalytics.topRatedProducts.length;
      if (topRatedProducts > 0) {
        insights.push({
          type: 'positive',
          title: 'Product Quality Excellence',
          description: `${topRatedProducts} products have excellent ratings (4.5+ stars).`,
          recommendation: 'Highlight these products in marketing materials and consider expanding similar product lines.'
        });
      }

      return insights;

    } catch (error) {
      console.error('Generate AI insights error:', error);
      return [];
    }
  }
}

const analyticsController = new AnalyticsController();

// Export individual methods
const getAnalyticsDashboard = analyticsController.getAnalyticsDashboard.bind(analyticsController);

module.exports = {
  getAnalyticsDashboard
};