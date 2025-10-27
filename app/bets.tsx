import { useAuth } from '@/contexts/AuthContext';
import { useBets } from '@/contexts/BetsContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowLeft, Plus, Trash2, Trophy, Pencil } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, ImageBackground, Keyboard, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableWithoutFeedback, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function BetsScreen() {
  const { currentUser } = useAuth();
  const { bets, addBet, updateBet, deleteBet } = useBets();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [showAddBetModal, setShowAddBetModal] = useState<boolean>(false);
  const [showEditBetModal, setShowEditBetModal] = useState<string | null>(null);
  const [opponent, setOpponent] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [betAmount, setBetAmount] = useState<string>('');
  const [betDate, setBetDate] = useState<string>('');
  const [won, setWon] = useState<boolean | null>(null);

  const userBets = bets.filter(b => b.userId === currentUser?.id);
  const totalWon = userBets.filter(b => b.won).reduce((sum, bet) => sum + bet.amount, 0);
  const totalLost = userBets.filter(b => !b.won).reduce((sum, bet) => sum + bet.amount, 0);
  const netBets = totalWon - totalLost;

  const handleCurrencyChange = (text: string, setter: (value: string) => void) => {
    const numbers = text.replace(/[^0-9]/g, '');
    setter(numbers);
  };

  const handleDateChange = (text: string) => {
    const numbers = text.replace(/[^0-9]/g, '');
    if (numbers.length <= 8) {
      setBetDate(numbers);
    }
  };

  const displayDate = (value: string): string => {
    if (!value) return '';
    const numbers = value.replace(/[^0-9]/g, '');
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 4) return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
    return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`;
  };

  const displayCurrency = (value: string): string => {
    if (!value) return '';
    const amount = parseFloat(value) / 100;
    return `${amount.toFixed(2)}`;
  };

  const handleAddBet = async () => {
    if (!currentUser || !opponent.trim() || !description.trim() || !betAmount) return;

    const amount = parseFloat(betAmount) / 100;
    let dateToUse: string | undefined = undefined;
    
    if (betDate) {
      const numbers = betDate.replace(/[^0-9]/g, '');
      if (numbers.length === 8) {
        const month = numbers.slice(0, 2);
        const day = numbers.slice(2, 4);
        const year = numbers.slice(4, 8);
        dateToUse = new Date(`${year}-${month}-${day}`).toISOString();
      }
    }
    
    await addBet(currentUser.id, opponent.trim(), description.trim(), amount, won ?? false, dateToUse);
    setOpponent('');
    setDescription('');
    setBetAmount('');
    setBetDate('');
    setWon(null);
    setShowAddBetModal(false);
  };

  const handleEditBet = (betId: string) => {
    const bet = bets.find(b => b.id === betId);
    if (!bet) return;

    setOpponent(bet.opponent);
    setDescription(bet.description);
    setBetAmount((bet.amount * 100).toString());
    setWon(bet.won);
    
    const date = new Date(bet.betDate);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = String(date.getFullYear());
    setBetDate(`${month}${day}${year}`);
    
    setShowEditBetModal(betId);
  };

  const handleUpdateBet = async () => {
    if (!showEditBetModal || !opponent.trim() || !description.trim() || !betAmount) return;

    const amount = parseFloat(betAmount) / 100;
    let dateToUse = new Date().toISOString();
    
    if (betDate) {
      const numbers = betDate.replace(/[^0-9]/g, '');
      if (numbers.length === 8) {
        const month = numbers.slice(0, 2);
        const day = numbers.slice(2, 4);
        const year = numbers.slice(4, 8);
        dateToUse = new Date(`${year}-${month}-${day}`).toISOString();
      }
    }
    
    await updateBet(showEditBetModal, opponent.trim(), description.trim(), amount, won ?? false, dateToUse);
    setOpponent('');
    setDescription('');
    setBetAmount('');
    setBetDate('');
    setWon(null);
    setShowEditBetModal(null);
  };

  const handleDeleteBet = (betId: string) => {
    Alert.alert(
      'Delete Bet',
      'Are you sure you want to delete this bet? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteBet(betId),
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

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
          <Pressable
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.backButtonPressed,
            ]}
            onPress={() => router.back()}
            testID="back-button"
          >
            <ArrowLeft size={24} color="#FFFFFF" />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>MY PRIVATE BETS</Text>
            <Text style={[styles.headerTotal, netBets >= 0 ? styles.positiveNet : styles.negativeNet]}>
              {netBets >= 0 ? '+' : ''}${netBets.toFixed(2)}
            </Text>
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.addButton,
              pressed && styles.addButtonPressed,
            ]}
            onPress={() => setShowAddBetModal(true)}
            testID="add-bet-button"
          >
            <Plus size={24} color="#FFFFFF" />
          </Pressable>
        </View>

        <ScrollView
          style={styles.scrollContent}
          contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 80 }]}
          showsVerticalScrollIndicator={false}
        >
          {userBets.length === 0 ? (
            <View style={styles.emptyState}>
              <Trophy size={48} color="rgba(36, 0, 70, 0.4)" />
              <Text style={styles.emptyStateText}>No bets yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Track your personal bets with friends or online
              </Text>
            </View>
          ) : (
            <View style={styles.betsList}>
              {userBets.map((bet) => (
                <View key={bet.id} style={styles.betCard}>
                  <View style={styles.betHeader}>
                    <View style={styles.betHeaderLeft}>
                      <View style={styles.betTitleRow}>
                        <Text style={styles.opponentName}>{bet.opponent}</Text>
                        <View style={[styles.resultBadge, bet.won ? styles.wonBadge : styles.lostBadge]}>
                          <Text style={styles.resultBadgeText}>{bet.won ? 'WON' : 'LOST'}</Text>
                        </View>
                      </View>
                      <Text style={styles.betDescription}>{bet.description}</Text>
                      <Text style={styles.betDate}>{formatDate(bet.betDate)}</Text>
                    </View>
                    <View style={styles.betHeaderActions}>
                      <Pressable
                        onPress={() => handleEditBet(bet.id)}
                        style={({ pressed }) => [
                          styles.editButton,
                          pressed && styles.editButtonPressed,
                        ]}
                        testID={`edit-bet-${bet.id}`}
                      >
                        <Pencil size={18} color="#9D4EDD" />
                      </Pressable>
                      <Pressable
                        onPress={() => handleDeleteBet(bet.id)}
                        style={({ pressed }) => [
                          styles.deleteButton,
                          pressed && styles.deleteButtonPressed,
                        ]}
                        testID={`delete-bet-${bet.id}`}
                      >
                        <Trash2 size={20} color="#000000" />
                      </Pressable>
                    </View>
                  </View>

                  <View style={styles.betAmount}>
                    <Text style={styles.betAmountLabel}>Amount</Text>
                    <Text style={[styles.betAmountValue, bet.won ? styles.wonAmount : styles.lostAmount]}>
                      {bet.won ? '+' : '-'}${bet.amount.toFixed(2)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
          <Pressable
            style={({ pressed }) => [
              styles.footerButton,
              pressed && styles.footerButtonPressed,
            ]}
            onPress={() => router.push('/lotto')}
            testID="footer-lotto-button"
          >
            <Text style={styles.footerButtonText}>Lotto</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.footerButton,
              pressed && styles.footerButtonPressed,
            ]}
            onPress={() => router.push('/sports')}
            testID="footer-sports-button"
          >
            <Text style={styles.footerButtonText}>Sports</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.footerButton,
              pressed && styles.footerButtonPressed,
            ]}
            onPress={() => router.push('/summary')}
            testID="footer-summary-button"
          >
            <Text style={styles.footerButtonText}>Summary</Text>
          </Pressable>
        </View>
      </View>

      <Modal
        visible={showAddBetModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddBetModal(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={styles.modal}>
                <Text style={styles.modalTitle}>Add New Bet</Text>
                
                <View style={styles.modalBody}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Opponent / Platform</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Friend name or online platform"
                      placeholderTextColor="rgba(36, 0, 70, 0.4)"
                      value={opponent}
                      onChangeText={setOpponent}
                      testID="opponent-input"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>What was the bet?</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Description of the bet"
                      placeholderTextColor="rgba(36, 0, 70, 0.4)"
                      value={description}
                      onChangeText={setDescription}
                      testID="description-input"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Bet Amount</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="$0.00"
                      placeholderTextColor="rgba(36, 0, 70, 0.4)"
                      value={displayCurrency(betAmount)}
                      onChangeText={(text) => handleCurrencyChange(text, setBetAmount)}
                      keyboardType="numeric"
                      testID="bet-amount-input"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Date of Bet (Optional)</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="MM/DD/YYYY"
                      placeholderTextColor="rgba(36, 0, 70, 0.4)"
                      value={displayDate(betDate)}
                      onChangeText={handleDateChange}
                      keyboardType="numeric"
                      testID="bet-date-input"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Result</Text>
                    <View style={styles.resultButtonsContainer}>
                      <Pressable
                        onPress={() => setWon(false)}
                        style={({ pressed }) => [
                          styles.resultButton,
                          won === false && styles.resultButtonSelected,
                          won === false && styles.lostButtonSelected,
                          pressed && styles.resultButtonPressed,
                        ]}
                        testID="lost-button"
                      >
                        <Text style={[styles.resultButtonText, won === false && styles.resultButtonTextSelected]}>Lost</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => setWon(true)}
                        style={({ pressed }) => [
                          styles.resultButton,
                          won === true && styles.resultButtonSelected,
                          won === true && styles.wonButtonSelected,
                          pressed && styles.resultButtonPressed,
                        ]}
                        testID="won-button"
                      >
                        <Text style={[styles.resultButtonText, won === true && styles.resultButtonTextSelected]}>Won</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>

                <View style={styles.modalFooter}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.modalButton,
                      styles.cancelButton,
                      pressed && styles.modalButtonPressed,
                    ]}
                    onPress={() => {
                      setOpponent('');
                      setDescription('');
                      setBetAmount('');
                      setBetDate('');
                      setWon(null);
                      setShowAddBetModal(false);
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [
                      styles.modalButton,
                      styles.confirmButton,
                      (!opponent.trim() || !description.trim() || !betAmount) && styles.confirmButtonDisabled,
                      pressed && styles.modalButtonPressed,
                    ]}
                    onPress={handleAddBet}
                    disabled={!opponent.trim() || !description.trim() || !betAmount}
                    testID="confirm-add-bet"
                  >
                    <Text style={styles.confirmButtonText}>Add Bet</Text>
                  </Pressable>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal
        visible={!!showEditBetModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditBetModal(null)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={styles.modal}>
                <Text style={styles.modalTitle}>Edit Bet</Text>
                
                <View style={styles.modalBody}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Opponent / Platform</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Friend name or online platform"
                      placeholderTextColor="rgba(36, 0, 70, 0.4)"
                      value={opponent}
                      onChangeText={setOpponent}
                      testID="edit-opponent-input"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>What was the bet?</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Description of the bet"
                      placeholderTextColor="rgba(36, 0, 70, 0.4)"
                      value={description}
                      onChangeText={setDescription}
                      testID="edit-description-input"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Bet Amount</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="$0.00"
                      placeholderTextColor="rgba(36, 0, 70, 0.4)"
                      value={displayCurrency(betAmount)}
                      onChangeText={(text) => handleCurrencyChange(text, setBetAmount)}
                      keyboardType="numeric"
                      testID="edit-bet-amount-input"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Date of Bet</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="MM/DD/YYYY"
                      placeholderTextColor="rgba(36, 0, 70, 0.4)"
                      value={displayDate(betDate)}
                      onChangeText={handleDateChange}
                      keyboardType="numeric"
                      testID="edit-bet-date-input"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Result</Text>
                    <View style={styles.resultButtonsContainer}>
                      <Pressable
                        onPress={() => setWon(false)}
                        style={({ pressed }) => [
                          styles.resultButton,
                          won === false && styles.resultButtonSelected,
                          won === false && styles.lostButtonSelected,
                          pressed && styles.resultButtonPressed,
                        ]}
                        testID="edit-lost-button"
                      >
                        <Text style={[styles.resultButtonText, won === false && styles.resultButtonTextSelected]}>Lost</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => setWon(true)}
                        style={({ pressed }) => [
                          styles.resultButton,
                          won === true && styles.resultButtonSelected,
                          won === true && styles.wonButtonSelected,
                          pressed && styles.resultButtonPressed,
                        ]}
                        testID="edit-won-button"
                      >
                        <Text style={[styles.resultButtonText, won === true && styles.resultButtonTextSelected]}>Won</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>

                <View style={styles.modalFooter}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.modalButton,
                      styles.cancelButton,
                      pressed && styles.modalButtonPressed,
                    ]}
                    onPress={() => {
                      setOpponent('');
                      setDescription('');
                      setBetAmount('');
                      setBetDate('');
                      setWon(null);
                      setShowEditBetModal(null);
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [
                      styles.modalButton,
                      styles.confirmButton,
                      (!opponent.trim() || !description.trim() || !betAmount) && styles.confirmButtonDisabled,
                      pressed && styles.modalButtonPressed,
                    ]}
                    onPress={handleUpdateBet}
                    disabled={!opponent.trim() || !description.trim() || !betAmount}
                    testID="confirm-edit-bet"
                  >
                    <Text style={styles.confirmButtonText}>Update Bet</Text>
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
    minHeight: 155,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(157, 78, 221, 0.9)',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButtonPressed: {
    opacity: 0.6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  headerTotal: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  positiveNet: {
    color: '#FFD700',
  },
  negativeNet: {
    color: '#EF4444',
  },
  addButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  addButtonPressed: {
    opacity: 0.6,
  },
  scrollContent: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    gap: 16,
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
  betsList: {
    gap: 16,
  },
  betCard: {
    backgroundColor: 'rgba(220, 190, 255, 0.95)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    gap: 16,
  },
  betHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  betHeaderLeft: {
    flex: 1,
    gap: 6,
  },
  betTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  betHeaderActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(157, 78, 221, 0.15)',
  },
  editButtonPressed: {
    opacity: 0.7,
  },
  opponentName: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#240046',
  },
  betDescription: {
    fontSize: 14,
    color: 'rgba(36, 0, 70, 0.85)',
    fontWeight: '500' as const,
  },
  betDate: {
    fontSize: 12,
    color: 'rgba(36, 0, 70, 0.7)',
    fontWeight: '500' as const,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  deleteButtonPressed: {
    opacity: 0.7,
  },
  resultBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  wonBadge: {
    backgroundColor: '#10B981',
  },
  lostBadge: {
    backgroundColor: '#EF4444',
  },
  resultBadgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  betAmount: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(157, 78, 221, 0.2)',
  },
  betAmountLabel: {
    fontSize: 13,
    color: 'rgba(36, 0, 70, 0.8)',
    fontWeight: '600' as const,
  },
  betAmountValue: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  wonAmount: {
    color: '#FFD700',
  },
  lostAmount: {
    color: '#EF4444',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#240046',
    padding: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(36, 0, 70, 0.1)',
  },
  modalBody: {
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
  resultButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  resultButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 50,
    alignItems: 'center',
    backgroundColor: 'rgba(157, 78, 221, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(157, 78, 221, 0.3)',
  },
  resultButtonSelected: {
    borderWidth: 2,
  },
  lostButtonSelected: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  wonButtonSelected: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  resultButtonPressed: {
    opacity: 0.7,
  },
  resultButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#9D4EDD',
  },
  resultButtonTextSelected: {
    color: '#FFFFFF',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(36, 0, 70, 0.1)',
  },
  modalButton: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  modalButtonPressed: {
    opacity: 0.7,
  },
  cancelButton: {
    backgroundColor: 'rgba(157, 78, 221, 0.1)',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#9D4EDD',
  },
  confirmButton: {
    backgroundColor: '#9D4EDD',
  },
  confirmButtonDisabled: {
    backgroundColor: 'rgba(157, 78, 221, 0.3)',
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 12,
    backgroundColor: 'transparent',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  footerButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(157, 78, 221, 0.5)',
  },
  footerButtonActive: {
    backgroundColor: '#5A189A',
    borderColor: '#5A189A',
  },
  footerButtonPressed: {
    opacity: 0.7,
  },
  footerButtonText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  footerButtonTextActive: {
    color: '#FFFFFF',
  },
});
