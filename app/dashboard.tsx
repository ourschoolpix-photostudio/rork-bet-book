import { useAuth } from '@/contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { LogOut, Edit2, X, Download, Upload } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Alert, ImageBackground, Keyboard, Modal, Pressable, StyleSheet, Text, TextInput, TouchableWithoutFeedback, View, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createBackup, restoreBackup } from '@/utils/dataBackup';

export default function DashboardScreen() {
  const { currentUser, logout, isLoading, updateProfile } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [showEditProfileModal, setShowEditProfileModal] = useState<boolean>(false);
  const [editUsername, setEditUsername] = useState<string>('');
  const [editPin, setEditPin] = useState<string>('');
  const [editConfirmPin, setEditConfirmPin] = useState<string>('');
  const [isBackingUp, setIsBackingUp] = useState<boolean>(false);
  const [isRestoring, setIsRestoring] = useState<boolean>(false);

  useEffect(() => {
    if (!currentUser && !isLoading) {
      router.replace('/login');
    }
  }, [currentUser, isLoading, router]);

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const handleUpdateProfile = async () => {
    if (!editUsername.trim()) {
      Alert.alert('Error', 'Username is required');
      return;
    }

    if (editPin.length !== 4) {
      Alert.alert('Error', 'PIN must be 4 digits');
      return;
    }

    if (editPin !== editConfirmPin) {
      Alert.alert('Error', 'PINs do not match');
      return;
    }

    const success = await updateProfile(editUsername.trim(), editPin);
    if (success) {
      Alert.alert('Success', 'Profile updated successfully');
      setShowEditProfileModal(false);
      setEditUsername('');
      setEditPin('');
      setEditConfirmPin('');
    } else {
      Alert.alert('Error', 'Username already exists');
    }
  };

  const handleBackup = async () => {
    setIsBackingUp(true);
    try {
      const success = await createBackup();
      if (success) {
        Alert.alert('Success', 'Backup created successfully');
      }
    } catch (error: any) {
      console.error('Backup error:', error);
      const errorMessage = error?.message || 'Failed to create backup';
      Alert.alert('Backup Failed', errorMessage);
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestore = async () => {
    Alert.alert(
      'Restore Data',
      'This will replace all current data with the backup. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          style: 'destructive',
          onPress: async () => {
            setIsRestoring(true);
            try {
              const result = await restoreBackup();
              if (result.success) {
                Alert.alert(
                  'Success',
                  'Data restored successfully. Please restart the app.',
                  [
                    {
                      text: 'OK',
                      onPress: () => {
                        logout();
                        router.replace('/login');
                      },
                    },
                  ]
                );
              } else {
                Alert.alert('Error', result.error || 'Failed to restore backup');
              }
            } catch (error) {
              console.error('Restore error:', error);
              Alert.alert('Error', 'Failed to restore backup');
            } finally {
              setIsRestoring(false);
            }
          },
        },
      ]
    );
  };

  if (!currentUser) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ImageBackground
        source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/pmhxsgkxjukxadd3cvfc3' }}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      >
        <View style={styles.purpleOverlay} />
      </ImageBackground>
      <LinearGradient
        colors={['rgba(157, 78, 221, 0.7)', 'rgba(123, 44, 191, 0.7)', 'rgba(90, 24, 154, 0.7)', 'rgba(36, 0, 70, 0.7)', 'rgba(16, 0, 43, 0.7)']}
        style={styles.gradientOverlay}
      />
      
      <View style={styles.contentWrapper}>
        <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
          <View style={styles.headerContent}>
            <View style={styles.usernameRow}>
              <Text style={styles.username}>{currentUser.username}</Text>
              <Pressable
                style={({ pressed }) => [
                  styles.editProfileButton,
                  pressed && styles.editProfileButtonPressed,
                ]}
                onPress={() => {
                  setEditUsername(currentUser.username);
                  setEditPin(currentUser.pin);
                  setEditConfirmPin(currentUser.pin);
                  setShowEditProfileModal(true);
                }}
                testID="edit-profile-button"
              >
                <Edit2 size={18} color="#FFFFFF" />
              </Pressable>
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.logoutButton,
                pressed && styles.logoutButtonPressed,
              ]}
              onPress={handleLogout}
              testID="logout-button"
            >
              <LogOut size={24} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>

        <View style={styles.cardsContainer}>
          <View style={styles.row}>
            <Pressable
              style={({ pressed }) => [
                styles.casinoCard,
                pressed && styles.cardPressed,
              ]}
              onPress={() => router.push('/bets')}
              testID="my-bets-card"
            >
              <ImageBackground
                source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/e4in3ntw7gm6kwsueamxx' }}
                style={styles.casinoCardBackground}
                imageStyle={styles.casinoCardImage}
                resizeMode="cover"
              >
                <Text style={styles.cardTitle}>My Bets</Text>
              </ImageBackground>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.casinoCard,
                pressed && styles.cardPressed,
              ]}
              onPress={() => router.push('/casino')}
              testID="casino-card"
            >
              <ImageBackground
                source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/c952af0g82678cforqxnd' }}
                style={styles.casinoCardBackground}
                imageStyle={styles.casinoCardImage}
                resizeMode="cover"
              >
                <Text style={styles.cardTitle}>Casino</Text>
              </ImageBackground>
            </Pressable>
          </View>

          <View style={styles.row}>
            <Pressable
              style={({ pressed }) => [
                styles.casinoCard,
                pressed && styles.cardPressed,
              ]}
              onPress={() => router.push('/sports')}
              testID="sports-card"
            >
              <ImageBackground
                source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/iss1h9mvgaiqk5r6klvbd' }}
                style={styles.casinoCardBackground}
                imageStyle={styles.casinoCardImage}
                resizeMode="cover"
              >
                <Text style={styles.cardTitle}>Sports</Text>
              </ImageBackground>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.casinoCard,
                pressed && styles.cardPressed,
              ]}
              onPress={() => router.push('/lotto')}
              testID="lotto-card"
            >
              <ImageBackground
                source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/ezt9mspxd5vii68gqdiz1' }}
                style={styles.casinoCardBackground}
                imageStyle={styles.casinoCardImage}
                resizeMode="cover"
              >
                <Text style={styles.cardTitle}>Lotto</Text>
              </ImageBackground>
            </Pressable>
          </View>

          <View style={styles.row}>
            <Pressable
              style={({ pressed }) => [
                styles.casinoCard,
                pressed && styles.cardPressed,
              ]}
              onPress={() => router.push('/borrows')}
              testID="borrowed-card"
            >
              <ImageBackground
                source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/67hokghqa8wlc8ccjtcfj' }}
                style={styles.casinoCardBackground}
                imageStyle={styles.casinoCardImage}
                resizeMode="cover"
              >
                <Text style={styles.cardTitle}>Borrowed</Text>
              </ImageBackground>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.casinoCard,
                pressed && styles.cardPressed,
              ]}
              onPress={() => router.push('/loans')}
              testID="loaned-out-card"
            >
              <ImageBackground
                source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/l09gtzqgrnooefmpdn9tq' }}
                style={styles.casinoCardBackground}
                imageStyle={styles.casinoCardImage}
                resizeMode="cover"
              >
                <Text style={styles.cardTitle}>Loaned Out</Text>
              </ImageBackground>
            </Pressable>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.casinoCard,
              pressed && styles.cardPressed,
            ]}
            onPress={() => router.push('/summary')}
            testID="summary-card"
          >
            <ImageBackground
              source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/gk9lbarcr3yw6lq2is6t9' }}
              style={styles.casinoCardBackground}
              imageStyle={styles.casinoCardImage}
              resizeMode="cover"
            >
              <Text style={styles.cardTitle}>Summary</Text>
            </ImageBackground>
          </Pressable>
        </View>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <Pressable
            style={({ pressed }) => [
              styles.footerButton,
              pressed && styles.footerButtonPressed,
              isBackingUp && styles.footerButtonDisabled,
            ]}
            onPress={handleBackup}
            disabled={isBackingUp}
            testID="backup-button"
          >
            {isBackingUp ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Download size={24} color="#FFFFFF" />
            )}
            <Text style={styles.footerButtonText}>Backup</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.footerButton,
              pressed && styles.footerButtonPressed,
              isRestoring && styles.footerButtonDisabled,
            ]}
            onPress={handleRestore}
            disabled={isRestoring}
            testID="restore-button"
          >
            {isRestoring ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Upload size={24} color="#FFFFFF" />
            )}
            <Text style={styles.footerButtonText}>Restore</Text>
          </Pressable>
        </View>
      </View>

      <Modal
        visible={showEditProfileModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditProfileModal(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={styles.editProfileModal}>
                <View style={styles.editProfileHeader}>
                  <Text style={styles.editProfileTitle}>Edit Profile</Text>
                  <Pressable
                    onPress={() => {
                      setShowEditProfileModal(false);
                      setEditUsername('');
                      setEditPin('');
                      setEditConfirmPin('');
                    }}
                    style={({ pressed }) => [
                      styles.closeButton,
                      pressed && styles.closeButtonPressed,
                    ]}
                    testID="close-edit-profile-button"
                  >
                    <X size={24} color="#240046" />
                  </Pressable>
                </View>

                <View style={styles.editProfileBody}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>User Name</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Enter username"
                      placeholderTextColor="rgba(36, 0, 70, 0.4)"
                      value={editUsername}
                      onChangeText={setEditUsername}
                      autoCapitalize="words"
                      testID="edit-username-input"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>PIN (4 digits)</Text>
                    <TextInput
                      style={styles.pinInput}
                      placeholder="0000"
                      placeholderTextColor="rgba(36, 0, 70, 0.4)"
                      value={editPin}
                      onChangeText={(text) => setEditPin(text.replace(/[^0-9]/g, '').slice(0, 4))}
                      keyboardType="numeric"
                      maxLength={4}
                      secureTextEntry
                      testID="edit-pin-input"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>PIN Confirmation</Text>
                    <TextInput
                      style={styles.pinInput}
                      placeholder="0000"
                      placeholderTextColor="rgba(36, 0, 70, 0.4)"
                      value={editConfirmPin}
                      onChangeText={(text) => setEditConfirmPin(text.replace(/[^0-9]/g, '').slice(0, 4))}
                      keyboardType="numeric"
                      maxLength={4}
                      secureTextEntry
                      testID="edit-confirm-pin-input"
                    />
                  </View>
                </View>

                <View style={styles.editProfileFooter}>
                  <Pressable
                    onPress={handleUpdateProfile}
                    disabled={!editUsername.trim() || !editPin || !editConfirmPin || editPin.length !== 4}
                    style={({ pressed }) => [
                      styles.updateProfileButton,
                      (!editUsername.trim() || !editPin || !editConfirmPin || editPin.length !== 4) && styles.updateProfileButtonDisabled,
                      pressed && styles.updateProfileButtonPressed,
                    ]}
                    testID="update-profile-button"
                  >
                    <Text style={styles.updateProfileButtonText}>Update Profile</Text>
                  </Pressable>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  purpleOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(157, 78, 221, 0.3)',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  contentWrapper: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: 'rgba(157, 78, 221, 0.9)',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  username: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  logoutButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  logoutButtonPressed: {
    opacity: 0.6,
  },
  cardsContainer: {
    flex: 1,
    padding: 20,
    gap: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
    height: 120,
  },
  card: {
    flex: 1,
    backgroundColor: 'rgba(157, 78, 221, 0.85)',
    borderRadius: 20,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  casinoCard: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden' as const,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },

  cardPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  casinoCardBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(157, 78, 221, 0.7)',
  },
  casinoCardImage: {
    borderRadius: 18,
    opacity: 0.6,
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  editProfileButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  editProfileButtonPressed: {
    opacity: 0.6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  editProfileModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    width: '100%',
    maxWidth: 600,
  },
  editProfileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(36, 0, 70, 0.1)',
  },
  editProfileTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#240046',
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(36, 0, 70, 0.05)',
  },
  closeButtonPressed: {
    opacity: 0.6,
  },
  editProfileBody: {
    padding: 24,
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#240046',
  },
  textInput: {
    backgroundColor: 'rgba(157, 78, 221, 0.05)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#240046',
    borderWidth: 1,
    borderColor: 'rgba(157, 78, 221, 0.2)',
  },
  pinInput: {
    backgroundColor: 'rgba(157, 78, 221, 0.05)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#240046',
    borderWidth: 1,
    borderColor: 'rgba(157, 78, 221, 0.2)',
    letterSpacing: 8,
    textAlign: 'center' as const,
  },
  editProfileFooter: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(36, 0, 70, 0.1)',
  },
  updateProfileButton: {
    backgroundColor: '#9D4EDD',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
  },
  updateProfileButtonDisabled: {
    backgroundColor: 'rgba(157, 78, 221, 0.3)',
  },
  updateProfileButtonPressed: {
    opacity: 0.7,
  },
  updateProfileButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: 'rgba(157, 78, 221, 0.9)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  footerButtonPressed: {
    opacity: 0.6,
  },
  footerButtonDisabled: {
    opacity: 0.4,
  },
  footerButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});
