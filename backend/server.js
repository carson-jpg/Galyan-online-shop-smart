const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const passport = require('passport');
const session = require('express-session');
const http = require('http');
const socketIo = require('socket.io');

dotenv.config();

const app = express();

// Create HTTP server and Socket.IO
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || (process.env.NODE_ENV === 'production' ? "https://galyan-shop.vercel.app" : "http://localhost:8080"),
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Session middleware (required for Passport OAuth)
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Use HTTPS in production
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Database connection
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('MongoDB connected'))
.catch(err => console.log(err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/products/:productId/reviews', require('./routes/reviews'));
app.use('/api/flash-sales', require('./routes/flashSales'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/mpesa', require('./routes/mpesa'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/chat', require('./routes/chat'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 5000;

// Schedule job to update expired flash sales every minute
const FlashSale = require('./models/FlashSale');
setInterval(async () => {
  try {
    await FlashSale.updateExpiredSales();
    await FlashSale.updateSoldOutSales();
  } catch (error) {
    console.error('Error updating flash sales:', error);
  }
}, 60000); // Run every minute

// Socket.IO connection handling
const Chat = require('./models/Chat');
const User = require('./models/User');
const Seller = require('./models/Seller');

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join user to their personal room
  socket.on('join', async (userId) => {
    try {
      socket.join(userId);
      console.log(`User ${userId} joined room`);

      // Update user's online status
      await User.findByIdAndUpdate(userId, { isOnline: true });
      socket.userId = userId;
    } catch (error) {
      console.error('Error joining user room:', error);
    }
  });

  // Handle joining a chat room
  socket.on('joinChat', async (data) => {
    try {
      const { chatId, userId } = data;
      socket.join(`chat_${chatId}`);
      console.log(`User ${userId} joined chat ${chatId}`);

      // Mark messages as read for this user
      const chat = await Chat.findById(chatId);
      if (chat) {
        const isCustomer = chat.customer.toString() === userId;
        const isSeller = chat.seller.toString() === userId;

        if (isCustomer) {
          chat.customerUnreadCount = 0;
        } else if (isSeller) {
          chat.sellerUnreadCount = 0;
        }
        await chat.save();
      }
    } catch (error) {
      console.error('Error joining chat:', error);
    }
  });

  // Handle sending messages
  socket.on('sendMessage', async (data) => {
    try {
      const { chatId, senderId, content, messageType = 'text' } = data;

      const chat = await Chat.findById(chatId).populate('seller').populate('customer');
      if (!chat) {
        socket.emit('error', { message: 'Chat not found' });
        return;
      }

      // Verify sender is part of this chat
      if (!chat.participants.some(p => p.toString() === senderId)) {
        socket.emit('error', { message: 'Unauthorized' });
        return;
      }

      // Add message to chat
      const newMessage = {
        sender: senderId,
        content,
        messageType,
        timestamp: new Date(),
        isRead: false
      };

      chat.messages.push(newMessage);

      // Update unread counts
      const isCustomer = chat.customer._id.toString() === senderId;
      if (isCustomer) {
        chat.sellerUnreadCount += 1;
      } else {
        chat.customerUnreadCount += 1;
      }

      await chat.save();

      // Emit to all participants in the chat room
      io.to(`chat_${chatId}`).emit('newMessage', {
        chatId,
        message: newMessage,
        chat: chat
      });

      // Also emit to individual user rooms for notifications
      const recipientId = isCustomer ? chat.seller._id.toString() : chat.customer._id.toString();
      io.to(recipientId).emit('messageNotification', {
        chatId,
        senderId,
        content,
        chat
      });

    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Handle typing indicators
  socket.on('typing', (data) => {
    const { chatId, userId, isTyping } = data;
    socket.to(`chat_${chatId}`).emit('userTyping', { userId, isTyping });
  });

  // Handle disconnect
  socket.on('disconnect', async () => {
    try {
      if (socket.userId) {
        await User.findByIdAndUpdate(socket.userId, { isOnline: false, lastSeen: new Date() });
        console.log(`User ${socket.userId} disconnected`);
      }
    } catch (error) {
      console.error('Error handling disconnect:', error);
    }
  });
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));