import { getAccessToken } from '$lib/supabase';
import { apiFetch } from './client';

const PUBLIC_BACKEND_URL = import.meta.env.PUBLIC_BACKEND_URL || 'http://localhost:3000';

export interface UploadedFile {
  id: string;
  filename: string;
  file_type: string;
  file_size: number;
  chunks_count: number;
  processed: boolean;
  created_at: string;
}

export async function listFiles(): Promise<{ files: UploadedFile[] }> {
  return apiFetch('/api/files');
}

export async function uploadFile(file: File): Promise<{ file: UploadedFile }> {
  const token = getAccessToken();
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${PUBLIC_BACKEND_URL as string}/api/files/upload`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(body.error || response.statusText);
  }

  return response.json();
}

export async function processFile(id: string): Promise<{ message: string; chunks_count: number }> {
  return apiFetch(`/api/files/${id}/process`, { method: 'POST' });
}

export async function deleteFile(id: string): Promise<void> {
  await apiFetch(`/api/files/${id}`, { method: 'DELETE' });
}
