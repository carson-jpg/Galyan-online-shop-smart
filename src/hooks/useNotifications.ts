import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import socketService from '@/lib/socket';
import { useToast } from '@/hooks/use-toast';

interface Notification {
  id: string;
  type: 'message' | 'order' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  data?: unknown;
}

export const useNotifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (user) {
      // Connect to socket for real-time notifications
      const socket = socketService.connect(user._id);

      // Listen for message notifications
      const handleMessageNotification = (data: unknown) => {
        const chatName = typeof data === 'object' && data !== null && 'chat' in data && data.chat && typeof data.chat === 'object' && data.chat !== null
          ? (('customer' in data.chat && data.chat.customer && typeof data.chat.customer === 'object' && 'name' in data.chat.customer && typeof data.chat.customer.name === 'string' ? data.chat.customer.name : undefined) ||
             ('seller' in data.chat && data.chat.seller && typeof data.chat.seller === 'object' && 'businessName' in data.chat.seller && typeof data.chat.seller.businessName === 'string' ? data.chat.seller.businessName : undefined))
          : 'Unknown';

        const notification: Notification = {
          id: `msg_${Date.now()}`,
          type: 'message',
          title: 'New Message',
          message: `New message from ${chatName}`,
          timestamp: new Date(),
          read: false,
          data: data
        };

        setNotifications(prev => [notification, ...prev]);

        // Show toast notification
        toast({
          title: notification.title,
          description: notification.message,
          duration: 5000,
        });
      };

      socketService.onMessageNotification(handleMessageNotification);

      return () => {
        socketService.off('messageNotification', handleMessageNotification);
      };
    }
  }, [user, toast]);

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const removeNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
  };
};