import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(userId: string) {
    if (this.socket?.connected) {
      return this.socket;
    }

    const API_URL = (typeof window !== 'undefined' && window.location.hostname === 'galyan-online-shop-smart.vercel.app')
      ? 'https://galyan-online-shop-smart.onrender.com'
      : (import.meta.env.VITE_API_URL || 'http://localhost:5000');

    this.socket = io(API_URL, {
      auth: {
        token: localStorage.getItem('token')
      },
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.reconnectAttempts = 0;

      // Join user room
      this.socket?.emit('join', userId);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from server:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      this.handleReconnect();
    });

    return this.socket;
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Reconnecting... Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);

      setTimeout(() => {
        this.socket?.connect();
      }, 2000 * this.reconnectAttempts); // Exponential backoff
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Chat methods
  joinChat(chatId: string, userId: string) {
    this.socket?.emit('joinChat', { chatId, userId });
  }

  sendMessage(chatId: string, senderId: string, content: string, messageType = 'text') {
    this.socket?.emit('sendMessage', {
      chatId,
      senderId,
      content,
      messageType
    });
  }

  onNewMessage(callback: (data: any) => void) {
    this.socket?.on('newMessage', callback);
  }

  onMessageNotification(callback: (data: any) => void) {
    this.socket?.on('messageNotification', callback);
  }

  onUserTyping(callback: (data: any) => void) {
    this.socket?.on('userTyping', callback);
  }

  onError(callback: (error: any) => void) {
    this.socket?.on('error', callback);
  }

  // Typing indicators
  emitTyping(chatId: string, userId: string, isTyping: boolean) {
    this.socket?.emit('typing', { chatId, userId, isTyping });
  }

  // Remove listeners
  off(event: string, callback?: (...args: any[]) => void) {
    if (callback) {
      this.socket?.off(event, callback);
    } else {
      this.socket?.off(event);
    }
  }

  // Get socket instance
  getSocket() {
    return this.socket;
  }

  // Check connection status
  isConnected() {
    return this.socket?.connected || false;
  }
}

export const socketService = new SocketService();
export default socketService;