const express = require('express');
const {
  getUserChats,
  getOrCreateChat,
  getChatById,
  sendMessage,
  markMessagesAsRead,
  getUnreadCount,
} = require('../controllers/chatController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All chat routes require authentication
router.use(protect);

// Get all chats for current user
router.get('/', getUserChats);

// Get unread message count
router.get('/unread-count', getUnreadCount);

// Get or create chat for a product
router.get('/:productId', getOrCreateChat);

// Get specific chat by ID
router.get('/conversation/:chatId', getChatById);

// Send message in chat
router.post('/:chatId/message', sendMessage);

// Mark messages as read
router.put('/:chatId/read', markMessagesAsRead);

module.exports = router;