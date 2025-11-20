import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Settings, Cloud, Download, Upload, ChevronRight, Dices } from 'lucide-react-native';
import { useBackup } from '@/contexts/BackupContext';

export default function SettingsScreen() {
  const router = useRouter();
  const { createBackupToCloud, createBackupToDevice, restoreFromCloud, restoreFromDevice } = useBackup();

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
            <Text style={styles.sectionTitle}>Configuration</Text>
            <TouchableOpacity 
              style={styles.settingItem}
              onPress={() => router.push('/supabase-settings')}
            >
              <View style={styles.settingItemLeft}>
                <Cloud size={20} color="#9D4EDD" />
                <Text style={styles.settingItemText}>Supabase Settings</Text>
              </View>
              <ChevronRight size={20} color="rgba(255, 255, 255, 0.4)" />
            </TouchableOpacity>
            <View style={styles.itemSpacer} />
            <TouchableOpacity 
              style={styles.settingItem}
              onPress={() => router.push('/lottery-settings')}
            >
              <View style={styles.settingItemLeft}>
                <Dices size={20} color="#9D4EDD" />
                <Text style={styles.settingItemText}>Lottery Scraping</Text>
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
  itemSpacer: {
    height: 12,
  },
});
