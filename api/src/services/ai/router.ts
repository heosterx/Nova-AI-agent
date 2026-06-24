import { GroqProvider } from './groq';
import { CerebrasProvider } from './cerebras';
import { OpenRouterProvider } from './openrouter';
import { AIProvider, AIMessage, AIResponse, RateLimitInfo } from './types';

interface ProviderError extends Error {
  status?: number;
}

class AIRouter {
  private providers: AIProvider[];
  private groq: GroqProvider;
  private cerebras: CerebrasProvider;
  private openrouter: OpenRouterProvider;

  constructor() {
    this.groq = new GroqProvider();
    this.cerebras = new CerebrasProvider();
    this.openrouter = new OpenRouterProvider();
    this.providers = [this.groq, this.cerebras, this.openrouter];
  }

  async complete(
    messages: AIMessage[],
    systemPrompt?: string,
    onChunk?: (chunk: string) => void
  ): Promise<AIResponse> {
    const errors: string[] = [];

    for (const provider of this.providers) {
      try {
        const result = await provider.complete(messages, systemPrompt, onChunk);
        return result;
      } catch (error: unknown) {
        const providerError = error as ProviderError;
        const status = providerError.status;
        const message = providerError.message || 'Unknown error';

        if (status === 429 || status === 503 || status === 529) {
          console.log(`[AIRouter] ${provider.name} rate limited (${status}), trying next provider...`);
          errors.push(`${provider.name}: ${message}`);
          continue;
        }

        if (!process.env[`${provider.name.toUpperCase()}_API_KEY`]) {
          console.log(`[AIRouter] ${provider.name} not configured, trying next provider...`);
          errors.push(`${provider.name}: not configured`);
          continue;
        }

        console.error(`[AIRouter] ${provider.name} error:`, message);
        errors.push(`${provider.name}: ${message}`);
        continue;
      }
    }

    throw new Error(`All AI providers failed: ${errors.join('; ')}`);
  }

  async getStatus(): Promise<Record<string, RateLimitInfo>> {
    const [groq, cerebras, openrouter] = await Promise.all([
      this.groq.getRateLimitStatus(),
      this.cerebras.getRateLimitStatus(),
      this.openrouter.getRateLimitStatus(),
    ]);

    return { groq, cerebras, openrouter };
  }
}

export const aiRouter = new AIRouter();
