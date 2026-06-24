import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { AIProvider, AIMessage, AIResponse, RateLimitInfo } from './types';

export class CerebrasProvider implements AIProvider {
  private client: OpenAI;
  name = 'cerebras';
  private tokensUsedToday = 0;
  private resetTime = Date.now() + 86_400_000;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.CEREBRAS_API_KEY || '',
      baseURL: 'https://api.cerebras.ai/v1',
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

    const stream = await this.client.chat.completions.create({
      model: 'llama-3.3-70b',
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

    this.tokensUsedToday += totalTokens;

    return {
      content: fullContent,
      model: 'llama-3.3-70b',
      provider: 'cerebras',
      tokensUsed: totalTokens,
      finishReason: 'stop',
    };
  }

  async getRateLimitStatus(): Promise<RateLimitInfo> {
    const now = Date.now();
    if (now > this.resetTime) {
      this.tokensUsedToday = 0;
      this.resetTime = now + 86_400_000;
    }

    const remaining = Math.max(0, 1_000_000 - this.tokensUsedToday);
    let status: RateLimitInfo['status'] = 'green';
    if (remaining < 100_000) status = 'red';
    else if (remaining < 500_000) status = 'yellow';

    return { remaining, resetAt: new Date(this.resetTime), status };
  }
}
