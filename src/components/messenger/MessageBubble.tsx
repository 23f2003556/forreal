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
      "flex w-full",
      isOwn ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "max-w-[75%] rounded-2xl px-3 py-2",
        isOwn 
          ? "bg-message-sent text-primary-foreground" 
          : "bg-message-received text-message-text"
      )}>
        <div className="break-words text-sm">{message}</div>
        <div className={cn(
          "text-xs mt-1 opacity-60",
          isOwn ? "text-right" : "text-left"
        )}>
          {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
}