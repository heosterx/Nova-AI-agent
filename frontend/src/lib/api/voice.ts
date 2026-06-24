import { apiFetch } from './client';
import { getAccessToken } from '$lib/supabase';

const PUBLIC_BACKEND_URL = import.meta.env.PUBLIC_BACKEND_URL || 'http://localhost:3000';

export interface VoiceSession {
  id: string;
  transcript: Array<{ role: string; content: string; timestamp: string }>;
  duration_seconds: number;
  created_at: string;
}

export async function getVoiceToken(): Promise<{ token: string }> {
  return apiFetch('/api/voice/token', { method: 'POST' });
}

export async function getVoices(): Promise<{ voices: Array<{ id: string; name: string; description: string }> }> {
  return apiFetch('/api/voice/voices');
}

export async function synthesize(text: string, voiceId?: string): Promise<Blob> {
  const token = getAccessToken();

  const response = await fetch(`${PUBLIC_BACKEND_URL as string}/api/voice/synthesize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ text, voiceId }),
  });

  if (!response.ok) throw new Error('Voice synthesis failed');
  return response.blob();
}

export async function getVoiceHistory(): Promise<{ history: VoiceSession[] }> {
  return apiFetch('/api/voice/history');
}

export async function saveVoiceSession(
  transcript: VoiceSession['transcript'],
  durationSeconds: number
): Promise<{ session: VoiceSession }> {
  return apiFetch('/api/voice/history', {
    method: 'POST',
    body: JSON.stringify({ transcript, duration_seconds: durationSeconds }),
  });
}
