import { apiFetch } from './client';

export interface UserSettings {
  system_prompt: string;
  default_model: string;
  voice_model: string;
  voice_id: string;
  active_providers: string[];
  fallback_chain: string[];
  theme: 'dark' | 'light';
}

export async function getSettings(): Promise<{ settings: UserSettings }> {
  return apiFetch('/api/settings');
}

export async function updateSettings(updates: Partial<UserSettings>): Promise<{ settings: UserSettings }> {
  return apiFetch('/api/settings', {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}
