import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useCallback, useMemo } from 'react';
import { Platform, Alert } from 'react-native';
import { useAuth } from './AuthContext';
import { useLoans } from './LoanContext';
import { useBorrows } from './BorrowContext';
import { useBets } from './BetsContext';
import { useSportsBets } from './SportsBetsContext';
import { useExpenses } from './ExpensesContext';
import { trpcClient } from '@/lib/trpc';

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

  const createBackup = useCallback(async (): Promise<boolean> => {
    try {
      console.log('Starting backup creation...');
      const backupData: BackupData = {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        data: {},
      };

      for (const key of STORAGE_KEYS) {
        try {
          const value = await AsyncStorage.getItem(key);
          backupData.data[key] = value;
          console.log(`Backed up ${key}: ${value ? 'data found' : 'no data'}`);
        } catch (error) {
          console.error(`Error backing up ${key}:`, error);
          backupData.data[key] = null;
        }
      }

      console.log('Sending backup to server...');
      const result = await trpcClient.backup.create.mutate(backupData);
      console.log('Server backup result:', result);
      
      Alert.alert(
        'Success', 
        `Backup created successfully!\n\nBackup ID: ${result.backupId}\nTimestamp: ${new Date(backupData.timestamp).toLocaleString()}`
      );
      return true;
    } catch (error) {
      console.error('Error creating backup:', error);
      Alert.alert('Error', 'Failed to create backup: ' + (error instanceof Error ? error.message : 'Unknown error'));
      return false;
    }
  }, [reloadAllData, reloadLoans, reloadBorrows, reloadBets, reloadSportsBets, reloadExpenses]);

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



  const restoreBackup = useCallback(async (backupId?: string): Promise<boolean> => {
    try {
      console.log('Starting backup restore...');
      
      let selectedBackupId = backupId;
      
      if (!selectedBackupId) {
        const backupsResult = await trpcClient.backup.list.query();
        
        if (backupsResult.backups.length === 0) {
          Alert.alert('No Backups', 'No backups found on the server.');
          return false;
        }
        
        if (Platform.OS === 'web') {
          const message = backupsResult.backups
            .map((b, i) => `${i + 1}. ${new Date(b.timestamp).toLocaleString()} (ID: ${b.id})`)
            .join('\n');
          
          const choice = prompt(`Available backups:\n\n${message}\n\nEnter backup number (1-${backupsResult.backups.length}):`);
          if (!choice) return false;
          
          const index = parseInt(choice) - 1;
          if (index < 0 || index >= backupsResult.backups.length) {
            Alert.alert('Error', 'Invalid backup selection');
            return false;
          }
          
          selectedBackupId = backupsResult.backups[index].id;
        } else {
          return new Promise((resolve) => {
            const buttons = backupsResult.backups.map((backup) => ({
              text: new Date(backup.timestamp).toLocaleString(),
              onPress: async () => {
                const success = await restoreBackup(backup.id);
                resolve(success);
              },
            }));
            
            buttons.push({
              text: 'Cancel',
              style: 'cancel' as const,
              onPress: () => resolve(false),
            });
            
            Alert.alert('Select Backup', 'Choose a backup to restore:', buttons);
          });
        }
      }
      
      console.log('Fetching backup from server:', selectedBackupId);
      const serverResult = await trpcClient.backup.restore.mutate({ backupId: selectedBackupId });
      
      if (!serverResult.success || !serverResult.data) {
        Alert.alert('Error', 'Failed to fetch backup from server');
        return false;
      }
      
      const backupData = serverResult.data as BackupData & { id: string; createdAt: string };
      
      console.log('Restoring backup from:', backupData.timestamp);

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
        `Backup restored successfully!\n\nFrom: ${new Date(backupData.timestamp).toLocaleString()}`
      );
      return true;
    } catch (error) {
      console.error('Error restoring backup:', error);
      Alert.alert('Error', 'Failed to restore backup: ' + (error instanceof Error ? error.message : 'Unknown error'));
      return false;
    }
  }, [reloadAllData, reloadLoans, reloadBorrows, reloadBets, reloadSportsBets, reloadExpenses]);

  return useMemo(() => ({
    createBackup,
    restoreBackup,
  }), [createBackup, restoreBackup]);
});
