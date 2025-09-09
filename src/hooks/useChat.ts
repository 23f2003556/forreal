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
  const [isInQueue, setIsInQueue] = useState(false);
  const [queuePosition, setQueuePosition] = useState(0);

  // Queue-based chat matching
  const joinQueue = useCallback(async (interests: string[] = [], genderPreference: string = '') => {
    if (!user || isInQueue || currentChatSession) return;
    
    setIsInQueue(true);
    setLoading(true);
    
    try {
      console.log('Joining chat queue...');
      
      // Add user to queue
      const { error: queueError } = await supabase
        .from('chat_queue')
        .insert({
          user_id: user.id,
          interests,
          gender_preference: genderPreference
        });

      if (queueError) {
        // If user is already in queue, that's okay
        if (queueError.code !== '23505') {
          throw queueError;
        }
      }

      // Try to find a match
      const { data: matchedUserId, error: matchError } = await supabase
        .rpc('find_queue_match', { requesting_user_id: user.id });

      if (matchError) {
        console.error('Error finding match:', matchError);
        throw matchError;
      }

      if (matchedUserId) {
        console.log('Found match:', matchedUserId);
        
        // Create chat session with matched user
        await createChatSession(matchedUserId);
        setIsInQueue(false);
      } else {
        console.log('No match found, waiting in queue...');
        // Stay in queue and wait for real-time match
      }
    } catch (error) {
      console.error('Error joining queue:', error);
      setIsInQueue(false);
      setLoading(false);
    }
  }, [user, isInQueue, currentChatSession]);

  const leaveQueue = useCallback(async () => {
    if (!user || !isInQueue) return;
    
    try {
      const { error } = await supabase
        .from('chat_queue')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;
      
      setIsInQueue(false);
      setQueuePosition(0);
      setLoading(false);
    } catch (error) {
      console.error('Error leaving queue:', error);
    }
  }, [user, isInQueue]);

  const createChatSession = async (otherUserId: string) => {
    if (!user) return;

    try {
      // Fetch other user's profile
      const { data: otherUserProfile, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, avatar_url')
        .eq('user_id', otherUserId)
        .single();

      if (profileError) throw profileError;

      // Ensure consistent ordering to prevent duplicate key violations
      const userId1 = user.id < otherUserId ? user.id : otherUserId;
      const userId2 = user.id < otherUserId ? otherUserId : user.id;
      
      // Create new chat session
      const { data: newSession, error: createError } = await supabase
        .from('chat_sessions')
        .insert({
          user1_id: userId1,
          user2_id: userId2,
          status: 'active'
        })
        .select('*')
        .single();

      if (createError) {
        console.error('Error creating chat session:', createError);
        throw createError;
      }

      console.log('Created new chat session:', newSession.id);
      
      setCurrentChatSession({
        ...newSession,
        other_user_profile: otherUserProfile
      });

      // Load messages for this chat
      await loadMessages(newSession.id);
      setLoading(false);
    } catch (error) {
      console.error('Error creating chat session:', error);
      setLoading(false);
    }
  };

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
            
            // Wait a moment and retry the search with multiple attempts
            let retrySession = null;
            let attempts = 0;
            const maxAttempts = 3;
            
            while (!retrySession && attempts < maxAttempts) {
              attempts++;
              await new Promise(resolve => setTimeout(resolve, 200 * attempts)); // Increasing delay
              
              const { data, error } = await supabase
                .from('chat_sessions')
                .select('*')
                .eq('status', 'active')
                .or(`and(user1_id.eq.${userId1},user2_id.eq.${userId2}),and(user1_id.eq.${userId2},user2_id.eq.${userId1})`)
                .limit(1);
              
              if (!error && data && data.length > 0) {
                retrySession = data[0];
                console.log(`Found session after duplicate key error (attempt ${attempts}):`, retrySession.id);
                break;
              }
              
              if (attempts === maxAttempts) {
                console.error('Failed to find session after multiple attempts');
                // Try one more time with a broader search
                const { data: broadSearch } = await supabase
                  .from('chat_sessions')
                  .select('*')
                  .eq('status', 'active')
                  .or(`user1_id.eq.${user.id},user2_id.eq.${user.id},user1_id.eq.${randomUser.user_id},user2_id.eq.${randomUser.user_id}`)
                  .limit(5);
                
                if (broadSearch && broadSearch.length > 0) {
                  // Find a session that involves both users
                  retrySession = broadSearch.find(session => 
                    (session.user1_id === user.id && session.user2_id === randomUser.user_id) ||
                    (session.user1_id === randomUser.user_id && session.user2_id === user.id)
                  );
                }
              }
            }
            
            if (!retrySession) {
              throw new Error('Unable to create or find chat session. Please try again.');
            }
            
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

  // Set up real-time listener for queue matches
  useEffect(() => {
    if (!user || !isInQueue) return;

    const queueChannel = supabase
      .channel('chat_queue_listener')
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'chat_queue',
          filter: `user_id=eq.${user.id}`
        },
        async (payload) => {
          console.log('User removed from queue, checking for match...');
          
          // Check if we have an active chat session now
          const { data: activeSessions, error } = await supabase
            .from('chat_sessions')
            .select('*, profiles!chat_sessions_user1_id_fkey(*), profiles!chat_sessions_user2_id_fkey(*)')
            .eq('status', 'active')
            .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
            .order('created_at', { ascending: false })
            .limit(1);

          if (!error && activeSessions && activeSessions.length > 0) {
            const session = activeSessions[0];
            const otherUserId = session.user1_id === user.id ? session.user2_id : session.user1_id;
            
            // Get other user's profile
            const { data: otherUserProfile } = await supabase
              .from('profiles')
              .select('user_id, username, display_name, avatar_url')
              .eq('user_id', otherUserId)
              .single();

            if (otherUserProfile) {
              console.log('Match found! Connecting to chat...');
              setCurrentChatSession({
                ...session,
                other_user_profile: otherUserProfile
              } as ChatSession & { other_user_profile: typeof otherUserProfile });

              await loadMessages(session.id);
            }
          }
          
          setIsInQueue(false);
          setLoading(false);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(queueChannel);
    };
  }, [user, isInQueue, loadMessages]);

  // Update queue position
  useEffect(() => {
    if (!user || !isInQueue) return;

    const updateQueuePosition = async () => {
      try {
        const { data: queueEntries, error } = await supabase
          .from('chat_queue')
          .select('user_id, created_at')
          .order('created_at', { ascending: true });

        if (!error && queueEntries) {
          const position = queueEntries.findIndex(entry => entry.user_id === user.id) + 1;
          setQueuePosition(position);
        }
      } catch (error) {
        console.error('Error updating queue position:', error);
      }
    };

    updateQueuePosition();
    const interval = setInterval(updateQueuePosition, 3000);

    return () => clearInterval(interval);
  }, [user, isInQueue]);

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
    isInQueue,
    queuePosition,
    startNewChat,
    sendMessage,
    endChat,
    skipToNextUser,
    setIsTyping,
    joinQueue,
    leaveQueue,
  };
}