import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  message: string;
  isOwn: boolean;
  timestamp: Date;
  senderName?: string;
}

export function MessageBubble({ message, isOwn, timestamp, senderName }: MessageBubbleProps) {
  return (
    <div className={cn(
      "flex w-full animate-message-slide-in",
      isOwn ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "max-w-[70%] rounded-2xl px-5 py-3 font-medium",
        isOwn 
          ? "gradient-bg text-white rounded-br-sm" 
          : "bg-message-received text-foreground rounded-bl-sm border-2 border-border"
      )}>
        {!isOwn && senderName && (
          <div className="text-xs text-foreground/60 mb-1 font-semibold">
            {senderName}
          </div>
        )}
        <div className="break-words text-base">{message}</div>
        <div className={cn(
          "text-xs mt-1 font-medium",
          isOwn ? "text-white/70 text-right" : "text-foreground/50 text-left"
        )}>
          {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
}