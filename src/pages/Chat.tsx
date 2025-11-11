import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Users, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import ChatList from '@/components/ChatList';
import ChatWindow from '@/components/ChatWindow';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

const Chat = () => {
  const { user } = useAuth();
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch all available sellers for direct chat
  const { data: sellers, isLoading: sellersLoading } = useQuery({
    queryKey: ['sellers'],
    queryFn: async () => {
      const response = await api.get('/admin/sellers');
      const sellersData = response.data?.sellers;
      return sellersData ? sellersData.filter((seller: any) => seller && seller.isActive && seller.user) : [];
    },
    enabled: !!user,
  });

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground">Please login to access your messages.</p>
        </div>
      </div>
    );
  }

  // Filter sellers based on search
  const filteredSellers = sellers?.filter((seller: any) =>
    seller.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    seller.user?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleStartChatWithSeller = async (sellerId: string) => {
    try {
      const response = await api.post(`/chat/direct/${sellerId}`);
      const chat = response.data;
      setSelectedChatId(chat._id);
    } catch (error: any) {
      console.error('Error creating direct chat:', error);
      alert('Failed to start chat with seller. Please try again.');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Messages</h1>
        <p className="text-muted-foreground mt-2">
          Chat with sellers directly or about specific products
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[600px]">
        {/* Conversations & Sellers */}
        <div className="lg:col-span-1 space-y-6">
          {/* Existing Conversations */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Conversations
            </h3>
            <ChatList
              onChatSelect={setSelectedChatId}
              selectedChatId={selectedChatId || undefined}
            />
          </div>

          {/* Direct Chat with Sellers */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Start New Chat
            </h3>
            <Card className="p-4">
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search sellers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <ScrollArea className="h-64">
                  {sellersLoading ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                      <p className="text-sm text-muted-foreground mt-2">Loading sellers...</p>
                    </div>
                  ) : filteredSellers.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground">No sellers found</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredSellers.map((seller: any) => (
                        <Button
                          key={seller._id}
                          variant="ghost"
                          className="w-full justify-start h-auto p-3"
                          onClick={() => handleStartChatWithSeller(seller._id)}
                        >
                          <div className="flex items-center gap-3 w-full">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={seller.storeLogo} alt={seller.businessName} />
                              <AvatarFallback>
                                {seller.businessName.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 text-left">
                              <p className="font-medium text-sm">{seller.businessName}</p>
                              <p className="text-xs text-muted-foreground">
                                {seller.user?.name || 'Seller'}
                              </p>
                            </div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </Card>
          </div>
        </div>

        {/* Chat Window */}
        <div className="lg:col-span-3">
          {selectedChatId ? (
            <ChatWindow
              chatId={selectedChatId}
              onClose={() => setSelectedChatId(null)}
            />
          ) : (
            <Card className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">Select a conversation or start a new chat</h3>
                <p className="text-muted-foreground">
                  Choose from existing conversations or search for sellers to start chatting directly
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;