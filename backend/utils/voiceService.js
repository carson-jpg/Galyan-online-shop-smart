const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Voice Commerce Service
class VoiceService {
  // Process voice commands for e-commerce
  async processVoiceCommand(audioBuffer, userContext = {}) {
    try {
      // Convert audio to text (mock implementation - would need actual speech-to-text)
      const transcription = await this.convertSpeechToText(audioBuffer);

      // Process the command with AI
      const command = await this.parseVoiceCommand(transcription, userContext);

      // Execute the command
      const result = await this.executeVoiceCommand(command, userContext);

      // Generate voice response
      const voiceResponse = await this.generateVoiceResponse(result);

      return {
        transcription,
        command,
        result,
        voiceResponse,
        audioUrl: voiceResponse.audioUrl
      };

    } catch (error) {
      console.error('Voice command processing error:', error);
      return {
        error: 'Failed to process voice command',
        transcription: null,
        command: null,
        result: null,
        voiceResponse: null
      };
    }
  }

  // Convert speech to text (mock - would use actual STT service)
  async convertSpeechToText(audioBuffer) {
    // Mock implementation - in real app, use Google Speech-to-Text, AWS Transcribe, etc.
    return "Show me smartphones under 50,000 shillings"; // Mock transcription
  }

  // Parse voice command using AI
  async parseVoiceCommand(transcription, userContext) {
    try {
      const prompt = `Parse this voice command for an e-commerce shopping assistant: "${transcription}"

User context: ${JSON.stringify(userContext)}

Extract:
- intent (search, add_to_cart, checkout, browse, etc.)
- product_category (if mentioned)
- product_name (if mentioned)
- price_range (if mentioned)
- quantity (if mentioned)
- filters (brand, color, size, etc.)

Return as JSON.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 200,
        temperature: 0.1,
      });

      const parsedCommand = JSON.parse(completion.choices[0].message.content);
      return parsedCommand;

    } catch (error) {
      console.error('Voice command parsing error:', error);
      return {
        intent: 'search',
        product_category: null,
        product_name: null,
        price_range: null,
        quantity: 1,
        filters: {}
      };
    }
  }

  // Execute voice command
  async executeVoiceCommand(command, userContext) {
    try {
      const { intent, product_category, product_name, price_range, quantity, filters } = command;

      switch (intent) {
        case 'search':
          return await this.performVoiceSearch(product_category, product_name, price_range, filters);

        case 'add_to_cart':
          return await this.addToCartVoice(product_name || product_category, quantity, userContext);

        case 'checkout':
          return await this.initiateVoiceCheckout(userContext);

        case 'browse':
          return await this.browseCategoryVoice(product_category);

        case 'show_cart':
          return await this.showCartVoice(userContext);

        case 'remove_from_cart':
          return await this.removeFromCartVoice(product_name, userContext);

        default:
          return {
            success: false,
            message: "I didn't understand that command. Try saying 'show me smartphones' or 'add iPhone to cart'."
          };
      }

    } catch (error) {
      console.error('Voice command execution error:', error);
      return {
        success: false,
        message: 'Sorry, I encountered an error processing your request.'
      };
    }
  }

  // Voice search implementation
  async performVoiceSearch(category, productName, priceRange, filters) {
    try {
      const Product = require('../models/Product');

      let query = { isActive: true };

      // Build search query
      if (productName) {
        query.$or = [
          { name: { $regex: productName, $options: 'i' } },
          { description: { $regex: productName, $options: 'i' } }
        ];
      }

      if (category) {
        query.category = { $regex: category, $options: 'i' };
      }

      if (priceRange) {
        if (priceRange.min) query.price = { $gte: priceRange.min };
        if (priceRange.max) query.price = { ...query.price, $lte: priceRange.max };
      }

      // Apply filters
      Object.assign(query, filters);

      const products = await Product.find(query)
        .limit(10)
        .sort({ rating: -1, soldCount: -1 });

      if (products.length === 0) {
        return {
          success: true,
          message: `I couldn't find any ${productName || category || 'products'} matching your criteria.`,
          products: [],
          count: 0
        };
      }

