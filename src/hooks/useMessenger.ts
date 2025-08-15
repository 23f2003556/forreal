import { useState, useCallback, useEffect } from 'react';
import { User } from '@/components/messenger/UserList';
import { ChatInsights } from '@/components/messenger/InsightsPanel';
import { llmService } from '@/services/llmService';

export interface Message {
  id: string;
  text: string;
  senderId: string;
  recipientId: string;
  timestamp: Date;
  responseTime?: number; // Time taken to send this message after receiving previous one
}

export interface MockAIAnalysis {
  analyzeMessage: (message: string, responseTime?: number) => {
    mood: ChatInsights['mood'];
    interests: string[];
    style: ChatInsights['behavioral']['communicationStyle'];
  };
  updateEngagement: (responseTime: number, messageLength: number) => {
    level: number;
    attentiveness: number;
  };
}

// Mock AI analysis functions
const createMockAI = (): MockAIAnalysis => ({
  analyzeMessage: (message: string, responseTime = 0) => {
    const words = message.toLowerCase();
    
    // Simple sentiment analysis based on keywords
    let mood: ChatInsights['mood'] = { current: 'neutral', confidence: 70 };
    
    if (words.includes('!') || words.includes('amazing') || words.includes('awesome') || words.includes('love')) {
      mood = { current: 'excited', confidence: 85 };
    } else if (words.includes('happy') || words.includes('good') || words.includes('great') || words.includes('😊')) {
      mood = { current: 'happy', confidence: 80 };
    } else if (words.includes('sad') || words.includes('bad') || words.includes('terrible') || words.includes('😢')) {
      mood = { current: 'sad', confidence: 75 };
    } else if (words.includes('angry') || words.includes('mad') || words.includes('furious')) {
      mood = { current: 'angry', confidence: 80 };
    }
    
    // Interest detection
    const interests: string[] = [];
    if (words.includes('music') || words.includes('song') || words.includes('band')) interests.push('Music');
    if (words.includes('movie') || words.includes('film') || words.includes('cinema')) interests.push('Movies');
    if (words.includes('travel') || words.includes('trip') || words.includes('vacation')) interests.push('Travel');
    if (words.includes('sport') || words.includes('football') || words.includes('basketball')) interests.push('Sports');
    if (words.includes('food') || words.includes('cooking') || words.includes('restaurant')) interests.push('Food');
    if (words.includes('book') || words.includes('reading') || words.includes('novel')) interests.push('Books');
    if (words.includes('tech') || words.includes('computer') || words.includes('programming')) interests.push('Technology');
    
    // Communication style detection
    let style: ChatInsights['behavioral']['communicationStyle'] = 'casual';
    if (message.includes('!') && message.length > 20) style = 'enthusiastic';
    else if (message.length < 10) style = 'brief';
    else if (words.includes('please') || words.includes('thank you') || words.includes('sir') || words.includes('madam')) style = 'formal';
    
    return { mood, interests, style };
  },
  
  updateEngagement: (responseTime: number, messageLength: number) => {
    // Calculate engagement based on response time and message length
    let level = 50;
    
    // Faster responses indicate higher engagement
    if (responseTime < 5) level += 30;
    else if (responseTime < 15) level += 15;
    else if (responseTime > 60) level -= 20;
    
    // Longer messages might indicate engagement
    if (messageLength > 10) level += 15;
    else if (messageLength < 3) level -= 10;
    
    level = Math.max(0, Math.min(100, level));
    
    // Attentiveness based on response patterns
    let attentiveness = responseTime < 30 ? 80 : 60;
    attentiveness = Math.max(0, Math.min(100, attentiveness));
    
    return { level, attentiveness };
  }
});

// Add compatibility analysis function
const analyzeCompatibility = (
  message: string, 
  mood: ChatInsights['mood']['current'], 
  engagement: number,
  messageCount: number
): ChatInsights['compatibility'] => {
  const words = message.toLowerCase();
  let score = 50;
  
  // Positive indicators
  if (mood === 'excited' || mood === 'happy') score += 20;
  if (engagement > 70) score += 15;
  if (words.includes('love') || words.includes('amazing') || words.includes('awesome')) score += 15;
  if (messageCount > 5) score += 10; // More messages = more interest
  
  // Negative indicators
  if (mood === 'sad' || mood === 'angry') score -= 20;
  if (engagement < 30) score -= 15;
  if (words.includes('boring') || words.includes('whatever') || words.includes('ok')) score -= 10;
  if (message.length < 5) score -= 5; // Very short responses
  
  score = Math.max(0, Math.min(100, score));
  
  let status: ChatInsights['compatibility']['status'];
  let confidence: number;
  
  if (score >= 80) {
    status = 'crush-worthy';
    confidence = 85;
  } else if (score >= 65) {
    status = 'interested';
    confidence = 75;
  } else if (score >= 45) {
    status = 'friend-zone';
    confidence = 70;
  } else if (score >= 25) {
    status = 'ghosting-vibes';
    confidence = 65;
  } else {
    status = 'red-flag';
    confidence = 80;
  }
  
  return { status, confidence };
};

