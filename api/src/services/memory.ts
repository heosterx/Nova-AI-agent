import { supabase } from '../db/supabase';
import { generateEmbedding } from './embedding';

export interface MemoryEntry {
  id: string;
  user_id: string;
  category: string;
  content: string;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export async function storeMemory(
  userId: string,
  content: string,
  category: string,
  expiresInDays = 90
): Promise<MemoryEntry> {
  const embedding = await generateEmbedding(content);
  const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

  const { data, error } = await supabase
    .from('memory')
    .insert({
      user_id: userId,
      content,
      category,
      embedding,
      expires_at: expiresAt.toISOString(),
    })
    .select('id, user_id, category, content, expires_at, created_at, updated_at')
    .single();

  if (error) throw error;
  return data as MemoryEntry;
}

export async function searchMemory(
  userId: string,
  query: string,
  limit = 10
): Promise<Array<{ id: string; content: string; category: string; similarity: number }>> {
  const queryEmbedding = await generateEmbedding(query);

  const { data, error } = await supabase.rpc('match_memory', {
    query_embedding: queryEmbedding,
    match_threshold: 0.7,
    match_count: limit,
    user_id_param: userId,
  });

  if (error) throw error;
  return data || [];
}

export async function listMemories(
  userId: string,
  category?: string
): Promise<MemoryEntry[]> {
  let query = supabase
    .from('memory')
    .select('id, user_id, category, content, expires_at, created_at, updated_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (category) {
    query = query.eq('category', category);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as MemoryEntry[];
}

export async function updateMemory(
  id: string,
  userId: string,
  updates: { content?: string; category?: string }
): Promise<MemoryEntry> {
  const updateData: Record<string, unknown> = {};
  if (updates.content !== undefined) {
    updateData.content = updates.content;
    updateData.embedding = await generateEmbedding(updates.content);
  }
  if (updates.category !== undefined) {
    updateData.category = updates.category;
  }

  const { data, error } = await supabase
    .from('memory')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', userId)
    .select('id, user_id, category, content, expires_at, created_at, updated_at')
    .single();

  if (error) throw error;
  return data as MemoryEntry;
}

export async function deleteMemory(id: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('memory')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw error;
}
