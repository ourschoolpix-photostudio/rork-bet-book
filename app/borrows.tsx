import { useAuth } from '@/contexts/AuthContext';
import { useBorrows } from '@/contexts/BorrowContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowLeft, Plus, Trash2, DollarSign, Pencil } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, ImageBackground, Keyboard, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableWithoutFeedback, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function BorrowsScreen() {
  const { currentUser, sessions } = useAuth();
  const { borrows, addBorrow, addPayment, deleteBorrow, deletePayment, updateBorrow } = useBorrows();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [showAddBorrowModal, setShowAddBorrowModal] = useState<boolean>(false);
  const [showEditBorrowModal, setShowEditBorrowModal] = useState<string | null>(null);
  const [showAddPaymentModal, setShowAddPaymentModal] = useState<string | null>(null);
  const [lenderName, setLenderName] = useState<string>('');
  const [borrowAmount, setBorrowAmount] = useState<string>('');
  const [borrowDate, setBorrowDate] = useState<string>('');
  const [paymentAmount, setPaymentAmount] = useState<string>('');

  const userBorrows = borrows.filter(b => b.userId === currentUser?.id);
  const totalBorrowsRemaining = userBorrows.reduce((sum, borrow) => sum + (borrow.amount - borrow.amountPaid), 0);

  const handleCurrencyChange = (text: string, setter: (value: string) => void) => {
    const numbers = text.replace(/[^0-9]/g, '');
    setter(numbers);
  };

  const handleDateChange = (text: string) => {
    const numbers = text.replace(/[^0-9]/g, '');
    if (numbers.length <= 8) {
      setBorrowDate(numbers);
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

  const handleAddBorrow = async () => {
    if (!currentUser || !lenderName.trim() || !borrowAmount) return;

    const amount = parseFloat(borrowAmount) / 100;
    let dateToUse: string | undefined = undefined;
    
    if (borrowDate) {
      const numbers = borrowDate.replace(/[^0-9]/g, '');
      if (numbers.length === 8) {
        const month = numbers.slice(0, 2);
        const day = numbers.slice(2, 4);
        const year = numbers.slice(4, 8);
        dateToUse = new Date(`${year}-${month}-${day}`).toISOString();
      }
    }
    
    await addBorrow(currentUser.id, lenderName.trim(), amount, dateToUse);
    setLenderName('');
    setBorrowAmount('');
    setBorrowDate('');
    setShowAddBorrowModal(false);
  };

  const handleAddPayment = async (borrowId: string) => {
    if (!paymentAmount) return;

    const amount = parseFloat(paymentAmount) / 100;
    await addPayment(borrowId, amount);
    setPaymentAmount('');
    setShowAddPaymentModal(null);
  };

  const handleEditBorrow = (borrowId: string) => {
    const borrow = borrows.find(b => b.id === borrowId);
    if (!borrow) return;

    setLenderName(borrow.lenderName);
    setBorrowAmount((borrow.amount * 100).toString());
    
    const date = new Date(borrow.borrowDate);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = String(date.getFullYear());
    setBorrowDate(`${month}${day}${year}`);
    
    setShowEditBorrowModal(borrowId);
  };

  const handleUpdateBorrow = async () => {
    if (!showEditBorrowModal || !lenderName.trim() || !borrowAmount) return;

    const amount = parseFloat(borrowAmount) / 100;
    let dateToUse = new Date().toISOString();
    
    if (borrowDate) {
      const numbers = borrowDate.replace(/[^0-9]/g, '');
      if (numbers.length === 8) {
        const month = numbers.slice(0, 2);
        const day = numbers.slice(2, 4);
        const year = numbers.slice(4, 8);
        dateToUse = new Date(`${year}-${month}-${day}`).toISOString();
      }
    }
    
    await updateBorrow(showEditBorrowModal, lenderName.trim(), amount, dateToUse);
    setLenderName('');
    setBorrowAmount('');
    setBorrowDate('');
    setShowEditBorrowModal(null);
  };

  const handleDeleteBorrow = (borrowId: string) => {
    Alert.alert(
      'Delete Borrow',
      'Are you sure you want to delete this borrow record? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteBorrow(borrowId),
        },
      ]
    );
  };

  const handleDeletePayment = (borrowId: string, paymentId: string) => {
    Alert.alert(
      'Delete Payment',
      'Are you sure you want to delete this payment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deletePayment(borrowId, paymentId),
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
            <Text style={styles.headerTitle}>BORROW</Text>
            <Text style={styles.headerTotal}>${totalBorrowsRemaining.toFixed(2)}</Text>
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.addButton,
              pressed && styles.addButtonPressed,
            ]}
            onPress={() => setShowAddBorrowModal(true)}
            testID="add-borrow-button"
          >
            <Plus size={24} color="#FFFFFF" />
          </Pressable>
        </View>

        <ScrollView
          style={styles.scrollContent}
          contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
        >
          {userBorrows.length === 0 ? (
            <View style={styles.emptyState}>
              <DollarSign size={48} color="rgba(36, 0, 70, 0.4)" />
              <Text style={styles.emptyStateText}>No borrows yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Track money you&apos;ve borrowed from others
              </Text>
            </View>
          ) : (
            <View style={styles.borrowsList}>
              {userBorrows.map((borrow) => {
                const remaining = borrow.amount - borrow.amountPaid;
                const isPaidOff = remaining <= 0;

                return (
                  <View key={borrow.id} style={styles.borrowCard}>
                    <View style={styles.borrowHeader}>
                      <View style={styles.borrowHeaderLeft}>
                        <Text style={styles.lenderName}>{borrow.lenderName}</Text>
                        <Text style={styles.borrowDate}>Borrowed on {formatDate(borrow.borrowDate)}</Text>
                        {borrow.sessionId && (() => {
                          const linkedSession = sessions.find(s => s.id === borrow.sessionId);
                          if (linkedSession) {
                            return (
                              <Text style={styles.linkedSessionText}>
                                🔗 Linked to session at {linkedSession.casinoName}
                              </Text>
                            );
                          }
                          return null;
                        })()}
                        {borrow.description && (
                          <Text style={styles.borrowDescription}>{borrow.description}</Text>
                        )}
                      </View>
                      <View style={styles.borrowHeaderActions}>
                        <Pressable
                          onPress={() => handleEditBorrow(borrow.id)}
                          style={({ pressed }) => [
                            styles.editButton,
                            pressed && styles.editButtonPressed,
                          ]}
                          testID={`edit-borrow-${borrow.id}`}
                        >
                          <Pencil size={18} color="#9D4EDD" />
                        </Pressable>
                        <Pressable
                          onPress={() => handleDeleteBorrow(borrow.id)}
                          style={({ pressed }) => [
                            styles.deleteButton,
                            pressed && styles.deleteButtonPressed,
                          ]}
                          testID={`delete-borrow-${borrow.id}`}
                        >
                          <Trash2 size={20} color="#000000" />
                        </Pressable>
                      </View>
                    </View>

                    <View style={styles.borrowStats}>
                      <View style={styles.borrowStatItem}>
                        <Text style={styles.borrowStatLabel}>Borrowed</Text>
                        <Text style={styles.borrowStatValue}>${borrow.amount.toFixed(2)}</Text>
                      </View>
                      <View style={styles.borrowStatItem}>
                        <Text style={styles.borrowStatLabel}>Paid</Text>
                        <Text style={styles.borrowStatValue}>${borrow.amountPaid.toFixed(2)}</Text>
                      </View>
                      <View style={styles.borrowStatItem}>
                        <Text style={styles.borrowStatLabel}>Remaining</Text>
                        <Text style={[styles.borrowStatValue, isPaidOff ? styles.paidOffText : styles.remainingText]}>
                          ${remaining.toFixed(2)}
                        </Text>
                      </View>
                    </View>

                    {borrow.payments.length > 0 && (
                      <View style={styles.paymentsSection}>
                        <Text style={styles.paymentsSectionTitle}>Payment History</Text>
                        {borrow.payments.map((payment) => (
                          <View key={payment.id} style={styles.paymentRow}>
                            <View style={styles.paymentInfo}>
                              <Text style={styles.paymentAmount}>${payment.amount.toFixed(2)}</Text>
                              <Text style={styles.paymentDate}>{formatDate(payment.date)}</Text>
                            </View>
                            <Pressable
                              onPress={() => handleDeletePayment(borrow.id, payment.id)}
                              style={({ pressed }) => [
                                styles.deletePaymentButton,
                                pressed && styles.deletePaymentButtonPressed,
                              ]}
                              testID={`delete-payment-${payment.id}`}
                            >
                              <Trash2 size={16} color="rgba(36, 0, 70, 0.6)" />
                            </Pressable>
                          </View>
                        ))}
                      </View>
                    )}

                    {!isPaidOff && (
                      <Pressable
                        style={({ pressed }) => [
                          styles.addPaymentButton,
                          pressed && styles.addPaymentButtonPressed,
                        ]}
                        onPress={() => setShowAddPaymentModal(borrow.id)}
                        testID={`add-payment-${borrow.id}`}
                      >
                        <Plus size={18} color="#9D4EDD" />
                        <Text style={styles.addPaymentButtonText}>Add Payment</Text>
                      </Pressable>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      </View>

      <Modal
        visible={showAddBorrowModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddBorrowModal(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={styles.modal}>
                <Text style={styles.modalTitle}>Add New Borrow</Text>
                
                <View style={styles.modalBody}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Lender Name</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Enter name"
                      placeholderTextColor="rgba(36, 0, 70, 0.4)"
                      value={lenderName}
                      onChangeText={setLenderName}
                      testID="lender-name-input"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Borrow Amount</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="$0.00"
                      placeholderTextColor="rgba(36, 0, 70, 0.4)"
                      value={displayCurrency(borrowAmount)}
                      onChangeText={(text) => handleCurrencyChange(text, setBorrowAmount)}
                      keyboardType="numeric"
                      testID="borrow-amount-input"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Date of Borrow (Optional)</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="MM/DD/YYYY"
                      placeholderTextColor="rgba(36, 0, 70, 0.4)"
                      value={displayDate(borrowDate)}
                      onChangeText={handleDateChange}
                      keyboardType="numeric"
                      testID="borrow-date-input"
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
                      setLenderName('');
                      setBorrowAmount('');
                      setBorrowDate('');
                      setShowAddBorrowModal(false);
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [
                      styles.modalButton,
                      styles.confirmButton,
                      (!lenderName.trim() || !borrowAmount) && styles.confirmButtonDisabled,
                      pressed && styles.modalButtonPressed,
                    ]}
                    onPress={handleAddBorrow}
                    disabled={!lenderName.trim() || !borrowAmount}
                    testID="confirm-add-borrow"
                  >
                    <Text style={styles.confirmButtonText}>Add Borrow</Text>
                  </Pressable>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal
        visible={!!showAddPaymentModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddPaymentModal(null)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={styles.modal}>
                <Text style={styles.modalTitle}>Add Payment</Text>
                
                <View style={styles.modalBody}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Payment Amount</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="$0.00"
                      placeholderTextColor="rgba(36, 0, 70, 0.4)"
                      value={displayCurrency(paymentAmount)}
                      onChangeText={(text) => handleCurrencyChange(text, setPaymentAmount)}
                      keyboardType="numeric"
                      testID="payment-amount-input"
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
                      setPaymentAmount('');
                      setShowAddPaymentModal(null);
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [
                      styles.modalButton,
                      styles.confirmButton,
                      !paymentAmount && styles.confirmButtonDisabled,
                      pressed && styles.modalButtonPressed,
                    ]}
                    onPress={() => showAddPaymentModal && handleAddPayment(showAddPaymentModal)}
                    disabled={!paymentAmount}
                    testID="confirm-add-payment"
                  >
                    <Text style={styles.confirmButtonText}>Add Payment</Text>
                  </Pressable>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal
        visible={!!showEditBorrowModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditBorrowModal(null)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={styles.modal}>
                <Text style={styles.modalTitle}>Edit Borrow</Text>
                
                <View style={styles.modalBody}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Lender Name</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Enter name"
                      placeholderTextColor="rgba(36, 0, 70, 0.4)"
                      value={lenderName}
                      onChangeText={setLenderName}
                      testID="edit-lender-name-input"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Borrow Amount</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="$0.00"
                      placeholderTextColor="rgba(36, 0, 70, 0.4)"
                      value={displayCurrency(borrowAmount)}
                      onChangeText={(text) => handleCurrencyChange(text, setBorrowAmount)}
                      keyboardType="numeric"
                      testID="edit-borrow-amount-input"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Date of Borrow</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="MM/DD/YYYY"
                      placeholderTextColor="rgba(36, 0, 70, 0.4)"
                      value={displayDate(borrowDate)}
                      onChangeText={handleDateChange}
                      keyboardType="numeric"
                      testID="edit-borrow-date-input"
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
                      setLenderName('');
                      setBorrowAmount('');
                      setBorrowDate('');
                      setShowEditBorrowModal(null);
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [
                      styles.modalButton,
                      styles.confirmButton,
                      (!lenderName.trim() || !borrowAmount) && styles.confirmButtonDisabled,
                      pressed && styles.modalButtonPressed,
                    ]}
                    onPress={handleUpdateBorrow}
                    disabled={!lenderName.trim() || !borrowAmount}
                    testID="confirm-edit-borrow"
                  >
                    <Text style={styles.confirmButtonText}>Update Borrow</Text>
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
    color: 'rgba(255, 255, 255, 0.9)',
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
  borrowsList: {
    gap: 16,
  },
  borrowCard: {
    backgroundColor: 'rgba(220, 190, 255, 0.95)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    gap: 16,
  },
  borrowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  borrowHeaderLeft: {
    flex: 1,
    gap: 4,
  },
  borrowHeaderActions: {
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
  lenderName: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#240046',
  },
  borrowDate: {
    fontSize: 12,
    color: 'rgba(36, 0, 70, 0.7)',
    fontWeight: '500' as const,
  },
  linkedSessionText: {
    fontSize: 11,
    color: '#9D4EDD',
    fontWeight: '600' as const,
    marginTop: 2,
  },
  borrowDescription: {
    fontSize: 11,
    color: 'rgba(36, 0, 70, 0.6)',
    fontStyle: 'italic' as const,
    marginTop: 2,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  deleteButtonPressed: {
    opacity: 0.7,
  },
  borrowStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  borrowStatItem: {
    flex: 1,
    gap: 4,
  },
  borrowStatLabel: {
    fontSize: 11,
    color: 'rgba(36, 0, 70, 0.8)',
    fontWeight: '500' as const,
  },
  borrowStatValue: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#240046',
  },
  remainingText: {
    color: '#EF4444',
  },
  paidOffText: {
    color: '#047857',
  },
  paymentsSection: {
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(157, 78, 221, 0.2)',
  },
  paymentsSectionTitle: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#240046',
    marginBottom: 4,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(157, 78, 221, 0.08)',
    borderRadius: 8,
  },
  paymentInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentAmount: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#240046',
  },
  paymentDate: {
    fontSize: 11,
    color: 'rgba(36, 0, 70, 0.7)',
    fontWeight: '500' as const,
  },
  deletePaymentButton: {
    padding: 4,
    marginLeft: 8,
  },
  deletePaymentButtonPressed: {
    opacity: 0.6,
  },
  addPaymentButton: {
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
  addPaymentButtonPressed: {
    opacity: 0.7,
  },
  addPaymentButtonText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#9D4EDD',
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
