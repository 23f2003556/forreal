import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Brain, Heart, Clock, TrendingUp, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ChatInsights {
  mood: {
    current: 'happy' | 'excited' | 'neutral' | 'sad' | 'angry';
    confidence: number;
  };
  engagement: {
    level: number; // 0-100
    responseTime: number; // in seconds
    messageLength: number; // average words
  };
  interests: string[];
  behavioral: {
    communicationStyle: 'formal' | 'casual' | 'enthusiastic' | 'brief';
    attentiveness: number; // 0-100
  };
  lastUpdated: Date;
}

interface InsightsPanelProps {
  insights: ChatInsights;
  isVisible: boolean;
  userName: string;
}

export function InsightsPanel({ insights, isVisible, userName }: InsightsPanelProps) {
  const getMoodColor = (mood: ChatInsights['mood']['current']) => {
    switch (mood) {
      case 'happy': return 'emotion-happy';
      case 'excited': return 'emotion-excited';
      case 'neutral': return 'emotion-neutral';
      case 'sad': return 'emotion-sad';
      case 'angry': return 'emotion-angry';
    }
  };

  const getMoodIcon = (mood: ChatInsights['mood']['current']) => {
    switch (mood) {
      case 'happy': return '😊';
      case 'excited': return '🤩';
      case 'neutral': return '😐';
      case 'sad': return '😢';
      case 'angry': return '😠';
    }
  };

  if (!isVisible) return null;

  return (
    <div className="w-96 bg-chat-panel border-l border-border overflow-y-auto">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-accent" />
          <h2 className="text-lg font-semibold text-foreground">AI Insights</h2>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Real-time analysis of {userName}'s conversation
        </p>
      </div>

      <div className="p-4 space-y-4">
        {/* Mood Analysis */}
        <Card className="animate-insight-glow bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Heart className="h-4 w-4 text-insight-primary" />
              Current Mood
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{getMoodIcon(insights.mood.current)}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "capitalize font-medium",
                    `text-${getMoodColor(insights.mood.current)}`
                  )}>
                    {insights.mood.current}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {insights.mood.confidence}% confident
                  </Badge>
                </div>
                <Progress 
                  value={insights.mood.confidence} 
                  className="mt-2 h-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Engagement Metrics */}
        <Card className="bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-insight-secondary" />
              Engagement Level
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Overall Engagement</span>
                <span className="font-medium">{insights.engagement.level}%</span>
              </div>
              <Progress value={insights.engagement.level} className="h-2" />
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  Response Time
                </div>
                <div className="font-medium">{insights.engagement.responseTime}s</div>
              </div>
              <div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <MessageCircle className="h-3 w-3" />
                  Avg Words
                </div>
                <div className="font-medium">{insights.engagement.messageLength}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detected Interests */}
        <Card className="bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Detected Interests</CardTitle>
            <CardDescription>Topics mentioned in conversation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {insights.interests.map((interest, index) => (
                <Badge 
                  key={index} 
                  variant="outline" 
                  className="bg-insight-primary/10 border-insight-primary/20 text-insight-primary"
                >
                  {interest}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Behavioral Analysis */}
        <Card className="bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Communication Style</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Style</span>
                <span className="font-medium capitalize">{insights.behavioral.communicationStyle}</span>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Attentiveness</span>
                <span className="font-medium">{insights.behavioral.attentiveness}%</span>
              </div>
              <Progress value={insights.behavioral.attentiveness} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <div className="text-xs text-muted-foreground text-center pt-2">
          Last updated: {insights.lastUpdated.toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}