import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Package } from 'lucide-react';
import { useUserChats } from '@/hooks/useChat';
import { useAuth } from '@/hooks/useAuth';

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

interface ChatListProps {
  onChatSelect: (chatId: string) => void;
  selectedChatId?: string;
}

const ChatList = ({ onChatSelect, selectedChatId }: ChatListProps) => {
  const { user } = useAuth();
  const { data: chats, isLoading } = useUserChats();

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const truncateMessage = (message: string, maxLength: number = 50) => {
    return message.length > maxLength ? message.substring(0, maxLength) + '...' : message;
  };

  const getUnreadCount = (chat: Chat) => {
    if (user?.role === 'seller') {
      return chat.sellerUnreadCount;
    } else {
      return chat.customerUnreadCount;
    }
  };

  const getOtherParticipant = (chat: Chat) => {
    if (user?.role === 'seller') {
      return {
        name: chat.customer.name,
        avatar: chat.customer.profilePicture
      };
    } else {
      return {
        name: chat.seller.businessName,
        avatar: chat.seller.storeLogo
      };
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Conversations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg border animate-pulse">
                <div className="w-10 h-10 bg-muted rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Conversations
          {chats && chats.length > 0 && (
            <Badge variant="secondary" className="ml-auto">
              {chats.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-96">
          {!chats || chats.length === 0 ? (
            <div className="text-center py-8 px-4">
              <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-medium mb-2">No conversations yet</h3>
              <p className="text-sm text-muted-foreground">
                Start chatting with sellers about their products
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {chats.filter((chat: Chat) => chat && chat._id && chat.seller && chat.customer && chat.seller._id && chat.customer._id && (!chat.lastMessage || (chat.lastMessage && chat.lastMessage.sender && chat.lastMessage.sender._id))).map((chat: Chat) => {
                const otherParticipant = getOtherParticipant(chat);
                const unreadCount = getUnreadCount(chat);
                const isSelected = selectedChatId === chat._id;

                return (
                  <Button
                    key={chat._id}
                    variant={isSelected ? "secondary" : "ghost"}
                    className="w-full justify-start h-auto p-3 rounded-none border-b border-border/50 last:border-b-0"
                    onClick={() => onChatSelect(chat._id)}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <Avatar className="w-10 h-10 flex-shrink-0">
                        <AvatarImage src={otherParticipant.avatar} alt={otherParticipant.name} />
                        <AvatarFallback>
                          {otherParticipant.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-sm truncate">
                            {otherParticipant.name}
                          </h4>
                          <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                              <Badge variant="destructive" className="h-5 px-1.5 text-xs">
                                {unreadCount}
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {chat.lastMessage ? formatTime(chat.lastMessage.timestamp) : formatTime(chat.updatedAt)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mb-1">
                          {chat.product ? (
                            <>
                              <Package className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                              <p className="text-xs text-muted-foreground truncate">
                                {chat.product.name}
                              </p>
                            </>
                          ) : (
                            <>
                              <MessageCircle className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                              <p className="text-xs text-muted-foreground truncate">
                                Direct conversation
                              </p>
                            </>
                          )}
                        </div>

                        {chat.lastMessage && chat.lastMessage.sender && (
                          <p className={`text-xs truncate ${
                            unreadCount > 0 ? 'font-medium text-foreground' : 'text-muted-foreground'
                          }`}>
                            {chat.lastMessage.sender._id === user?._id && 'You: '}
                            {truncateMessage(chat.lastMessage.content)}
                          </p>
                        )}
                      </div>
                    </div>
                  </Button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ChatList;