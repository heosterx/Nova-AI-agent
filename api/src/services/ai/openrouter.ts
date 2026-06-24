import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { AIProvider, AIMessage, AIResponse, RateLimitInfo } from './types';

export class OpenRouterProvider implements AIProvider {
  private client: OpenAI;
  name = 'openrouter';
  private requestCount = 0;
  private resetTime = Date.now() + 86_400_000;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY || '',
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': process.env.FRONTEND_URL || 'https://nova.pages.dev',
        'X-Title': 'Nova AI Agent',
      },
    });
  }

  async complete(
    messages: AIMessage[],
    systemPrompt?: string,
    onChunk?: (chunk: string) => void
  ): Promise<AIResponse> {
    const allMessages = systemPrompt
      ? [{ role: 'system' as const, content: systemPrompt }, ...messages]
      : messages;

    this.requestCount++;

    const stream = await this.client.chat.completions.create({
      model: 'meta-llama/llama-3.3-70b-instruct:free',
      messages: allMessages.map((m) => {
        if (m.role === 'tool') {
          return { role: 'user' as const, content: `[Tool Result]: ${m.content}` };
        }
        return { role: m.role as 'user' | 'assistant' | 'system', content: m.content };
      }) as ChatCompletionMessageParam[],
      stream: true,
      temperature: 0.7,
      max_tokens: 8192,
    });

    let fullContent = '';
    let totalTokens = 0;

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content || '';
      if (text) {
        fullContent += text;
        onChunk?.(text);
      }
      if (chunk.usage) {
        totalTokens = (chunk.usage.prompt_tokens ?? 0) + (chunk.usage.completion_tokens ?? 0);
      }
    }

    return {
      content: fullContent,
      model: 'meta-llama/llama-3.3-70b-instruct:free',
      provider: 'openrouter',
      tokensUsed: totalTokens,
      finishReason: 'stop',
    };
  }

  async getRateLimitStatus(): Promise<RateLimitInfo> {
    const now = Date.now();
    if (now > this.resetTime) {
      this.requestCount = 0;
      this.resetTime = now + 86_400_000;
    }

    const remaining = Math.max(0, 50 - this.requestCount);
    let status: RateLimitInfo['status'] = 'green';
    if (remaining < 10) status = 'red';
    else if (remaining < 25) status = 'yellow';

    return { remaining, resetAt: new Date(this.resetTime), status };
  }
}
