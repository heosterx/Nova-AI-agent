import Groq from 'groq-sdk';
import { ChatCompletionMessageParam } from 'groq-sdk/resources/chat/completions';
import { AIProvider, AIMessage, AIResponse, RateLimitInfo } from './types';

export class GroqProvider implements AIProvider {
  private client: Groq;
  name = 'groq';
  private requestCount = 0;
  private resetTime = Date.now() + 60_000;

  constructor() {
    this.client = new Groq({ apiKey: process.env.GROQ_API_KEY || '' });
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
      model: 'llama-3.3-70b-versatile',
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
    let promptTokens = 0;
    let completionTokens = 0;

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content || '';
      if (text) {
        fullContent += text;
        onChunk?.(text);
      }
      if (chunk.x_groq?.usage) {
        promptTokens = chunk.x_groq.usage.prompt_tokens ?? 0;
        completionTokens = chunk.x_groq.usage.completion_tokens ?? 0;
      }
    }

    return {
      content: fullContent,
      model: 'llama-3.3-70b-versatile',
      provider: 'groq',
      tokensUsed: promptTokens + completionTokens,
      finishReason: 'stop',
    };
  }

  async getRateLimitStatus(): Promise<RateLimitInfo> {
    const now = Date.now();
    if (now > this.resetTime) {
      this.requestCount = 0;
      this.resetTime = now + 60_000;
    }

    const remaining = Math.max(0, 30 - this.requestCount);
    let status: RateLimitInfo['status'] = 'green';
    if (remaining < 5) status = 'red';
    else if (remaining < 15) status = 'yellow';

    return { remaining, resetAt: new Date(this.resetTime), status };
  }
}
