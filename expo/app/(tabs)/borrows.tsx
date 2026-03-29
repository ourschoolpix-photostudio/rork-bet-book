import { useAuth } from '@/contexts/AuthContext';
import { useBorrows } from '@/contexts/BorrowContext';
import { Borrow } from '@/types/user';
import { WALLPAPER_URL } from '@/constants/wallpaper';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, Trash2, Wallet, Pencil, DollarSign, ChevronRight } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, ImageBackground, Keyboard, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableWithoutFeedback, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function BorrowsScreen() {
  const { currentUser } = useAuth();
  const { borrows, addBorrow, addPayment, deleteBorrow, deletePayment, updateBorrow } = useBorrows();
  const insets = useSafeAreaInsets();

  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showPaymentModal, setShowPaymentModal] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState<string | null>(null);
  const [expandedBorrow, setExpandedBorrow] = useState<string | null>(null);

  const [lenderName, setLenderName] = useState<string>('');
  const [borrowAmount, setBorrowAmount] = useState<string>('');
  const [borrowDate, setBorrowDate] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [paymentAmount, setPaymentAmount] = useState<string>('');

  const userBorrows = borrows.filter(b => b.userId === currentUser?.id);
  const totalBorrowed = userBorrows.reduce((sum, b) => sum + b.amount, 0);
  const totalPaid = userBorrows.reduce((sum, b) => sum + b.amountPaid, 0);
  const totalOwed = totalBorrowed - totalPaid;

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

    await addBorrow(currentUser.id, lenderName.trim(), amount, dateToUse, undefined, description.trim() || undefined);
    resetForm();
    setShowAddModal(false);
  };

  const handleEditBorrow = (borrow: Borrow) => {
    setLenderName(borrow.lenderName);
    setBorrowAmount((borrow.amount * 100).toString());
    setDescription(borrow.description || '');
    const date = new Date(borrow.borrowDate);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = String(date.getFullYear());
    setBorrowDate(`${month}${day}${year}`);
    setShowEditModal(borrow.id);
  };

  const handleUpdateBorrow = async () => {
    if (!showEditModal || !lenderName.trim() || !borrowAmount) return;

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

    await updateBorrow(showEditModal, lenderName.trim(), amount, dateToUse);
    resetForm();
    setShowEditModal(null);
  };

  const handleAddPayment = async () => {
    if (!showPaymentModal || !paymentAmount) return;
    const amount = parseFloat(paymentAmount) / 100;
    await addPayment(showPaymentModal, amount);
    setPaymentAmount('');
    setShowPaymentModal(null);
  };

  const handleDeleteBorrow = (borrowId: string) => {
    Alert.alert(
      'Delete Borrow',
      'Are you sure you want to delete this borrow? This action cannot be undone.',
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

  const resetForm = () => {
    setLenderName('');
    setBorrowAmount('');
    setBorrowDate('');
    setDescription('');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={{ uri: WALLPAPER_URL }}
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
            <Text style={styles.headerTitle}>MY BORROWS</Text>
            <Text style={styles.headerSubtitle}>
              Owed: ${totalOwed.toFixed(2)}
            </Text>
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.addButton,
              pressed && styles.addButtonPressed,
            ]}
            onPress={() => setShowAddModal(true)}
            testID="add-borrow-button"
          >
            <Plus size={24} color="#FFFFFF" />
          </Pressable>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Borrowed</Text>
            <Text style={styles.summaryValue}>${totalBorrowed.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Paid</Text>
            <Text style={[styles.summaryValue, styles.paidValue]}>${totalPaid.toFixed(2)}</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollContent}
          contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 80 }]}
          showsVerticalScrollIndicator={false}
        >
          {userBorrows.length === 0 ? (
            <View style={styles.emptyState}>
              <Wallet size={48} color="rgba(36, 0, 70, 0.4)" />
              <Text style={styles.emptyStateText}>No borrows yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Track money you've borrowed from others
              </Text>
            </View>
          ) : (
            <View style={styles.borrowsList}>
              {userBorrows.map((borrow) => {
                const remaining = borrow.amount - borrow.amountPaid;
                const isPaidOff = remaining <= 0;
                const isExpanded = expandedBorrow === borrow.id;

                return (
                  <View key={borrow.id} style={styles.borrowCard}>
                    <Pressable
                      style={({ pressed }) => [
                        styles.borrowHeader,
                        pressed && styles.borrowHeaderPressed,
                      ]}
                      onPress={() => setExpandedBorrow(isExpanded ? null : borrow.id)}
                    >
                      <View style={styles.borrowHeaderLeft}>
                        <View style={styles.borrowTitleRow}>
                          <Text style={styles.lenderName}>{borrow.lenderName}</Text>
                          {isPaidOff && (
                            <View style={styles.paidOffBadge}>
                              <Text style={styles.paidOffBadgeText}>PAID OFF</Text>
                            </View>
                          )}
                        </View>
                        {borrow.description ? (
                          <Text style={styles.borrowDescription}>{borrow.description}</Text>
                        ) : null}
                        <Text style={styles.borrowDate}>{formatDate(borrow.borrowDate)}</Text>
                      </View>
                      <View style={styles.borrowHeaderRight}>
                        <Text style={styles.borrowAmountValue}>${borrow.amount.toFixed(2)}</Text>
                        <ChevronRight
                          size={20}
                          color="rgba(36, 0, 70, 0.5)"
                          style={{ transform: [{ rotate: isExpanded ? '90deg' : '0deg' }] }}
                        />
                      </View>
                    </Pressable>

                    {isExpanded && (
                      <View style={styles.borrowDetails}>
                        <View style={styles.borrowAmountRow}>
                          <View style={styles.amountDetail}>
                            <Text style={styles.amountDetailLabel}>Borrowed</Text>
                            <Text style={styles.amountDetailValue}>${borrow.amount.toFixed(2)}</Text>
                          </View>
                          <View style={styles.amountDetail}>
                            <Text style={styles.amountDetailLabel}>Paid Back</Text>
                            <Text style={[styles.amountDetailValue, styles.paidValue]}>${borrow.amountPaid.toFixed(2)}</Text>
                          </View>
                          <View style={styles.amountDetail}>
                            <Text style={styles.amountDetailLabel}>Remaining</Text>
                            <Text style={[styles.amountDetailValue, styles.remainingValue]}>${remaining.toFixed(2)}</Text>
                          </View>
                        </View>

                        {borrow.payments.length > 0 && (
                          <View style={styles.paymentsSection}>
                            <Text style={styles.paymentsSectionTitle}>Payments</Text>
                            {borrow.payments.map((payment) => (
                              <View key={payment.id} style={styles.paymentItem}>
                                <View>
                                  <Text style={styles.paymentAmount}>${payment.amount.toFixed(2)}</Text>
                                  <Text style={styles.paymentDate}>{formatDate(payment.date)}</Text>
                                </View>
                                <Pressable
                                  style={({ pressed }) => [
                                    styles.deletePaymentButton,
                                    pressed && styles.deletePaymentButtonPressed,
                                  ]}
                                  onPress={() => handleDeletePayment(borrow.id, payment.id)}
                                >
                                  <Trash2 size={16} color="#EF4444" />
                                </Pressable>
                              </View>
                            ))}
                          </View>
                        )}

                        <View style={styles.borrowActions}>
                          {!isPaidOff && (
                            <Pressable
                              style={({ pressed }) => [
                                styles.actionBtn,
                                styles.paymentBtn,
                                pressed && styles.actionBtnPressed,
                              ]}
                              onPress={() => setShowPaymentModal(borrow.id)}
                            >
                              <DollarSign size={16} color="#FFFFFF" />
                              <Text style={styles.actionBtnText}>Add Payment</Text>
                            </Pressable>
                          )}
                          <Pressable
                            style={({ pressed }) => [
                              styles.actionBtn,
                              styles.editBtn,
                              pressed && styles.actionBtnPressed,
                            ]}
                            onPress={() => handleEditBorrow(borrow)}
                          >
                            <Pencil size={16} color="#9D4EDD" />
                            <Text style={styles.editBtnText}>Edit</Text>
                          </Pressable>
                          <Pressable
                            style={({ pressed }) => [
                              styles.actionBtn,
                              styles.deleteBtn,
                              pressed && styles.actionBtnPressed,
                            ]}
                            onPress={() => handleDeleteBorrow(borrow.id)}
                          >
                            <Trash2 size={16} color="#EF4444" />
                            <Text style={styles.deleteBtnText}>Delete</Text>
                          </Pressable>
                        </View>
                      </View>
                    )}
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
        onRequestClose={() => { resetForm(); setShowAddModal(false); }}
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
                      placeholder="Who did you borrow from?"
                      placeholderTextColor="rgba(36, 0, 70, 0.4)"
                      value={lenderName}
                      onChangeText={setLenderName}
                      testID="lender-name-input"
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Amount</Text>
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
                    <Text style={styles.inputLabel}>Date (Optional)</Text>
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
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Description (Optional)</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="What was it for?"
                      placeholderTextColor="rgba(36, 0, 70, 0.4)"
                      value={description}
                      onChangeText={setDescription}
                      testID="borrow-description-input"
                    />
                  </View>
                </View>
                <View style={styles.modalFooter}>
                  <Pressable
                    style={({ pressed }) => [styles.modalButton, styles.cancelButton, pressed && styles.modalButtonPressed]}
                    onPress={() => { resetForm(); setShowAddModal(false); }}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [
                      styles.modalButton, styles.confirmButton,
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
        visible={!!showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => { resetForm(); setShowEditModal(null); }}
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
                      placeholder="Who did you borrow from?"
                      placeholderTextColor="rgba(36, 0, 70, 0.4)"
                      value={lenderName}
                      onChangeText={setLenderName}
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Amount</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="$0.00"
                      placeholderTextColor="rgba(36, 0, 70, 0.4)"
                      value={displayCurrency(borrowAmount)}
                      onChangeText={(text) => handleCurrencyChange(text, setBorrowAmount)}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Date</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="MM/DD/YYYY"
                      placeholderTextColor="rgba(36, 0, 70, 0.4)"
                      value={displayDate(borrowDate)}
                      onChangeText={handleDateChange}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
                <View style={styles.modalFooter}>
                  <Pressable
                    style={({ pressed }) => [styles.modalButton, styles.cancelButton, pressed && styles.modalButtonPressed]}
                    onPress={() => { resetForm(); setShowEditModal(null); }}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [
                      styles.modalButton, styles.confirmButton,
                      (!lenderName.trim() || !borrowAmount) && styles.confirmButtonDisabled,
                      pressed && styles.modalButtonPressed,
                    ]}
                    onPress={handleUpdateBorrow}
                    disabled={!lenderName.trim() || !borrowAmount}
                  >
                    <Text style={styles.confirmButtonText}>Update</Text>
                  </Pressable>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal
        visible={!!showPaymentModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => { setPaymentAmount(''); setShowPaymentModal(null); }}
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
                    style={({ pressed }) => [styles.modalButton, styles.cancelButton, pressed && styles.modalButtonPressed]}
                    onPress={() => { setPaymentAmount(''); setShowPaymentModal(null); }}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [
                      styles.modalButton, styles.confirmButton,
                      !paymentAmount && styles.confirmButtonDisabled,
                      pressed && styles.modalButtonPressed,
                    ]}
                    onPress={handleAddPayment}
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
  headerSubtitle: {
    fontSize: 16,
    fontWeight: '600' as const,
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
  summaryRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: 'rgba(255, 255, 255, 0.7)',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginTop: 4,
  },
  paidValue: {
    color: '#10B981',
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
    textAlign: 'center' as const,
  },
  borrowsList: {
    gap: 16,
  },
  borrowCard: {
    backgroundColor: 'rgba(220, 190, 255, 0.95)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    overflow: 'hidden' as const,
  },
  borrowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  borrowHeaderPressed: {
    opacity: 0.7,
  },
  borrowHeaderLeft: {
    flex: 1,
    gap: 4,
  },
  borrowTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  lenderName: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#240046',
  },
  borrowDescription: {
    fontSize: 13,
    color: 'rgba(36, 0, 70, 0.7)',
    fontWeight: '500' as const,
  },
  borrowDate: {
    fontSize: 12,
    color: 'rgba(36, 0, 70, 0.6)',
    fontWeight: '500' as const,
  },
  borrowHeaderRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  borrowAmountValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#240046',
  },
  paidOffBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#10B981',
  },
  paidOffBadgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  borrowDetails: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(157, 78, 221, 0.2)',
    paddingTop: 16,
  },
  borrowAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  amountDetail: {
    alignItems: 'center',
    gap: 4,
  },
  amountDetailLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: 'rgba(36, 0, 70, 0.6)',
    textTransform: 'uppercase' as const,
  },
  amountDetailValue: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#240046',
  },
  remainingValue: {
    color: '#EF4444',
  },
  paymentsSection: {
    gap: 8,
  },
  paymentsSectionTitle: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#240046',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  paymentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(157, 78, 221, 0.1)',
    borderRadius: 10,
    padding: 12,
  },
  paymentAmount: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#10B981',
  },
  paymentDate: {
    fontSize: 11,
    color: 'rgba(36, 0, 70, 0.6)',
    marginTop: 2,
  },
  deletePaymentButton: {
    padding: 6,
    borderRadius: 6,
  },
  deletePaymentButtonPressed: {
    opacity: 0.6,
  },
  borrowActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  actionBtnPressed: {
    opacity: 0.7,
  },
  paymentBtn: {
    backgroundColor: '#9D4EDD',
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  editBtn: {
    backgroundColor: 'rgba(157, 78, 221, 0.15)',
  },
  editBtnText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#9D4EDD',
  },
  deleteBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  deleteBtnText: {
    fontSize: 13,
    fontWeight: '700' as const,
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
