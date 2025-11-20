import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Dices } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { useSettings } from '@/contexts/SettingsContext';

const DEFAULT_POWERBALL_URL = 'https://www.powerball.com';
const DEFAULT_MEGA_MILLIONS_URL = 'https://www.valottery.com/data/draw-games/mega-millions';

export default function LotterySettingsScreen() {
  const router = useRouter();
  const { powerballUrl, megaMillionsUrl, saveLotteryUrls } = useSettings();
  
  const [localPowerballUrl, setLocalPowerballUrl] = useState<string>('');
  const [localMegaMillionsUrl, setLocalMegaMillionsUrl] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    setLocalPowerballUrl(powerballUrl || DEFAULT_POWERBALL_URL);
    setLocalMegaMillionsUrl(megaMillionsUrl || DEFAULT_MEGA_MILLIONS_URL);
  }, [powerballUrl, megaMillionsUrl]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const finalPowerballUrl = localPowerballUrl.trim() || DEFAULT_POWERBALL_URL;
      const finalMegaMillionsUrl = localMegaMillionsUrl.trim() || DEFAULT_MEGA_MILLIONS_URL;

      await saveLotteryUrls({
        powerballUrl: finalPowerballUrl,
        megaMillionsUrl: finalMegaMillionsUrl,
      });

      Alert.alert(
        'Success',
        'Lottery URLs saved successfully. The app will use these URLs for scraping lottery data.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to save lottery URLs',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    Alert.alert(
      'Reset to Defaults',
      'Are you sure you want to reset URLs to default values?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            setLocalPowerballUrl(DEFAULT_POWERBALL_URL);
            setLocalMegaMillionsUrl(DEFAULT_MEGA_MILLIONS_URL);
          },
        },
      ]
    );
  };

  return (
    <>
      <Stack.Screen 
        options={{
          title: 'Lottery Scraping',
          headerStyle: {
            backgroundColor: '#3D1F66',
          },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {
            fontWeight: '600',
          },
        }} 
      />
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Dices size={28} color="#9D4EDD" />
            </View>
            <Text style={styles.title}>Lottery Scraping URLs</Text>
            <Text style={styles.subtitle}>
              Configure URLs for lottery data scraping. Leave empty to use default websites.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Powerball URL</Text>
            <Text style={styles.hint}>Default: {DEFAULT_POWERBALL_URL}</Text>
            <TextInput
              style={styles.input}
              value={localPowerballUrl}
              onChangeText={setLocalPowerballUrl}
              placeholder={DEFAULT_POWERBALL_URL}
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Mega Millions URL</Text>
            <Text style={styles.hint}>Default: {DEFAULT_MEGA_MILLIONS_URL}</Text>
            <TextInput
              style={styles.input}
              value={localMegaMillionsUrl}
              onChangeText={setLocalMegaMillionsUrl}
              placeholder={DEFAULT_MEGA_MILLIONS_URL}
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
          </View>

          <View style={styles.buttonsContainer}>
            <TouchableOpacity 
              style={styles.saveButton}
              onPress={handleSave}
              disabled={isSaving}
            >
              <Text style={styles.saveButtonText}>
                {isSaving ? 'Saving...' : 'Save URLs'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.resetButton}
              onPress={handleReset}
              disabled={isSaving}
            >
              <Text style={styles.resetButtonText}>Reset to Defaults</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.infoText}>
              These URLs are used to scrape lottery winning numbers and jackpot information. 
              If scraping fails, verify that the URLs are correct and accessible.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  hint: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(157, 78, 221, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(157, 78, 221, 0.3)',
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  buttonsContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  saveButton: {
    backgroundColor: '#9D4EDD',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  resetButton: {
    backgroundColor: 'rgba(157, 78, 221, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(157, 78, 221, 0.3)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#9D4EDD',
    fontSize: 16,
    fontWeight: '600',
  },
  infoSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  infoText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.5)',
    lineHeight: 20,
    fontStyle: 'italic',
  },
});
