import createContextHook from '@nkzw/create-context-hook';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL_KEY = 'casino_tracker_supabase_url';
const SUPABASE_KEY_KEY = 'casino_tracker_supabase_key';

export interface SupabaseConfig {
  url: string;
  key: string;
}

export const [SettingsProvider, useSettings] = createContextHook(() => {
  const [supabaseUrl, setSupabaseUrl] = useState<string>('');
  const [supabaseKey, setSupabaseKey] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [supabaseClient, setSupabaseClient] = useState<SupabaseClient | null>(null);

  const loadSettings = useCallback(async () => {
    try {
      let url: string | null = null;
      let key: string | null = null;

      if (Platform.OS === 'web') {
        url = localStorage.getItem(SUPABASE_URL_KEY);
        key = localStorage.getItem(SUPABASE_KEY_KEY);
      } else {
        [url, key] = await Promise.all([
          SecureStore.getItemAsync(SUPABASE_URL_KEY),
          SecureStore.getItemAsync(SUPABASE_KEY_KEY),
        ]);
      }

      if (url) setSupabaseUrl(url);
      if (key) setSupabaseKey(key);
      
      console.log('✅ Loaded Supabase credentials from secure storage');
    } catch (error) {
      console.error('❌ Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

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

      if (Platform.OS === 'web') {
        localStorage.setItem(SUPABASE_URL_KEY, config.url);
        localStorage.setItem(SUPABASE_KEY_KEY, config.key);
      } else {
        await Promise.all([
          SecureStore.setItemAsync(SUPABASE_URL_KEY, config.url),
          SecureStore.setItemAsync(SUPABASE_KEY_KEY, config.key),
        ]);
      }

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
      if (Platform.OS === 'web') {
        localStorage.removeItem(SUPABASE_URL_KEY);
        localStorage.removeItem(SUPABASE_KEY_KEY);
      } else {
        await Promise.all([
          SecureStore.deleteItemAsync(SUPABASE_URL_KEY),
          SecureStore.deleteItemAsync(SUPABASE_KEY_KEY),
        ]);
      }

      setSupabaseUrl('');
      setSupabaseKey('');
      setSupabaseClient(null);
      
      console.log('✅ Supabase credentials cleared from secure storage');
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
