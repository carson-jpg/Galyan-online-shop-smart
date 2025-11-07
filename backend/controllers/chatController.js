const Chat = require('../models/Chat');
const User = require('../models/User');
const Seller = require('../models/Seller');
const Product = require('../models/Product');

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
      .populate('seller', 'businessName storeLogo')
      .populate('customer', 'name profilePicture')
      .populate('lastMessage.sender', 'name')
      .sort({ updatedAt: -1 });

    res.json(chats);
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

    res.json({
      message,
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

module.exports = {
  getUserChats,
  getOrCreateChat,
  getChatById,
  sendMessage,
  markMessagesAsRead,
  getUnreadCount,
};