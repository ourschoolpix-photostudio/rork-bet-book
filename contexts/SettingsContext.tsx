import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL_KEY = '@casino_tracker_supabase_url';
const SUPABASE_KEY_KEY = '@casino_tracker_supabase_key';

export interface SupabaseConfig {
  url: string;
  key: string;
}

export const [SettingsProvider, useSettings] = createContextHook(() => {
  const [supabaseUrl, setSupabaseUrl] = useState<string>('');
  const [supabaseKey, setSupabaseKey] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [supabaseClient, setSupabaseClient] = useState<SupabaseClient | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (supabaseUrl && supabaseKey) {
      try {
        const client = createClient(supabaseUrl, supabaseKey);
        setSupabaseClient(client);
        console.log('✅ Supabase client created with user credentials');
      } catch (error) {
        console.error('❌ Failed to create Supabase client:', error);
        setSupabaseClient(null);
      }
    } else {
      setSupabaseClient(null);
    }
  }, [supabaseUrl, supabaseKey]);

  const loadSettings = async () => {
    try {
      const [url, key] = await Promise.all([
        AsyncStorage.getItem(SUPABASE_URL_KEY),
        AsyncStorage.getItem(SUPABASE_KEY_KEY),
      ]);

      if (url) setSupabaseUrl(url);
      if (key) setSupabaseKey(key);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSupabaseConfig = useCallback(async (config: SupabaseConfig): Promise<boolean> => {
    try {
      if (!config.url || !config.key) {
        throw new Error('URL and Key are required');
      }

      const testClient = createClient(config.url, config.key);
      
      const { error } = await testClient.from('backups').select('count').limit(0);
      if (error && error.code !== 'PGRST116') {
        throw new Error(`Connection test failed: ${error.message}`);
      }

      await Promise.all([
        AsyncStorage.setItem(SUPABASE_URL_KEY, config.url),
        AsyncStorage.setItem(SUPABASE_KEY_KEY, config.key),
      ]);

      setSupabaseUrl(config.url);
      setSupabaseKey(config.key);
      
      console.log('✅ Supabase credentials saved successfully');
      return true;
    } catch (error) {
      console.error('❌ Error saving Supabase config:', error);
      throw error;
    }
  }, []);

  const clearSupabaseConfig = useCallback(async (): Promise<void> => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(SUPABASE_URL_KEY),
        AsyncStorage.removeItem(SUPABASE_KEY_KEY),
      ]);

      setSupabaseUrl('');
      setSupabaseKey('');
      setSupabaseClient(null);
      
      console.log('✅ Supabase credentials cleared');
    } catch (error) {
      console.error('❌ Error clearing Supabase config:', error);
      throw error;
    }
  }, []);

  const isSupabaseConfigured = useMemo(() => {
    return supabaseClient !== null && !!supabaseUrl && !!supabaseKey;
  }, [supabaseClient, supabaseUrl, supabaseKey]);

  return useMemo(() => ({
    supabaseUrl,
    supabaseKey,
    supabaseClient,
    isSupabaseConfigured,
    isLoading,
    saveSupabaseConfig,
    clearSupabaseConfig,
  }), [supabaseUrl, supabaseKey, supabaseClient, isSupabaseConfigured, isLoading, saveSupabaseConfig, clearSupabaseConfig]);
});