      const productList = products.map(p => p.name).join(', ');
      const message = `I found ${products.length} ${productName || category || 'products'}. Here are the top results: ${productList}`;

      return {
        success: true,
        message,
        products: products.map(p => ({
          id: p._id,
          name: p.name,
          price: p.price,
          rating: p.rating
        })),
        count: products.length
      };

    } catch (error) {
      console.error('Voice search error:', error);
      return {
        success: false,
        message: 'Sorry, I had trouble searching for products.'
      };
    }
  }

  // Add to cart via voice
  async addToCartVoice(productIdentifier, quantity, userContext) {
    try {
      if (!userContext.userId) {
        return {
          success: false,
          message: 'Please log in to add items to your cart.'
        };
      }

      const Product = require('../models/Product');
      const Cart = require('../models/Cart');

      // Find product
      const product = await Product.findOne({
        $or: [
          { name: { $regex: productIdentifier, $options: 'i' } },
          { tags: { $in: [productIdentifier.toLowerCase()] } }
        ],
        isActive: true
      });

      if (!product) {
        return {
          success: false,
          message: `I couldn't find a product called ${productIdentifier}.`
        };
      }

      if (product.stock < quantity) {
        return {
          success: false,
          message: `Sorry, only ${product.stock} units of ${product.name} are available.`
        };
      }

      // Add to cart
      let cart = await Cart.findOne({ user: userContext.userId });
      if (!cart) {
        cart = new Cart({ user: userContext.userId, items: [], totalAmount: 0 });
      }

      const existingItem = cart.items.find(item => item.product.toString() === product._id.toString());

      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        cart.items.push({
          product: product._id,
          quantity,
          price: product.price
        });
      }

      // Recalculate total
      cart.totalAmount = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      await cart.save();

      return {
        success: true,
        message: `Added ${quantity} ${product.name} to your cart. Your cart total is now KSh ${cart.totalAmount.toLocaleString()}.`,
        cartTotal: cart.totalAmount,
        itemCount: cart.items.length
      };

    } catch (error) {
      console.error('Voice add to cart error:', error);
      return {
        success: false,
        message: 'Sorry, I had trouble adding that item to your cart.'
      };
    }
  }

  // Voice checkout
  async initiateVoiceCheckout(userContext) {
    try {
      if (!userContext.userId) {
        return {
          success: false,
          message: 'Please log in to checkout.'
        };
      }

      const Cart = require('../models/Cart');
      const cart = await Cart.findOne({ user: userContext.userId }).populate('items.product');

      if (!cart || cart.items.length === 0) {
        return {
          success: false,
          message: 'Your cart is empty. Add some items before checking out.'
        };
      }

      return {
        success: true,
        message: `Ready to checkout with ${cart.items.length} items totaling KSh ${cart.totalAmount.toLocaleString()}. Would you like me to proceed to checkout?`,
        cartSummary: {
          itemCount: cart.items.length,
          totalAmount: cart.totalAmount,
          items: cart.items.map(item => ({
            name: item.product.name,
            quantity: item.quantity,
            price: item.price
          }))
        },
        action: 'checkout_ready'
      };

    } catch (error) {
      console.error('Voice checkout error:', error);
      return {
        success: false,
        message: 'Sorry, I had trouble accessing your cart.'
      };
    }
  }

  // Browse category via voice
  async browseCategoryVoice(category) {
    try {
      const Product = require('../models/Product');

      const products = await Product.find({
        category: { $regex: category, $options: 'i' },
        isActive: true
      })
      .limit(5)
      .sort({ rating: -1 });

      if (products.length === 0) {
        return {
          success: true,
          message: `I couldn't find any products in the ${category} category.`,
          products: []
        };
      }

      const productNames = products.map(p => p.name).join(', ');
      return {
        success: true,
        message: `Here are some popular ${category} products: ${productNames}`,
        products: products.map(p => ({
          id: p._id,
          name: p.name,
          price: p.price
        }))
      };

    } catch (error) {
      console.error('Voice browse category error:', error);
      return {
        success: false,
        message: 'Sorry, I had trouble browsing that category.'
      };
    }
  }

  // Show cart via voice
  async showCartVoice(userContext) {
    try {
      if (!userContext.userId) {
        return {
          success: false,
          message: 'Please log in to view your cart.'
        };
      }

      const Cart = require('../models/Cart');
      const cart = await Cart.findOne({ user: userContext.userId }).populate('items.product');

      if (!cart || cart.items.length === 0) {
        return {
          success: true,
          message: 'Your cart is empty.',
          cart: { items: [], totalAmount: 0 }
        };
      }

      const itemDescriptions = cart.items.map(item =>
        `${item.quantity} ${item.product.name} at KSh ${item.price.toLocaleString()} each`
      ).join(', ');

      return {
        success: true,
        message: `Your cart contains: ${itemDescriptions}. Total: KSh ${cart.totalAmount.toLocaleString()}.`,
        cart: {
          items: cart.items.map(item => ({
            name: item.product.name,
            quantity: item.quantity,
            price: item.price,
            total: item.price * item.quantity
          })),
          totalAmount: cart.totalAmount
        }
      };

    } catch (error) {
      console.error('Voice show cart error:', error);
      return {
        success: false,
        message: 'Sorry, I had trouble accessing your cart.'
      };
    }
  }

  // Remove from cart via voice
  async removeFromCartVoice(productName, userContext) {
    try {
      if (!userContext.userId) {
        return {
          success: false,
          message: 'Please log in to modify your cart.'
        };
      }

      const Cart = require('../models/Cart');
      const cart = await Cart.findOne({ user: userContext.userId }).populate('items.product');

      if (!cart || cart.items.length === 0) {
        return {
          success: false,
          message: 'Your cart is empty.'
        };
      }

      // Find item to remove
      const itemIndex = cart.items.findIndex(item =>
        item.product.name.toLowerCase().includes(productName.toLowerCase())
      );

      if (itemIndex === -1) {
        return {
          success: false,
          message: `I couldn't find ${productName} in your cart.`
        };
      }

      const removedItem = cart.items.splice(itemIndex, 1)[0];

      // Recalculate total
      cart.totalAmount = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      await cart.save();

      return {
        success: true,
        message: `Removed ${removedItem.product.name} from your cart. Your new total is KSh ${cart.totalAmount.toLocaleString()}.`,
        cartTotal: cart.totalAmount,
        itemCount: cart.items.length
      };

    } catch (error) {
      console.error('Voice remove from cart error:', error);
      return {
        success: false,
        message: 'Sorry, I had trouble removing that item from your cart.'
      };
    }
  }

  // Generate voice response (mock - would use TTS service)
  async generateVoiceResponse(result) {
    try {
      // Mock implementation - in real app, use Google TTS, AWS Polly, etc.
      return {
        text: result.message,
        audioUrl: null, // Would be URL to generated audio file
        duration: Math.ceil(result.message.length / 15) // Rough estimate
      };

    } catch (error) {
      console.error('Voice response generation error:', error);
      return {
        text: 'Sorry, I had trouble generating a voice response.',
        audioUrl: null,
        duration: 3
      };
    }
  }

  // Get voice command suggestions
  getVoiceSuggestions(context = {}) {
    const suggestions = [
      "Show me smartphones",
      "Add iPhone to cart",
      "What's in my cart?",
      "Find laptops under 100,000",
      "Browse electronics",
      "Checkout my order"
    ];

    return suggestions;
  }
}

module.exports = new VoiceService();