import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('nova_access_token');
}

export function setAccessToken(token: string): void {
  localStorage.setItem('nova_access_token', token);
}

export function clearAccessToken(): void {
  localStorage.removeItem('nova_access_token');
}
