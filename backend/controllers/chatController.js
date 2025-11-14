const Chat = require('../models/Chat');
const User = require('../models/User');
const Seller = require('../models/Seller');
const Product = require('../models/Product');
const aiService = require('../utils/aiService');

// @desc    Get all chats for a user
// @route   GET /api/chat
// @access  Private
const getUserChats = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;

    let query = {};

    if (userRole === 'seller') {
      // Sellers see chats for their products
      const seller = await Seller.findOne({ user: userId });
      if (!seller) {
        return res.status(404).json({ message: 'Seller profile not found' });
      }
      query.seller = seller._id;
    } else {
      // Customers see their chats
      query.customer = userId;
    }

    const chats = await Chat.find(query)
      .populate('product', 'name images price')
      .populate('seller', 'businessName storeLogo user')
      .populate('customer', 'name profilePicture')
      .populate('lastMessage.sender', 'name')
      .sort({ updatedAt: -1 });

    // Filter out chats with missing required data
    const validChats = chats.filter(chat => {
      return chat.seller && chat.customer && chat.seller.user;
    });

    res.json(validChats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create direct chat with seller (without product)
// @route   POST /api/chat/direct/:sellerId
// @access  Private
const createDirectChat = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const customerId = req.user._id;

    // Check if seller exists and is active
    const seller = await Seller.findById(sellerId);
    if (!seller || !seller.isActive) {
      return res.status(404).json({ message: 'Seller not found or inactive' });
    }

    // Check if direct chat already exists
    let chat = await Chat.findOne({
      seller: sellerId,
      customer: customerId,
      product: null // Direct chats have no product
    }).populate('seller', 'businessName storeLogo user')
      .populate('customer', 'name profilePicture')
      .populate('messages.sender', 'name profilePicture');

    if (!chat) {
      // Create new direct chat
      chat = new Chat({
        participants: [customerId, seller.user],
        seller: sellerId,
        customer: customerId,
        product: null, // No product for direct chats
        messages: []
      });
      await chat.save();

      // Populate the new chat
      chat = await Chat.findById(chat._id)
        .populate('seller', 'businessName storeLogo user')
        .populate('customer', 'name profilePicture');
    }

    res.json(chat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get or create chat between customer and seller for a product
// @route   GET /api/chat/:productId
// @access  Private
const getOrCreateChat = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    // Get product and seller info
    const product = await Product.findById(productId).populate('seller');
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const seller = product.seller;
    if (!seller || !seller.isActive) {
      return res.status(404).json({ message: 'Seller not found or inactive' });
    }

    // Check if chat already exists
    let chat = await Chat.findOne({
      product: productId,
      seller: seller._id,
      customer: userRole === 'user' ? userId : null
    }).populate('product', 'name images price')
      .populate('seller', 'businessName storeLogo')
      .populate('customer', 'name profilePicture')
      .populate('messages.sender', 'name profilePicture');

    if (!chat) {
      // Create new chat
      chat = new Chat({
        participants: [userId, seller.user],
        product: productId,
        seller: seller._id,
        customer: userId,
        messages: []
      });
      await chat.save();

      // Populate the new chat
      chat = await Chat.findById(chat._id)
        .populate('product', 'name images price')
        .populate('seller', 'businessName storeLogo')
        .populate('customer', 'name profilePicture');
    }

    res.json(chat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get chat by ID
// @route   GET /api/chat/conversation/:chatId
// @access  Private
const getChatById = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user._id;

    const chat = await Chat.findById(chatId)
      .populate('product', 'name images price')
      .populate('seller', 'businessName storeLogo user')
      .populate('customer', 'name profilePicture')
      .populate('messages.sender', 'name profilePicture');

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Check if user is participant
    if (!chat.participants.some(p => p.toString() === userId.toString())) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(chat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Send message in chat
// @route   POST /api/chat/:chatId/message
// @access  Private
const sendMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { content, messageType = 'text' } = req.body;
    const senderId = req.user._id;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Check if sender is participant
    if (!chat.participants.some(p => p.toString() === senderId.toString())) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const newMessage = {
      sender: senderId,
      content,
      messageType,
      timestamp: new Date(),
      isRead: false
    };

    chat.messages.push(newMessage);

    // Update unread counts
    const isCustomer = chat.customer.toString() === senderId.toString();
    if (isCustomer) {
      chat.sellerUnreadCount += 1;
    } else {
      chat.customerUnreadCount += 1;
    }

    await chat.save();

    // Populate sender info
    await chat.populate('messages.sender', 'name profilePicture');

    const message = chat.messages[chat.messages.length - 1];

    // Generate AI response if message is from customer and not to AI
    let aiResponse = null;
    if (isCustomer && messageType === 'text' && !content.toLowerCase().includes('ai') && !content.toLowerCase().includes('bot')) {
      try {
        // Get chat context
        const recentMessages = chat.messages.slice(-5).map(msg => ({
          role: msg.sender.toString() === senderId.toString() ? 'user' : 'assistant',
          content: msg.content
        }));

        const context = {
          product: chat.product ? await Product.findById(chat.product).select('name category price') : null,
          seller: chat.seller ? await Seller.findById(chat.seller).select('businessName') : null,
          recentMessages
        };

        aiResponse = await aiService.generateChatResponse(content, context);

        if (aiResponse) {
          const aiMessage = {
            sender: null, // AI sender
            content: aiResponse,
            messageType: 'ai_response',
            timestamp: new Date(),
            isRead: false
          };

          chat.messages.push(aiMessage);
          chat.customerUnreadCount += 1; // AI response counts as unread for customer
          await chat.save();
          await chat.populate('messages.sender', 'name profilePicture');
        }
      } catch (aiError) {
        console.error('AI Response Error:', aiError);
        // Continue without AI response if it fails
      }
    }

    res.json({
      message,
      aiResponse: aiResponse ? chat.messages[chat.messages.length - 1] : null,
      chatId: chat._id
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark messages as read
// @route   PUT /api/chat/:chatId/read
// @access  Private
const markMessagesAsRead = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user._id;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Check if user is participant
    if (!chat.participants.some(p => p.toString() === userId.toString())) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Mark messages as read for this user
    const isCustomer = chat.customer.toString() === userId.toString();
    if (isCustomer) {
      chat.customerUnreadCount = 0;
    } else {
      chat.sellerUnreadCount = 0;
    }

    // Mark individual messages as read
    chat.messages.forEach(msg => {
      if (msg.sender.toString() !== userId.toString()) {
        msg.isRead = true;
      }
    });

    await chat.save();

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get unread message count for user
// @route   GET /api/chat/unread-count
// @access  Private
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;

    let query = {};

    if (userRole === 'seller') {
      const seller = await Seller.findOne({ user: userId });
      if (seller) {
        query.seller = seller._id;
      }
    } else {
      query.customer = userId;
    }

    const chats = await Chat.find(query);
    let totalUnread = 0;

    chats.forEach(chat => {
      if (userRole === 'seller') {
        totalUnread += chat.sellerUnreadCount;
      } else {
        totalUnread += chat.customerUnreadCount;
      }
    });

    res.json({ unreadCount: totalUnread });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get AI chat suggestions
// @route   GET /api/chat/ai-suggestions
// @access  Private
const getAISuggestions = async (req, res) => {
  try {
    const { productId } = req.query;
    let suggestions = [];

    if (productId) {
      const product = await Product.findById(productId).select('name category price');
      if (product) {
        suggestions = [
          `Tell me more about the ${product.name}`,
          `What are the specifications of this product?`,
          `Do you have similar products?`,
          `What's the warranty on this item?`,
          `Can I get this delivered today?`
        ];
      }
    } else {
      suggestions = [
        `Help me find a product`,
        `Check my order status`,
        `I need help with a return`,
        `Show me popular products`,
        `Tell me about shipping costs`
      ];
    }

    res.json({ suggestions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getUserChats,
  getOrCreateChat,
  getChatById,
  createDirectChat,
  sendMessage,
  markMessagesAsRead,
  getUnreadCount,
  getAISuggestions,
};