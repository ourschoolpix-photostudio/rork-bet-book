import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { Platform } from 'react-native';

const STORAGE_KEYS: { [key: string]: string } = {
  USERS: '@casino_tracker_users',
  CURRENT_USER: '@casino_tracker_current_user',
  LAST_CASINO: '@casino_tracker_last_casino',
  SESSIONS: '@casino_tracker_sessions',
  LOANS: '@casino_tracker_loans',
  BORROWS: '@casino_tracker_borrows',
  BETS: '@casino_tracker_bets',
  SPORTS_BETS: '@casino_tracker_sports_bets',
};

export interface BackupData {
  version: string;
  timestamp: string;
  data: {
    [key: string]: string | null;
  };
}

export const createBackup = async (): Promise<boolean> => {
  try {
    const backupData: BackupData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      data: {},
    };

    for (const key of Object.values(STORAGE_KEYS)) {
      const value = await AsyncStorage.getItem(key);
      backupData.data[key] = value;
    }

    const jsonString = JSON.stringify(backupData, null, 2);
    const fileName = `casino_tracker_backup_${new Date().toISOString().split('T')[0]}.json`;

    if (Platform.OS === 'web') {
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return true;
    } else {
      const FileSystem = await import('expo-file-system');
      
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        throw new Error('Sharing is not available on this device');
      }

      const storageDir = FileSystem.Paths?.cache || FileSystem.Paths?.document;
      
      if (!storageDir) {
        throw new Error('FileSystem not available. Please check app setup.');
      }
      
      const fileUri = `${storageDir}/${fileName}`;
      console.log('Creating backup file at:', fileUri);
      
      await FileSystem.writeAsStringAsync(fileUri, jsonString);
      
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      console.log('File info:', fileInfo);
      
      if (!fileInfo.exists) {
        throw new Error('Failed to create backup file');
      }
      
      console.log('Sharing file:', fileUri);
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/json',
        dialogTitle: 'Save Backup File',
        UTI: 'public.json',
      });
      
      try {
        await FileSystem.deleteAsync(fileUri, { idempotent: true });
      } catch (cleanupError) {
        console.warn('Failed to cleanup backup file:', cleanupError);
      }
      
      return true;
    }
  } catch (error) {
    console.error('Error creating backup:', error);
    throw error;
  }
};

export const restoreBackup = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    if (Platform.OS === 'web') {
      return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';
        
        input.onchange = async (e: Event) => {
          const target = e.target as HTMLInputElement;
          const file = target.files?.[0];
          
          if (!file) {
            resolve({ success: false, error: 'No file selected' });
            return;
          }

          try {
            const reader = new FileReader();
            reader.onload = async (event) => {
              try {
                const content = event.target?.result as string;
                const result = await processBackupData(content);
                resolve(result);
              } catch (error) {
                console.error('Error reading file:', error);
                resolve({ success: false, error: 'Failed to read file' });
              }
            };
            reader.onerror = () => {
              resolve({ success: false, error: 'Failed to read file' });
            };
            reader.readAsText(file);
          } catch (error) {
            console.error('Error processing file:', error);
            resolve({ success: false, error: 'Failed to process file' });
          }
        };

        input.click();
      });
    } else {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: false,
      });

      if (result.canceled) {
        return { success: false, error: 'File selection cancelled' };
      }

      const fileUri = result.assets[0].uri;
      const response = await fetch(fileUri);
      const fileContent = await response.text();

      return await processBackupData(fileContent);
    }
  } catch (error) {
    console.error('Error restoring backup:', error);
    return { success: false, error: 'Failed to restore backup' };
  }
};

const processBackupData = async (fileContent: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const backupData: BackupData = JSON.parse(fileContent);

    if (!backupData.version || !backupData.data) {
      return { success: false, error: 'Invalid backup file format' };
    }

    for (const [key, value] of Object.entries(backupData.data)) {
      if (value !== null) {
        await AsyncStorage.setItem(key, value);
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error processing backup data:', error);
    return { success: false, error: 'Failed to process backup data' };
  }
};
