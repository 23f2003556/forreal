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
    return `You are a Gen Z person chatting on a dating app. Respond naturally with Gen Z slang, emojis, and dating energy. ${context}

User: ${userMessage}
Response:`;
  }

  private formatResponse(generated: string, userMessage: string): string {
    // Clean up the generated response
    let response = generated.trim();
    
    // Remove any unwanted prefixes
    response = response.replace(/^(Response:|User:|Chat:|Reply:)/i, '').trim();
    
    // If response is too short or doesn't make sense, use contextual fallback
    if (response.length < 5 || !this.isValidResponse(response)) {
      return this.getContextualResponse(userMessage);
    }

    // Add some Gen Z flair if missing
    if (!this.hasGenZElements(response)) {
      response = this.addGenZFlair(response);
    }

    return response;
  }

  private isValidResponse(response: string): boolean {
    const invalidPatterns = /^[^a-zA-Z]*$|^\s*$|^\.+$|^[,;:!?\s]*$/;
    return !invalidPatterns.test(response) && response.length > 2;
  }

  private hasGenZElements(text: string): boolean {
    const genZWords = ['fr', 'no cap', 'bestie', 'periodt', 'slay', 'vibe', 'lowkey', 'highkey', 'bet', 'fam'];
    const emojis = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/u;
    
    return genZWords.some(word => text.toLowerCase().includes(word)) || emojis.test(text);
  }

  private addGenZFlair(response: string): string {
    const genZEndings = [' fr fr', ' no cap', ' bestie', ' 💯', ' ✨', ' 😭'];
    const randomEnding = genZEndings[Math.floor(Math.random() * genZEndings.length)];
    
    return response + randomEnding;
  }

  private getContextualResponse(userMessage: string): string {
    const msg = userMessage.toLowerCase();
    
    // Greeting responses
    if (msg.includes('hi') || msg.includes('hello') || msg.includes('hey')) {
      const greetings = [
        "heyy! what's good bestie? 😊",
        "omg hiiii! you're giving main character energy today ✨",
        "hey there! how are you doing fr? 💫"
      ];
      return greetings[Math.floor(Math.random() * greetings.length)];
    }
    
    // Question responses
    if (msg.includes('?')) {
      const questionResponses = [
        "that's such a good question! let me think... 🤔",
        "ooh interesting! tell me more about that bestie 💭",
        "wait that's lowkey deep though, I'm here for it 🫶"
      ];
      return questionResponses[Math.floor(Math.random() * questionResponses.length)];
    }
    
    // Interest responses
    if (msg.includes('music')) {
      const musicResponses = [
        "no way! what kind of music are you into? I'm always discovering new artists 🎵",
        "music taste says everything about a person ngl... what's your current obsession? 🎧",
        "bestie yes! music is literally my love language fr 💿"
      ];
      return musicResponses[Math.floor(Math.random() * musicResponses.length)];
    }
    
    if (msg.includes('food') || msg.includes('eat')) {
      const foodResponses = [
        "don't even get me started on food! what's your go-to comfort meal? 🍕",
        "okay food talk is my favorite... are you more of a sweet or savory person? 🤤",
        "stop I'm literally always hungry! what did you have today? 😋"
      ];
      return foodResponses[Math.floor(Math.random() * foodResponses.length)];
    }
    
    if (msg.includes('travel') || msg.includes('trip')) {
      const travelResponses = [
        "travel stories hit different! where's the most beautiful place you've been? ✈️",
        "wanderlust is real fr... what's on your bucket list? 🗺️",
        "okay travel buddy! are you more of a beach or mountain person? 🏝️"
      ];
      return travelResponses[Math.floor(Math.random() * travelResponses.length)];
    }
    
    // Positive sentiment responses
    if (msg.includes('love') || msg.includes('amazing') || msg.includes('awesome')) {
      const positiveResponses = [
        "your energy is literally contagious! I'm here for this vibe 🌟",
        "stop you're making me smile! this conversation is everything 😊",
        "the way you see things is actually beautiful fr 💕"
      ];
      return positiveResponses[Math.floor(Math.random() * positiveResponses.length)];
    }
    
    // Default responses
    const defaultResponses = [
      "that's actually so interesting! tell me more bestie 💭",
      "you're giving such good vibes rn, I'm loving this energy ✨",
      "wait pause... that's lowkey deep and I wasn't expecting it 🤯",
      "okay but why does that sound exactly like something I would say? 👯‍♀️",
      "not you being relatable af right now... we might be the same person 🫶"
    ];
    
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  }

  private getFallbackResponse(userMessage: string): string {
    return this.getContextualResponse(userMessage);
  }
}

export const llmService = new LLMService();