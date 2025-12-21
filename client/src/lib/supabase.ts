import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;
let supabasePromise: Promise<SupabaseClient> | null = null;

async function initSupabase(): Promise<SupabaseClient> {
  const response = await fetch('/api/supabase-config');
  if (!response.ok) {
    throw new Error('Failed to fetch Supabase configuration');
  }
  const { url, anonKey } = await response.json();
  return createClient(url, anonKey);
}

export async function getSupabase(): Promise<SupabaseClient> {
  if (supabaseInstance) {
    return supabaseInstance;
  }
  
  if (!supabasePromise) {
    supabasePromise = initSupabase().then((client) => {
      supabaseInstance = client;
      return client;
    });
  }
  
  return supabasePromise;
}

export function getSupabaseSync(): SupabaseClient | null {
  return supabaseInstance;
}
