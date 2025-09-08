import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useConversationAnalysis } from './useConversationAnalysis';

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
  const { analyzeConversation } = useConversationAnalysis();
  const [currentChatSession, setCurrentChatSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  // Find or create a chat session with an online user
  const startNewChat = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // First, try to find online users to chat with
      const { data: onlineUsers, error: usersError } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, avatar_url')
        .eq('is_online', true)
        .neq('user_id', user.id)
        .limit(20);

      if (usersError) throw usersError;

      if (!onlineUsers || onlineUsers.length === 0) {
        throw new Error('No online users available to chat with. Try again later!');
      }

      // Pick a random online user
      const randomUser = onlineUsers[Math.floor(Math.random() * onlineUsers.length)];

      console.log('Attempting to start chat with user:', randomUser);

      // Check if a chat session already exists with this user (handle both directions)
      const { data: existingSessions, error: sessionError } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('status', 'active')
        .or(`and(user1_id.eq.${user.id},user2_id.eq.${randomUser.user_id}),and(user1_id.eq.${randomUser.user_id},user2_id.eq.${user.id})`);

      let chatSession;

      if (sessionError) {
        console.error('Error checking existing sessions:', sessionError);
        throw sessionError;
      }

      if (existingSessions && existingSessions.length > 0) {
        console.log('Found existing chat session:', existingSessions[0].id);
        chatSession = existingSessions[0];
      } else {
        console.log('Creating new chat session...');
        
        // Ensure consistent ordering to prevent duplicate key violations
        const userId1 = user.id < randomUser.user_id ? user.id : randomUser.user_id;
        const userId2 = user.id < randomUser.user_id ? randomUser.user_id : user.id;
        
        // Try to create new chat session with consistent user ordering
        const { data: newSession, error: createError } = await supabase
          .from('chat_sessions')
          .insert({
            user1_id: userId1,
            user2_id: userId2,
            status: 'active'
          })
          .select('*')
          .maybeSingle();

        if (createError) {
          // If duplicate key error, try to find the session that might have been created by another request
          if (createError.code === '23505') {
            console.log('Duplicate key error, searching for existing session...');
            
            // Wait a moment and retry the search
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const { data: retrySession, error: retryError } = await supabase
              .from('chat_sessions')
              .select('*')
              .eq('status', 'active')
              .or(`and(user1_id.eq.${userId1},user2_id.eq.${userId2}),and(user1_id.eq.${userId2},user2_id.eq.${userId1})`)
              .maybeSingle();
            
            if (retryError || !retrySession) {
              console.error('Error finding session after duplicate key error:', retryError);
              throw new Error('Unable to create or find chat session. Please try again.');
            }
            
            console.log('Found session after duplicate key error:', retrySession.id);
            chatSession = retrySession;
          } else {
            console.error('Error creating chat session:', createError);
            throw createError;
          }
        } else if (newSession) {
          console.log('Created new chat session:', newSession.id);
          chatSession = newSession;
        } else {
          throw new Error('Failed to create chat session. Please try again.');
        }
      }

      // Set the other user's profile data
      const otherUserId = chatSession.user1_id === user.id ? chatSession.user2_id : chatSession.user1_id;
      const otherUserProfile = onlineUsers.find(u => u.user_id === otherUserId) || randomUser;

      setCurrentChatSession({
        ...chatSession,
        other_user_profile: otherUserProfile
      });

      // Load messages for this chat
      await loadMessages(chatSession.id);

    } catch (error) {
      console.error('Error starting new chat:', error);
      // Show user-friendly error message
      alert(error instanceof Error ? error.message : 'Failed to start chat. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = useCallback(async (chatSessionId: string) => {
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
  }, []);

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

      setMessages(prev => {
        const newMessages = [...prev, newMessage];
        
        // Trigger analysis after adding the message (background task)
        if (newMessages.length >= 3 && currentChatSession) {
          setTimeout(() => {
            analyzeConversation(currentChatSession.id, newMessages);
          }, 1000);
        }
        
        return newMessages;
      });
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

  // Set up real-time listeners for messages
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

            setMessages(prev => {
              const newMessages = [...prev, newMessage];
              
              // Trigger analysis for incoming messages too
              if (newMessage.sender_id !== user?.id && newMessages.length >= 3 && currentChatSession) {
                setTimeout(() => {
                  analyzeConversation(currentChatSession.id, newMessages);
                }, 1000);
              }
              
              return newMessages;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
    };
  }, [currentChatSession]);

  // Set up real-time listener for new chat sessions
  useEffect(() => {
    if (!user) return;

    const chatSessionsChannel = supabase
      .channel('chat_sessions_listener')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_sessions',
          filter: `or(user1_id.eq.${user.id},user2_id.eq.${user.id})`
        },
        async (payload) => {
          console.log('New chat session detected:', payload.new);
          
          // Only auto-join if we don't already have an active chat
          if (!currentChatSession) {
            const newSession = payload.new;
            
            // Determine the other user
            const otherUserId = newSession.user1_id === user.id ? newSession.user2_id : newSession.user1_id;
            
            // Fetch the other user's profile
            const { data: otherUserProfile } = await supabase
              .from('profiles')
              .select('user_id, username, display_name, avatar_url')
              .eq('user_id', otherUserId)
              .single();

            if (otherUserProfile) {
              console.log('Auto-joining chat session with:', otherUserProfile.display_name);
              setCurrentChatSession({
                ...newSession,
                other_user_profile: otherUserProfile
              } as ChatSession & { other_user_profile: typeof otherUserProfile });

              // Load messages for this chat
              await loadMessages(newSession.id);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(chatSessionsChannel);
    };
  }, [user, currentChatSession, loadMessages]);

  const skipToNextUser = async () => {
    if (!currentChatSession) return;
    
    // End current chat and start a new one
    await endChat();
    // Small delay to ensure cleanup
    setTimeout(() => {
      startNewChat();
    }, 500);
  };

  return {
    currentChatSession,
    messages,
    loading,
    isTyping,
    startNewChat,
    sendMessage,
    endChat,
    skipToNextUser,
    setIsTyping,
  };
}