import { writable, derived } from 'svelte/store';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  toolName?: string;
  toolInput?: Record<string, unknown>;
  toolOutput?: Record<string, unknown>;
  model?: string;
  tokensUsed?: number;
  createdAt: string;
}

interface ChatState {
  sessionId: string | null;
  messages: Message[];
  isStreaming: boolean;
  error: string | null;
}

export const chatStore = writable<ChatState>({
  sessionId: null,
  messages: [],
  isStreaming: false,
  error: null,
});

export const totalTokens = derived(chatStore, ($chat) =>
  $chat.messages.reduce((sum, m) => sum + (m.tokensUsed || 0), 0)
);
