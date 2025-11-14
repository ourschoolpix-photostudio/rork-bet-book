import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

import { useCallback, useMemo } from 'react';
import { Platform, Alert } from 'react-native';
import { useAuth } from './AuthContext';
import { useLoans } from './LoanContext';
import { useBorrows } from './BorrowContext';
import { useBets } from './BetsContext';
import { useSportsBets } from './SportsBetsContext';
import { useExpenses } from './ExpensesContext';
import { trpcClient } from '@/lib/trpc';
import { BackupRecord } from '@/lib/supabase';
import { useSettings } from './SettingsContext';

const STORAGE_KEYS = [
  '@casino_tracker_users',
  '@casino_tracker_current_user',
  '@casino_tracker_last_casino',
  '@casino_tracker_sessions',
  '@casino_tracker_loans',
  '@casino_tracker_borrows',
  '@casino_tracker_bets',
  '@casino_tracker_sports_bets',
  '@casino_tracker_expenses',
  '@casino_tracker_recurring_bills',
  '@casino_tracker_utilities',
];

export interface BackupData {
  version: string;
  timestamp: string;
  data: Record<string, string | null>;
}

export const [BackupProvider, useBackup] = createContextHook(() => {
  const { reloadAllData } = useAuth();
  const { reloadLoans } = useLoans();
  const { reloadBorrows } = useBorrows();
  const { reloadBets } = useBets();
  const { reloadSportsBets } = useSportsBets();
  const { reloadAllData: reloadExpenses } = useExpenses();
  const { supabaseClient, isSupabaseConfigured } = useSettings();

  const createBackupToCloud = useCallback(async (): Promise<boolean> => {
    try {
      if (!isSupabaseConfigured || !supabaseClient) {
        Alert.alert(
          'Configuration Required',
          'Supabase is not configured. Please set up your Supabase credentials to use cloud backups.\n\nRequired environment variables:\n- EXPO_PUBLIC_SUPABASE_URL\n- EXPO_PUBLIC_SUPABASE_ANON_KEY\n\nSee SUPABASE_SETUP.md for instructions.'
        );
        return false;
      }

      console.log('🔵 Starting Supabase cloud backup creation...');
      const backupData: BackupData = {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        data: {},
      };

      for (const key of STORAGE_KEYS) {
        try {
          const value = await AsyncStorage.getItem(key);
          backupData.data[key] = value;
          console.log(`✅ Backed up ${key}: ${value ? 'data found' : 'no data'}`);
        } catch (error) {
          console.error(`❌ Error backing up ${key}:`, error);
          backupData.data[key] = null;
        }
      }

      const backupId = `backup-${Date.now()}`;
      const record: BackupRecord = {
        id: backupId,
        version: backupData.version,
        timestamp: backupData.timestamp,
        data: backupData.data,
        created_at: new Date().toISOString(),
      };

      console.log('📤 Sending backup to Supabase...');
      const { data, error } = await supabaseClient
        .from('backups')
        .insert(record)
        .select()
        .single();
      
      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }

      console.log('✅ Supabase backup result:', data);
      
      Alert.alert(
        'Success', 
        `Backup created successfully to Supabase!\n\nBackup ID: ${backupId}\nTimestamp: ${new Date(backupData.timestamp).toLocaleString()}`
      );
      return true;
    } catch (error) {
      console.error('❌ Error creating cloud backup:', error);
      
      let errorMessage = 'Failed to create cloud backup.';
      
      if (error instanceof Error) {
        errorMessage += '\n\n' + error.message;
      }
      
      Alert.alert('Backup Error', errorMessage);
      return false;
    }
  }, [supabaseClient, isSupabaseConfigured]);

  const createBackupToDevice = useCallback(async (): Promise<boolean> => {
    try {
      console.log('🔵 Starting device backup creation...');
      const backupData: BackupData = {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        data: {},
      };

      for (const key of STORAGE_KEYS) {
        try {
          const value = await AsyncStorage.getItem(key);
          backupData.data[key] = value;
          console.log(`✅ Backed up ${key}: ${value ? 'data found' : 'no data'}`);
        } catch (error) {
          console.error(`❌ Error backing up ${key}:`, error);
          backupData.data[key] = null;
        }
      }

      const fileName = `casino-tracker-backup-${Date.now()}.json`;
      const fileContent = JSON.stringify(backupData, null, 2);

      if (Platform.OS === 'web') {
        const blob = new Blob([fileContent], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        Alert.alert(
          'Success',
          `Backup created successfully to device!\n\nFile: ${fileName}`
        );
      } else {
        const fileUri = FileSystem.documentDirectory + fileName;
        await FileSystem.writeAsStringAsync(fileUri, fileContent);
        
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(fileUri);
        } else {
          Alert.alert(
            'Success',
            `Backup created successfully!\n\nSaved to: ${fileUri}`
          );
        }
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error creating device backup:', error);
      Alert.alert('Backup Error', 'Failed to create device backup: ' + (error instanceof Error ? error.message : 'Unknown error'));
      return false;
    }
  }, []);

  const createBackup = useCallback(async (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (Platform.OS === 'web') {
        const choice = confirm('Choose backup location:\n\n1. Cloud (backend server)\n2. Device (download file)\n\nClick OK for Cloud, Cancel for Device');
        if (choice) {
          createBackupToCloud().then(resolve);
        } else {
          createBackupToDevice().then(resolve);
        }
      } else {
        Alert.alert(
          'Backup Location',
          'Where would you like to save the backup?',
          [
            {
              text: 'Cloud',
              onPress: async () => {
                const success = await createBackupToCloud();
                resolve(success);
              },
            },
            {
              text: 'Device',
              onPress: async () => {
                const success = await createBackupToDevice();
                resolve(success);
              },
            },
            {
              text: 'Cancel',
              style: 'cancel' as const,
              onPress: () => resolve(false),
            },
          ]
        );
      }
    });
  }, [createBackupToCloud, createBackupToDevice]);

  const mergeData = (currentValue: string | null, backupValue: string | null): string | null => {
    if (!currentValue || currentValue === '[]' || currentValue === '{}' || currentValue === 'null') {
      return backupValue;
    }
    if (!backupValue || backupValue === '[]' || backupValue === '{}' || backupValue === 'null') {
      return currentValue;
    }

    try {
      let current: any;
      let backup: any;
      
      try {
        current = JSON.parse(currentValue);
      } catch (e) {
        console.error('Failed to parse current value:', currentValue, e);
        return backupValue;
      }
      
      try {
        backup = JSON.parse(backupValue);
      } catch (e) {
        console.error('Failed to parse backup value:', backupValue, e);
        return currentValue;
      }

      if (Array.isArray(current) && Array.isArray(backup)) {
        const mergedMap = new Map<string, any>();
        
        current.forEach((item: any) => {
          if (item && typeof item === 'object' && item.id) {
            mergedMap.set(item.id, item);
          }
        });
        
        backup.forEach((item: any) => {
          if (item && typeof item === 'object' && item.id) {
            mergedMap.set(item.id, item);
          }
        });
        
        return JSON.stringify(Array.from(mergedMap.values()));
      }
      
      if (typeof current === 'object' && typeof backup === 'object' && !Array.isArray(current) && !Array.isArray(backup)) {
        return JSON.stringify({ ...current, ...backup });
      }
      
      return backupValue;
    } catch (error) {
      console.error('Error merging data:', error);
      return backupValue;
    }
  };



  const restoreFromCloud = useCallback(async (backupId?: string): Promise<boolean> => {
    try {
      if (!isSupabaseConfigured || !supabaseClient) {
        Alert.alert(
          'Configuration Required',
          'Supabase is not configured. Please set up your Supabase credentials to use cloud backups.\n\nRequired environment variables:\n- EXPO_PUBLIC_SUPABASE_URL\n- EXPO_PUBLIC_SUPABASE_ANON_KEY\n\nSee SUPABASE_SETUP.md for instructions.'
        );
        return false;
      }

      console.log('Starting Supabase backup restore...');
      
      let selectedBackupId = backupId;
      
      if (!selectedBackupId) {
        const { data: backups, error } = await supabaseClient
          .from('backups')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) {
          throw new Error(`Supabase error: ${error.message}`);
        }
        
        if (!backups || backups.length === 0) {
          Alert.alert('No Backups', 'No backups found in Supabase.');
          return false;
        }
        
        if (Platform.OS === 'web') {
          const message = backups
            .map((b, i) => `${i + 1}. ${new Date(b.timestamp).toLocaleString()} (ID: ${b.id})`)
            .join('\n');
          
          const choice = prompt(`Available backups:\n\n${message}\n\nEnter backup number (1-${backups.length}):`);
          if (!choice) return false;
          
          const index = parseInt(choice) - 1;
          if (index < 0 || index >= backups.length) {
            Alert.alert('Error', 'Invalid backup selection');
            return false;
          }
          
          selectedBackupId = backups[index].id;
        } else {
          return new Promise((resolve) => {
            const buttons = backups.map((backup) => ({
              text: new Date(backup.timestamp).toLocaleString(),
              onPress: async () => {
                const success = await restoreFromCloud(backup.id);
                resolve(success);
              },
            }));
            
            buttons.push({
              text: 'Cancel',
              style: 'cancel' as const,
              onPress: () => resolve(false),
            });
            
            Alert.alert('Select Cloud Backup', 'Choose a backup to restore:', buttons);
          });
        }
      }
      
      console.log('Fetching backup from Supabase:', selectedBackupId);
      const { data: backupRecord, error } = await supabaseClient
        .from('backups')
        .select('*')
        .eq('id', selectedBackupId)
        .single();
      
      if (error || !backupRecord) {
        throw new Error(`Failed to fetch backup: ${error?.message || 'Not found'}`);
      }
      
      console.log('Restoring backup from:', backupRecord.timestamp);

      for (const [key, value] of Object.entries(backupRecord.data)) {
        const currentValue = await AsyncStorage.getItem(key);
        const mergedValue = mergeData(currentValue, value);
        
        if (mergedValue !== null) {
          await AsyncStorage.setItem(key, mergedValue);
          console.log(`Merged ${key}`);
        } else if (currentValue === null && value === null) {
          console.log(`Skipped ${key} (both null)`);
        }
      }

      console.log('Reloading all contexts...');
      await Promise.all([
        reloadAllData(),
        reloadLoans(),
        reloadBorrows(),
        reloadBets(),
        reloadSportsBets(),
        reloadExpenses(),
      ]);
      console.log('All contexts reloaded successfully');
      
      Alert.alert(
        'Success',
        `Backup restored successfully from Supabase!\n\nFrom: ${new Date(backupRecord.timestamp).toLocaleString()}`
      );
      return true;
    } catch (error) {
      console.error('Error restoring backup:', error);
      Alert.alert('Error', 'Failed to restore backup: ' + (error instanceof Error ? error.message : 'Unknown error'));
      return false;
    }
  }, [supabaseClient, isSupabaseConfigured, reloadAllData, reloadLoans, reloadBorrows, reloadBets, reloadSportsBets, reloadExpenses]);

  const restoreFromDevice = useCallback(async (): Promise<boolean> => {
    try {
      console.log('Starting device backup restore...');
      
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });
      
      if (result.canceled) {
        return false;
      }
      
      const fileUri = result.assets[0].uri;
      let content: string;
      
      if (Platform.OS === 'web') {
        const response = await fetch(fileUri);
        content = await response.text();
      } else {
        content = await FileSystem.readAsStringAsync(fileUri);
      }
      
      const backupData = JSON.parse(content) as BackupData;
      
      console.log('Restoring backup from device:', backupData.timestamp);
      
      for (const [key, value] of Object.entries(backupData.data)) {
        const currentValue = await AsyncStorage.getItem(key);
        const mergedValue = mergeData(currentValue, value);
        
        if (mergedValue !== null) {
          await AsyncStorage.setItem(key, mergedValue);
          console.log(`Merged ${key}`);
        } else if (currentValue === null && value === null) {
          console.log(`Skipped ${key} (both null)`);
        }
      }
      
      console.log('Reloading all contexts...');
      await Promise.all([
        reloadAllData(),
        reloadLoans(),
        reloadBorrows(),
        reloadBets(),
        reloadSportsBets(),
        reloadExpenses(),
      ]);
      console.log('All contexts reloaded successfully');
      
      Alert.alert(
        'Success',
        `Backup restored successfully from device!\n\nFrom: ${new Date(backupData.timestamp).toLocaleString()}`
      );
      return true;
    } catch (error) {
      console.error('Error restoring backup from device:', error);
      Alert.alert('Error', 'Failed to restore backup from device: ' + (error instanceof Error ? error.message : 'Unknown error'));
      return false;
    }
  }, [reloadAllData, reloadLoans, reloadBorrows, reloadBets, reloadSportsBets, reloadExpenses]);

  return useMemo(() => ({
    createBackup,
    createBackupToCloud,
    createBackupToDevice,
    restoreFromCloud,
    restoreFromDevice,
  }), [createBackup, createBackupToCloud, createBackupToDevice, restoreFromCloud, restoreFromDevice]);
});
