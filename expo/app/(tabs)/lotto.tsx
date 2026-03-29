import { useAuth } from '@/contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, Trash2, Pencil, Ticket } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, ImageBackground, Keyboard, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableWithoutFeedback, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface LottoEntry {
  id: string;
  userId: string;
  gameName: string;
  ticketCost: number;
  winnings: number;
  date: string;
  createdAt: string;
}

export default function LottoScreen() {
  const { currentUser } = useAuth();
  const insets = useSafeAreaInsets();
  const [entries, setEntries] = useState<LottoEntry[]>([]);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<string | null>(null);
  const [gameName, setGameName] = useState<string>('');
  const [ticketCost, setTicketCost] = useState<string>('');
  const [winnings, setWinnings] = useState<string>('');
  const [entryDate, setEntryDate] = useState<string>('');

  const userEntries = entries.filter(e => e.userId === currentUser?.id);
  const totalSpent = userEntries.reduce((sum, e) => sum + e.ticketCost, 0);
  const totalWon = userEntries.reduce((sum, e) => sum + e.winnings, 0);
  const netLotto = totalWon - totalSpent;

  const handleCurrencyChange = (text: string, setter: (value: string) => void) => {
    const numbers = text.replace(/[^0-9]/g, '');
    setter(numbers);
  };

  const handleDateChange = (text: string) => {
    const numbers = text.replace(/[^0-9]/g, '');
    if (numbers.length <= 8) {
      setEntryDate(numbers);
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

  const parseDateString = (dateStr: string): string => {
    if (!dateStr) return new Date().toISOString();
    const numbers = dateStr.replace(/[^0-9]/g, '');
    if (numbers.length === 8) {
      const month = numbers.slice(0, 2);
      const day = numbers.slice(2, 4);
      const year = numbers.slice(4, 8);
      return new Date(`${year}-${month}-${day}`).toISOString();
    }
    return new Date().toISOString();
  };

  const resetForm = () => {
    setGameName('');
    setTicketCost('');
    setWinnings('');
    setEntryDate('');
  };

  const handleAddEntry = () => {
    if (!currentUser || !gameName.trim() || !ticketCost) return;

    const cost = parseFloat(ticketCost) / 100;
    const won = winnings ? parseFloat(winnings) / 100 : 0;

    const newEntry: LottoEntry = {
      id: Date.now().toString(),
      userId: currentUser.id,
      gameName: gameName.trim(),
      ticketCost: cost,
      winnings: won,
      date: parseDateString(entryDate),
      createdAt: new Date().toISOString(),
    };

    setEntries(prev => [newEntry, ...prev]);
    resetForm();
    setShowAddModal(false);
  };

  const handleEditEntry = (entryId: string) => {
    const entry = entries.find(e => e.id === entryId);
    if (!entry) return;

    setGameName(entry.gameName);
    setTicketCost((entry.ticketCost * 100).toString());
    setWinnings((entry.winnings * 100).toString());

    const date = new Date(entry.date);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = String(date.getFullYear());
    setEntryDate(`${month}${day}${year}`);

    setShowEditModal(entryId);
  };

  const handleUpdateEntry = () => {
    if (!showEditModal || !gameName.trim() || !ticketCost) return;

    const cost = parseFloat(ticketCost) / 100;
    const won = winnings ? parseFloat(winnings) / 100 : 0;

    setEntries(prev =>
      prev.map(e =>
        e.id === showEditModal
          ? { ...e, gameName: gameName.trim(), ticketCost: cost, winnings: won, date: parseDateString(entryDate) }
          : e
      )
    );
    resetForm();
    setShowEditModal(null);
  };

  const handleDeleteEntry = (entryId: string) => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this lotto entry? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => setEntries(prev => prev.filter(e => e.id !== entryId)),
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
        source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/ezt9mspxd5vii68gqdiz1' }}
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
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>LOTTO TRACKER</Text>
            <Text style={[styles.headerTotal, netLotto >= 0 ? styles.positiveNet : styles.negativeNet]}>
              {netLotto >= 0 ? '+' : ''}${netLotto.toFixed(2)}
            </Text>
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.addButton,
              pressed && styles.addButtonPressed,
            ]}
            onPress={() => setShowAddModal(true)}
            testID="add-lotto-button"
          >
            <Plus size={24} color="#FFFFFF" />
          </Pressable>
        </View>

        <ScrollView
          style={styles.scrollContent}
          contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 80 }]}
          showsVerticalScrollIndicator={false}
        >
          {userEntries.length === 0 ? (
            <View style={styles.emptyState}>
              <Ticket size={48} color="rgba(36, 0, 70, 0.4)" />
              <Text style={styles.emptyStateText}>No lotto entries yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Track your lottery tickets and winnings
              </Text>
            </View>
          ) : (
            <View style={styles.entryList}>
              {userEntries.map((entry) => {
                const net = entry.winnings - entry.ticketCost;
                return (
                  <View key={entry.id} style={styles.entryCard}>
                    <View style={styles.entryHeader}>
                      <View style={styles.entryHeaderLeft}>
                        <View style={styles.entryTitleRow}>
                          <Text style={styles.entryName}>{entry.gameName}</Text>
                          <View style={[styles.resultBadge, net >= 0 ? styles.wonBadge : styles.lostBadge]}>
                            <Text style={styles.resultBadgeText}>{net >= 0 ? 'WIN' : 'LOSS'}</Text>
                          </View>
                        </View>
                        <Text style={styles.entryDate}>{formatDate(entry.date)}</Text>
                      </View>
                      <View style={styles.entryHeaderActions}>
                        <Pressable
                          onPress={() => handleEditEntry(entry.id)}
                          style={({ pressed }) => [
                            styles.editButton,
                            pressed && styles.editButtonPressed,
                          ]}
                          testID={`edit-lotto-${entry.id}`}
                        >
                          <Pencil size={18} color="#9D4EDD" />
                        </Pressable>
                        <Pressable
                          onPress={() => handleDeleteEntry(entry.id)}
                          style={({ pressed }) => [
                            styles.deleteButton,
                            pressed && styles.deleteButtonPressed,
                          ]}
                          testID={`delete-lotto-${entry.id}`}
                        >
                          <Trash2 size={20} color="#000000" />
                        </Pressable>
                      </View>
                    </View>

                    <View style={styles.entryAmounts}>
                      <View style={styles.amountRow}>
                        <Text style={styles.amountLabel}>Ticket Cost</Text>
                        <Text style={styles.amountSpent}>-${entry.ticketCost.toFixed(2)}</Text>
                      </View>
                      <View style={styles.amountRow}>
                        <Text style={styles.amountLabel}>Winnings</Text>
                        <Text style={styles.amountWon}>+${entry.winnings.toFixed(2)}</Text>
                      </View>
                      <View style={[styles.amountRow, styles.netRow]}>
                        <Text style={styles.netLabel}>Net</Text>
                        <Text style={[styles.netValue, net >= 0 ? styles.positiveNet : styles.negativeNet]}>
                          {net >= 0 ? '+' : ''}${net.toFixed(2)}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      </View>

      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={styles.modal}>
                <Text style={styles.modalTitle}>Add Lotto Entry</Text>

                <View style={styles.modalBody}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Game Name</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Powerball, Mega Millions, etc."
                      placeholderTextColor="rgba(36, 0, 70, 0.4)"
                      value={gameName}
                      onChangeText={setGameName}
                      testID="lotto-game-input"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Ticket Cost</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="$0.00"
                      placeholderTextColor="rgba(36, 0, 70, 0.4)"
                      value={displayCurrency(ticketCost)}
                      onChangeText={(text) => handleCurrencyChange(text, setTicketCost)}
                      keyboardType="numeric"
                      testID="lotto-cost-input"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Winnings</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="$0.00"
                      placeholderTextColor="rgba(36, 0, 70, 0.4)"
                      value={displayCurrency(winnings)}
                      onChangeText={(text) => handleCurrencyChange(text, setWinnings)}
                      keyboardType="numeric"
                      testID="lotto-winnings-input"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Date (Optional)</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="MM/DD/YYYY"
                      placeholderTextColor="rgba(36, 0, 70, 0.4)"
                      value={displayDate(entryDate)}
                      onChangeText={handleDateChange}
                      keyboardType="numeric"
                      testID="lotto-date-input"
                    />
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
                      resetForm();
                      setShowAddModal(false);
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [
                      styles.modalButton,
                      styles.confirmButton,
                      (!gameName.trim() || !ticketCost) && styles.confirmButtonDisabled,
                      pressed && styles.modalButtonPressed,
                    ]}
                    onPress={handleAddEntry}
                    disabled={!gameName.trim() || !ticketCost}
                    testID="confirm-add-lotto"
                  >
                    <Text style={styles.confirmButtonText}>Add Entry</Text>
                  </Pressable>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal
        visible={!!showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditModal(null)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={styles.modal}>
                <Text style={styles.modalTitle}>Edit Lotto Entry</Text>

                <View style={styles.modalBody}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Game Name</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Powerball, Mega Millions, etc."
                      placeholderTextColor="rgba(36, 0, 70, 0.4)"
                      value={gameName}
                      onChangeText={setGameName}
                      testID="edit-lotto-game-input"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Ticket Cost</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="$0.00"
                      placeholderTextColor="rgba(36, 0, 70, 0.4)"
                      value={displayCurrency(ticketCost)}
                      onChangeText={(text) => handleCurrencyChange(text, setTicketCost)}
                      keyboardType="numeric"
                      testID="edit-lotto-cost-input"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Winnings</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="$0.00"
                      placeholderTextColor="rgba(36, 0, 70, 0.4)"
                      value={displayCurrency(winnings)}
                      onChangeText={(text) => handleCurrencyChange(text, setWinnings)}
                      keyboardType="numeric"
                      testID="edit-lotto-winnings-input"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Date</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="MM/DD/YYYY"
                      placeholderTextColor="rgba(36, 0, 70, 0.4)"
                      value={displayDate(entryDate)}
                      onChangeText={handleDateChange}
                      keyboardType="numeric"
                      testID="edit-lotto-date-input"
                    />
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
                      resetForm();
                      setShowEditModal(null);
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [
                      styles.modalButton,
                      styles.confirmButton,
                      (!gameName.trim() || !ticketCost) && styles.confirmButtonDisabled,
                      pressed && styles.modalButtonPressed,
                    ]}
                    onPress={handleUpdateEntry}
                    disabled={!gameName.trim() || !ticketCost}
                    testID="confirm-edit-lotto"
                  >
                    <Text style={styles.confirmButtonText}>Update Entry</Text>
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
    backgroundColor: '#3D1F66',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
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
  entryList: {
    gap: 16,
  },
  entryCard: {
    backgroundColor: 'rgba(220, 190, 255, 0.95)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    gap: 16,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  entryHeaderLeft: {
    flex: 1,
    gap: 6,
  },
  entryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  entryName: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#240046',
  },
  entryDate: {
    fontSize: 12,
    color: 'rgba(36, 0, 70, 0.7)',
    fontWeight: '500' as const,
  },
  entryHeaderActions: {
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
  entryAmounts: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(157, 78, 221, 0.2)',
    gap: 8,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 13,
    color: 'rgba(36, 0, 70, 0.8)',
    fontWeight: '600' as const,
  },
  amountSpent: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#EF4444',
  },
  amountWon: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#10B981',
  },
  netRow: {
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(157, 78, 221, 0.15)',
  },
  netLabel: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#240046',
  },
  netValue: {
    fontSize: 18,
    fontWeight: '700' as const,
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
});
