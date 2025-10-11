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
    isBotChat,
    joinQueue,
    leaveQueue,
    sendMessage: sendChatMessage,
    endChat,
  } = useChat();

  return (
    <div className="min-h-screen" style={{ background: 'var(--gradient-background)' }}>
      {/* Header */}
      <header className="glass-strong border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <span className="text-4xl animate-fade-in">🤫</span>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-fade-in hover-scale cursor-default">
                  forreal
                </h1>
                <p className="text-xs text-muted-foreground">Discover what's in their mind</p>
              </div>
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
          <div className="mt-4 p-4 glass rounded-2xl border border-border">
            <div className="flex items-center space-x-2">
              <Switch
                id="analytics"
                checked={analyticsEnabled}
                onCheckedChange={setAnalyticsEnabled}
              />
              <Label htmlFor="analytics" className="flex items-center gap-2 text-foreground">
                <Brain className="h-4 w-4 text-primary" />
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
              <div className="glass-strong border-b border-border px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center text-xl">
                      {isBotChat ? '🤖' : '🤫'}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {currentChatSession.other_user_profile?.display_name || 'Anonymous User'}
                        {isBotChat && (
                          <span className="ml-2 text-xs px-2 py-1 rounded-full bg-accent/20 text-accent-foreground font-normal">
                            AI
                          </span>
                        )}
                      </h3>
                      <p className="text-sm font-medium text-primary">● Online</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={endChat}
                    className="text-destructive hover:bg-destructive/10 border-destructive/30"
                  >
                    End Chat
                  </Button>
                </div>
              </div>
              
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50 text-foreground" />
                      <p className="text-foreground font-medium">Say hi to start the conversation!</p>
                      <p className="text-sm mt-2 text-muted-foreground">
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
              <div className="text-center glass p-10 rounded-3xl max-w-md mx-4">
                <div className="text-6xl mb-4 animate-bounce">🤫</div>
                <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-primary" />
                <h3 className="text-xl font-bold mb-2 text-foreground">Finding someone for you...</h3>
                <p className="text-muted-foreground mb-6">
                  {queuePosition > 0 ? `Position in queue: ${queuePosition}` : 'Searching for a match...'}
                </p>
                <Button
                  variant="outline"
                  onClick={leaveQueue}
                  disabled={loading}
                  className="border-2"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center glass-strong p-12 rounded-3xl max-w-lg mx-4 border-2 border-border">
                <div className="text-7xl mb-6 animate-pulse">🤫</div>
                <h3 className="text-3xl font-black mb-3 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                  Welcome to forreal
                </h3>
                <p className="text-foreground/70 mb-8 text-lg font-medium">
                  Connect with someone new and discover what's really on their mind through AI-powered insights 🚀
                </p>
                <Button
                  onClick={() => joinQueue()}
                  disabled={loading}
                  size="lg"
                  className="gradient-bg hover:opacity-90 text-white font-bold text-lg px-8 py-6 rounded-2xl"
                >
                  {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : "Start a New Chat ✨"}
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