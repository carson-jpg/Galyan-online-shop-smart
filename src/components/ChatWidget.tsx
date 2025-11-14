import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Send, X, Minimize2, Maximize2 } from 'lucide-react';
import { useChat, useProductChat, useUnreadCount } from '@/hooks/useChat';
import { useAuth } from '@/hooks/useAuth';
import { useAISuggestions } from '@/hooks/useAISuggestions';
import socketService from '@/lib/socket';

interface Message {
  _id: string;
  sender: {
    _id: string;
    name: string;
    profilePicture?: string;
  } | null; // Allow null for AI messages
  content: string;
  messageType: 'text' | 'image' | 'file' | 'ai_response';
  timestamp: string;
  isRead: boolean;
}

interface ChatWidgetProps {
  productId?: string;
  productName?: string;
  sellerName?: string;
  sellerAvatar?: string;
}

const ChatWidget = ({ productId, productName, sellerName, sellerAvatar }: ChatWidgetProps) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState('');
  const [chatStarted, setChatStarted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const { data: unreadCount } = useUnreadCount();
  const { chat, startChat, chatId } = useProductChat(productId || null);
  const { chat: activeChat, isLoading, isTyping, sendMessage, emitTyping } = useChat(chatId);
  const { data: aiSuggestions } = useAISuggestions(productId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeChat?.messages]);

  const handleStartChat = () => {
    if (productId) {
      startChat();
      setChatStarted(true);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && chatId) {
      sendMessage(message.trim());
      setMessage('');

      // Clear typing indicator
      emitTyping(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);

    // Emit typing indicator
    if (chatId) {
      emitTyping(true);

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set new timeout to stop typing indicator
      typingTimeoutRef.current = setTimeout(() => {
        emitTyping(false);
      }, 1000);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!user) {
    return null; // Don't show chat widget for unauthenticated users
  }

  return (
    <>
      {/* Chat Button */}
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-full w-14 h-14 shadow-lg relative"
          size="icon"
        >
          <MessageCircle className="h-6 w-6" />
          {unreadCount && unreadCount > 0 && (
            <Badge className="absolute -top-2 -right-2 h-6 w-6 flex items-center justify-center p-0 bg-red-500">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Chat Window */}
      {isOpen && (
        <Card className={`fixed bottom-20 right-4 w-80 h-96 shadow-xl z-50 transition-all duration-300 ${
          isMinimized ? 'h-14' : ''
        }`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 cursor-pointer">
            <CardTitle className="text-sm font-medium">
              {productName ? `Chat about ${productName}` : 'Messages'}
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setIsMinimized(!isMinimized)}
              >
                {isMinimized ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>

          {!isMinimized && (
            <CardContent className="flex flex-col h-80 p-0">
              {/* Chat Content */}
              <ScrollArea className="flex-1 p-4">
                {!chatStarted && productId ? (
                  <div className="text-center py-8">
                    <Avatar className="w-12 h-12 mx-auto mb-3">
                      <AvatarImage src={sellerAvatar} alt={sellerName} />
                      <AvatarFallback>
                        {sellerName?.charAt(0)?.toUpperCase() || 'S'}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="font-medium mb-2">Chat with {sellerName}</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Ask questions about this product
                    </p>
                    <Button onClick={handleStartChat} size="sm">
                      Start Chat
                    </Button>
                  </div>
                ) : isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-sm text-muted-foreground mt-2">Loading chat...</p>
                  </div>
                ) : activeChat?.messages ? (
                  <div className="space-y-3">
                    {activeChat.messages.map((msg: Message) => {
                      const isOwnMessage = msg.sender?._id === user._id;
                      const isAIMessage = msg.messageType === 'ai_response';
                      return (
                        <div
                          key={msg._id}
                          className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`flex gap-2 max-w-[80%] ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
                            {!isAIMessage && (
                              <Avatar className="w-6 h-6 flex-shrink-0">
                                <AvatarImage src={msg.sender?.profilePicture} alt={msg.sender?.name || 'AI Assistant'} />
                                <AvatarFallback className="text-xs">
                                  {msg.sender?.name?.charAt(0).toUpperCase() || 'AI'}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            {isAIMessage && (
                              <div className="w-6 h-6 flex-shrink-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs font-bold">AI</span>
                              </div>
                            )}
                            <div className={`rounded-lg px-3 py-2 ${
                              isOwnMessage
                                ? 'bg-primary text-primary-foreground'
                                : isAIMessage
                                ? 'bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200'
                                : 'bg-muted'
                            }`}>
                              {isAIMessage && (
                                <div className="flex items-center gap-1 mb-1">
                                  <span className="text-xs font-medium text-blue-600">AI Assistant</span>
                                </div>
                              )}
                              <p className="text-sm">{msg.content}</p>
                              <p className={`text-xs mt-1 ${
                                isOwnMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'
                              }`}>
                                {formatTime(msg.timestamp)}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="bg-muted rounded-lg px-3 py-2">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No messages yet</p>
                  </div>
                )}
              </ScrollArea>

              {/* Message Input */}
              {chatStarted && (
                <div className="border-t p-3">
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <div className="flex-1 relative">
                      <Input
                        placeholder="Type a message..."
                        value={message}
                        onChange={handleInputChange}
                        className="pr-8"
                        disabled={!socketService.isConnected()}
                      />
                      {aiSuggestions && aiSuggestions.length > 0 && !message && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 max-h-32 overflow-y-auto">
                          {aiSuggestions.slice(0, 3).map((suggestion, index) => (
                            <button
                              key={index}
                              onClick={() => setMessage(suggestion)}
                              className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm text-gray-600 border-b border-gray-100 last:border-b-0"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      )}
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
                    <p className="text-xs text-muted-foreground mt-1">
                      Connecting...
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          )}
        </Card>
      )}
    </>
  );
};

export default ChatWidget;