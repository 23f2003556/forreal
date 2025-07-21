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
    <div className="min-h-screen bg-gradient-to-br from-background to-chat-background">
      {/* Header */}
      <header className="bg-chat-panel border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🤫</span>
              <h1 className="text-xl font-bold text-foreground animate-fade-in hover-scale cursor-default">For Real</h1>
            </div>
            <div className="text-sm text-muted-foreground">
              Discover what's in their mind
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowInsights(!showInsights)}
              className="flex items-center gap-2"
            >
              {showInsights ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showInsights ? "Hide" : "Show"} Insights
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Settings Panel */}
        {showSettings && (
          <div className="mt-4 p-4 bg-card rounded-lg border border-border">
            <div className="flex items-center space-x-2">
              <Switch
                id="analytics"
                checked={analyticsEnabled}
                onCheckedChange={setAnalyticsEnabled}
              />
              <Label htmlFor="analytics" className="flex items-center gap-2">
                <Brain className="h-4 w-4" />
                Enable AI Analysis
              </Label>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              When enabled, AI analyzes conversation patterns, emotions, and interests in real-time.
            </p>
          </div>
        )}
      </header>

      <div className="flex h-[calc(100vh-80px)]">
        {/* User List */}
        <UserList
          users={users}
          selectedUserId={selectedUser?.id}
          onSelectUser={selectUser}
        />
        
        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-chat-background">
          {selectedUser ? (
            <>
              {/* Chat Header */}
              <div className="bg-chat-panel border-b border-border px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-lg">
                    {selectedUser.emoji}
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">{selectedUser.name}</h3>
                    <p className="text-sm text-muted-foreground capitalize">{selectedUser.status}</p>
                  </div>
                </div>
              </div>
              
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Start a conversation with {selectedUser.name}</p>
                      <p className="text-sm mt-2">
                        {analyticsEnabled && "Discover your connection through AI insights"}
                      </p>
                    </div>
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
              <div className="text-center text-muted-foreground">
                <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Welcome to For Real</h3>
                <p>Select someone to start chatting and discover your connection</p>
              </div>
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