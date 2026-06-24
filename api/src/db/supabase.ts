import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn(
    'Supabase credentials not found. Set SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables.'
  );
}

export const supabase: SupabaseClient = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseServiceKey || 'placeholder-key'
);

export function createUserClient(accessToken: string): SupabaseClient {
  return createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    process.env.SUPABASE_ANON_KEY || 'placeholder-key',
    {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    }
  );
}
