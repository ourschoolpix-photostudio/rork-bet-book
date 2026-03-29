import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, Switch, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Settings, Cloud, Download, Upload, ChevronRight, Smartphone } from 'lucide-react-native';
import { useBackup } from '@/contexts/BackupContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useState } from 'react';

export default function SettingsScreen() {
  const router = useRouter();
  const { createBackupToCloud, createBackupToDevice, restoreFromCloud, restoreFromDevice, switchStorageMode } = useBackup();
  const { storageMode, isSupabaseConfigured, localSyncTimestamp, cloudSyncTimestamp } = useSettings();
  const [isSwitching, setIsSwitching] = useState(false);

  const handleBackupToCloud = async () => {
    await createBackupToCloud();
  };

  const handleBackupToDevice = async () => {
    await createBackupToDevice();
  };

  const handleRestoreFromCloud = async () => {
    Alert.alert(
      'Confirm Restore',
      'This will merge cloud backup data with your current data. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          style: 'destructive',
          onPress: async () => {
            await restoreFromCloud();
          },
        },
      ]
    );
  };

  const handleRestoreFromDevice = async () => {
    Alert.alert(
      'Confirm Restore',
      'This will merge device backup data with your current data. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          style: 'destructive',
          onPress: async () => {
            await restoreFromDevice();
          },
        },
      ]
    );
  };

  const handleStorageModeToggle = async (value: boolean) => {
    const newMode = value ? 'supabase' : 'local';
    
    if (newMode === 'supabase' && !isSupabaseConfigured) {
      Alert.alert(
        'Configuration Required',
        'Please configure Supabase credentials first before switching to cloud storage.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Configure', onPress: () => router.push('/supabase-settings') },
        ]
      );
      return;
    }

    setIsSwitching(true);
    try {
      await switchStorageMode(newMode);
    } finally {
      setIsSwitching(false);
    }
  };

  const formatTimestamp = (timestamp: string | null) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleString();
  };

  return (
    <>
      <Stack.Screen 
        options={{
          title: 'Settings',
          headerStyle: {
            backgroundColor: '#3D1F66',
          },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {
            fontWeight: '600',
          },
        }} 
      />
      <View style={styles.container}>
        <ScrollView style={styles.content}>
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Settings size={28} color="#9D4EDD" />
            </View>
            <Text style={styles.title}>Settings</Text>
            <Text style={styles.subtitle}>Manage your app settings and backups</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Storage Mode</Text>
            <Text style={styles.sectionDescription}>
              Choose where to store your data
            </Text>

            <View style={styles.storageModeCard}>
              <View style={styles.storageModeHeader}>
                <View style={styles.storageModeLeft}>
                  {storageMode === 'supabase' ? (
                    <Cloud size={24} color="#4ADE80" />
                  ) : (
                    <Smartphone size={24} color="#3B82F6" />
                  )}
                  <View style={styles.storageModeInfo}>
                    <Text style={styles.storageModeTitle}>
                      {storageMode === 'supabase' ? 'Cloud Storage' : 'Local Storage'}
                    </Text>
                    <Text style={styles.storageModeSubtitle}>
                      {storageMode === 'supabase' 
                        ? 'Data synced to Supabase' 
                        : 'Data stored on device'}
                    </Text>
                  </View>
                </View>
                {isSwitching ? (
                  <ActivityIndicator size="small" color="#9D4EDD" />
                ) : (
                  <Switch
                    value={storageMode === 'supabase'}
                    onValueChange={handleStorageModeToggle}
                    trackColor={{ false: 'rgba(74, 222, 128, 0.4)', true: 'rgba(157, 78, 221, 0.4)' }}
                    thumbColor={storageMode === 'supabase' ? '#9D4EDD' : '#4ADE80'}
                  />
                )}
              </View>

              <View style={styles.syncTimestamps}>
                <View style={styles.syncRow}>
                  <View style={styles.syncLabel}>
                    <Smartphone size={14} color="rgba(255, 255, 255, 0.5)" />
                    <Text style={styles.syncLabelText}>Local sync:</Text>
                  </View>
                  <Text style={styles.syncValue}>{formatTimestamp(localSyncTimestamp)}</Text>
                </View>
                <View style={styles.syncRow}>
                  <View style={styles.syncLabel}>
                    <Cloud size={14} color="rgba(255, 255, 255, 0.5)" />
                    <Text style={styles.syncLabelText}>Cloud sync:</Text>
                  </View>
                  <Text style={styles.syncValue}>{formatTimestamp(cloudSyncTimestamp)}</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cloud Configuration</Text>
            <TouchableOpacity 
              style={styles.settingItem}
              onPress={() => router.push('/supabase-settings')}
            >
              <View style={styles.settingItemLeft}>
                <Cloud size={20} color="#9D4EDD" />
                <View>
                  <Text style={styles.settingItemText}>Supabase Settings</Text>
                  <Text style={styles.settingItemSubtext}>
                    {isSupabaseConfigured ? 'Connected' : 'Not configured'}
                  </Text>
                </View>
              </View>
              <ChevronRight size={20} color="rgba(255, 255, 255, 0.4)" />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Backup</Text>
            <Text style={styles.sectionDescription}>
              Create a backup of your data to keep it safe
            </Text>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleBackupToCloud}
            >
              <Upload size={18} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Backup to Cloud</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, styles.actionButtonSecondary]}
              onPress={handleBackupToDevice}
            >
              <Upload size={18} color="#9D4EDD" />
              <Text style={styles.actionButtonTextSecondary}>Backup to Device</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Restore</Text>
            <Text style={styles.sectionDescription}>
              Restore your data from a previous backup
            </Text>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleRestoreFromCloud}
            >
              <Download size={18} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Restore from Cloud</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, styles.actionButtonSecondary]}
              onPress={handleRestoreFromDevice}
            >
              <Download size={18} color="#9D4EDD" />
              <Text style={styles.actionButtonTextSecondary}>Restore from Device</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.warningSection}>
            <Text style={styles.warningText}>
              Note: Restoring from a backup will merge the backup data with your current data. Duplicate items will not be created.
            </Text>
            <Text style={[styles.warningText, { marginTop: 8 }]}>
              Storage Mode: When switching between local and cloud, the app compares timestamps to sync the most recent data.
            </Text>
          </View>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A0B2E',
  },
  content: {
    flex: 1,
  },
  header: {
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(157, 78, 221, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 20,
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(157, 78, 221, 0.1)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(157, 78, 221, 0.2)',
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  settingItemSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 2,
  },
  storageModeCard: {
    backgroundColor: 'rgba(157, 78, 221, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(157, 78, 221, 0.2)',
    padding: 16,
  },
  storageModeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  storageModeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  storageModeInfo: {
    gap: 2,
  },
  storageModeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  storageModeSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  syncTimestamps: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    gap: 8,
  },
  syncRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  syncLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  syncLabelText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  syncValue: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    backgroundColor: '#9D4EDD',
    marginBottom: 12,
  },
  actionButtonSecondary: {
    backgroundColor: 'rgba(157, 78, 221, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(157, 78, 221, 0.3)',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  actionButtonTextSecondary: {
    color: '#9D4EDD',
    fontSize: 16,
    fontWeight: '600',
  },
  warningSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  warningText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.5)',
    lineHeight: 20,
    fontStyle: 'italic',
  },
});
