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
      // Get user's order history and viewed products
      const userOrders = await Order.find({ customer: userId })
        .populate('orderItems.product')
        .sort({ createdAt: -1 })
        .limit(10);

      const purchasedCategories = [];
      const purchasedProducts = [];

      userOrders.forEach(order => {
        order.orderItems.forEach(item => {
          if (item.product) {
            purchasedCategories.push(item.product.category);
            purchasedProducts.push(item.product._id);
          }
        });
      });

      // Find similar products
      const recommendations = await Product.find({
        _id: { $nin: purchasedProducts },
        category: { $in: purchasedCategories },
        isActive: true
      })
      .limit(limit)
      .sort({ rating: -1, soldCount: -1 });

      return recommendations;
    } catch (error) {
      console.error('Personalized Recommendations Error:', error);
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
}

module.exports = new AIService();