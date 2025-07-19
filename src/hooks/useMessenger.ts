import { useState, useCallback } from 'react';
import { User } from '@/components/messenger/UserList';
import { ChatInsights } from '@/components/messenger/InsightsPanel';

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

export function useMessenger() {
  // Mock users - Indian names for dating app
  const [users] = useState<User[]>([
    { id: '1', name: 'Priya Sharma', status: 'online' },
    { id: '2', name: 'Arjun Patel', status: 'away' },
    { id: '3', name: 'Ananya Singh', status: 'online' },
    { id: '4', name: 'Vikram Reddy', status: 'offline', lastSeen: new Date(Date.now() - 3600000) },
    { id: '5', name: 'Meera Gupta', status: 'online' },
    { id: '6', name: 'Rohit Kumar', status: 'away' },
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
    lastUpdated: new Date(),
  });
  
  const mockAI = createMockAI();
  
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
      lastUpdated: now,
    }));
    
    // Simulate other user typing and responding
    setTimeout(() => {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        // Generate contextual response based on user's message
        const generateContextualResponse = (userMessage: string) => {
          const words = userMessage.toLowerCase();
          
          // Greeting responses
          if (words.includes('hi') || words.includes('hello') || words.includes('hey')) {
            return ["heyy bestie! 💕 what's good?", "hiiii! you're cute fr 🥺", "hey there! loving the energy already ✨"][Math.floor(Math.random() * 3)];
          }
          
          // Music related
          if (words.includes('music') || words.includes('song') || words.includes('band')) {
            return ["yooo music taste reveal pls?? 🎵", "no cap music is my love language bestie", "omg we need to share playlists asap! what genre you into?"][Math.floor(Math.random() * 3)];
          }
          
          // Food related
          if (words.includes('food') || words.includes('eat') || words.includes('restaurant')) {
            return ["bestie same! food dates hit different though 🍕", "not you making me hungry rn 😭 what's your comfort food?", "food pics or it didn't happen fr fr 📸"][Math.floor(Math.random() * 3)];
          }
          
          // Travel related
          if (words.includes('travel') || words.includes('trip') || words.includes('vacation')) {
            return ["travel bestie! where's your dream destination? ✈️", "periodt travel stories are the best! spill the tea", "wanderlust is real bestie, let's plan something together 🗺️"][Math.floor(Math.random() * 3)];
          }
          
          // Movie/TV related
          if (words.includes('movie') || words.includes('show') || words.includes('netflix')) {
            return ["netflix and chill vibes? what we watching bestie 🍿", "movie nights are elite! what's your comfort watch?", "not me judging your taste rn... jk spill the recs 📺"][Math.floor(Math.random() * 3)];
          }
          
          // Work/career related
          if (words.includes('work') || words.includes('job') || words.includes('career')) {
            return ["work bestie understands the grind 💪", "career goals though! tell me more about what you do", "work-life balance is everything bestie, how you managing?"][Math.floor(Math.random() * 3)];
          }
          
          // Positive sentiment responses
          if (words.includes('amazing') || words.includes('awesome') || words.includes('great') || words.includes('!')) {
            return ["your energy is immaculate bestie! 🌟", "periodt! this is why I fw you fr", "bestie you're literally glowing through the screen ✨"][Math.floor(Math.random() * 3)];
          }
          
          // Questions
          if (userMessage.includes('?')) {
            return ["ooh good question bestie! lemme think... 🤔", "you really got me thinking rn fr", "bestie you're asking the real questions! love that for us 💭"][Math.floor(Math.random() * 3)];
          }
          
          // Compliments
          if (words.includes('cute') || words.includes('beautiful') || words.includes('handsome')) {
            return ["stoppp you're making me blush 🥺💕", "bestie you're too sweet fr fr", "not you being perfect and humble too 😭✨"][Math.floor(Math.random() * 3)];
          }
          
          // Default contextual responses
          const contextualDefaults = [
            "bestie you're such a vibe honestly 💫",
            "fr though this conversation is everything",
            "you really understand the assignment bestie ✨",
            "periodt! we're really clicking rn 🫶",
            "bestie you're giving main character energy",
            "not me getting butterflies from this convo 🦋"
          ];
          
          return contextualDefaults[Math.floor(Math.random() * contextualDefaults.length)];
        };
        
        const responseText = generateContextualResponse(text);
        
        const responseMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: responseText,
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
  }, [selectedUserId, currentUser.id, lastMessageTime, mockAI]);
  
  const selectUser = useCallback((userId: string) => {
    setSelectedUserId(userId);
    setMessages([]); // Clear messages when switching users
    setInsights({
      mood: { current: 'neutral', confidence: 50 },
      engagement: { level: 50, responseTime: 0, messageLength: 0 },
      interests: [],
      behavioral: { communicationStyle: 'casual', attentiveness: 50 },
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