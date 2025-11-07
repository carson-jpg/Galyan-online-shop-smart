import { useState } from 'react';
import { Card } from '@/components/ui/card';
import ChatList from '@/components/ChatList';
import ChatWindow from '@/components/ChatWindow';
import { useAuth } from '@/hooks/useAuth';

const Chat = () => {
  const { user } = useAuth();
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Messages</h1>
        <p className="text-muted-foreground mt-2">
          Chat with sellers about their products
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
        {/* Chat List */}
        <div className="lg:col-span-1">
          <ChatList
            onChatSelect={setSelectedChatId}
            selectedChatId={selectedChatId || undefined}
          />
        </div>

        {/* Chat Window */}
        <div className="lg:col-span-2">
          {selectedChatId ? (
            <ChatWindow
              chatId={selectedChatId}
              onClose={() => setSelectedChatId(null)}
            />
          ) : (
            <Card className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
                <p className="text-muted-foreground">
                  Choose a chat from the list to start messaging
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