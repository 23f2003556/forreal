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
    <form onSubmit={handleSubmit} className="flex gap-3 p-4 border-t-2 border-border glass-strong">
      <Input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type your message... 💬"
        disabled={disabled}
        className="flex-1 bg-background border-2 border-border focus:ring-primary rounded-2xl text-foreground font-medium"
      />
      <Button 
        type="submit" 
        disabled={!message.trim() || disabled}
        className="gradient-bg hover:opacity-90 text-white rounded-2xl px-6"
      >
        <Send className="h-5 w-5" />
      </Button>
    </form>
  );
}