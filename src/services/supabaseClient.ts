import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const SUPABASE_URL =
  (import.meta.env.VITE_SUPABASE_URL as string) ||
  'https://anqzmsmknttmfqkgzihz.supabase.co';

export const getSupabaseAnonKey = (): string => {
  if (typeof window !== 'undefined') {
    return (
      (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ||
      localStorage.getItem('workshop_supabase_anon_key') ||
      ''
    );
  }
  return (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';
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
  getSupabaseAnonKey() || 'placeholder-anon-key'
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
