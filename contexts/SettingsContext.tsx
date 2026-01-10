import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL_KEY = '@casino_tracker_supabase_url';
const SUPABASE_KEY_KEY = '@casino_tracker_supabase_key';
const STORAGE_MODE_KEY = '@casino_tracker_storage_mode';
const LOCAL_SYNC_TIMESTAMP_KEY = '@casino_tracker_local_sync_timestamp';
const CLOUD_SYNC_TIMESTAMP_KEY = '@casino_tracker_cloud_sync_timestamp';

export type StorageMode = 'local' | 'supabase';

export interface SyncInfo {
  localTimestamp: string | null;
  cloudTimestamp: string | null;
}

export interface SupabaseConfig {
  url: string;
  key: string;
}

export const [SettingsProvider, useSettings] = createContextHook(() => {
  const [supabaseUrl, setSupabaseUrl] = useState<string>('');
  const [supabaseKey, setSupabaseKey] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [supabaseClient, setSupabaseClient] = useState<SupabaseClient | null>(null);
  const [storageMode, setStorageMode] = useState<StorageMode>('local');
  const [localSyncTimestamp, setLocalSyncTimestamp] = useState<string | null>(null);
  const [cloudSyncTimestamp, setCloudSyncTimestamp] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    try {
      const [url, key, mode, localTs, cloudTs] = await Promise.all([
        AsyncStorage.getItem(SUPABASE_URL_KEY),
        AsyncStorage.getItem(SUPABASE_KEY_KEY),
        AsyncStorage.getItem(STORAGE_MODE_KEY),
        AsyncStorage.getItem(LOCAL_SYNC_TIMESTAMP_KEY),
        AsyncStorage.getItem(CLOUD_SYNC_TIMESTAMP_KEY),
      ]);

      if (url) setSupabaseUrl(url);
      if (key) setSupabaseKey(key);
      if (mode === 'local' || mode === 'supabase') {
        setStorageMode(mode);
      }
      setLocalSyncTimestamp(localTs);
      setCloudSyncTimestamp(cloudTs);
      
      console.log('✅ Loaded settings from AsyncStorage');
      console.log('📦 Storage mode:', mode || 'local');
      console.log('🕐 Local sync:', localTs);
      console.log('☁️ Cloud sync:', cloudTs);
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

      await Promise.all([
        AsyncStorage.setItem(SUPABASE_URL_KEY, config.url),
        AsyncStorage.setItem(SUPABASE_KEY_KEY, config.key),
      ]);

      setSupabaseUrl(config.url);
      setSupabaseKey(config.key);
      
      console.log('✅ Supabase credentials saved to AsyncStorage successfully');
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
      
      if (storageMode === 'supabase') {
        setStorageMode('local');
        await AsyncStorage.setItem(STORAGE_MODE_KEY, 'local');
      }
      
      console.log('✅ Supabase credentials cleared from AsyncStorage');
    } catch (error) {
      console.error('❌ Error clearing Supabase config:', error);
      throw error;
    }
  }, [storageMode]);

  const setStorageModeValue = useCallback(async (mode: StorageMode): Promise<void> => {
    try {
      await AsyncStorage.setItem(STORAGE_MODE_KEY, mode);
      setStorageMode(mode);
      console.log('📦 Storage mode set to:', mode);
    } catch (error) {
      console.error('❌ Error setting storage mode:', error);
      throw error;
    }
  }, []);

  const updateLocalSyncTimestamp = useCallback(async (): Promise<string> => {
    const timestamp = new Date().toISOString();
    try {
      await AsyncStorage.setItem(LOCAL_SYNC_TIMESTAMP_KEY, timestamp);
      setLocalSyncTimestamp(timestamp);
      console.log('🕐 Local sync timestamp updated:', timestamp);
      return timestamp;
    } catch (error) {
      console.error('❌ Error updating local sync timestamp:', error);
      throw error;
    }
  }, []);

  const updateCloudSyncTimestamp = useCallback(async (): Promise<string> => {
    const timestamp = new Date().toISOString();
    try {
      await AsyncStorage.setItem(CLOUD_SYNC_TIMESTAMP_KEY, timestamp);
      setCloudSyncTimestamp(timestamp);
      console.log('☁️ Cloud sync timestamp updated:', timestamp);
      return timestamp;
    } catch (error) {
      console.error('❌ Error updating cloud sync timestamp:', error);
      throw error;
    }
  }, []);

  const getSyncInfo = useCallback((): SyncInfo => {
    return {
      localTimestamp: localSyncTimestamp,
      cloudTimestamp: cloudSyncTimestamp,
    };
  }, [localSyncTimestamp, cloudSyncTimestamp]);

  const reloadSettings = useCallback(async () => {
    await loadSettings();
  }, [loadSettings]);

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
    reloadSettings,
    storageMode,
    setStorageMode: setStorageModeValue,
    localSyncTimestamp,
    cloudSyncTimestamp,
    updateLocalSyncTimestamp,
    updateCloudSyncTimestamp,
    getSyncInfo,
  }), [supabaseUrl, supabaseKey, supabaseClient, isSupabaseConfigured, isLoading, saveSupabaseConfig, clearSupabaseConfig, reloadSettings, storageMode, setStorageModeValue, localSyncTimestamp, cloudSyncTimestamp, updateLocalSyncTimestamp, updateCloudSyncTimestamp, getSyncInfo]);
});
