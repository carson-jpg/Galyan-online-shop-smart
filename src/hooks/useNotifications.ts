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
  data?: any;
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
      const handleMessageNotification = (data: any) => {
        const notification: Notification = {
          id: `msg_${Date.now()}`,
          type: 'message',
          title: 'New Message',
          message: `New message from ${data.chat?.customer?.name || data.chat?.seller?.businessName || 'Unknown'}`,
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