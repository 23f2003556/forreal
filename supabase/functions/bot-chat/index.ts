import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Bot user ID stored server-side only
const BOT_USER_ID = '00000000-0000-0000-0000-000000000000';

// Simple bot response generator (replaces client-side LLM)
function generateBotResponse(userMessage: string, conversationHistory: string[]): string {
  const message = userMessage.toLowerCase();
  
  // Contextual responses based on conversation length
  const conversationLength = conversationHistory.length;
  
  // Greeting responses
  if (message.includes('hi') || message.includes('hello') || message.includes('hey')) {
    const greetings = [
      "Hey! 👋 How's your day going?",
      "Hi there! What's on your mind?",
      "Hello! Nice to chat with you!",
      "Hey! Tell me something interesting about yourself!"
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }
  
  // Question responses
  if (message.includes('how are you') || message.includes('how are u')) {
    return "I'm doing great! Thanks for asking. How about you?";
  }
  
  if (message.includes('what') && message.includes('name')) {
    return "I'm your AI chat buddy! I'm here to keep you company until you find a real person to chat with.";
  }
  
  // Interest-based responses
  if (message.includes('music') || message.includes('song')) {
    return "Music is awesome! What kind of music do you like? I'd love to hear about your favorite artists!";
  }
  
  if (message.includes('movie') || message.includes('film')) {
    return "Movies are great! What's the last good movie you watched? I'm always looking for recommendations!";
  }
  
  if (message.includes('game') || message.includes('gaming')) {
    return "Gaming is fun! What games are you into? I hear there are some great new releases lately.";
  }
  
  if (message.includes('book') || message.includes('reading')) {
    return "Reading is wonderful! What kind of books do you enjoy? Fiction or non-fiction?";
  }
  
  // Engagement responses based on conversation depth
  if (conversationLength < 3) {
    const earlyResponses = [
      "That's interesting! Tell me more about that.",
      "Cool! What else do you like to do?",
      "Nice! How did you get into that?",
      "Awesome! I'd love to hear more about your interests!"
    ];
    return earlyResponses[Math.floor(Math.random() * earlyResponses.length)];
  } else if (conversationLength < 6) {
    const midResponses = [
      "You seem like an interesting person! What's something you're passionate about?",
      "That's really cool! What would you say is your favorite thing to do?",
      "I'm enjoying our chat! What made you decide to join this app?",
      "You have great taste! What else should I know about you?"
    ];
    return midResponses[Math.floor(Math.random() * midResponses.length)];
  } else {
    const lateResponses = [
      "This has been a great conversation! You know, there might be real people online now who'd love to chat with you!",
      "I'm having fun chatting, but I bet you'd have an even better time talking to a real person. Want to try matching again?",
      "You're really interesting to talk to! I think you'd make a great conversation partner for someone real.",
      "I've enjoyed our chat! Feel free to end this and look for a real match - I think you'd hit it off with someone!"
    ];
    return lateResponses[Math.floor(Math.random() * lateResponses.length)];
  }
  
  // Default fallback
  const fallbacks = [
    "That's really interesting! What else is on your mind?",
    "Cool! Tell me more about that.",
    "I see! What do you think about that?",
    "Interesting perspective! What made you feel that way?",
    "That's awesome! Anything else you'd like to share?"
  ];
  
  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create Supabase client with auth
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Verify user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse request body
    const { chatSessionId, userMessage } = await req.json();

    // Input validation
    if (!chatSessionId || !userMessage) {
      return new Response(JSON.stringify({ error: 'Missing chatSessionId or userMessage' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate message length
    if (typeof userMessage !== 'string' || userMessage.length > 2000) {
      return new Response(JSON.stringify({ error: 'Message too long (max 2000 characters)' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Rate limiting check
    const supabaseServiceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: rateLimitData } = await supabaseServiceClient
      .from('rate_limits')
      .select('last_request_at')
      .eq('user_id', user.id)
      .eq('action', 'bot_chat')
      .maybeSingle();

    if (rateLimitData) {
      const timeSince = Date.now() - new Date(rateLimitData.last_request_at).getTime();
      if (timeSince < 1000) { // 1 second cooldown
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please wait before sending another message.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Update rate limit
    await supabaseServiceClient
      .from('rate_limits')
      .upsert({
        user_id: user.id,
        action: 'bot_chat',
        last_request_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,action'
      });

    // Verify user is participant in the chat session
    const { data: session, error: sessionError } = await supabaseClient
      .from('chat_sessions')
      .select('user1_id, user2_id, status')
      .eq('id', chatSessionId)
      .single();

    if (sessionError || !session) {
      console.error('Chat session not found:', chatSessionId, sessionError);
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify user is a participant
    if (session.user1_id !== user.id && session.user2_id !== user.id) {
      console.error('Authorization failed: User', user.id, 'not in session', chatSessionId);
      return new Response(JSON.stringify({ error: 'Access denied' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify it's a bot chat
    if (session.user1_id !== BOT_USER_ID && session.user2_id !== BOT_USER_ID) {
      console.error('Invalid chat type for bot interaction:', chatSessionId);
      return new Response(JSON.stringify({ error: 'Invalid request' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify session is active
    if (session.status !== 'active') {
      return new Response(JSON.stringify({ error: 'Chat session is not active' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get conversation history for context
    const { data: messages } = await supabaseClient
      .from('messages')
      .select('content')
      .eq('chat_session_id', chatSessionId)
      .order('created_at', { ascending: true })
      .limit(10);

    const conversationHistory = messages?.map(m => m.content) || [];

    // Generate bot response
    const botResponse = generateBotResponse(userMessage, conversationHistory);

    // Insert bot message using service role (bypasses RLS)
    const { data: messageData, error: messageError } = await supabaseServiceClient
      .from('messages')
      .insert({
        chat_session_id: chatSessionId,
        sender_id: BOT_USER_ID,
        content: botResponse,
        message_type: 'text',
      })
      .select()
      .single();

    if (messageError) {
      console.error('Message insert error:', messageError);
      return new Response(JSON.stringify({ error: 'Failed to send bot message' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, message: messageData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Bot chat error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
