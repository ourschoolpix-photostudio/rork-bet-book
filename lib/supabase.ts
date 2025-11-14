import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

let supabaseInstance: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey) {
  try {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
    console.log('✅ Supabase client initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Supabase client:', error);
  }
} else {
  console.warn('⚠️ Supabase credentials not configured. Cloud backup features will be disabled.');
  console.warn('Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your environment.');
}

export const supabase = supabaseInstance;

export function isSupabaseConfigured(): boolean {
  return supabaseInstance !== null;
}

export interface BackupRecord {
  id: string;
  user_id?: string;
  version: string;
  timestamp: string;
  data: Record<string, string | null>;
  created_at: string;
}
