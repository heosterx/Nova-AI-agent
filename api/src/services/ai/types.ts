export interface AIMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
}

export interface AIResponse {
  content: string;
  model: string;
  provider: string;
  tokensUsed: number;
  finishReason: string;
}

export interface RateLimitInfo {
  remaining: number;
  resetAt: Date;
  status: 'green' | 'yellow' | 'red';
}

export interface AIProvider {
  name: string;
  complete(
    messages: AIMessage[],
    systemPrompt?: string,
    onChunk?: (chunk: string) => void
  ): Promise<AIResponse>;
  getRateLimitStatus(): Promise<RateLimitInfo>;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface ToolCall {
  name: string;
  arguments: Record<string, unknown>;
}
