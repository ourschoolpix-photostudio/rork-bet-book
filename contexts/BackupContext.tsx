import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { File, Directory, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { useCallback, useMemo } from 'react';
import { Platform, Alert } from 'react-native';

const STORAGE_KEYS = [
  '@casino_tracker_users',
  '@casino_tracker_current_user',
  '@casino_tracker_last_casino',
  '@casino_tracker_sessions',
  '@casino_tracker_loans',
  '@casino_tracker_borrows',
  '@casino_tracker_bets',
  '@casino_tracker_sports_bets',
];

export interface BackupData {
  version: string;
  timestamp: string;
  data: Record<string, string | null>;
}

export const [BackupProvider, useBackup] = createContextHook(() => {
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

      const backupJson = JSON.stringify(backupData, null, 2);
      const fileName = `casino_tracker_backup_${new Date().toISOString().split('T')[0]}_${Date.now()}.json`;

      if (Platform.OS === 'web') {
        const blob = new Blob([backupJson], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        console.log('Backup downloaded on web');
        return true;
      } else {
        const backupDir = new Directory(Paths.cache, 'backups');
        if (!backupDir.exists) {
          backupDir.create({ intermediates: true });
        }
        const file = new File(backupDir, fileName);
        file.create();
        file.write(backupJson);
        console.log('Backup file created:', file.uri);
        
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(file.uri, {
            mimeType: 'application/json',
            dialogTitle: 'Save Backup File',
            UTI: 'public.json',
          });
          console.log('Backup shared successfully');
          return true;
        } else {
          Alert.alert('Error', 'Sharing is not available on this device');
          return false;
        }
      }
    } catch (error) {
      console.error('Error creating backup:', error);
      Alert.alert('Error', 'Failed to create backup: ' + (error instanceof Error ? error.message : 'Unknown error'));
      return false;
    }
  }, []);

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

  const restoreBackup = useCallback(async (): Promise<boolean> => {
    try {
      console.log('Starting backup restore...');
      
      let backupJson: string;

      if (Platform.OS === 'web') {
        return new Promise((resolve) => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'application/json,.json';
          
          input.onchange = async (e: Event) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) {
              Alert.alert('Error', 'No file selected');
              resolve(false);
              return;
            }

            try {
              const text = await file.text();
              const backupData = JSON.parse(text) as BackupData;
              
              if (!backupData.version || !backupData.data) {
                Alert.alert('Error', 'Invalid backup file format');
                resolve(false);
                return;
              }

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

              Alert.alert(
                'Success',
                'Backup merged successfully. Please reload the app to see changes.',
                [
                  {
                    text: 'Reload',
                    onPress: () => {
                      if (Platform.OS === 'web') {
                        window.location.reload();
                      }
                    },
                  },
                ]
              );
              resolve(true);
            } catch (error) {
              console.error('Error processing backup file:', error);
              Alert.alert('Error', 'Failed to restore backup: ' + (error instanceof Error ? error.message : 'Unknown error'));
              resolve(false);
            }
          };

          document.body.appendChild(input);
          input.click();
          document.body.removeChild(input);
        });
      } else {
        const result = await DocumentPicker.getDocumentAsync({
          type: 'application/json',
          copyToCacheDirectory: true,
        });

        if (result.canceled) {
          console.log('Restore canceled by user');
          return false;
        }

        const fileUri = result.assets[0].uri;
        const file = new File(fileUri);
        backupJson = await file.text();
        
        const backupData = JSON.parse(backupJson) as BackupData;
        
        if (!backupData.version || !backupData.data) {
          Alert.alert('Error', 'Invalid backup file format');
          return false;
        }

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

        Alert.alert(
          'Success',
          'Backup merged successfully. Please reload the app to see changes.',
          [
            {
              text: 'OK',
              onPress: () => {
                console.log('Backup restore complete, app reload required');
              },
            },
          ]
        );
        return true;
      }
    } catch (error) {
      console.error('Error restoring backup:', error);
      Alert.alert('Error', 'Failed to restore backup: ' + (error instanceof Error ? error.message : 'Unknown error'));
      return false;
    }
  }, []);

  return useMemo(() => ({
    createBackup,
    restoreBackup,
  }), [createBackup, restoreBackup]);
});
