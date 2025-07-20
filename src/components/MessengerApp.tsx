import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { MessageBubble } from "./messenger/MessageBubble";
import { ChatInput } from "./messenger/ChatInput";
import { UserList } from "./messenger/UserList";
import { InsightsPanel } from "./messenger/InsightsPanel";
import { TypingIndicator } from "./messenger/TypingIndicator";
import { useMessenger } from "@/hooks/useMessenger";
import { Settings, Eye, EyeOff, Brain, MessageCircle } from "lucide-react";

export function MessengerApp() {
  const [showInsights, setShowInsights] = useState(true);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  
  const {
    users,
    currentUser,
    selectedUser,
    messages,
    insights,
    isTyping,
    sendMessage,
    selectUser,
  } = useMessenger();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-background border-b border-border px-6 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-medium text-foreground">Messages</h1>
          
          {selectedUser && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowInsights(!showInsights)}
              className="text-muted-foreground hover:text-foreground"
            >
              {showInsights ? "Hide" : "Show"} Insights
            </Button>
          )}
        </div>
      </header>

      <div className="flex h-[calc(100vh-65px)]">
        {/* User List */}
        <UserList
          users={users}
          selectedUserId={selectedUser?.id}
          onSelectUser={selectUser}
        />
        
        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-background">
          {selectedUser ? (
            <>
              {/* Chat Header */}
              <div className="bg-background border-b border-border px-6 py-3">
                <h3 className="font-medium text-foreground">{selectedUser.name}</h3>
              </div>
              
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-3">
                {messages.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center">
                    <p className="text-muted-foreground">No messages yet</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <MessageBubble
                      key={message.id}
                      message={message.text}
                      isOwn={message.senderId === currentUser.id}
                      timestamp={message.timestamp}
                      senderName={message.senderId === currentUser.id ? undefined : selectedUser.name}
                    />
                  ))
                )}
                
                {isTyping && (
                  <TypingIndicator userName={selectedUser.name} />
                )}
              </div>
              
              {/* Chat Input */}
              <ChatInput
                onSendMessage={sendMessage}
                disabled={!analyticsEnabled}
              />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-muted-foreground">Select a conversation</p>
            </div>
          )}
        </div>
        
        {/* Insights Panel */}
        {analyticsEnabled && selectedUser && (
          <InsightsPanel
            insights={insights}
            isVisible={showInsights}
            userName={selectedUser.name}
          />
        )}
      </div>
    </div>
  );
}