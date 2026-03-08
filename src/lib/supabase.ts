import { createClient, type SupabaseClient } from '@supabase/supabase-js';

function getEnv() {
  const url = import.meta.env.PUBLIC_SUPABASE_URL as string;
  const anonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY as string;

  if (!url || !anonKey) {
    throw new Error(
      'Missing Supabase environment variables. Set PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY in .env'
    );
  }

  return { url, anonKey };
}

let _client: SupabaseClient | null = null;

/** Browser / client-side Supabase client (anon key). Lazily initialized. */
export function getSupabase(): SupabaseClient {
  if (!_client) {
    const { url, anonKey } = getEnv();
    _client = createClient(url, anonKey, {
      auth: { persistSession: false },
    });
  }
  return _client;
}

/**
 * Server-side Supabase client (creates a new instance per request).
 * Optionally accepts a JWT from Clerk to enforce Row Level Security
 * scoped to the authenticated user.
 */
export function createServerSupabaseClient(accessToken?: string): SupabaseClient {
  const { url, anonKey } = getEnv();

  return createClient(url, anonKey, {
    global: {
      headers: accessToken
        ? { Authorization: `Bearer ${accessToken}` }
        : {},
    },
    auth: { persistSession: false },
  });
}
