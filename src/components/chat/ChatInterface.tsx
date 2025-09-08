import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Send, MessageCircle, UserX, Sparkles, SkipForward, Users } from "lucide-react";
import { useChat } from "@/hooks/useChat";
import { useAuth } from "@/hooks/useAuth";
import { usePresence } from "@/hooks/usePresence";
import { ChatInsights } from "./ChatInsights";
export function ChatInterface() {
  const {
    user
  } = useAuth();
  const {
    currentChatSession,
    messages,
    loading,
    startNewChat,
    sendMessage,
    endChat,
    skipToNextUser,
    autoConnectToChat
  } = useChat();
  const {
    getOnlineUsers
  } = usePresence(); // Initialize presence tracking
  const [messageInput, setMessageInput] = useState("");
  const [onlineUserCount, setOnlineUserCount] = useState(0);

  // Update online user count periodically
  useEffect(() => {
    const updateOnlineCount = async () => {
      const onlineUsers = await getOnlineUsers();
      setOnlineUserCount(onlineUsers.length);
    };

    // Initial load
    updateOnlineCount();

    // Update every 30 seconds
    const interval = setInterval(updateOnlineCount, 30000);
    return () => clearInterval(interval);
  }, [getOnlineUsers]);

  // Trigger auto-connect when new users come online
  useEffect(() => {
    if (onlineUserCount > 0 && !currentChatSession && !loading) {
      // Small delay to avoid too frequent connection attempts
      const connectTimer = setTimeout(() => {
        autoConnectToChat();
      }, 1000);

      return () => clearTimeout(connectTimer);
    }
  }, [onlineUserCount, currentChatSession, loading, autoConnectToChat]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim()) return;
    await sendMessage(messageInput);
    setMessageInput("");
  };
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  if (!currentChatSession) {
    return <div className="h-full flex items-center justify-center p-8">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <MessageCircle className="h-12 w-12 text-primary animate-pulse" />
            </div>
            <CardTitle className="text-xl">
              {loading ? "Connecting you with someone..." : "Looking for someone to chat with..."}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <Badge variant="secondary" className="mb-4 bg-green-500/10 text-green-600 border-green-500/20">
                <Users className="h-4 w-4 mr-2" />
                {onlineUserCount} {onlineUserCount === 1 ? 'user' : 'users'} online
              </Badge>
              <p className="text-muted-foreground">
                {loading 
                  ? "We're finding someone perfect for you to chat with!"
                  : onlineUserCount === 0 
                    ? "Waiting for someone to come online..."
                    : "The system automatically connects you with random users when they're available."
                }
              </p>
              {loading && (
                <div className="mt-4 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
            {onlineUserCount === 0 && (
              <p className="text-xs text-muted-foreground">
                More users will appear soon! The system connects you automatically.
              </p>
            )}
          </CardContent>
        </Card>
      </div>;
  }
  return <div className="h-full flex">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="p-4 border-b border-border bg-chat-panel">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center text-white font-semibold">
                {currentChatSession.other_user_profile?.display_name?.[0] || '?'}
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
                  {currentChatSession.other_user_profile?.display_name || 'Anonymous'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  @{currentChatSession.other_user_profile?.username || 'unknown'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="bg-insight-primary/20 text-insight-primary">
                <Sparkles className="h-3 w-3 mr-1" />
                AI Insights
              </Badge>
              <Button variant="outline" size="sm" onClick={skipToNextUser} disabled={loading} className="hover:bg-accent">
                <SkipForward className="h-4 w-4 mr-1" />
                Skip
              </Button>
              <Button variant="destructive" size="sm" onClick={endChat} className="bg-destructive hover:bg-destructive/90">
                <UserX className="h-4 w-4 mr-1" />
                End Chat
              </Button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4 bg-chat-background">
          <div className="space-y-4">
            {messages.map(message => {
            const isOwnMessage = message.sender_id === user?.id;
            return <div key={message.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} animate-message-slide-in`}>
                  <div className={`max-w-[70%] rounded-lg p-3 ${isOwnMessage ? 'bg-message-sent text-message-text ml-4' : 'bg-message-received text-message-text mr-4'}`} style={{
                boxShadow: 'var(--shadow-message)'
              }}>
                    <p className="text-sm">{message.content}</p>
                    <p className={`text-xs mt-1 ${isOwnMessage ? 'text-message-text/70' : 'text-message-text/70'}`}>
                      {formatTime(message.created_at)}
                    </p>
                  </div>
                </div>;
          })}
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="p-4 border-t border-border bg-chat-panel">
          <form onSubmit={handleSendMessage} className="flex space-x-2">
            <Input value={messageInput} onChange={e => setMessageInput(e.target.value)} placeholder="Type your message..." className="flex-1 bg-input border-border focus:ring-primary" />
            <Button type="submit" disabled={!messageInput.trim()} className="bg-primary hover:bg-primary/90">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>

      {/* AI Insights Panel */}
      <ChatInsights chatSessionId={currentChatSession.id} />
    </div>;
}