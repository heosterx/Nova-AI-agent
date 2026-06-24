import { apiFetch } from './client';
import { setAccessToken, clearAccessToken } from '$lib/supabase';

export interface AuthUser {
  id: string;
  email: string;
}

export async function signup(email: string, password: string): Promise<AuthUser> {
  const data = await apiFetch<{ user: AuthUser; access_token: string }>('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setAccessToken(data.access_token);
  return data.user;
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const data = await apiFetch<{ user: AuthUser; access_token: string }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setAccessToken(data.access_token);
  return data.user;
}

export async function logout(): Promise<void> {
  await apiFetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
  clearAccessToken();
}

export async function getMe(): Promise<AuthUser | null> {
  try {
    const data = await apiFetch<{ user: AuthUser }>('/api/auth/me');
    return data.user;
  } catch {
    return null;
  }
}
