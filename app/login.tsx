import { useAuth } from '@/contexts/AuthContext';
import { WALLPAPER_URL } from '@/constants/wallpaper';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { LogIn, UserPlus } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const [username, setUsername] = useState<string>('');
  const [pin, setPin] = useState<string>('');
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const { login, register, currentUser, isLoading } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (currentUser && !isLoading) {
      router.replace('/dashboard');
    }
  }, [currentUser, isLoading, router]);

  const handleSubmit = async () => {
    if (!username.trim()) {
      Alert.alert('Error', 'Please enter a username');
      return;
    }

    if (pin.length !== 4) {
      Alert.alert('Error', 'PIN must be exactly 4 digits');
      return;
    }

    setIsSubmitting(true);

    try {
      let success = false;

      if (isRegistering) {
        success = await register(username.trim(), pin);
        if (!success) {
          Alert.alert('Error', 'Username already exists');
        }
      } else {
        success = await login(username.trim(), pin);
        if (!success) {
          Alert.alert('Error', 'Invalid username or PIN');
        }
      }

      if (success) {
        router.replace('/dashboard');
      }
    } catch (error) {
      console.error('Auth error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    setUsername('');
    setPin('');
  };

  if (isLoading) {
    return (
      <ImageBackground
        source={{ uri: WALLPAPER_URL }}
        style={styles.container}
        resizeMode="cover"
      >
        <View style={styles.overlay} />
        <View style={styles.gradientOverlay}>
          <LinearGradient
            colors={['rgba(157, 78, 221, 0.7)', 'rgba(123, 44, 191, 0.7)', 'rgba(90, 24, 154, 0.7)', 'rgba(36, 0, 70, 0.7)', 'rgba(16, 0, 43, 0.7)']}
            style={StyleSheet.absoluteFill}
          />
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#FFFFFF" />
          </View>
        </View>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground
      source={{ uri: WALLPAPER_URL }}
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      <View style={styles.gradientOverlay}>
        <LinearGradient
          colors={['rgba(157, 78, 221, 0.7)', 'rgba(123, 44, 191, 0.7)', 'rgba(90, 24, 154, 0.7)', 'rgba(36, 0, 70, 0.7)', 'rgba(16, 0, 43, 0.7)']}
          style={StyleSheet.absoluteFill}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={[styles.keyboardView, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.content}>
              <View style={styles.header}>
                <Text style={styles.title}>Casino Tracker</Text>
                <Text style={styles.subtitle}>
                  {isRegistering ? 'Create your account' : 'Welcome back'}
                </Text>
              </View>

              <View style={styles.form}>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Username</Text>
                  <TextInput
                    style={styles.input}
                    value={username}
                    onChangeText={setUsername}
                    placeholder="Enter username"
                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                    autoCapitalize="words"
                    autoCorrect={false}
                    editable={!isSubmitting}
                    testID="username-input"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>4-Digit PIN</Text>
                  <TextInput
                    style={styles.input}
                    value={pin}
                    onChangeText={(text) => {
                      if (text.length <= 4 && /^\d*$/.test(text)) {
                        setPin(text);
                      }
                    }}
                    placeholder="Enter 4-digit PIN"
                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                    keyboardType="number-pad"
                    secureTextEntry
                    maxLength={4}
                    editable={!isSubmitting}
                    testID="pin-input"
                  />
                </View>

                <Pressable
                  style={({ pressed }) => [
                    styles.submitButton,
                    pressed && styles.submitButtonPressed,
                    isSubmitting && styles.submitButtonDisabled,
                  ]}
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                  testID="submit-button"
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#240046" />
                  ) : (
                    <>
                      {isRegistering ? (
                        <UserPlus size={20} color="#240046" />
                      ) : (
                        <LogIn size={20} color="#240046" />
                      )}
                      <Text style={styles.submitButtonText}>
                        {isRegistering ? 'Create Account' : 'Sign In'}
                      </Text>
                    </>
                  )}
                </Pressable>

                <Pressable
                  style={styles.toggleButton}
                  onPress={toggleMode}
                  disabled={isSubmitting}
                  testID="toggle-mode-button"
                >
                  <Text style={styles.toggleButtonText}>
                    {isRegistering
                      ? 'Already have an account? Sign in'
                      : "Don't have an account? Create one"}
                  </Text>
                </Pressable>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(157, 78, 221, 0.3)',
    zIndex: 1,
  },
  gradientOverlay: {
    flex: 1,
    zIndex: 2,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 32,
  },
  header: {
    alignItems: 'center',
    marginTop: '20%',
  },
  title: {
    fontSize: 42,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '400' as const,
  },
  form: {
    gap: 20,
    marginBottom: 20,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: 'rgba(255, 255, 255, 0.9)',
    letterSpacing: 0.3,
  },
  input: {
    backgroundColor: 'rgba(36, 0, 70, 1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  submitButton: {
    backgroundColor: 'rgba(255, 255, 255, 1)',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
  },
  submitButtonPressed: {
    opacity: 0.8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#240046',
    letterSpacing: 0.5,
  },
  toggleButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  toggleButtonText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500' as const,
  },
});