export function useMessenger() {
  // Mock users - Indian names for dating app
  const [users] = useState<User[]>([
    { id: '1', name: 'Priya Sharma', status: 'online', emoji: '😎' },
    { id: '2', name: 'Arjun Patel', status: 'away', emoji: '🔥' },
    { id: '3', name: 'Ananya Singh', status: 'online', emoji: '✨' },
    { id: '4', name: 'Vikram Reddy', status: 'offline', lastSeen: new Date(Date.now() - 3600000), emoji: '🚀' },
    { id: '5', name: 'Meera Gupta', status: 'online', emoji: '💫' },
    { id: '6', name: 'Rohit Kumar', status: 'away', emoji: '⚡' },
  ]);
  
  const [currentUser] = useState({ id: 'me', name: 'You' });
  const [selectedUserId, setSelectedUserId] = useState<string>('1');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [lastMessageTime, setLastMessageTime] = useState<Date>(new Date());
  const [insights, setInsights] = useState<ChatInsights>({
    mood: { current: 'neutral', confidence: 50 },
    engagement: { level: 50, responseTime: 0, messageLength: 0 },
    interests: [],
    behavioral: { communicationStyle: 'casual', attentiveness: 50 },
    compatibility: { status: 'friend-zone', confidence: 50 },
    lastUpdated: new Date(),
  });
  
  const mockAI = createMockAI();

  // Initialize LLM service on component mount
  useEffect(() => {
    llmService.initialize().catch(console.error);
  }, []);
  
  const sendMessage = useCallback((text: string) => {
    if (!selectedUserId) return;
    
    const now = new Date();
    const responseTime = Math.floor((now.getTime() - lastMessageTime.getTime()) / 1000);
    
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      senderId: currentUser.id,
      recipientId: selectedUserId,
      timestamp: now,
      responseTime,
    };
    
    setMessages(prev => [...prev, newMessage]);
    setLastMessageTime(now);
    
    // Simulate AI analysis
    const analysis = mockAI.analyzeMessage(text, responseTime);
    const engagement = mockAI.updateEngagement(responseTime, text.split(' ').length);
    
    // Analyze compatibility
    const compatibility = analyzeCompatibility(
      text, 
      analysis.mood.current, 
      engagement.level,
      messages.length + 1
    );
    
    setInsights(prev => ({
      mood: analysis.mood,
      engagement: {
        ...engagement,
        responseTime: responseTime,
        messageLength: text.split(' ').length,
      },
      interests: [...new Set([...prev.interests, ...analysis.interests])],
      behavioral: {
        communicationStyle: analysis.style,
        attentiveness: engagement.attentiveness,
      },
      compatibility,
      lastUpdated: now,
    }));
    
    // Simulate other user typing and responding
    setTimeout(() => {
      setIsTyping(true);
      setTimeout(async () => {
        setIsTyping(false);
        
        // Get conversation history for context
        const conversationHistory = messages
          .slice(-5) // Last 5 messages for context
          .map(msg => msg.text);
        
        // Generate intelligent response using LLM service
        const intelligentResponse = await llmService.generateResponse(text, conversationHistory);
        
        const responseMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: intelligentResponse,
          senderId: selectedUserId,
          recipientId: currentUser.id,
          timestamp: new Date(),
        };
        
        setMessages(prev => [...prev, responseMessage]);
        setLastMessageTime(new Date());
        
        // Update insights based on the response
        const responseAnalysis = mockAI.analyzeMessage(responseMessage.text);
        setInsights(prev => ({
          ...prev,
          mood: responseAnalysis.mood,
          interests: [...new Set([...prev.interests, ...responseAnalysis.interests])],
          behavioral: {
            ...prev.behavioral,
            communicationStyle: responseAnalysis.style,
          },
          lastUpdated: new Date(),
        }));
      }, 2000 + Math.random() * 3000);
    }, 1000);
  }, [selectedUserId, currentUser.id, lastMessageTime, mockAI, messages.length]);
  
  const selectUser = useCallback((userId: string) => {
    setSelectedUserId(userId);
    setMessages([]); // Clear messages when switching users
    setInsights({
      mood: { current: 'neutral', confidence: 50 },
      engagement: { level: 50, responseTime: 0, messageLength: 0 },
      interests: [],
      behavioral: { communicationStyle: 'casual', attentiveness: 50 },
      compatibility: { status: 'friend-zone', confidence: 50 },
      lastUpdated: new Date(),
    });
  }, []);
  
  const selectedUser = users.find(u => u.id === selectedUserId);
  
  return {
    users,
    currentUser,
    selectedUser,
    selectedUserId,
    messages,
    insights,
    isTyping,
    sendMessage,
    selectUser,
  };
}
