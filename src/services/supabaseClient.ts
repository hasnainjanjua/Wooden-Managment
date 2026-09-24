import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const SUPABASE_URL =
  (import.meta.env.VITE_SUPABASE_URL as string) ||
  'https://anqzmsmknttmfqkgzihz.supabase.co';

export const DEFAULT_SUPABASE_ANON_KEY =
  'sb_publishable_M8QZ3ys7CzZUFTeDIPXYTA_hCNQk2Xg';

export const getSupabaseAnonKey = (): string => {
  if (typeof window !== 'undefined') {
    return (
      (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ||
      localStorage.getItem('workshop_supabase_anon_key') ||
      DEFAULT_SUPABASE_ANON_KEY
    );
  }
  return (
    (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ||
    DEFAULT_SUPABASE_ANON_KEY
  );
};

export const setSupabaseAnonKey = (key: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('workshop_supabase_anon_key', key.trim());
    // Reload client instance
    _supabaseInstance = createClient(SUPABASE_URL, key.trim());
  }
};

let _supabaseInstance: SupabaseClient = createClient(
  SUPABASE_URL,
  getSupabaseAnonKey()
);

export const getSupabase = (): SupabaseClient => {
  const currentKey = getSupabaseAnonKey();
  if (currentKey && currentKey.length > 20) {
    return _supabaseInstance;
  }
  return _supabaseInstance;
};

export const isSupabaseConfigured = (): boolean => {
  const key = getSupabaseAnonKey();
  return Boolean(SUPABASE_URL && key && key.length > 20 && key !== 'placeholder-anon-key');
};
