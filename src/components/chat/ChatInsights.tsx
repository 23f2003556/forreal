import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Brain, 
  Heart, 
  MessageSquare, 
  TrendingUp, 
  Lightbulb,
  Smile,
  Meh,
  Frown,
  Zap,
  Users
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface ChatInsight {
  id: string;
  chat_session_id: string;
  user_id: string;
  interest_score: number;
  vibe_score: string;
  key_topics: string[];
  engagement_level: number;
  sentiment_score: number;
  updated_at: string;
}

interface ChatInsightsProps {
  chatSessionId: string;
}

export function ChatInsights({ chatSessionId }: ChatInsightsProps) {
  const { user } = useAuth();
  const [insights, setInsights] = useState<ChatInsight | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (chatSessionId && user) {
      fetchInsights();
      // Set up real-time listener for insights
      const channel = supabase
        .channel('chat_insights')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'chat_insights',
            filter: `chat_session_id=eq.${chatSessionId}`
          },
          () => {
            fetchInsights();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [chatSessionId, user]);

  const fetchInsights = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('chat_insights')
        .select('*')
        .eq('chat_session_id', chatSessionId)
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setInsights(data || null);
    } catch (error) {
      console.error('Error fetching insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const getVibeIcon = (vibe: string) => {
    switch (vibe) {
      case 'friendly':
        return <Smile className="h-4 w-4" />;
      case 'enthusiastic':
        return <Zap className="h-4 w-4" />;
      case 'neutral':
        return <Meh className="h-4 w-4" />;
      case 'reserved':
        return <Users className="h-4 w-4" />;
      case 'negative':
        return <Frown className="h-4 w-4" />;
      default:
        return <Meh className="h-4 w-4" />;
    }
  };

  const getVibeColor = (vibe: string) => {
    switch (vibe) {
      case 'friendly':
        return 'emotion-happy';
      case 'enthusiastic':
        return 'emotion-excited';
      case 'neutral':
        return 'emotion-neutral';
      case 'reserved':
        return 'emotion-neutral';
      case 'negative':
        return 'emotion-angry';
      default:
        return 'emotion-neutral';
    }
  };

  const getSentimentLabel = (score: number) => {
    if (score > 0.3) return 'Very Positive';
    if (score > 0.1) return 'Positive';
    if (score > -0.1) return 'Neutral';
    if (score > -0.3) return 'Negative';
    return 'Very Negative';
  };

  if (loading) {
    return (
      <div className="w-80 border-l border-border bg-chat-panel p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-muted rounded w-3/4"></div>
          <div className="h-20 bg-muted rounded"></div>
          <div className="h-20 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 border-l border-border bg-chat-panel">
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold text-foreground flex items-center">
          <Brain className="h-5 w-5 mr-2 text-insight-primary" />
          AI Insights
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Real-time conversation analysis
        </p>
      </div>

      <ScrollArea className="h-full pb-20">
        <div className="p-4 space-y-4">
          {insights ? (
            <>
              {/* Interest Score */}
              <Card className="bg-card/50 border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center">
                    <Heart className="h-4 w-4 mr-2 text-insight-warning" />
                    Interest Level
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Progress 
                      value={insights.interest_score} 
                      className="h-2"
                    />
                    <p className="text-sm text-muted-foreground">
                      {insights.interest_score}% interested in the conversation
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Engagement Level */}
              <Card className="bg-card/50 border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center">
                    <TrendingUp className="h-4 w-4 mr-2 text-insight-success" />
                    Engagement
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Progress 
                      value={insights.engagement_level} 
                      className="h-2"
                    />
                    <p className="text-sm text-muted-foreground">
                      {insights.engagement_level}% engagement level
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Vibe Score */}
              <Card className="bg-card/50 border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center">
                    <MessageSquare className="h-4 w-4 mr-2 text-insight-secondary" />
                    Overall Vibe
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge 
                    variant="secondary" 
                    className={`bg-${getVibeColor(insights.vibe_score)}/20 text-${getVibeColor(insights.vibe_score)} border-${getVibeColor(insights.vibe_score)}/30`}
                  >
                    {getVibeIcon(insights.vibe_score)}
                    <span className="ml-1 capitalize">{insights.vibe_score}</span>
                  </Badge>
                  <p className="text-sm text-muted-foreground mt-2">
                    Sentiment: {getSentimentLabel(insights.sentiment_score)}
                  </p>
                </CardContent>
              </Card>

              {/* Key Topics */}
              <Card className="bg-card/50 border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center">
                    <Lightbulb className="h-4 w-4 mr-2 text-insight-primary" />
                    Key Topics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {insights.key_topics && insights.key_topics.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {insights.key_topics.map((topic, index) => (
                        <Badge 
                          key={index} 
                          variant="outline" 
                          className="text-xs bg-insight-primary/10 border-insight-primary/30 text-insight-primary"
                        >
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Continue chatting to discover topics...
                    </p>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="bg-card/50 border-border/50">
              <CardContent className="pt-6 text-center">
                <Brain className="h-12 w-12 mx-auto text-insight-primary mb-4" />
                <h3 className="font-semibold mb-2">AI Analysis Starting</h3>
                <p className="text-sm text-muted-foreground">
                  Send a few messages to start seeing insights about your conversation!
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}