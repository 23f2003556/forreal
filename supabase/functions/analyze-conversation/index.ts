import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = 'https://yzygrnctogbsxbzlvsow.supabase.co';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication and get user from JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized - No auth token provided' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Create Supabase client with the user's auth token for authorization
    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(JSON.stringify({ error: 'Unauthorized - Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Use authenticated user's ID, don't trust request body
    const userId = user.id;
    const { chatSessionId, messages } = await req.json();

    if (!chatSessionId || !messages) {
      throw new Error('Missing required parameters');
    }

    console.log('Analyzing conversation for chat session:', chatSessionId, 'user:', userId);

    // Verify the authenticated user is a participant in this chat session
    const { data: session, error: sessionError } = await supabase
      .from('chat_sessions')
      .select('user1_id, user2_id, status')
      .eq('id', chatSessionId)
      .single();

    if (sessionError || !session) {
      console.error('Chat session not found:', sessionError);
      return new Response(JSON.stringify({ error: 'Chat session not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verify user is one of the participants
    if (session.user1_id !== userId && session.user2_id !== userId) {
      console.error('User not authorized for this chat session');
      return new Response(JSON.stringify({ error: 'Forbidden - You are not a participant in this chat' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Prepare conversation text for analysis
    const conversationText = messages
      .map((msg: any) => `${msg.sender_id === userId ? 'Me' : 'Them'}: ${msg.content}`)
      .join('\n');

    console.log('Conversation text length:', conversationText.length);

    // Create OpenAI analysis prompt
    const prompt = `Analyze this chat conversation and provide insights in JSON format. Focus on the perspective of the user who says "Me:".

Conversation:
${conversationText}

Please analyze and return a JSON object with these exact fields:
{
  "interest_score": <number 0-100 representing how interested the other person seems in the conversation>,
  "engagement_level": <number 0-100 representing overall engagement level>,
  "vibe_score": <one of: "friendly", "enthusiastic", "neutral", "reserved", "negative">,
  "sentiment_score": <number between -1.0 and 1.0 representing overall sentiment>,
  "key_topics": <array of 3-5 main topics discussed as strings>
}

Base your analysis on:
- Response length and frequency
- Use of questions and follow-ups 
- Emotional language and tone
- Topic initiation and development
- Overall conversational flow

Return only the JSON object, no other text.`;

    console.log('Calling OpenAI API...');

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert conversation analyst. Analyze chat conversations and provide insights in the exact JSON format requested.' 
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 500,
        temperature: 0.3
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('OpenAI response received');

    const aiAnalysis = data.choices[0].message.content.trim();
    console.log('AI analysis:', aiAnalysis);

    // Parse the JSON response
    let insights;
    try {
      insights = JSON.parse(aiAnalysis);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', aiAnalysis);
      // Fallback insights
      insights = {
        interest_score: 50,
        engagement_level: 50,
        vibe_score: 'neutral',
        sentiment_score: 0.0,
        key_topics: ['general conversation']
      };
    }

    console.log('Parsed insights:', insights);

    // Update database with insights (supabase client already created above for auth)

    const { data: existingInsight } = await supabase
      .from('chat_insights')
      .select('id')
      .eq('chat_session_id', chatSessionId)
      .eq('user_id', userId)
      .maybeSingle();

    let result;
    if (existingInsight) {
      // Update existing insight
      result = await supabase
        .from('chat_insights')
        .update({
          interest_score: Math.round(insights.interest_score),
          engagement_level: Math.round(insights.engagement_level),
          vibe_score: insights.vibe_score,
          sentiment_score: parseFloat(insights.sentiment_score.toFixed(2)),
          key_topics: insights.key_topics || [],
          updated_at: new Date().toISOString()
        })
        .eq('id', existingInsight.id)
        .select()
        .single();
    } else {
      // Insert new insight
      result = await supabase
        .from('chat_insights')
        .insert({
          chat_session_id: chatSessionId,
          user_id: userId,
          interest_score: Math.round(insights.interest_score),
          engagement_level: Math.round(insights.engagement_level),
          vibe_score: insights.vibe_score,
          sentiment_score: parseFloat(insights.sentiment_score.toFixed(2)),
          key_topics: insights.key_topics || []
        })
        .select()
        .single();
    }

    if (result.error) {
      console.error('Database error:', result.error);
      throw new Error('Failed to save insights to database');
    }

    console.log('Insights saved to database successfully');

    return new Response(JSON.stringify({ 
      success: true, 
      insights: result.data 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-conversation function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});