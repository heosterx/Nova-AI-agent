import { apiFetch, apiStreamFetch } from './client';

export interface ChatSession {
  id: string;
  title: string;
  model: string;
  created_at: string;
  updated_at: string;
}

export function sendMessage(
  sessionId: string | null,
  content: string,
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (err: Error) => void
): AbortController {
  return apiStreamFetch(
    '/api/chat',
    { sessionId, content },
    onChunk,
    onDone,
    onError
  );
}

export async function getSessions(): Promise<{ sessions: ChatSession[] }> {
  return apiFetch('/api/chat/sessions');
}

export async function getSession(sessionId: string): Promise<{ session: ChatSession; messages: unknown[] }> {
  return apiFetch(`/api/chat/sessions/${sessionId}`);
}

export async function forkSession(sessionId: string): Promise<{ session: ChatSession }> {
  return apiFetch(`/api/chat/sessions/${sessionId}/fork`, { method: 'POST' });
}
