import { apiFetch } from './client';

export interface Memory {
  id: string;
  user_id: string;
  category: string;
  content: string;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export async function listMemories(category?: string, search?: string): Promise<{ memories: Memory[] }> {
  const params = new URLSearchParams();
  if (category) params.set('category', category);
  if (search) params.set('search', search);
  const query = params.toString();
  return apiFetch(`/api/memory${query ? `?${query}` : ''}`);
}

export async function createMemory(content: string, category: string, expiresInDays?: number): Promise<{ memory: Memory }> {
  return apiFetch('/api/memory', {
    method: 'POST',
    body: JSON.stringify({ content, category, expiresInDays }),
  });
}

export async function updateMemory(id: string, updates: { content?: string; category?: string }): Promise<{ memory: Memory }> {
  return apiFetch(`/api/memory/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

export async function deleteMemory(id: string): Promise<void> {
  await apiFetch(`/api/memory/${id}`, { method: 'DELETE' });
}
