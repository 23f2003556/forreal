import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";

// Validation schema for message input
const messageSchema = z.object({
  content: z.string()
    .trim()
    .min(1, "Message cannot be empty")
    .max(5000, "Message must be less than 5000 characters")
});

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSendMessage, disabled }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [charCount, setCharCount] = useState(0);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMessage(value);
    setCharCount(value.length);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || disabled) {
      return;
    }

    // Validate message before sending
    try {
      const validated = messageSchema.parse({ content: message });
      onSendMessage(validated.content);
      setMessage("");
      setCharCount(0);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      }
    }
  };

  const isOverLimit = charCount > 5000;

  return (
    <form onSubmit={handleSubmit} className="border-t-2 border-border glass-strong">
      <div className="flex gap-3 p-4">
        <div className="flex-1 relative">
          <Input
            value={message}
            onChange={handleInputChange}
            placeholder="Type your message... 💬"
            disabled={disabled}
            maxLength={5100}
            className={`bg-background border-2 ${
              isOverLimit ? 'border-destructive' : 'border-border'
            } focus:ring-primary rounded-2xl text-foreground font-medium pr-16`}
          />
          <div className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium ${
            isOverLimit ? 'text-destructive' : charCount > 4500 ? 'text-orange-500' : 'text-muted-foreground'
          }`}>
            {charCount}/5000
          </div>
        </div>
        <Button 
          type="submit" 
          disabled={!message.trim() || disabled || isOverLimit}
          className="gradient-bg hover:opacity-90 text-white rounded-2xl px-6"
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
      {isOverLimit && (
        <div className="px-4 pb-3 text-sm text-destructive">
          Message is too long. Please keep it under 5000 characters.
        </div>
      )}
    </form>
  );
}