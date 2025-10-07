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
        "max-w-[70%] rounded-lg px-4 py-2",
        isOwn 
          ? "bg-message-sent text-message-text rounded-br-sm" 
          : "bg-message-received text-message-text rounded-bl-sm"
      )}>
        {!isOwn && senderName && (
          <div className="text-xs text-muted-foreground mb-1 font-medium">
            {senderName}
          </div>
        )}
        <div className="break-words">{message}</div>
        <div className={cn(
          "text-xs mt-1 opacity-70",
          isOwn ? "text-right" : "text-left"
        )}>
          {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
}