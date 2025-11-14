const Product = require('../models/Product');
const Order = require('../models/Order');

// AI-Powered Pricing Optimization Service
class PricingService {
  // Analyze and optimize product pricing
  async analyzePricing(productId) {
    try {
      const product = await Product.findById(productId);
      if (!product) return null;

      // Get pricing data
      const pricingData = await this.getPricingData(product);

      // Analyze competitor pricing (mock data - would integrate with competitor APIs)
      const competitorPrices = await this.getCompetitorPrices(product);

      // Calculate optimal price
      const optimalPrice = await this.calculateOptimalPrice(product, pricingData, competitorPrices);

      // Generate pricing insights
      const insights = await this.generatePricingInsights(product, pricingData, optimalPrice);

      return {
        productId,
        currentPrice: product.price,
        optimalPrice,
        priceRange: {
          min: optimalPrice * 0.8,
          max: optimalPrice * 1.2
        },
        competitorAverage: competitorPrices.average,
        insights,
        lastAnalyzed: new Date()
      };

    } catch (error) {
      console.error('Pricing analysis error:', error);
      return null;
    }
  }

  // Get pricing data for a product
  async getPricingData(product) {
    try {
      // Get sales data for different price points
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const orders = await Order.find({
        'orderItems.product': product._id,
        createdAt: { $gte: thirtyDaysAgo },
        isPaid: true
      });

      // Calculate conversion rates at different price ranges
      const priceRanges = [
        { min: 0, max: 5000, conversions: 0, total: 0 },
        { min: 5000, max: 15000, conversions: 0, total: 0 },
        { min: 15000, max: 30000, conversions: 0, total: 0 },
        { min: 30000, max: 50000, conversions: 0, total: 0 },
        { min: 50000, max: 100000, conversions: 0, total: 0 },
        { min: 100000, max: Infinity, conversions: 0, total: 0 }
      ];

      // This is a simplified analysis - in reality, you'd need historical pricing data
      orders.forEach(order => {
        const item = order.orderItems.find(item => item.product.toString() === product._id.toString());
        if (item) {
          const range = priceRanges.find(r => item.price >= r.min && item.price < r.max);
          if (range) {
            range.conversions++;
          }
        }
      });

      // Calculate elasticity (simplified)
      const elasticity = this.calculatePriceElasticity(priceRanges);

      return {
        totalSales: orders.length,
        averageOrderValue: orders.length > 0 ?
          orders.reduce((sum, order) => {
            const item = order.orderItems.find(item => item.product.toString() === product._id.toString());
            return sum + (item ? item.price * item.quantity : 0);
          }, 0) / orders.length : 0,
        priceRanges,
        elasticity,
        timeRange: '30 days'
      };

    } catch (error) {
      console.error('Get pricing data error:', error);
      return {
        totalSales: 0,
        averageOrderValue: 0,
        priceRanges: [],
        elasticity: 0,
        timeRange: '30 days'
      };
    }
  }

  // Get competitor pricing (mock implementation)
  async getCompetitorPrices(product) {
    try {
      // Mock competitor data - in real implementation, you'd scrape competitor sites or use APIs
      const mockCompetitors = [
        { name: 'Competitor A', price: product.price * 0.95 },
        { name: 'Competitor B', price: product.price * 1.05 },
        { name: 'Competitor C', price: product.price * 0.9 },
        { name: 'Competitor D', price: product.price * 1.1 }
      ];

      const average = mockCompetitors.reduce((sum, comp) => sum + comp.price, 0) / mockCompetitors.length;
      const min = Math.min(...mockCompetitors.map(c => c.price));
      const max = Math.max(...mockCompetitors.map(c => c.price));

      return {
        competitors: mockCompetitors,
        average,
        min,
        max,
        marketPosition: product.price > average ? 'premium' : product.price < average ? 'budget' : 'competitive'
      };

    } catch (error) {
      console.error('Get competitor prices error:', error);
      return {
        competitors: [],
        average: product.price,
        min: product.price,
        max: product.price,
        marketPosition: 'unknown'
      };
    }
  }

  // Calculate optimal price using AI analysis
  async calculateOptimalPrice(product, pricingData, competitorPrices) {
    try {
      // Simple optimization algorithm
      let optimalPrice = product.price;

      // Factor 1: Competitor positioning
      if (competitorPrices.marketPosition === 'premium') {
        optimalPrice *= 1.1; // Can charge premium
      } else if (competitorPrices.marketPosition === 'budget') {
        optimalPrice *= 0.95; // Need to be competitive
      }

      // Factor 2: Price elasticity
      if (pricingData.elasticity < -1) {
        // Elastic demand - small price changes have big impact
        optimalPrice *= 1.05; // Can increase price
      } else if (pricingData.elasticity > -0.5) {
        // Inelastic demand - price changes have little impact
        optimalPrice *= 0.98; // Slight decrease to boost volume
      }

      // Factor 3: Product category pricing strategy
      const categoryMultipliers = {
        'electronics': 1.0,
        'clothing': 0.9,
        'books': 0.8,
        'home': 1.1,
        'sports': 1.05
      };

      const categoryKey = product.category.toLowerCase();
      const multiplier = Object.keys(categoryMultipliers).find(key =>
        categoryKey.includes(key)
      );

      if (multiplier) {
        optimalPrice *= categoryMultipliers[multiplier];
      }

      // Factor 4: Stock levels (clearance pricing)
      if (product.stock > 100) {
        optimalPrice *= 0.95; // Discount for high stock
      } else if (product.stock < 10) {
        optimalPrice *= 1.1; // Premium for low stock
      }

      // Ensure price is reasonable
      optimalPrice = Math.max(optimalPrice, product.price * 0.7); // Min 30% discount
      optimalPrice = Math.min(optimalPrice, product.price * 1.5); // Max 50% increase

      return Math.round(optimalPrice);

    } catch (error) {
      console.error('Calculate optimal price error:', error);
      return product.price;
    }
  }

