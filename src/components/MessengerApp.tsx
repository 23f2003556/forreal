import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { MessageBubble } from "./messenger/MessageBubble";
import { ChatInput } from "./messenger/ChatInput";
import { InsightsPanel } from "./messenger/InsightsPanel";
import { TypingIndicator } from "./messenger/TypingIndicator";
import { useChat } from "@/hooks/useChat";
import { useAuth } from "@/hooks/useAuth";
import { Settings, Eye, EyeOff, Brain, MessageCircle, Users, Loader2 } from "lucide-react";

export function MessengerApp() {
  const [showInsights, setShowInsights] = useState(true);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  
  const { user } = useAuth();
  const {
    currentChatSession,
    messages,
    isTyping,
    isInQueue,
    loading,
    queuePosition,
    joinQueue,
    leaveQueue,
    sendMessage: sendChatMessage,
    endChat,
  } = useChat();

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
        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-chat-background">
          {currentChatSession ? (
            <>
              {/* Chat Header */}
              <div className="bg-chat-panel border-b border-border px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-lg">
                      👤
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">
                        {currentChatSession.other_user_profile?.display_name || 'Anonymous User'}
                      </h3>
                      <p className="text-sm text-muted-foreground">Online</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={endChat}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    End Chat
                  </Button>
                </div>
              </div>
              
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Say hi to start the conversation!</p>
                      <p className="text-sm mt-2">
                        {analyticsEnabled && "AI will analyze your chat in real-time"}
                      </p>
                    </div>
                  </div>
                ) : (
                  messages.map((message) => (
                    <MessageBubble
                      key={message.id}
                      message={message.content}
                      isOwn={message.sender_id === user?.id}
                      timestamp={new Date(message.created_at)}
                      senderName={message.sender_id === user?.id ? undefined : message.sender_profile?.display_name}
                    />
                  ))
                )}
                
                {isTyping && (
                  <TypingIndicator userName={currentChatSession.other_user_profile?.display_name || 'User'} />
                )}
              </div>
              
              {/* Chat Input */}
              <ChatInput
                onSendMessage={(msg) => sendChatMessage(msg)}
                disabled={!analyticsEnabled}
              />
            </>
          ) : isInQueue ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="h-16 w-16 mx-auto mb-4 animate-spin text-primary" />
                <h3 className="text-lg font-medium mb-2 text-foreground">Finding someone for you...</h3>
                <p className="text-muted-foreground mb-4">
                  {queuePosition > 0 ? `Position in queue: ${queuePosition}` : 'Searching for a match...'}
                </p>
                <Button
                  variant="outline"
                  onClick={leaveQueue}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center glass p-8 rounded-2xl max-w-md mx-4">
                <Users className="h-16 w-16 mx-auto mb-4 text-primary" />
                <h3 className="text-2xl font-bold mb-2 text-foreground">Welcome to forreal</h3>
                <p className="text-muted-foreground mb-6">
                  Connect with someone new and discover what's really on their mind through AI-powered insights
                </p>
                <Button
                  onClick={() => joinQueue()}
                  disabled={loading}
                  size="lg"
                  className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-semibold"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Start a New Chat"}
                </Button>
              </div>
            </div>
          )}
        </div>
        
        {/* Insights Panel */}
        {analyticsEnabled && currentChatSession && (
          <InsightsPanel
            insights={{
              mood: { current: 'neutral', confidence: 50 },
              engagement: { level: 50, responseTime: 0, messageLength: 0 },
              interests: [],
              behavioral: { communicationStyle: 'casual', attentiveness: 50 },
              compatibility: { status: 'friend-zone', confidence: 50 },
              lastUpdated: new Date(),
            }}
            isVisible={showInsights}
            userName={currentChatSession.other_user_profile?.display_name || 'User'}
          />
        )}
      </div>
    </div>
  );
}