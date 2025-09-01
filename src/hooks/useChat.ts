import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface Message {
  id: string;
  chat_session_id: string;
  sender_id: string;
  content: string;
  message_type: string;
  created_at: string;
  is_read: boolean;
  sender_profile?: {
    username: string;
    display_name: string;
    avatar_url: string;
  };
}

interface ChatSession {
  id: string;
  user1_id: string;
  user2_id: string;
  status: string;
  created_at: string;
  other_user_profile?: {
    username: string;
    display_name: string;
    avatar_url: string;
  };
}

export function useChat() {
  const { user } = useAuth();
  const [currentChatSession, setCurrentChatSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  // Find or create a chat session with a random user
  const startNewChat = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // First, try to find an available user to chat with
      const { data: availableUsers, error: usersError } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, avatar_url')
        .neq('user_id', user.id)
        .limit(10);

      if (usersError) throw usersError;

      if (!availableUsers || availableUsers.length === 0) {
        throw new Error('No available users to chat with');
      }

      // Pick a random user
      const randomUser = availableUsers[Math.floor(Math.random() * availableUsers.length)];

      // Check if a chat session already exists with this user
      const { data: existingSession, error: sessionError } = await supabase
        .from('chat_sessions')
        .select(`
          *,
          profiles!chat_sessions_user1_id_fkey(username, display_name, avatar_url),
          profiles!chat_sessions_user2_id_fkey(username, display_name, avatar_url)
        `)
        .or(`and(user1_id.eq.${user.id},user2_id.eq.${randomUser.user_id}),and(user1_id.eq.${randomUser.user_id},user2_id.eq.${user.id})`)
        .eq('status', 'active')
        .single();

      let chatSession;

      if (existingSession && !sessionError) {
        chatSession = existingSession;
      } else {
        // Create new chat session
        const { data: newSession, error: createError } = await supabase
          .from('chat_sessions')
          .insert({
            user1_id: user.id,
            user2_id: randomUser.user_id,
            status: 'active'
          })
          .select(`
            *,
            profiles!chat_sessions_user2_id_fkey(username, display_name, avatar_url)
          `)
          .single();

        if (createError) throw createError;
        chatSession = newSession;
      }

      // Set the other user's profile data
      const otherUserId = chatSession.user1_id === user.id ? chatSession.user2_id : chatSession.user1_id;
      const otherUserProfile = chatSession.user1_id === user.id 
        ? chatSession.profiles 
        : availableUsers.find(u => u.user_id === otherUserId);

      setCurrentChatSession({
        ...chatSession,
        other_user_profile: otherUserProfile
      });

      // Load messages for this chat
      await loadMessages(chatSession.id);

    } catch (error) {
      console.error('Error starting new chat:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (chatSessionId: string) => {
    try {
      const { data: messagesData, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_session_id', chatSessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (messagesData) {
        // Fetch profile data for each message
        const messagesWithProfiles = await Promise.all(
          messagesData.map(async (message) => {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('username, display_name, avatar_url')
              .eq('user_id', message.sender_id)
              .single();

            return {
              ...message,
              sender_profile: profileData || { username: 'Unknown', display_name: 'Unknown', avatar_url: null }
            };
          })
        );

        setMessages(messagesWithProfiles);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async (content: string) => {
    if (!user || !currentChatSession) return;

    try {
      const { data: messageData, error } = await supabase
        .from('messages')
        .insert({
          chat_session_id: currentChatSession.id,
          sender_id: user.id,
          content: content.trim(),
          message_type: 'text'
        })
        .select('*')
        .single();

      if (error) throw error;

      // Fetch sender profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('username, display_name, avatar_url')
        .eq('user_id', messageData.sender_id)
        .single();

      const newMessage = {
        ...messageData,
        sender_profile: profileData || { username: 'Unknown', display_name: 'Unknown', avatar_url: null }
      };

      setMessages(prev => [...prev, newMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const endChat = async () => {
    if (!currentChatSession) return;

    try {
      const { error } = await supabase
        .from('chat_sessions')
        .update({ status: 'ended', ended_at: new Date().toISOString() })
        .eq('id', currentChatSession.id);

      if (error) throw error;

      setCurrentChatSession(null);
      setMessages([]);
    } catch (error) {
      console.error('Error ending chat:', error);
    }
  };

  // Set up real-time listeners
  useEffect(() => {
    if (!currentChatSession) return;

    const messagesChannel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_session_id=eq.${currentChatSession.id}`
        },
        async (payload) => {
          // Fetch the complete message with profile data
          const { data: messageData } = await supabase
            .from('messages')
            .select('*')
            .eq('id', payload.new.id)
            .single();

          if (messageData) {
            // Fetch sender profile
            const { data: profileData } = await supabase
              .from('profiles')
              .select('username, display_name, avatar_url')
              .eq('user_id', messageData.sender_id)
              .single();

            const newMessage = {
              ...messageData,
              sender_profile: profileData || { username: 'Unknown', display_name: 'Unknown', avatar_url: null }
            };

            setMessages(prev => [...prev, newMessage]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
    };
  }, [currentChatSession]);

  return {
    currentChatSession,
    messages,
    loading,
    isTyping,
    startNewChat,
    sendMessage,
    endChat,
    setIsTyping,
  };
}