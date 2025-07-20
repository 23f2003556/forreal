import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSendMessage, disabled }: ChatInputProps) {
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-3 p-4 border-t border-border bg-background">
      <Input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Message..."
        disabled={disabled}
        className="flex-1 border-0 bg-muted focus-visible:ring-0 focus-visible:ring-offset-0"
      />
      <Button 
        type="submit" 
        disabled={!message.trim() || disabled}
        size="sm"
        className="px-3"
      >
        <Send className="h-4 w-4" />
      </Button>
    </form>
  );
}