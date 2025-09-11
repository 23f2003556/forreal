import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Send, MessageCircle, UserX, SkipForward, Users, X } from "lucide-react";
import { useChat } from "@/hooks/useChat";
import { useAuth } from "@/hooks/useAuth";
import { usePresence } from "@/hooks/usePresence";
import { ChatInsights } from "./ChatInsights";
export function ChatInterface() {
  const { user } = useAuth();
  const {
    currentChatSession,
    messages,
    loading,
    isTyping,
    isInQueue,
    queuePosition,
    sendMessage,
    endChat,
    skipToNextUser,
    setIsTyping,
    joinQueue,
    leaveQueue,
  } = useChat();
  const { getOnlineUsers } = usePresence();
  const [messageInput, setMessageInput] = useState("");
  const [onlineUserCount, setOnlineUserCount] = useState(0);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedGender, setSelectedGender] = useState<string>("Both");

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

  const handleStartChat = () => {
    joinQueue(selectedInterests, selectedGender);
  };

  const handleCancelQueue = () => {
    leaveQueue();
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim()) return;
    await sendMessage(messageInput);
    setMessageInput("");
  };
  const interests = ["Gaming", "Anime", "Politics", "Music", "Movies", "Sports", "Technology", "Art"];
  const genderOptions = ["Male", "Both", "Female"];

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleInterestToggle = (interest: string) => {
    setSelectedInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && currentChatSession) {
      endChat();
    }
  };
  if (!currentChatSession) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 bg-background" onKeyDown={handleKeyPress}>
        <div className="w-full max-w-2xl">
          {/* Logo Section */}
          <div className="text-center mb-8 animate-fade-in-up">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center glass neon-glow animate-float">
              <MessageCircle className="h-10 w-10 text-white drop-shadow-lg" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              forreal
            </h1>
          </div>

          {/* Interests Section */}
          <Card className="mb-6 glass animate-fade-in-up">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-white flex items-center">
                  Your Interests 
                  <Badge variant="secondary" className="ml-2 bg-emotion-happy/20 text-emotion-happy border-emotion-happy/30 neon-glow-accent">
                    ON
                  </Badge>
                </h3>
                <Button variant="ghost" size="sm" className="text-white/70 hover:text-white">
                  Manage
                </Button>
              </div>
              
              <div className="border-2 border-dashed border-white/20 rounded-lg p-4 mb-4 glass">
                <div className="flex flex-wrap gap-2 mb-3">
                  {interests.map((interest) => (
                    <Badge
                      key={interest}
                      variant={selectedInterests.includes(interest) ? "default" : "outline"}
                      className={`cursor-pointer transition-all ${
                        selectedInterests.includes(interest)
                          ? "bg-primary text-white neon-glow"
                          : "hover:bg-white/10 border-white/30 text-white"
                      }`}
                      onClick={() => handleInterestToggle(interest)}
                    >
                      {interest}
                    </Badge>
                  ))}
                </div>
                <p className="text-sm text-white/70">
                  You have {selectedInterests.length} interests. Click to add some.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Gender Filter */}
          <Card className="mb-8 glass animate-fade-in-up">
            <CardContent className="p-6">
              <h3 className="text-lg font-medium text-white mb-4">Gender Filter:</h3>
              <div className="flex gap-4">
                {genderOptions.map((gender) => (
                  <Button
                    key={gender}
                    variant={selectedGender === gender ? "default" : "outline"}
                    size="lg"
                    className={`flex-1 ${
                      selectedGender === gender
                        ? "bg-primary text-white neon-glow"
                        : "hover:bg-white/10 border-white/30 text-white"
                    }`}
                    onClick={() => setSelectedGender(gender)}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    {gender}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Status and Start Button */}
          <div className="text-center">
            <Badge variant="secondary" className="mb-4 bg-emotion-happy/20 text-emotion-happy border-emotion-happy/30 neon-glow-accent">
              <Users className="h-4 w-4 mr-2" />
              {onlineUserCount} {onlineUserCount === 1 ? 'user' : 'users'} online
            </Badge>
            
            {loading || isInQueue ? (
              <div className="mb-4">
                <div className="w-8 h-8 mx-auto mb-2 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                {isInQueue ? (
                  <div>
                    <p className="text-muted-foreground mb-2">
                      Waiting for someone to join... {queuePosition > 0 && `(Position: ${queuePosition})`}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancelQueue}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Connecting you with someone...</p>
                )}
              </div>
            ) : (
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-white px-8 py-6 text-lg font-medium neon-glow brutal-shadow animate-neon-pulse"
                onClick={handleStartChat}
                disabled={onlineUserCount === 0}
              >
                <MessageCircle className="h-5 w-5 mr-2" />
                Start Real Chat
              </Button>
            )}
            
            <p className="text-xs text-muted-foreground mt-4">
              Be respectful and follow our chat rules
            </p>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="h-full flex" onKeyDown={handleKeyPress}>
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
                  @{currentChatSession.other_user_profile?.display_name || currentChatSession.other_user_profile?.username || 'Anonymous'}
                </h3>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={endChat} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4 bg-chat-background">
          <div className="space-y-4">
            {/* Welcome Message */}
            {messages.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground text-lg">
                  You are now chatting with{' '}
                  <span className="text-primary font-medium">
                    {currentChatSession.other_user_profile?.display_name || currentChatSession.other_user_profile?.username || 'Anonymous'}
                  </span>
                  . Say hi!
                </p>
              </div>
            )}
            
            {messages.map(message => {
              const isOwnMessage = message.sender_id === user?.id;
              return (
                <div key={message.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} animate-message-slide-in`}>
                  <div 
                    className={`max-w-[70%] rounded-lg p-3 ${
                      isOwnMessage 
                        ? 'bg-message-sent text-message-text ml-4' 
                        : 'bg-message-received text-message-text mr-4'
                    }`}
                    style={{ boxShadow: 'var(--shadow-message)' }}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className={`text-xs mt-1 ${isOwnMessage ? 'text-message-text/70' : 'text-message-text/70'}`}>
                      {formatTime(message.created_at)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="p-4 border-t border-border bg-chat-panel">
          <div className="flex items-center space-x-2 mb-2">
            <Button
              variant="secondary"
              size="sm"
              className="bg-orange-500 hover:bg-orange-600 text-white border-0"
            >
              ESC
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={skipToNextUser}
              disabled={loading}
              className="bg-orange-500 hover:bg-orange-600 text-white border-0"
            >
              SKIP
            </Button>
          </div>
          <form onSubmit={handleSendMessage} className="flex space-x-2">
            <Input 
              value={messageInput} 
              onChange={e => setMessageInput(e.target.value)} 
              placeholder="Send a message"
              className="flex-1 bg-input border-border focus:ring-primary text-foreground"
            />
            <Button 
              type="submit" 
              disabled={!messageInput.trim()} 
              className="bg-primary hover:bg-primary/90"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>

      {/* AI Insights Panel */}
      <ChatInsights chatSessionId={currentChatSession.id} />
    </div>
  );
}