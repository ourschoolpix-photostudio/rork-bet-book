import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator, Clipboard } from 'react-native';
import { Stack } from 'expo-router';
import { useState } from 'react';
import { Cloud, Trash2, Check, Copy, Database } from 'lucide-react-native';
import { useSettings } from '@/contexts/SettingsContext';

export default function SupabaseSettingsScreen() {
  const { 
    supabaseUrl: savedUrl, 
    supabaseKey: savedKey, 
    isSupabaseConfigured, 
    saveSupabaseConfig,
    clearSupabaseConfig 
  } = useSettings();

  const [url, setUrl] = useState<string>(savedUrl || '');
  const [key, setKey] = useState<string>(savedKey || '');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [showSqlScript, setShowSqlScript] = useState<boolean>(false);

  const sqlScript = `-- Create backups table for Casino Tracker
CREATE TABLE IF NOT EXISTS backups (
  id TEXT PRIMARY KEY,
  version TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable Row Level Security for now
ALTER TABLE backups DISABLE ROW LEVEL SECURITY;

-- Optional: Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_backups_created_at ON backups(created_at DESC);`;

  const handleTestConnection = async () => {
    if (!url.trim() || !key.trim()) {
      Alert.alert('Error', 'Please enter both Supabase URL and Key');
      return;
    }

    setIsTesting(true);
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const testClient = createClient(url.trim(), key.trim());
      
      const { error } = await testClient.from('backups').select('count').limit(0);
      
      if (error) {
        if (error.code === '42P01') {
          Alert.alert(
            'Table Not Found',
            'Connection successful, but the "backups" table does not exist. Please run the SQL script below to create the table.',
            [{ text: 'OK', onPress: () => setShowSqlScript(true) }]
          );
        } else {
          Alert.alert(
            'Connection Error',
            `Error: ${error.message}\n\nPlease check your credentials and make sure the backups table exists.`
          );
        }
      } else {
        Alert.alert(
          'Connection Successful',
          'Successfully connected to your Supabase database! The backups table is ready.'
        );
      }
    } catch (error) {
      Alert.alert(
        'Connection Failed',
        error instanceof Error ? error.message : 'Failed to connect to Supabase. Please check your credentials.'
      );
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    if (!url.trim() || !key.trim()) {
      Alert.alert('Error', 'Please enter both Supabase URL and Key');
      return;
    }

    setIsSubmitting(true);
    try {
      await saveSupabaseConfig({ url: url.trim(), key: key.trim() });
      Alert.alert(
        'Success',
        'Supabase credentials saved successfully! Cloud backups are now available.'
      );
    } catch (error) {
      Alert.alert(
        'Configuration Error',
        error instanceof Error ? error.message : 'Failed to save Supabase configuration. Please check your credentials and try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopySql = () => {
    Clipboard.setString(sqlScript);
    Alert.alert('Copied', 'SQL script copied to clipboard!');
  };

  const handleClear = () => {
    Alert.alert(
      'Clear Configuration',
      'Are you sure you want to clear your Supabase credentials? Cloud backup features will be disabled.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearSupabaseConfig();
              setUrl('');
              setKey('');
              Alert.alert('Success', 'Supabase credentials cleared');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear credentials');
            }
          },
        },
      ]
    );
  };

  return (
    <>
      <Stack.Screen 
        options={{
          title: 'Supabase Settings',
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
              <Cloud size={28} color="#9D4EDD" />
            </View>
            <Text style={styles.title}>Supabase Configuration</Text>
            <Text style={styles.subtitle}>Configure cloud backup with your own Supabase instance</Text>
          </View>

          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <Cloud size={20} color={isSupabaseConfigured ? '#4ADE80' : '#94A3B8'} />
              <Text style={[styles.statusText, isSupabaseConfigured && styles.statusTextActive]}>
                {isSupabaseConfigured ? 'Cloud Backups Active' : 'Cloud Backups Disabled'}
              </Text>
            </View>
            {isSupabaseConfigured && (
              <View style={styles.statusIndicator}>
                <Check size={16} color="#4ADE80" />
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Credentials</Text>
            <Text style={styles.sectionDescription}>
              Enter your Supabase project URL and anon key to enable cloud backups. Your data will be stored in your own Supabase instance.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Supabase URL</Text>
              <TextInput
                style={styles.input}
                value={url}
                onChangeText={setUrl}
                placeholder="https://your-project.supabase.co"
                placeholderTextColor="rgba(255, 255, 255, 0.3)"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Supabase Anon Key</Text>
              <TextInput
                style={[styles.input, styles.inputKey]}
                value={key}
                onChangeText={setKey}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                placeholderTextColor="rgba(255, 255, 255, 0.3)"
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry
                multiline
              />
            </View>

            <View style={styles.buttonGroup}>
              <TouchableOpacity 
                style={[styles.button, styles.buttonTest, (isSubmitting || isTesting) && styles.buttonDisabled]}
                onPress={handleTestConnection}
                disabled={isSubmitting || isTesting}
              >
                {isTesting ? (
                  <ActivityIndicator size="small" color="#3B82F6" />
                ) : (
                  <>
                    <Database size={18} color="#3B82F6" />
                    <Text style={styles.buttonTextTest}>Test Connection</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.button, styles.buttonPrimary, (isSubmitting || isTesting) && styles.buttonDisabled]}
                onPress={handleSave}
                disabled={isSubmitting || isTesting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Check size={18} color="#FFFFFF" />
                    <Text style={styles.buttonText}>Save Configuration</Text>
                  </>
                )}
              </TouchableOpacity>

              {isSupabaseConfigured && (
                <TouchableOpacity 
                  style={[styles.button, styles.buttonSecondary]}
                  onPress={handleClear}
                  disabled={isSubmitting || isTesting}
                >
                  <Trash2 size={18} color="#EF4444" />
                  <Text style={styles.buttonTextSecondary}>Clear Credentials</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>How to set up Supabase:</Text>
            <Text style={styles.infoText}>1. Create a free account at supabase.com</Text>
            <Text style={styles.infoText}>2. Create a new project</Text>
            <Text style={styles.infoText}>3. Go to Settings {'->'} API</Text>
            <Text style={styles.infoText}>4. Copy your Project URL and anon/public key</Text>
            <Text style={styles.infoText}>5. Paste credentials here and test connection</Text>
            <Text style={styles.infoText}>6. Run SQL script below if table doesn&apos;t exist</Text>
          </View>

          <View style={styles.sqlSection}>
            <TouchableOpacity 
              style={styles.sqlHeader}
              onPress={() => setShowSqlScript(!showSqlScript)}
            >
              <Text style={styles.sqlTitle}>SQL Setup Script</Text>
              <Text style={styles.sqlToggle}>{showSqlScript ? '▼' : '▶'}</Text>
            </TouchableOpacity>
            
            {showSqlScript && (
              <>
                <View style={styles.sqlCodeContainer}>
                  <Text style={styles.sqlCode}>{sqlScript}</Text>
                </View>
                <TouchableOpacity 
                  style={styles.sqlCopyButton}
                  onPress={handleCopySql}
                >
                  <Copy size={16} color="#3B82F6" />
                  <Text style={styles.sqlCopyButtonText}>Copy SQL Script</Text>
                </TouchableOpacity>
                <Text style={styles.sqlInstructions}>
                  1. Go to your Supabase project{"\n"}
                  2. Click on SQL Editor in the sidebar{"\n"}
                  3. Paste and run this script{"\n"}
                  4. Test connection above to verify
                </Text>
              </>
            )}
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
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(157, 78, 221, 0.1)',
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(157, 78, 221, 0.2)',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  statusTextActive: {
    color: '#4ADE80',
  },
  statusIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(74, 222, 128, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
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
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(157, 78, 221, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(157, 78, 221, 0.3)',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#FFFFFF',
  },
  inputKey: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  buttonGroup: {
    gap: 12,
    marginTop: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  buttonPrimary: {
    backgroundColor: '#9D4EDD',
  },
  buttonTest: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  buttonSecondary: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextTest: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextSecondary: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
  },
  infoSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 22,
    marginBottom: 6,
  },
  sqlSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  sqlHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(157, 78, 221, 0.1)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(157, 78, 221, 0.2)',
    marginBottom: 12,
  },
  sqlTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  sqlToggle: {
    fontSize: 16,
    color: '#9D4EDD',
  },
  sqlCodeContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(157, 78, 221, 0.2)',
    marginBottom: 12,
  },
  sqlCode: {
    fontFamily: 'monospace' as const,
    fontSize: 12,
    color: '#E5E7EB',
    lineHeight: 18,
  },
  sqlCopyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    borderRadius: 8,
    marginBottom: 12,
  },
  sqlCopyButtonText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
  },
  sqlInstructions: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 20,
  },
});
