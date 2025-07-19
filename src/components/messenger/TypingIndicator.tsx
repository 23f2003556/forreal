import { cn } from "@/lib/utils";

interface TypingIndicatorProps {
  userName: string;
  className?: string;
}

export function TypingIndicator({ userName, className }: TypingIndicatorProps) {
  return (
    <div className={cn("flex items-center gap-2 px-4 py-2", className)}>
      <div className="flex gap-1">
        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-typing-pulse" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-typing-pulse" style={{ animationDelay: '200ms' }} />
        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-typing-pulse" style={{ animationDelay: '400ms' }} />
      </div>
      <span className="text-sm text-muted-foreground">{userName} is typing...</span>
    </div>
  );
}