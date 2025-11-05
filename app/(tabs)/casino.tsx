import { useAuth } from '@/contexts/AuthContext';
import { useBorrows } from '@/contexts/BorrowContext';
import NewSessionModal from '@/components/NewSessionModal';
import EditSessionModal from '@/components/EditSessionModal';
import SessionDetailsModal from '@/components/SessionDetailsModal';
import { GameType } from '@/types/user';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Clock, DollarSign, Edit2, LogOut, MapPin, ShieldOff, Trash2, X, Clover, Spade, Circle, Grid3x3, ChevronRight } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Alert, ImageBackground, Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableWithoutFeedback, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CasinoScreen() {
  const { currentUser, logout, isLoading, currentSession, completedSessions, startSession, endSession, updateSessionAddOn, updateSession, deleteSession, updatePin } = useAuth();
  const { addBorrow } = useBorrows();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [showNewSessionModal, setShowNewSessionModal] = useState<boolean>(false);
  const [showEditSessionModal, setShowEditSessionModal] = useState<boolean>(false);
  const [showEndSessionModal, setShowEndSessionModal] = useState<boolean>(false);
  const [endAmount, setEndAmount] = useState<string>('');
  const [addOnAmount, setAddOnAmount] = useState<string>('');
  const [editingCompletedSession, setEditingCompletedSession] = useState<typeof completedSessions[0] | null>(null);
  const [detailsSession, setDetailsSession] = useState<typeof completedSessions[0] | typeof currentSession | null>(null);
  const [showEditPinModal, setShowEditPinModal] = useState<boolean>(false);
  const [newPin, setNewPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');

  useEffect(() => {
    if (!currentUser && !isLoading) {
      router.replace('/login');
    }
  }, [currentUser, isLoading, router]);

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const handleStartSession = async (casinoName: string, state: string, startAmount: number, isFreeBet: boolean, gameType?: GameType, addOnAmount?: number, addOnCategory?: 'ATM' | 'Borrow' | 'Cash Advance', borrowFrom?: string) => {
    const sessionId = await startSession(casinoName, state, startAmount, isFreeBet, gameType, addOnAmount, addOnCategory, borrowFrom);
    
    if (sessionId && addOnCategory === 'Borrow' && borrowFrom && addOnAmount && addOnAmount > 0 && currentUser) {
      await addBorrow(
        currentUser.id,
        borrowFrom,
        addOnAmount,
        new Date().toISOString(),
        sessionId,
        `Session add-on at ${casinoName}`
      );
    }
    
    setShowNewSessionModal(false);
  };

  const handleEditSession = async (data: {
    casinoName: string;
    state: string;
    gameType?: GameType;
    startAmount: number;
    addOnAmount: number;
    addOnCategory?: 'ATM' | 'Borrow' | 'Cash Advance';
    borrowFrom?: string;
    startDate: Date;
    endDate?: Date;
  }) => {
    if (!currentSession) return;
    await updateSession(currentSession.id, data);
    setShowEditSessionModal(false);
  };

  const handleEditCompletedSession = async (data: {
    casinoName: string;
    state: string;
    gameType?: GameType;
    startAmount: number;
    addOnAmount: number;
    addOnCategory?: 'ATM' | 'Borrow' | 'Cash Advance';
    borrowFrom?: string;
    startDate: Date;
    endDate?: Date;
  }) => {
    if (!editingCompletedSession) return;
    await updateSession(editingCompletedSession.id, data);
    setEditingCompletedSession(null);
  };

  const handleUpdatePin = async () => {
    if (newPin.length !== 4) {
      Alert.alert('Error', 'PIN must be 4 digits');
      return;
    }

    if (newPin !== confirmPin) {
      Alert.alert('Error', 'PINs do not match');
      return;
    }

    const success = await updatePin(newPin);
    if (success) {
      Alert.alert('Success', 'PIN updated successfully');
      setShowEditPinModal(false);
      setNewPin('');
      setConfirmPin('');
    } else {
      Alert.alert('Error', 'Failed to update PIN');
    }
  };

  const handleDeleteSession = async (sessionId: string, isCurrentSession: boolean) => {
    Alert.alert(
      'Delete Session',
      `Are you sure you want to delete this ${isCurrentSession ? 'current' : 'completed'} session? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteSession(sessionId);
            if (isCurrentSession) {
              setEndAmount('');
            }
          },
        },
      ]
    );
  };

  const handleEndSession = async () => {
    if (!currentSession || !endAmount) return;
    
    const end = parseFloat(endAmount) / 100;
    await endSession(currentSession.id, end);
    setEndAmount('');
    setAddOnAmount('');
  };

  const handleAddOn = async () => {
    if (!currentSession || !addOnAmount) return;
    
    const addOn = parseFloat(addOnAmount) / 100;
    await updateSessionAddOn(currentSession.id, currentSession.addOnAmount + addOn);
    setAddOnAmount('');
    Alert.alert('Success', `Added $${addOn.toFixed(2)} to your session`);
  };

  const handleCurrencyChange = (text: string, setter: (value: string) => void) => {
    const numbers = text.replace(/[^0-9]/g, '');
    setter(numbers);
  };

  const displayCurrency = (value: string): string => {
    if (!value) return '';
    const amount = parseFloat(value) / 100;
    return `${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const calculateDuration = (startTime: string, endTime?: string) => {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const diff = end.getTime() - start.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const totalStats = completedSessions.reduce(
    (acc, session) => {
      const winLoss = session.winLoss || 0;
      if (winLoss > 0) {
        acc.totalWinnings += winLoss;
      } else {
        acc.totalLosses += Math.abs(winLoss);
      }
      return acc;
    },
    { totalWinnings: 0, totalLosses: 0 }
  );

  const netBalance = totalStats.totalWinnings - totalStats.totalLosses;

  const getGameIcon = (game?: GameType, color: string = '#240046') => {
    if (!game) return null;
    const size = 18;
    switch (game) {
      case 'Baccarat':
        return <Clover size={size} color={color} />;
      case 'Blackjack':
        return <Spade size={size} color={color} />;
      case 'Roulette':
        return <Circle size={size} color={color} />;
      case 'Slots':
        return <Grid3x3 size={size} color={color} />;
    }
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
          <View style={styles.headerTop}>
            <View style={styles.headerCenter}>
              <Text style={styles.casinoTitle}>CASINO SESSIONS</Text>
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

        <View style={styles.statsContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.statsHeader,
              pressed && styles.statsHeaderPressed,
            ]}
            onPress={() => router.push('/stats')}
            testID="stats-button"
          >
            <Text style={styles.sectionTitle}>My Stats</Text>
            <ChevronRight size={20} color="#FFFFFF" />
          </Pressable>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.emojiIcon}>😊</Text>
              <Text style={styles.statValue}>${totalStats.totalWinnings.toFixed(2)}</Text>
              <Text style={styles.statLabel}>Total Winnings</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.emojiIcon}>😢</Text>
              <Text style={styles.statValue}>${totalStats.totalLosses.toFixed(2)}</Text>
              <Text style={styles.statLabel}>Total Losses</Text>
            </View>
          </View>
          <View style={styles.netCardWrapper}>
            <View style={[styles.statCard, styles.netCard]}>
              <Text style={styles.netLabel}>Net Balance</Text>
              <Text style={styles.netValue}>
                {netBalance >= 0 ? '+' : ''}${netBalance.toFixed(2)}
              </Text>
            </View>
          </View>
          {!currentSession && (
            <View style={styles.startSessionContainer}>
              <Pressable
                style={({ pressed }) => [
                  styles.startSessionButton,
                  pressed && styles.startSessionButtonPressed,
                ]}
                onPress={() => setShowNewSessionModal(true)}
                testID="start-session-button"
              >
                <Text style={styles.startSessionButtonText}>START NEW SESSION</Text>
              </Pressable>
            </View>
          )}
        </View>

        <ScrollView
          style={styles.scrollContent}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >

          {currentSession && (
            <View style={styles.currentSessionContainer}>
              <Text style={styles.sectionTitle}>Current Session</Text>
              <Pressable 
                style={styles.sessionCard}
                onPress={() => setDetailsSession(currentSession)}
                testID="current-session-card"
              >
                <View style={styles.sessionHeader}>
                  <View style={styles.sessionHeaderLeft}>
                    <Text style={styles.sessionCasino}>{currentSession.casinoName}</Text>
                    <View style={styles.sessionMeta}>
                      <MapPin size={14} color="rgba(36, 0, 70, 0.6)" />
                      <Text style={styles.sessionMetaText}>{currentSession.state}</Text>
                      <Clock size={14} color="rgba(36, 0, 70, 0.6)" style={{ marginLeft: 12 }} />
                      <Text style={styles.sessionMetaText}>{calculateDuration(currentSession.startTime)}</Text>
                      {currentSession.gameType && (
                        <View style={styles.gameIconContainer}>
                          {getGameIcon(currentSession.gameType, 'rgba(36, 0, 70, 0.6)')}
                          <Text style={styles.sessionMetaText}>{currentSession.gameType}</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.sessionIcons}>
                      <Pressable
                        onPress={() => setShowEditSessionModal(true)}
                        style={({ pressed }) => [
                          styles.editButton,
                          pressed && styles.editButtonPressed,
                        ]}
                        testID="edit-session-button"
                      >
                        <Edit2 size={20} color="#000000" />
                      </Pressable>
                      <Pressable
                        onPress={() => handleDeleteSession(currentSession.id, true)}
                        style={({ pressed }) => [
                          styles.deleteButton,
                          pressed && styles.deleteButtonPressed,
                        ]}
                        testID="delete-current-session-button"
                      >
                        <Trash2 size={20} color="#000000" />
                      </Pressable>
                    </View>
                  </View>
                  <View style={styles.sessionHeaderRight}>
                    <View style={styles.sessionStatRightItem}>
                      <Text style={styles.sessionStatLabel}>Invested</Text>
                      <Text style={styles.sessionStatValue}>${currentSession.totalInvestment.toFixed(2)}</Text>
                    </View>
                    <View style={styles.activeBadge}>
                      <View style={styles.activeDot} />
                      <Text style={styles.activeBadgeText}>ACTIVE</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.sessionStats}>
                  <View style={styles.sessionStatItem}>
                    <Text style={styles.sessionStatLabel}>Start Amount</Text>
                    <Text style={styles.sessionStatValue}>
                      ${currentSession.startAmount.toFixed(2)}
                      {currentSession.isFreeBet && ' 🎁'}
                    </Text>
                  </View>
                  <View style={styles.sessionStatItem}>
                    <Text style={styles.sessionStatLabel}>Add-On</Text>
                    <Text style={styles.sessionStatValue}>${currentSession.addOnAmount.toFixed(2)}</Text>
                  </View>
                  <View style={styles.sessionStatItem}>
                    <Text style={styles.sessionStatLabel}>Total Investment</Text>
                    <Text style={[styles.sessionStatValue, styles.sessionStatValueHighlight]}>
                      ${currentSession.totalInvestment.toFixed(2)}
                    </Text>
                  </View>
                </View>

                <View style={styles.endAmountSection}>
                  <Text style={styles.endAmountLabel}>End Amount</Text>
                  <TextInput
                    style={styles.endAmountInput}
                    placeholder="$0.00"
                    placeholderTextColor="rgba(36, 0, 70, 0.4)"
                    value={displayCurrency(endAmount)}
                    onChangeText={(text) => handleCurrencyChange(text, setEndAmount)}
                    keyboardType="numeric"
                    testID="current-session-end-amount-input"
                  />
                  {endAmount && (
                    <View style={styles.winLossPreview}>
                      <Text style={styles.winLossPreviewLabel}>
                        {(parseFloat(endAmount) / 100 - currentSession.totalInvestment) >= 0 ? 'Win:' : 'Loss:'}
                      </Text>
                      <Text style={[
                        styles.winLossPreviewValue,
                        (parseFloat(endAmount) / 100 - currentSession.totalInvestment) >= 0 ? styles.winText : styles.lossText
                      ]}>
                        {(parseFloat(endAmount) / 100 - currentSession.totalInvestment) >= 0 ? '+' : ''}
                        ${((parseFloat(endAmount) / 100) - currentSession.totalInvestment).toFixed(2)}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.sessionActions}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.addOnButton,
                      pressed && styles.addOnButtonPressed,
                    ]}
                    onPress={() => {
                      Alert.prompt(
                        'Add-On Amount',
                        'Enter the amount you want to add to this session',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Add',
                            onPress: (text?: string) => {
                              if (text) {
                                const amount = text.replace(/[^0-9.]/g, '');
                                const cents = Math.round(parseFloat(amount) * 100).toString();
                                handleCurrencyChange(cents, setAddOnAmount);
                                setTimeout(() => handleAddOn(), 100);
                              }
                            },
                          },
                        ],
                        'plain-text',
                        '',
                        'numeric'
                      );
                    }}
                    testID="add-on-button"
                  >
                    <DollarSign size={18} color="#9D4EDD" />
                    <Text style={styles.addOnButtonText}>Add-On</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [
                      styles.endSessionButton,
                      !endAmount && styles.endSessionButtonDisabled,
                      pressed && styles.endSessionButtonPressed,
                    ]}
                    onPress={handleEndSession}
                    disabled={!endAmount}
                    testID="end-session-button"
                  >
                    <Text style={styles.endSessionButtonText}>End Session</Text>
                  </Pressable>
                </View>
              </Pressable>
            </View>
          )}

          {/* ... continuing with the rest of the file */}
          <View style={styles.recentContainer}>
            <Text style={styles.sectionTitle}>Recent Activities</Text>
            {completedSessions.length === 0 ? (
              <View style={styles.emptyState}>
                <ShieldOff size={48} color="rgba(36, 0, 70, 0.4)" />
                <Text style={styles.emptyStateText}>No completed sessions yet</Text>
                <Text style={styles.emptyStateSubtext}>
                  Complete your first session to see it here
                </Text>
              </View>
            ) : (
              <View style={styles.sessionsList}>
                {completedSessions.map((session) => (
                  <Pressable 
                    key={session.id} 
                    style={styles.sessionCard}
                    onPress={() => setDetailsSession(session)}
                    testID={`completed-session-card-${session.id}`}
                  >
                    <View style={styles.sessionHeader}>
                      <View style={styles.sessionHeaderLeft}>
                        <Text style={styles.sessionCasino}>{session.casinoName}</Text>
                        <View style={styles.sessionMeta}>
                          <MapPin size={14} color="rgba(36, 0, 70, 0.6)" />
                          <Text style={styles.sessionMetaText}>{session.state}</Text>
                        </View>
                        <View style={styles.sessionMeta}>
                          <Clock size={14} color="rgba(36, 0, 70, 0.6)" />
                          <Text style={styles.sessionMetaText}>{calculateDuration(session.startTime, session.endTime)}</Text>
                        </View>
                        {session.gameType && (
                          <View style={styles.sessionMeta}>
                            {getGameIcon(session.gameType, 'rgba(36, 0, 70, 0.6)')}
                            <Text style={styles.sessionMetaText}>{session.gameType}</Text>
                          </View>
                        )}
                        <View style={styles.sessionMeta}>
                          <Text style={styles.sessionStatLabel}>Date: {formatDate(session.endTime!)}</Text>
                        </View>
                        <View style={styles.sessionIcons}>
                          <Pressable
                            onPress={() => setEditingCompletedSession(session)}
                            style={({ pressed }) => [
                              styles.editButton,
                              pressed && styles.editButtonPressed,
                            ]}
                            testID={`edit-completed-session-${session.id}`}
                          >
                            <Edit2 size={20} color="#000000" />
                          </Pressable>
                          <Pressable
                            onPress={() => handleDeleteSession(session.id, false)}
                            style={({ pressed }) => [
                              styles.deleteButton,
                              pressed && styles.deleteButtonPressed,
                            ]}
                            testID={`delete-completed-session-${session.id}`}
                          >
                            <Trash2 size={20} color="#000000" />
                          </Pressable>
                        </View>
                      </View>
                      <View style={styles.sessionHeaderRight}>
                        <View style={styles.sessionStatRightItem}>
                          <Text style={styles.sessionStatLabel}>Invested</Text>
                          <Text style={styles.sessionStatValue}>${session.totalInvestment.toFixed(2)}</Text>
                        </View>
                        <View style={styles.sessionStatRightItem}>
                          <Text style={styles.sessionStatLabel}>Final</Text>
                          <Text style={styles.sessionStatValue}>${session.endAmount!.toFixed(2)}</Text>
                        </View>
                        <View style={styles.sessionStatRightItem}>
                          <Text style={styles.sessionStatLabel}>Amount Won</Text>
                          <Text style={[styles.sessionStatValue, styles.amountWonText]}>
                            {session.winLoss! >= 0 ? '+' : ''}${session.winLoss!.toFixed(2)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </View>

      <NewSessionModal
        visible={showNewSessionModal}
        onClose={() => setShowNewSessionModal(false)}
        onSubmit={handleStartSession}
      />

      {currentSession && (
        <EditSessionModal
          visible={showEditSessionModal}
          onClose={() => setShowEditSessionModal(false)}
          onSubmit={handleEditSession}
          initialData={{
            casinoName: currentSession.casinoName,
            state: currentSession.state,
            gameType: currentSession.gameType,
            startAmount: currentSession.startAmount,
            addOnAmount: currentSession.addOnAmount,
            addOnCategory: currentSession.addOnCategory,
            borrowFrom: currentSession.borrowFrom,
            startDate: new Date(currentSession.startTime),
          }}
          isCompleted={false}
        />
      )}

      {editingCompletedSession && (
        <EditSessionModal
          visible={!!editingCompletedSession}
          onClose={() => setEditingCompletedSession(null)}
          onSubmit={handleEditCompletedSession}
          initialData={{
            casinoName: editingCompletedSession.casinoName,
            state: editingCompletedSession.state,
            gameType: editingCompletedSession.gameType,
            startAmount: editingCompletedSession.startAmount,
            addOnAmount: editingCompletedSession.addOnAmount,
            addOnCategory: editingCompletedSession.addOnCategory,
            borrowFrom: editingCompletedSession.borrowFrom,
            startDate: new Date(editingCompletedSession.startTime),
            endDate: editingCompletedSession.endTime ? new Date(editingCompletedSession.endTime) : undefined,
          }}
          isCompleted={true}
        />
      )}

      <SessionDetailsModal
        visible={!!detailsSession}
        onClose={() => setDetailsSession(null)}
        session={detailsSession}
      />

      <Modal
        visible={showEditPinModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditPinModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <Pressable 
              style={styles.modalOverlay}
              onPress={() => {
                setShowEditPinModal(false);
                setNewPin('');
                setConfirmPin('');
              }}
            >
              <Pressable 
                style={styles.editPinModal}
                onPress={(e) => e.stopPropagation()}
              >
                <View style={styles.editPinHeader}>
                  <Text style={styles.editPinTitle}>Edit PIN</Text>
                  <Pressable
                    onPress={() => {
                      setShowEditPinModal(false);
                      setNewPin('');
                      setConfirmPin('');
                    }}
                    style={({ pressed }) => [
                      styles.closeButton,
                      pressed && styles.closeButtonPressed,
                    ]}
                  >
                    <X size={24} color="#240046" />
                  </Pressable>
                </View>

                <ScrollView 
                  style={styles.editPinBody}
                  contentContainerStyle={styles.editPinBodyContent}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>New PIN (4 digits)</Text>
                    <TextInput
                      style={styles.pinInput}
                      placeholder="0000"
                      placeholderTextColor="rgba(36, 0, 70, 0.4)"
                      value={newPin}
                      onChangeText={(text) => setNewPin(text.replace(/[^0-9]/g, '').slice(0, 4))}
                      keyboardType="numeric"
                      maxLength={4}
                      secureTextEntry
                      testID="new-pin-input"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Confirm PIN</Text>
                    <TextInput
                      style={styles.pinInput}
                      placeholder="0000"
                      placeholderTextColor="rgba(36, 0, 70, 0.4)"
                      value={confirmPin}
                      onChangeText={(text) => setConfirmPin(text.replace(/[^0-9]/g, '').slice(0, 4))}
                      keyboardType="numeric"
                      maxLength={4}
                      secureTextEntry
                      testID="confirm-pin-input"
                    />
                  </View>
                </ScrollView>

                <View style={styles.editPinFooter}>
                  <Pressable
                    onPress={handleUpdatePin}
                    disabled={!newPin || !confirmPin || newPin.length !== 4}
                    style={({ pressed }) => [
                      styles.updatePinButton,
                      (!newPin || !confirmPin || newPin.length !== 4) && styles.updatePinButtonDisabled,
                      pressed && styles.updatePinButtonPressed,
                    ]}
                    testID="update-pin-button"
                  >
                    <Text style={styles.updatePinButtonText}>Update PIN</Text>
                  </Pressable>
                </View>
              </Pressable>
            </Pressable>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={showEndSessionModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEndSessionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.endSessionModal}>
            <View style={styles.endSessionHeader}>
              <Text style={styles.endSessionTitle}>End Session</Text>
              <Pressable
                onPress={() => setShowEndSessionModal(false)}
                style={({ pressed }) => [
                  styles.closeButton,
                  pressed && styles.closeButtonPressed,
                ]}
              >
                <X size={24} color="#240046" />
              </Pressable>
            </View>

            <View style={styles.endSessionBody}>
              <Text style={styles.endSessionLabel}>Final Amount</Text>
              <TextInput
                style={styles.endSessionInput}
                placeholder="$0.00"
                placeholderTextColor="rgba(36, 0, 70, 0.4)"
                value={displayCurrency(endAmount)}
                onChangeText={(text) => handleCurrencyChange(text, setEndAmount)}
                keyboardType="numeric"
                testID="end-session-amount-input"
              />

              {currentSession && endAmount && (
                <View style={styles.endSessionSummary}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Total Investment:</Text>
                    <Text style={styles.summaryValue}>${currentSession.totalInvestment.toFixed(2)}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Final Amount:</Text>
                    <Text style={styles.summaryValue}>${(parseFloat(endAmount) / 100).toFixed(2)}</Text>
                  </View>
                  <View style={[styles.summaryRow, styles.summaryRowHighlight]}>
                    <Text style={styles.summaryLabelHighlight}>
                      {(parseFloat(endAmount) / 100 - currentSession.totalInvestment) >= 0 ? 'Win:' : 'Loss:'}
                    </Text>
                    <Text style={[
                      styles.summaryValueHighlight,
                      (parseFloat(endAmount) / 100 - currentSession.totalInvestment) >= 0 ? styles.winText : styles.lossText
                    ]}>
                      {(parseFloat(endAmount) / 100 - currentSession.totalInvestment) >= 0 ? '+' : ''}
                      ${((parseFloat(endAmount) / 100) - currentSession.totalInvestment).toFixed(2)}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            <View style={styles.endSessionFooter}>
              <Pressable
                onPress={handleEndSession}
                disabled={!endAmount}
                style={({ pressed }) => [
                  styles.confirmEndButton,
                  !endAmount && styles.confirmEndButtonDisabled,
                  pressed && styles.confirmEndButtonPressed,
                ]}
                testID="confirm-end-session-button"
              >
                <Text style={styles.confirmEndButtonText}>Confirm End Session</Text>
              </Pressable>
            </View>
          </View>
        </View>
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  username: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  casinoTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },

  logoutButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  logoutButtonPressed: {
    opacity: 0.6,
  },
  scrollContent: {
    flex: 1,
    marginTop: 8,
  },
  contentContainer: {
    padding: 20,
    paddingTop: 0,
    gap: 32,
  },
  statsContainer: {
    gap: 16,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  statsHeaderPressed: {
    opacity: 0.7,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(200, 162, 255, 0.95)',
    borderRadius: 16,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    gap: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#240046',
  },
  statLabel: {
    fontSize: 9,
    color: 'rgba(36, 0, 70, 0.9)',
    fontWeight: '600' as const,
  },
  netCardWrapper: {
    paddingBottom: 0,
  },
  netCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    minHeight: 56,
  },
  netLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: 'rgba(36, 0, 70, 0.9)',
  },
  netValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFD700',
  },
  recentContainer: {
    gap: 16,
    paddingTop: 12,
  },
  emptyState: {
    backgroundColor: 'rgba(200, 162, 255, 0.95)',
    borderRadius: 16,
    padding: 48,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  emptyStateText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#240046',
  },
  emptyStateSubtext: {
    fontSize: 12,
    color: 'rgba(36, 0, 70, 0.8)',
    textAlign: 'center',
  },
  startSessionContainer: {
    paddingTop: 12,
  },
  startSessionButton: {
    backgroundColor: 'rgba(157, 78, 221, 0.95)',
    borderRadius: 16,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  startSessionButtonPressed: {
    opacity: 0.7,
  },
  startSessionButtonText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  winText: {
    color: '#047857',
  },
  lossText: {
    color: '#EF4444',
  },
  currentSessionContainer: {
    gap: 16,
  },
  sessionCard: {
    backgroundColor: 'rgba(220, 190, 255, 0.95)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    gap: 16,
    overflow: 'hidden' as const,
  },
  sessionCardBackground: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.3,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    minHeight: 80,
  },
  sessionHeaderLeft: {
    flex: 1,
    gap: 8,
    paddingBottom: 44,
  },
  sessionHeaderRight: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 8,
  },
  editButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  editButtonPressed: {
    opacity: 0.7,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  deleteButtonPressed: {
    opacity: 0.7,
  },
  sessionIcons: {
    flexDirection: 'row',
    gap: 8,
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
  },
  sessionCasino: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#240046',
  },
  sessionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sessionMetaText: {
    fontSize: 13,
    color: 'rgba(36, 0, 70, 0.85)',
    fontWeight: '500' as const,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  activeBadgeText: {
    fontSize: 9,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  sessionStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  sessionStatLeft: {
    gap: 4,
  },
  sessionStatRight: {
    gap: 8,
    alignItems: 'flex-end',
  },
  sessionStatRightItem: {
    gap: 4,
    alignItems: 'flex-end',
  },
  sessionStatItem: {
    flex: 1,
    gap: 4,
  },
  sessionStatLabel: {
    fontSize: 12,
    color: 'rgba(36, 0, 70, 0.8)',
    fontWeight: '500' as const,
  },
  sessionStatValue: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#240046',
  },
  sessionStatValueHighlight: {
    fontSize: 15,
    color: '#9D4EDD',
  },
  amountWonText: {
    color: '#240046',
  },
  sessionActions: {
    flexDirection: 'row',
    gap: 12,
  },
  addOnButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(157, 78, 221, 0.15)',
    borderRadius: 12,
    padding: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: '#9D4EDD',
  },
  addOnButtonPressed: {
    opacity: 0.7,
  },
  addOnButtonText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#9D4EDD',
  },
  endSessionButton: {
    flex: 1,
    backgroundColor: '#9D4EDD',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  endSessionButtonDisabled: {
    backgroundColor: 'rgba(157, 78, 221, 0.3)',
  },
  endSessionButtonPressed: {
    opacity: 0.7,
  },
  endSessionButtonText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  sessionsList: {
    gap: 12,
  },
  winLossBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  winBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  lossBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  winLossBadgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  endSessionModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '60%',
  },
  endSessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(36, 0, 70, 0.1)',
  },
  endSessionTitle: {
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
  endSessionBody: {
    padding: 24,
    gap: 16,
  },
  endSessionLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#240046',
  },
  endSessionInput: {
    backgroundColor: 'rgba(157, 78, 221, 0.05)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#240046',
    borderWidth: 1,
    borderColor: 'rgba(157, 78, 221, 0.2)',
  },
  endSessionSummary: {
    backgroundColor: 'rgba(157, 78, 221, 0.08)',
    borderRadius: 16,
    padding: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(157, 78, 221, 0.2)',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryRowHighlight: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(157, 78, 221, 0.2)',
  },
  summaryLabel: {
    fontSize: 14,
    color: 'rgba(36, 0, 70, 0.7)',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#240046',
  },
  summaryLabelHighlight: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#240046',
  },
  summaryValueHighlight: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  endSessionFooter: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(36, 0, 70, 0.1)',
  },
  confirmEndButton: {
    backgroundColor: '#9D4EDD',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
  },
  confirmEndButtonDisabled: {
    backgroundColor: 'rgba(157, 78, 221, 0.3)',
  },
  confirmEndButtonPressed: {
    opacity: 0.7,
  },
  confirmEndButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  endAmountSection: {
    gap: 8,
  },
  endAmountLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#240046',
  },
  endAmountInput: {
    backgroundColor: 'rgba(157, 78, 221, 0.08)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#240046',
    borderWidth: 1,
    borderColor: 'rgba(157, 78, 221, 0.3)',
  },
  winLossPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
  },
  winLossPreviewLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#240046',
  },
  winLossPreviewValue: {
    fontSize: 15,
    fontWeight: '700' as const,
  },
  gameIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 12,
  },
  emojiIcon: {
    fontSize: 16,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButtonPressed: {
    opacity: 0.6,
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editPinButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  editPinButtonPressed: {
    opacity: 0.6,
  },
  editPinModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    marginHorizontal: 20,
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
  },
  editPinHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(36, 0, 70, 0.1)',
  },
  editPinTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#240046',
  },
  editPinBody: {
    maxHeight: 300,
  },
  editPinBodyContent: {
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
  editPinFooter: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(36, 0, 70, 0.1)',
  },
  updatePinButton: {
    backgroundColor: '#9D4EDD',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
  },
  updatePinButtonDisabled: {
    backgroundColor: 'rgba(157, 78, 221, 0.3)',
  },
  updatePinButtonPressed: {
    opacity: 0.7,
  },
  updatePinButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    letterSpacing: 1,
  },
});
