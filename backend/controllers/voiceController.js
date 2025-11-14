const aiService = require('../utils/aiService');
const Product = require('../models/Product');
const User = require('../models/User');

// @desc    Process voice commands for shopping
// @route   POST /api/voice/process-command
// @access  Private
const processVoiceCommand = async (req, res) => {
  try {
    const { command, userId } = req.body;

    if (!command || !command.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Voice command is required'
      });
    }

    // Get user context for personalization
    let userContext = null;
    if (userId) {
      try {
        const user = await User.findById(userId).select('name preferences');
        if (user) {
          userContext = {
            name: user.name,
            preferences: user.preferences || []
          };
        }
      } catch (userError) {
        console.error('Error fetching user context:', userError);
      }
    }

    // Process the voice command using AI
    let aiResponse;
    try {
      aiResponse = await aiService.processVoiceCommand(command, userContext);
    } catch (aiError) {
      console.error('AI Voice Command Error:', aiError.message);
      // Fallback response
      aiResponse = {
        intent: 'search_products',
        keywords: [command],
        response: "I heard you say: " + command + ". Let me help you find what you're looking for!"
      };
    }

    if (!aiResponse) {
      return res.status(500).json({
        success: false,
        message: 'Failed to process voice command'
      });
    }

    // Execute the command based on AI interpretation
    const result = await executeVoiceCommand(aiResponse, userId);

    res.json({
      success: true,
      response: aiResponse.response,
      products: result.products || [],
      actions: result.actions || []
    });

  } catch (error) {
    console.error('Voice command processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process voice command',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Execute the interpreted voice command
const executeVoiceCommand = async (aiResponse, userId) => {
  const result = {
    products: [],
    actions: []
  };

  try {
    // Handle different types of voice commands
    if (aiResponse.intent === 'search_products') {
      // Search for products based on AI interpretation
      const searchQuery = {
        isActive: true,
        $or: []
      };

      // Build search query from AI keywords
      if (aiResponse.keywords && aiResponse.keywords.length > 0) {
        const keywordConditions = aiResponse.keywords.map(keyword => ({
          $or: [
            { name: { $regex: keyword, $options: 'i' } },
            { description: { $regex: keyword, $options: 'i' } },
            { tags: { $regex: keyword, $options: 'i' } },
            { brand: { $regex: keyword, $options: 'i' } }
          ]
        }));

        searchQuery.$or = keywordConditions;
      }

      // Add category filter if specified
      if (aiResponse.category) {
        searchQuery.category = { $regex: aiResponse.category, $options: 'i' };
      }

      // Add price filter if specified
      if (aiResponse.priceRange) {
        searchQuery.price = {};
        if (aiResponse.priceRange.min) {
          searchQuery.price.$gte = aiResponse.priceRange.min;
        }
        if (aiResponse.priceRange.max) {
          searchQuery.price.$lte = aiResponse.priceRange.max;
        }
      }

      // Execute search
      const products = await Product.find(searchQuery)
        .populate('category', 'name')
        .limit(10)
        .sort({ soldCount: -1, rating: -1 });

      result.products = products;

      // Add search action
      if (aiResponse.keywords && aiResponse.keywords.length > 0) {
        result.actions.push({
          type: 'search',
          label: `View all ${aiResponse.keywords.join(' ')} products`,
          query: aiResponse.keywords.join(' ')
        });
      }

    } else if (aiResponse.intent === 'get_product_info') {
      // Get specific product information
      if (aiResponse.productName) {
        const product = await Product.findOne({
          name: { $regex: aiResponse.productName, $options: 'i' },
          isActive: true
        }).populate('category', 'name');

        if (product) {
          result.products = [product];
        }
      }

    } else if (aiResponse.intent === 'add_to_cart') {
      // This would be handled on the frontend
      result.actions.push({
        type: 'add_to_cart',
        label: 'Add to Cart',
        productId: aiResponse.productId
      });

    } else if (aiResponse.intent === 'get_recommendations') {
      // Get personalized recommendations
      if (userId) {
        const recommendations = await aiService.getPersonalizedRecommendations(userId, 5);
        result.products = recommendations;
      } else {
        // Get trending products for non-logged users
        const trending = await Product.find({ isActive: true })
          .populate('category', 'name')
          .sort({ soldCount: -1, rating: -1 })
          .limit(5);
        result.products = trending;
      }

    } else if (aiResponse.intent === 'browse_category') {
      // Browse products by category
      if (aiResponse.category) {
        const products = await Product.find({
          category: { $regex: aiResponse.category, $options: 'i' },
          isActive: true
        })
        .populate('category', 'name')
        .limit(8)
        .sort({ soldCount: -1 });

        result.products = products;
      }
    }

  } catch (error) {
    console.error('Error executing voice command:', error);
  }

  return result;
};

// @desc    Get voice command suggestions
// @route   GET /api/voice/suggestions
// @access  Public
const getVoiceSuggestions = async (req, res) => {
  try {
    const suggestions = [
      "Show me smartphones under 50k",
      "Find red running shoes",
      "What are your best selling products?",
      "Find laptops for gaming",
      "Show me smart watches",
      "Find wireless earbuds",
      "What cameras do you have?",
      "Show me kitchen appliances",
      "Find books for programming",
      "What headphones are on sale?"
    ];

    res.json({
      success: true,
      suggestions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get suggestions'
    });
  }
};

module.exports = {
  processVoiceCommand,
  getVoiceSuggestions
};