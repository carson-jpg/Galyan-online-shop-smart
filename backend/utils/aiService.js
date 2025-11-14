const OpenAI = require('openai');
const Product = require('../models/Product');
const User = require('../models/User');
const Order = require('../models/Order');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// AI Chat Enhancement Service
class AIService {
  // Generate AI responses for customer support chat
  async generateChatResponse(message, context = {}) {
    try {
      const systemPrompt = `You are an AI assistant for Galyan Shop, a comprehensive e-commerce platform.
      You help customers with product inquiries, order support, and general shopping assistance.

      Key capabilities:
      - Answer questions about products, pricing, and availability
      - Help with order tracking and status updates
      - Provide shopping recommendations
      - Assist with returns and refunds
      - Explain shipping and delivery information
      - Help with account and payment issues

      Guidelines:
      - Be friendly, helpful, and professional
      - Keep responses concise but informative
      - If you don't know something, suggest contacting human support
      - Always prioritize customer satisfaction
      - Use the provided context when available

      Context: ${JSON.stringify(context)}`;

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ],
        max_tokens: 300,
        temperature: 0.7,
      });

      return completion.choices[0].message.content.trim();
    } catch (error) {
      console.error('AI Chat Response Error:', error);
      return "I'm sorry, I'm having trouble responding right now. Please try again or contact our support team.";
    }
  }

  // Generate product recommendations based on user behavior
  async getPersonalizedRecommendations(userId, limit = 5) {
    try {
      console.log('Getting personalized recommendations for user:', userId);

      // Validate inputs
      if (!userId) {
        throw new Error('User ID is required');
      }

      if (limit < 1 || limit > 20) {
        limit = 5; // Default to 5 if invalid
      }

      // Get user's order history with error handling
      let userOrders = [];
      try {
        userOrders = await Order.find({ user: userId, isPaid: true })
          .populate('orderItems.product')
          .sort({ createdAt: -1 })
          .limit(10);
      } catch (orderError) {
        console.error('Error fetching user orders:', orderError);
        // Continue with empty order history
      }

      console.log('User orders found:', userOrders.length);

      if (userOrders.length === 0) {
        console.log('No order history, returning trending products');
        // Return trending products if no order history
        try {
          const trendingProducts = await Product.find({ isActive: true })
            .sort({ soldCount: -1, rating: -1, createdAt: -1 })
            .limit(limit)
            .populate('category', 'name')
            .populate('seller', 'businessName');

          return trendingProducts;
        } catch (trendingError) {
          console.error('Error fetching trending products:', trendingError);
          return []; // Return empty array as fallback
        }
      }

      // Extract product IDs from user's orders safely
      const orderedProductIds = [];
      try {
        userOrders.forEach(order => {
          if (order && order.orderItems && Array.isArray(order.orderItems)) {
            order.orderItems.forEach(item => {
              if (item && item.product && item.product._id) {
                orderedProductIds.push(item.product._id);
              }
            });
          }
        });
      } catch (extractError) {
        console.error('Error extracting product IDs:', extractError);
      }

      console.log('Ordered product IDs:', orderedProductIds.length);

      // Get categories from user's purchased products safely
      const userCategories = [];
      try {
        userOrders.forEach(order => {
          if (order && order.orderItems && Array.isArray(order.orderItems)) {
            order.orderItems.forEach(item => {
              if (item && item.product && item.product.category) {
                userCategories.push(item.product.category);
              }
            });
          }
        });
      } catch (categoryError) {
        console.error('Error extracting categories:', categoryError);
      }

      const uniqueCategories = [...new Set(userCategories)];
      console.log('User categories:', uniqueCategories.length);

      // Find similar products based on categories and exclude already purchased
      let recommendations = [];
      try {
        if (uniqueCategories.length > 0) {
          recommendations = await Product.find({
            isActive: true,
            category: { $in: uniqueCategories },
            _id: { $nin: orderedProductIds }
          })
            .populate('category', 'name')
            .populate('seller', 'businessName')
            .sort({ rating: -1, soldCount: -1, createdAt: -1 })
            .limit(limit * 2); // Get more to filter
        }
      } catch (recommendationError) {
        console.error('Error fetching category-based recommendations:', recommendationError);
        recommendations = [];
      }

      console.log('Initial recommendations:', recommendations.length);

      // If not enough recommendations, add trending products
      if (recommendations.length < limit) {
        try {
          const additionalProducts = await Product.find({
            isActive: true,
            _id: { $nin: [...orderedProductIds, ...recommendations.map(p => p._id)] }
          })
            .populate('category', 'name')
            .populate('seller', 'businessName')
            .sort({ soldCount: -1, rating: -1, createdAt: -1 })
            .limit(limit - recommendations.length);

          recommendations = [...recommendations, ...additionalProducts];
        } catch (additionalError) {
          console.error('Error fetching additional products:', additionalError);
          // Continue with existing recommendations
        }
      }

      // Return limited results
      const finalRecommendations = recommendations.slice(0, limit);
      console.log('Final recommendations:', finalRecommendations.length);

      return finalRecommendations;
    } catch (error) {
      console.error('Error getting personalized recommendations:', error);
      // Return empty array instead of throwing error to prevent 500 responses
      return [];
    }
  }

  // Smart search with AI-powered query understanding
  async smartSearch(query, filters = {}) {
    try {
      // Use AI to understand the search intent
      const searchAnalysis = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "Analyze this search query and extract key terms, categories, and intent. Return as JSON with keys: keywords, category, intent, price_range, features"
          },
          { role: "user", content: query }
        ],
        max_tokens: 150,
        temperature: 0.3,
      });

      const analysis = JSON.parse(searchAnalysis.choices[0].message.content);

      // Build MongoDB query based on AI analysis
      const searchQuery = {
        isActive: true,
        $or: [
          { name: { $regex: analysis.keywords.join('|'), $options: 'i' } },
          { description: { $regex: analysis.keywords.join('|'), $options: 'i' } },
          { tags: { $in: analysis.keywords } }
        ]
      };

      if (analysis.category) {
        searchQuery.category = { $regex: analysis.category, $options: 'i' };
      }

      if (analysis.price_range) {
        if (analysis.price_range.min) searchQuery.price = { $gte: analysis.price_range.min };
        if (analysis.price_range.max) searchQuery.price = { ...searchQuery.price, $lte: analysis.price_range.max };
      }

      // Apply additional filters
      Object.assign(searchQuery, filters);

      const products = await Product.find(searchQuery)
        .sort({ soldCount: -1, rating: -1 })
        .limit(50);

      return {
        products,
        analysis,
        total: products.length
      };
    } catch (error) {
      console.error('Smart Search Error:', error);
      // Fallback to basic search
      const products = await Product.find({
        isActive: true,
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } }
        ]
      }).limit(20);

      return {
        products,
        analysis: { keywords: [query] },
        total: products.length
      };
    }
  }

  // Generate product descriptions
  async generateProductDescription(productData) {
    try {
      const prompt = `Generate a compelling product description for an e-commerce site based on this information:
      Name: ${productData.name}
      Category: ${productData.category}
      Price: ${productData.price}
      Key Features: ${productData.features?.join(', ') || 'Not specified'}

      Make it engaging, highlight benefits, and keep it under 200 words.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 200,
        temperature: 0.7,
      });

      return completion.choices[0].message.content.trim();
    } catch (error) {
      console.error('Product Description Generation Error:', error);
      return null;
    }
  }

  // Analyze customer sentiment from reviews
  async analyzeSentiment(text) {
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "Analyze the sentiment of this text and return only: positive, negative, or neutral"
          },
          { role: "user", content: text }
        ],
        max_tokens: 10,
        temperature: 0.2,
      });

      return completion.choices[0].message.content.trim().toLowerCase();
    } catch (error) {
      console.error('Sentiment Analysis Error:', error);
      return 'neutral';
    }
  }

  // Generate personalized marketing content
  async generateMarketingContent(userData, productData) {
    try {
      const prompt = `Create a personalized marketing message for:
      Customer: ${userData.name}
      Recent purchases: ${userData.recentPurchases?.join(', ') || 'None'}
      Recommended product: ${productData.name}
      Product category: ${productData.category}

      Make it personalized and compelling, under 100 words.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 100,
        temperature: 0.8,
      });

      return completion.choices[0].message.content.trim();
    } catch (error) {
      console.error('Marketing Content Generation Error:', error);
      return null;
    }
  }

  // Process voice commands for shopping
  async processVoiceCommand(command, userContext = null) {
    try {
      const systemPrompt = `You are an AI voice assistant for Galyan Shop, an e-commerce platform.
      Analyze the user's voice command and extract:
      - intent: What the user wants to do (search_products, get_product_info, add_to_cart, get_recommendations, browse_category)
      - keywords: Key search terms
      - category: Product category if mentioned
      - priceRange: Price constraints if mentioned (min/max)
      - productName: Specific product name if mentioned
      - quantity: Quantity if mentioned

      Return a JSON object with these fields. Be smart about understanding natural language.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: command }
        ],
        max_tokens: 200,
        temperature: 0.3,
      });

      const analysis = JSON.parse(completion.choices[0].message.content);

      // Generate a friendly response
      const responsePrompt = `Generate a friendly, helpful response to this voice command: "${command}"
      The user is shopping on Galyan Shop. Keep the response under 50 words and be conversational.`;

      const responseCompletion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: responsePrompt }],
        max_tokens: 50,
        temperature: 0.7,
      });

      return {
        ...analysis,
        response: responseCompletion.choices[0].message.content.trim()
      };
    } catch (error) {
      console.error('Voice Command Processing Error:', error);
      return {
        intent: 'search_products',
        keywords: [command],
        response: "I heard you say: " + command + ". Let me help you find what you're looking for!"
      };
    }
  }
}

module.exports = new AIService();