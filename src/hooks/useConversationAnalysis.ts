import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface Message {
  id: string;
  chat_session_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export function useConversationAnalysis() {
  const { user } = useAuth();

  const analyzeConversation = useCallback(async (
    chatSessionId: string, 
    messages: Message[]
  ) => {
    if (!user || messages.length < 3) {
      return { success: false, error: 'Not enough messages to analyze' };
    }

    try {
      console.log('Starting conversation analysis...');
      
      const { data, error } = await supabase.functions.invoke('analyze-conversation', {
        body: {
          chatSessionId,
          messages: messages.slice(-10), // Analyze last 10 messages for efficiency
          userId: user.id
        }
      });

      if (error) {
        console.error('Analysis error:', error);
        throw error;
      }

      console.log('Analysis completed successfully');
      return { success: true, data };
    } catch (error) {
      console.error('Error analyzing conversation:', error);
      return { success: false, error: error.message || 'Analysis failed' };
    }
  }, [user]);

  return { analyzeConversation };
}