import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import api from '@/lib/api';
import socketService from '@/lib/socket';

interface Message {
  _id: string;
  sender: {
    _id: string;
    name: string;
    profilePicture?: string;
  };
  content: string;
  messageType: 'text' | 'image' | 'file';
  timestamp: string;
  isRead: boolean;
}

interface Chat {
  _id: string;
  product?: {
    _id: string;
    name: string;
    images: string[];
    price: number;
  } | null;
  seller: {
    _id: string;
    businessName: string;
    storeLogo?: string;
  };
  customer: {
    _id: string;
    name: string;
    profilePicture?: string;
  };
  messages: Message[];
  lastMessage?: {
    content: string;
    sender: {
      _id: string;
      name: string;
    };
    timestamp: string;
  };
  customerUnreadCount: number;
  sellerUnreadCount: number;
  updatedAt: string;
}

// Hook for managing user chats
export const useUserChats = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['userChats', user?._id],
    queryFn: async () => {
      const response = await api.get('/chat');
      return (response.data as Chat[]).filter(chat => chat && chat._id);
    },
    enabled: !!user,
  });
};

// Hook for managing a specific chat
export const useChat = (chatId: string | null) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isTyping, setIsTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  // Get chat data
  const { data: chat, isLoading } = useQuery({
    queryKey: ['chat', chatId],
    queryFn: async () => {
      const response = await api.get(`/chat/conversation/${chatId}`);
      return response.data as Chat;
    },
    enabled: !!chatId && !!user,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ content, messageType = 'text' }: { content: string; messageType?: 'text' | 'image' | 'file' }) => {
      const response = await api.post(`/chat/${chatId}/message`, { content, messageType });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat', chatId] });
      queryClient.invalidateQueries({ queryKey: ['userChats'] });
    },
  });

  // Mark messages as read
  const markAsReadMutation = useMutation({
    mutationFn: async () => {
      await api.put(`/chat/${chatId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat', chatId] });
      queryClient.invalidateQueries({ queryKey: ['userChats'] });
    },
  });

  // Socket connection and event handling
  useEffect(() => {
    if (user && chatId) {
      // Connect to socket
      const socket = socketService.connect(user._id);

      // Join chat room
      socketService.joinChat(chatId, user._id);

      // Listen for new messages
      const handleNewMessage = (data: unknown) => {
        if (typeof data === 'object' && data !== null && 'chatId' in data && data.chatId === chatId) {
          queryClient.invalidateQueries({ queryKey: ['chat', chatId] });
          queryClient.invalidateQueries({ queryKey: ['userChats'] });
        }
      };

      // Listen for typing indicators
      const handleTyping = (data: unknown) => {
        if (typeof data === 'object' && data !== null && 'chatId' in data && 'userId' in data && 'isTyping' in data && data.chatId === chatId && data.userId !== user._id) {
          setIsTyping(data.isTyping as boolean);
        }
      };

      socketService.onNewMessage(handleNewMessage);
      socketService.onUserTyping(handleTyping);

      return () => {
        socketService.off('newMessage', handleNewMessage);
        socketService.off('userTyping', handleTyping);
      };
    }
  }, [user, chatId, queryClient]);

  // Auto-mark messages as read when chat is viewed
  useEffect(() => {
    if (chat && user) {
      const hasUnreadMessages = chat.messages.some(
        msg => !msg.isRead && msg.sender._id !== user._id
      );
      if (hasUnreadMessages) {
        markAsReadMutation.mutate();
      }
    }
  }, [chat, user]);

  const sendMessage = useCallback((content: string, messageType: 'text' | 'image' | 'file' = 'text') => {
    if (socketService.isConnected()) {
      socketService.sendMessage(chatId!, user!._id, content, messageType);
    } else {
      sendMessageMutation.mutate({ content, messageType });
    }
  }, [chatId, user, sendMessageMutation]);

  const emitTyping = useCallback((typing: boolean) => {
    if (socketService.isConnected() && chatId && user) {
      socketService.emitTyping(chatId, user._id, typing);
    }
  }, [chatId, user]);

  return {
    chat,
    isLoading,
    isTyping,
    sendMessage,
    emitTyping,
    markAsRead: markAsReadMutation.mutate,
    isMarkingRead: markAsReadMutation.isPending,
  };
};

// Hook for getting or creating a chat for a product
export const useProductChat = (productId: string | null) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: chat, isLoading } = useQuery({
    queryKey: ['productChat', productId, user?._id],
    queryFn: async () => {
      const response = await api.get(`/chat/${productId}`);
      return response.data as Chat;
    },
    enabled: !!productId && !!user,
  });

  const startChat = useCallback(() => {
    if (productId && user) {
      queryClient.invalidateQueries({ queryKey: ['productChat', productId, user._id] });
    }
  }, [productId, user, queryClient]);

  return {
    chat,
    isLoading,
    startChat,
    chatId: chat?._id || null,
  };
};

// Hook for unread message count
export const useUnreadCount = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['unreadCount', user?._id],
    queryFn: async () => {
      const response = await api.get('/chat/unread-count');
      return response.data.unreadCount as number;
    },
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};