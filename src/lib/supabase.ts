import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | null = null;
let _serviceClient: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  const url = import.meta.env.PUBLIC_SUPABASE_URL ?? '';
  const key = import.meta.env.PUBLIC_SUPABASE_ANON_KEY ?? '';
  return url.startsWith('https://') && key.length > 20;
}

export function getSupabaseClient(): SupabaseClient {
  if (_client) return _client;

  const url = import.meta.env.PUBLIC_SUPABASE_URL;
  const key = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error('Supabase credentials not configured. Set PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY.');
  }

  _client = createClient(url, key);
  return _client;
}

export function getSupabaseServiceClient(): SupabaseClient {
  if (_serviceClient) return _serviceClient;

  const url = import.meta.env.PUBLIC_SUPABASE_URL;
  const key = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Supabase service credentials not configured. Set SUPABASE_SERVICE_ROLE_KEY.');
  }

  _serviceClient = createClient(url, key);
  return _serviceClient;
}
