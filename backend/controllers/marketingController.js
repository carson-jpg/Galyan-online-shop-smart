const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const aiService = require('../utils/aiService');
const emailService = require('../utils/emailService');

// @desc    Generate personalized marketing campaigns
// @route   POST /api/marketing/campaigns/generate
// @access  Private/Admin
const generateMarketingCampaign = async (req, res) => {
  try {
    const { campaignType, targetAudience, productId } = req.body;

    let users = [];
    let product = null;

    // Get target audience
    if (targetAudience === 'all') {
      users = await User.find({ role: 'user' }).select('name email');
    } else if (targetAudience === 'recent_buyers') {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const recentOrders = await Order.find({
        createdAt: { $gte: thirtyDaysAgo }
      }).distinct('customer');

      users = await User.find({
        _id: { $in: recentOrders },
        role: 'user'
      }).select('name email');
    } else if (targetAudience === 'inactive_users') {
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      const activeUsers = await Order.find({
        createdAt: { $gte: ninetyDaysAgo }
      }).distinct('customer');

      users = await User.find({
        _id: { $nin: activeUsers },
        role: 'user',
        createdAt: { $lt: ninetyDaysAgo }
      }).select('name email');
    }

    // Get product if specified
    if (productId) {
      product = await Product.findById(productId).populate('category', 'name');
    }

    // Generate personalized content for each user
    const campaigns = [];

    for (const user of users.slice(0, 10)) { // Limit for demo
      try {
        // Get user's recent purchases
        const userOrders = await Order.find({ customer: user._id })
          .populate('orderItems.product', 'name category')
          .sort({ createdAt: -1 })
          .limit(5);

        const recentPurchases = userOrders.flatMap(order =>
          order.orderItems.map(item => item.product?.name).filter(Boolean)
        );

        const userData = {
          name: user.name,
          email: user.email,
          recentPurchases: recentPurchases.slice(0, 3)
        };

        let marketingContent = '';

        if (campaignType === 'product_recommendation' && product) {
          marketingContent = await aiService.generateMarketingContent(userData, {
            name: product.name,
            category: product.category?.name || 'General'
          });
        } else if (campaignType === 'flash_sale') {
          marketingContent = await aiService.generateMarketingContent(userData, {
            name: 'Flash Sale',
            category: 'Special Offer'
          });
        } else if (campaignType === 'welcome_back') {
          marketingContent = `Welcome back, ${user.name}! We noticed you haven't shopped with us recently. Here's a special offer just for you.`;
        }

        if (marketingContent) {
          campaigns.push({
            userId: user._id,
            userEmail: user.email,
            userName: user.name,
            content: marketingContent,
            campaignType,
            productId: product?._id
          });
        }
      } catch (userError) {
        console.error(`Error generating content for user ${user._id}:`, userError);
        continue;
      }
    }

    res.json({
      success: true,
      campaigns,
      totalUsers: users.length,
      generatedCampaigns: campaigns.length
    });

  } catch (error) {
    console.error('Generate marketing campaign error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Send marketing emails
// @route   POST /api/marketing/campaigns/send
// @access  Private/Admin
const sendMarketingEmails = async (req, res) => {
  try {
    const { campaigns } = req.body;

    const results = [];

    for (const campaign of campaigns) {
      try {
        await emailService.sendEmail({
          to: campaign.userEmail,
          subject: getCampaignSubject(campaign.campaignType),
          html: generateEmailTemplate(campaign)
        });

        results.push({
          userId: campaign.userId,
          email: campaign.userEmail,
          status: 'sent',
          sentAt: new Date()
        });
      } catch (emailError) {
        console.error(`Failed to send email to ${campaign.userEmail}:`, emailError);
        results.push({
          userId: campaign.userId,
          email: campaign.userEmail,
          status: 'failed',
          error: emailError.message
        });
      }
    }

    res.json({
      success: true,
      results,
      sent: results.filter(r => r.status === 'sent').length,
      failed: results.filter(r => r.status === 'failed').length
    });

  } catch (error) {
    console.error('Send marketing emails error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get marketing analytics
// @route   GET /api/marketing/analytics
// @access  Private/Admin
const getMarketingAnalytics = async (req, res) => {
  try {
    // This would typically aggregate data from email service providers
    // For now, return mock analytics
    const analytics = {
      totalCampaigns: 0,
      totalEmailsSent: 0,
      openRate: 0,
      clickRate: 0,
      conversionRate: 0,
      campaigns: []
    };

    res.json(analytics);
  } catch (error) {
    console.error('Get marketing analytics error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Helper functions
const getCampaignSubject = (campaignType) => {
  const subjects = {
    product_recommendation: 'Special Recommendation Just for You!',
    flash_sale: '⚡ Flash Sale Alert - Limited Time Only!',
    welcome_back: 'We Miss You! Special Offer Inside'
  };
  return subjects[campaignType] || 'Special Offer from Galyan Shop';
};

const generateEmailTemplate = (campaign) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${getCampaignSubject(campaign.campaignType)}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Galyan Shop</h1>
          <p>Personalized Shopping Experience</p>
        </div>
        <div class="content">
          <h2>Hello ${campaign.userName}!</h2>
          <p>${campaign.content}</p>
          <a href="${process.env.FRONTEND_URL || 'https://galyan-online-shop-smart.vercel.app'}/products" class="button">Shop Now</a>
          <p>Happy shopping! 🎉</p>
        </div>
        <div class="footer">
          <p>You're receiving this email because you're a valued customer of Galyan Shop.</p>
          <p><a href="#">Unsubscribe</a> | <a href="#">Privacy Policy</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
};

module.exports = {
  generateMarketingCampaign,
  sendMarketingEmails,
  getMarketingAnalytics,
};