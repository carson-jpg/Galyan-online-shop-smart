import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Package, Image, Paperclip } from 'lucide-react';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/hooks/useAuth';
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
}

interface ChatWindowProps {
  chatId: string;
  onClose?: () => void;
}

const ChatWindow = ({ chatId, onClose }: ChatWindowProps) => {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const { chat, isLoading, isTyping, sendMessage, emitTyping } = useChat(chatId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chat?.messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      sendMessage(message.trim());
      setMessage('');

      // Clear typing indicator
      emitTyping(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);

    // Emit typing indicator
    emitTyping(true);

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      emitTyping(false);
    }, 1000);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
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
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  if (!chat) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-muted-foreground">Chat not found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const otherParticipant = getOtherParticipant(chat);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={otherParticipant.avatar} alt={otherParticipant.name} />
              <AvatarFallback>
                {otherParticipant.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{otherParticipant.name}</CardTitle>
              {chat.product ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Package className="w-3 h-3" />
                  <span>{chat.product.name}</span>
                  <Badge variant="outline" className="text-xs">
                    KSh {chat.product.price.toLocaleString()}
                  </Badge>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  Direct conversation
                </div>
              )}
            </div>
          </div>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              ×
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        {/* Product Info Banner - Only show if there's a product */}
        {chat.product && (
          <div className="bg-muted/50 p-3 border-b">
            <div className="flex items-center gap-3">
              <img
                src={chat.product.images[0] || "/placeholder.svg"}
                alt={chat.product.name}
                className="w-12 h-12 object-cover rounded"
              />
              <div className="flex-1">
                <h4 className="font-medium text-sm">{chat.product.name}</h4>
                <p className="text-sm text-muted-foreground">
                  KSh {chat.product.price.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {chat.messages.filter((msg: Message) => msg && msg.sender).map((msg: Message) => {
              const isOwnMessage = msg.sender._id === user?._id;
              return (
                <div
                  key={msg._id}
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-2 max-w-[70%] ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarImage src={msg.sender.profilePicture} alt={msg.sender.name} />
                      <AvatarFallback className="text-xs">
                        {msg.sender.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`rounded-lg px-3 py-2 ${
                      isOwnMessage
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}>
                      <p className="text-sm">{msg.content}</p>
                      <p className={`text-xs mt-1 ${
                        isOwnMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'
                      }`}>
                        {formatTime(msg.timestamp)}
                        {isOwnMessage && msg.isRead && (
                          <span className="ml-1">✓</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
            {isTyping && (
              <div className="flex justify-start">
                <div className="flex gap-2">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={otherParticipant.avatar} alt={otherParticipant.name} />
                    <AvatarFallback>
                      {otherParticipant.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-muted rounded-lg px-3 py-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="border-t p-4">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                placeholder="Type your message..."
                value={message}
                onChange={handleInputChange}
                className="pr-20"
                disabled={!socketService.isConnected()}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  disabled
                >
                  <Image className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  disabled
                >
                  <Paperclip className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <Button
              type="submit"
              size="icon"
              disabled={!message.trim() || !socketService.isConnected()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
          {!socketService.isConnected() && (
            <p className="text-xs text-muted-foreground mt-2">
              Connecting to chat server...
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ChatWindow;