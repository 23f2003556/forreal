import { pipeline } from '@huggingface/transformers';

interface LLMResponse {
  text: string;
  confidence: number;
}

class LLMService {
  private textGenerator: any = null;
  private isInitialized = false;

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Use a small, fast text generation model
      this.textGenerator = await pipeline(
        'text-generation',
        'Xenova/distilgpt2',
        { device: 'webgpu' }
      );
      this.isInitialized = true;
    } catch (error) {
      console.warn('WebGPU not available, falling back to CPU');
      try {
        this.textGenerator = await pipeline(
          'text-generation',
          'Xenova/distilgpt2'
        );
        this.isInitialized = true;
      } catch (fallbackError) {
        console.error('Failed to initialize LLM:', fallbackError);
      }
    }
  }

  async generateResponse(userMessage: string, conversationHistory: string[] = []): Promise<string> {
    if (!this.isInitialized || !this.textGenerator) {
      return this.getFallbackResponse(userMessage);
    }

    try {
      // Create a context-aware prompt
      const context = this.buildContext(userMessage, conversationHistory);
      const prompt = this.createPrompt(context, userMessage);

      const result = await this.textGenerator(prompt, {
        max_new_tokens: 50,
        temperature: 0.8,
        do_sample: true,
        return_full_text: false
      });

      const generatedText = result[0]?.generated_text || '';
      return this.formatResponse(generatedText, userMessage);
    } catch (error) {
      console.error('LLM generation failed:', error);
      return this.getFallbackResponse(userMessage);
    }
  }

  private buildContext(userMessage: string, history: string[]): string {
    const messageType = this.analyzeMessageType(userMessage);
    const recentHistory = history.slice(-3).join(' ');
    
    return `Context: ${messageType}. Recent: ${recentHistory}`;
  }

  private analyzeMessageType(message: string): string {
    const msg = message.toLowerCase();
    
    if (msg.includes('hi') || msg.includes('hello') || msg.includes('hey')) {
      return 'greeting';
    }
    if (msg.includes('?')) {
      return 'question';
    }
    if (msg.includes('love') || msg.includes('like') || msg.includes('amazing')) {
      return 'positive';
    }
    if (msg.includes('music') || msg.includes('movie') || msg.includes('food') || msg.includes('travel')) {
      return 'interest_sharing';
    }
    if (msg.includes('work') || msg.includes('job') || msg.includes('career')) {
      return 'professional';
    }
    
    return 'casual';
  }

  private createPrompt(context: string, userMessage: string): string {
    return `Respond briefly and formally to this message. Maximum 15 words. ${context}

User message: ${userMessage}
Your response:`;
  }

  private formatResponse(generated: string, userMessage: string): string {
    // Clean up the generated response
    let response = generated.trim();
    
    // Remove any unwanted prefixes
    response = response.replace(/^(Response:|User:|Chat:|Reply:)/i, '').trim();
    
    // If response is too short or doesn't make sense, use contextual fallback
    if (response.length < 3 || !this.isValidResponse(response)) {
      return this.getContextualResponse(userMessage);
    }

    // Keep response brief and formal
    return response.split('.')[0] + (response.includes('.') ? '.' : '');
  }

  private isValidResponse(response: string): boolean {
    const invalidPatterns = /^[^a-zA-Z]*$|^\s*$|^\.+$|^[,;:!?\s]*$/;
    return !invalidPatterns.test(response) && response.length > 2;
  }

  private getContextualResponse(userMessage: string): string {
    const msg = userMessage.toLowerCase();
    
    // Greeting responses
    if (msg.includes('hi') || msg.includes('hello') || msg.includes('hey')) {
      const greetings = [
        "Hello! How are you today?",
        "Hi there! Nice to meet you.",
        "Hello! Hope you're doing well."
      ];
      return greetings[Math.floor(Math.random() * greetings.length)];
    }
    
    // Question responses
    if (msg.includes('?')) {
      const questionResponses = [
        "That's interesting. Could you tell me more?",
        "Good question. What do you think?",
        "I'd like to hear your thoughts on that."
      ];
      return questionResponses[Math.floor(Math.random() * questionResponses.length)];
    }
    
    // Interest responses
    if (msg.includes('music')) {
      const musicResponses = [
        "I enjoy music too. What genre do you prefer?",
        "Music is wonderful. Any favorite artists?",
        "That's nice. What's your current favorite song?"
      ];
      return musicResponses[Math.floor(Math.random() * musicResponses.length)];
    }
    
    if (msg.includes('food') || msg.includes('eat')) {
      const foodResponses = [
        "Food is always a good topic. What's your favorite cuisine?",
        "I appreciate good food. Any restaurant recommendations?",
        "That sounds delicious. Do you enjoy cooking?"
      ];
      return foodResponses[Math.floor(Math.random() * foodResponses.length)];
    }
    
    if (msg.includes('travel') || msg.includes('trip')) {
      const travelResponses = [
        "Travel is enriching. Where would you like to visit?",
        "I enjoy learning about new places. Any recent trips?",
        "That sounds interesting. Do you prefer local or international travel?"
      ];
      return travelResponses[Math.floor(Math.random() * travelResponses.length)];
    }
    
    // Positive sentiment responses
    if (msg.includes('love') || msg.includes('amazing') || msg.includes('awesome')) {
      const positiveResponses = [
        "Thank you for sharing that. It sounds wonderful.",
        "That's lovely to hear. I appreciate your perspective.",
        "It's nice to meet someone with such positivity."
      ];
      return positiveResponses[Math.floor(Math.random() * positiveResponses.length)];
    }
    
    // Default responses
    const defaultResponses = [
      "That's quite interesting. Please tell me more.",
      "I appreciate you sharing that with me.",
      "Thank you for that insight. What else would you like to discuss?",
      "That's a thoughtful observation.",
      "I'd like to know more about your thoughts on this."
    ];
    
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  }

  private getFallbackResponse(userMessage: string): string {
    return this.getContextualResponse(userMessage);
  }
}

export const llmService = new LLMService();