  // Calculate price elasticity
  calculatePriceElasticity(priceRanges) {
    try {
      // Simplified elasticity calculation
      // In reality, this would use historical data with different prices
      const totalConversions = priceRanges.reduce((sum, range) => sum + range.conversions, 0);

      if (totalConversions === 0) return 0;

      // Mock elasticity based on conversion distribution
      const lowPriceConversions = priceRanges.slice(0, 2).reduce((sum, range) => sum + range.conversions, 0);
      const highPriceConversions = priceRanges.slice(3).reduce((sum, range) => sum + range.conversions, 0);

      if (lowPriceConversions > highPriceConversions * 2) {
        return -1.5; // Elastic - price sensitive
      } else if (highPriceConversions > lowPriceConversions * 2) {
        return -0.3; // Inelastic - not price sensitive
      }

      return -0.8; // Moderate elasticity

    } catch (error) {
      console.error('Calculate price elasticity error:', error);
      return -0.8;
    }
  }

  // Generate pricing insights
  async generatePricingInsights(product, pricingData, optimalPrice) {
    try {
      const insights = [];
      const priceDifference = ((optimalPrice - product.price) / product.price) * 100;

      if (Math.abs(priceDifference) > 10) {
        if (priceDifference > 0) {
          insights.push({
            type: 'opportunity',
            title: 'Price Increase Opportunity',
            description: `Consider increasing price by ${priceDifference.toFixed(1)}% to KSh ${optimalPrice.toLocaleString()}. This could improve margins without significantly impacting sales.`,
            impact: 'high'
          });
        } else {
          insights.push({
            type: 'warning',
            title: 'Price Decrease Recommended',
            description: `Consider decreasing price by ${Math.abs(priceDifference).toFixed(1)}% to KSh ${optimalPrice.toLocaleString()} to improve competitiveness and sales volume.`,
            impact: 'medium'
          });
        }
      }

      // Stock-based insights
      if (product.stock < 10) {
        insights.push({
          type: 'warning',
          title: 'Low Stock - Premium Pricing',
          description: 'Low stock levels support premium pricing strategy.',
          impact: 'low'
        });
      } else if (product.stock > 50) {
        insights.push({
          type: 'info',
          title: 'High Stock - Consider Promotion',
          description: 'High inventory levels suggest promotional pricing to increase turnover.',
          impact: 'medium'
        });
      }

      // Sales performance insights
      if (pricingData.totalSales < 5) {
        insights.push({
          type: 'warning',
          title: 'Low Sales Volume',
          description: 'Product has low sales. Consider pricing strategy review or marketing efforts.',
          impact: 'high'
        });
      } else if (pricingData.totalSales > 20) {
        insights.push({
          type: 'positive',
          title: 'Strong Sales Performance',
          description: 'Product is selling well. Current pricing strategy is effective.',
          impact: 'high'
        });
      }

      return insights;

    } catch (error) {
      console.error('Generate pricing insights error:', error);
      return [];
    }
  }

  // Apply dynamic pricing
  async applyDynamicPricing(productId, newPrice, reason) {
    try {
      const product = await Product.findById(productId);

      if (!product) {
        throw new Error('Product not found');
      }

      const oldPrice = product.price;
      product.price = newPrice;
      product.pricingHistory = product.pricingHistory || [];
      product.pricingHistory.push({
        oldPrice,
        newPrice,
        reason,
        appliedAt: new Date(),
        appliedBy: 'ai_system'
      });

      await product.save();

      return {
        success: true,
        productId,
        oldPrice,
        newPrice,
        priceChange: ((newPrice - oldPrice) / oldPrice) * 100,
        reason
      };

    } catch (error) {
      console.error('Apply dynamic pricing error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get pricing recommendations for all products
  async getPricingRecommendations(sellerId = null) {
    try {
      const query = { isActive: true };
      if (sellerId) {
        query.seller = sellerId;
      }

      const products = await Product.find(query).limit(50); // Limit for performance

      const recommendations = [];

      for (const product of products) {
        const analysis = await this.analyzePricing(product._id);
        if (analysis && Math.abs(((analysis.optimalPrice - analysis.currentPrice) / analysis.currentPrice) * 100) > 5) {
          recommendations.push({
            productId: product._id,
            productName: product.name,
            currentPrice: analysis.currentPrice,
            recommendedPrice: analysis.optimalPrice,
            priceDifference: ((analysis.optimalPrice - analysis.currentPrice) / analysis.currentPrice) * 100,
            insights: analysis.insights.slice(0, 2) // Top 2 insights
          });
        }
      }

      // Sort by potential impact
      recommendations.sort((a, b) => Math.abs(b.priceDifference) - Math.abs(a.priceDifference));

      return {
        totalProducts: products.length,
        recommendations: recommendations.slice(0, 20), // Top 20 recommendations
        generatedAt: new Date()
      };

    } catch (error) {
      console.error('Get pricing recommendations error:', error);
      return {
        totalProducts: 0,
        recommendations: [],
        generatedAt: new Date()
      };
    }
  }
}

module.exports = new PricingService();