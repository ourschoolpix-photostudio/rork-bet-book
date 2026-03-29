import { useAuth } from '@/contexts/AuthContext';
import { useLoans } from '@/contexts/LoanContext';
import { Loan } from '@/types/user';
import { WALLPAPER_URL } from '@/constants/wallpaper';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, Trash2, HandCoins, Pencil, DollarSign, ChevronRight, Archive, ArchiveRestore, PlusCircle } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, ImageBackground, Keyboard, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableWithoutFeedback, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function LoansScreen() {
  const { currentUser } = useAuth();
  const { loans, addLoan, addPayment, deleteLoan, deletePayment, updateLoan, addLoanAddition, deleteLoanAddition, archiveLoan, unarchiveLoan } = useLoans();
  const insets = useSafeAreaInsets();

  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showPaymentModal, setShowPaymentModal] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState<string | null>(null);
  const [showAdditionModal, setShowAdditionModal] = useState<string | null>(null);
  const [expandedLoan, setExpandedLoan] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState<boolean>(false);

  const [borrowerName, setBorrowerName] = useState<string>('');
  const [loanAmount, setLoanAmount] = useState<string>('');
  const [loanDate, setLoanDate] = useState<string>('');
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [additionAmount, setAdditionAmount] = useState<string>('');

  const userLoans = loans.filter(l => l.userId === currentUser?.id);
  const activeLoans = userLoans.filter(l => !l.isArchived);
  const archivedLoans = userLoans.filter(l => l.isArchived);
  const displayLoans = showArchived ? archivedLoans : activeLoans;

  const totalLoaned = activeLoans.reduce((sum, l) => sum + l.amount, 0);
  const totalCollected = activeLoans.reduce((sum, l) => sum + l.amountPaid, 0);
  const totalOutstanding = totalLoaned - totalCollected;

  const handleCurrencyChange = (text: string, setter: (value: string) => void) => {
    const numbers = text.replace(/[^0-9]/g, '');
    setter(numbers);
  };

  const handleDateChange = (text: string) => {
    const numbers = text.replace(/[^0-9]/g, '');
    if (numbers.length <= 8) {
      setLoanDate(numbers);
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

  const handleAddLoan = async () => {
    if (!currentUser || !borrowerName.trim() || !loanAmount) return;

    const amount = parseFloat(loanAmount) / 100;
    let dateToUse: string | undefined = undefined;

    if (loanDate) {
      const numbers = loanDate.replace(/[^0-9]/g, '');
      if (numbers.length === 8) {
        const month = numbers.slice(0, 2);
        const day = numbers.slice(2, 4);
        const year = numbers.slice(4, 8);
        dateToUse = new Date(`${year}-${month}-${day}`).toISOString();
      }
    }

    await addLoan(currentUser.id, borrowerName.trim(), amount, dateToUse);
    resetForm();
    setShowAddModal(false);
  };

  const handleEditLoan = (loan: Loan) => {
    setBorrowerName(loan.borrowerName);
    const originalAmt = loan.originalAmount ?? loan.amount;
    setLoanAmount((originalAmt * 100).toString());
    const date = new Date(loan.loanDate);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = String(date.getFullYear());
    setLoanDate(`${month}${day}${year}`);
    setShowEditModal(loan.id);
  };

  const handleUpdateLoan = async () => {
    if (!showEditModal || !borrowerName.trim() || !loanAmount) return;

    const amount = parseFloat(loanAmount) / 100;
    let dateToUse = new Date().toISOString();

    if (loanDate) {
      const numbers = loanDate.replace(/[^0-9]/g, '');
      if (numbers.length === 8) {
        const month = numbers.slice(0, 2);
        const day = numbers.slice(2, 4);
        const year = numbers.slice(4, 8);
        dateToUse = new Date(`${year}-${month}-${day}`).toISOString();
      }
    }

    await updateLoan(showEditModal, borrowerName.trim(), amount, dateToUse);
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

  const handleAddAddition = async () => {
    if (!showAdditionModal || !additionAmount) return;
    const amount = parseFloat(additionAmount) / 100;
    await addLoanAddition(showAdditionModal, amount);
    setAdditionAmount('');
    setShowAdditionModal(null);
  };

  const handleDeleteLoan = (loanId: string) => {
    Alert.alert(
      'Delete Loan',
      'Are you sure you want to delete this loan? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteLoan(loanId),
        },
      ]
    );
  };

  const handleDeletePayment = (loanId: string, paymentId: string) => {
    Alert.alert(
      'Delete Payment',
      'Are you sure you want to delete this payment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deletePayment(loanId, paymentId),
        },
      ]
    );
  };

  const handleDeleteAddition = (loanId: string, additionId: string) => {
    Alert.alert(
      'Delete Addition',
      'Are you sure you want to delete this loan addition?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteLoanAddition(loanId, additionId),
        },
      ]
    );
  };

  const resetForm = () => {
    setBorrowerName('');
    setLoanAmount('');
    setLoanDate('');
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
            <Text style={styles.headerTitle}>MY LOANS</Text>
            <Text style={styles.headerSubtitle}>
              Outstanding: ${totalOutstanding.toFixed(2)}
            </Text>
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.addButton,
              pressed && styles.addButtonPressed,
            ]}
            onPress={() => setShowAddModal(true)}
            testID="add-loan-button"
          >
            <Plus size={24} color="#FFFFFF" />
          </Pressable>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Loaned</Text>
            <Text style={styles.summaryValue}>${totalLoaned.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Collected</Text>
            <Text style={[styles.summaryValue, styles.collectedValue]}>${totalCollected.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.tabRow}>
          <Pressable
            style={({ pressed }) => [
              styles.tabButton,
              !showArchived && styles.tabButtonActive,
              pressed && styles.tabButtonPressed,
            ]}
            onPress={() => setShowArchived(false)}
          >
            <Text style={[styles.tabButtonText, !showArchived && styles.tabButtonTextActive]}>
              Active ({activeLoans.length})
            </Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.tabButton,
              showArchived && styles.tabButtonActive,
              pressed && styles.tabButtonPressed,
            ]}
            onPress={() => setShowArchived(true)}
          >
            <Text style={[styles.tabButtonText, showArchived && styles.tabButtonTextActive]}>
              Archived ({archivedLoans.length})
            </Text>
          </Pressable>
        </View>

        <ScrollView
          style={styles.scrollContent}
          contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 80 }]}
          showsVerticalScrollIndicator={false}
        >
          {displayLoans.length === 0 ? (
            <View style={styles.emptyState}>
              <HandCoins size={48} color="rgba(36, 0, 70, 0.4)" />
              <Text style={styles.emptyStateText}>
                {showArchived ? 'No archived loans' : 'No active loans'}
              </Text>
              <Text style={styles.emptyStateSubtext}>
                {showArchived ? 'Archived loans will appear here' : 'Track money you\'ve loaned to others'}
              </Text>
            </View>
          ) : (
            <View style={styles.loansList}>
              {displayLoans.map((loan) => {
                const remaining = loan.amount - loan.amountPaid;
                const isPaidOff = remaining <= 0;
                const isExpanded = expandedLoan === loan.id;

                return (
                  <View key={loan.id} style={styles.loanCard}>
                    <Pressable
                      style={({ pressed }) => [
                        styles.loanHeader,
                        pressed && styles.loanHeaderPressed,
                      ]}
                      onPress={() => setExpandedLoan(isExpanded ? null : loan.id)}
                    >
                      <View style={styles.loanHeaderLeft}>
                        <View style={styles.loanTitleRow}>
                          <Text style={styles.borrowerName}>{loan.borrowerName}</Text>
                          {isPaidOff && (
                            <View style={styles.paidOffBadge}>
                              <Text style={styles.paidOffBadgeText}>PAID OFF</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.loanDate}>{formatDate(loan.loanDate)}</Text>
                      </View>
                      <View style={styles.loanHeaderRight}>
                        <Text style={styles.loanAmountValue}>${loan.amount.toFixed(2)}</Text>
                        <ChevronRight
                          size={20}
                          color="rgba(36, 0, 70, 0.5)"
                          style={{ transform: [{ rotate: isExpanded ? '90deg' : '0deg' }] }}
                        />
                      </View>
                    </Pressable>

                    {isExpanded && (
                      <View style={styles.loanDetails}>
                        <View style={styles.loanAmountRow}>
                          <View style={styles.amountDetail}>
                            <Text style={styles.amountDetailLabel}>Original</Text>
                            <Text style={styles.amountDetailValue}>${(loan.originalAmount ?? loan.amount).toFixed(2)}</Text>
                          </View>
                          {(loan.loanAdditions?.length > 0) && (
                            <View style={styles.amountDetail}>
                              <Text style={styles.amountDetailLabel}>Additions</Text>
                              <Text style={styles.amountDetailValue}>
                                ${loan.loanAdditions.reduce((s, a) => s + a.amount, 0).toFixed(2)}
                              </Text>
                            </View>
                          )}
                          <View style={styles.amountDetail}>
                            <Text style={styles.amountDetailLabel}>Collected</Text>
                            <Text style={[styles.amountDetailValue, styles.collectedValue]}>${loan.amountPaid.toFixed(2)}</Text>
                          </View>
                          <View style={styles.amountDetail}>
                            <Text style={styles.amountDetailLabel}>Remaining</Text>
                            <Text style={[styles.amountDetailValue, styles.remainingValue]}>${remaining.toFixed(2)}</Text>
                          </View>
                        </View>

                        {loan.loanAdditions?.length > 0 && (
                          <View style={styles.paymentsSection}>
                            <Text style={styles.paymentsSectionTitle}>Loan Additions</Text>
                            {loan.loanAdditions.map((addition) => (
                              <View key={addition.id} style={styles.paymentItem}>
                                <View>
                                  <Text style={styles.additionAmount}>+${addition.amount.toFixed(2)}</Text>
                                  <Text style={styles.paymentDate}>{formatDate(addition.date)}</Text>
                                </View>
                                <Pressable
                                  style={({ pressed }) => [
                                    styles.deletePaymentButton,
                                    pressed && styles.deletePaymentButtonPressed,
                                  ]}
                                  onPress={() => handleDeleteAddition(loan.id, addition.id)}
                                >
                                  <Trash2 size={16} color="#EF4444" />
                                </Pressable>
                              </View>
                            ))}
                          </View>
                        )}

                        {loan.payments.length > 0 && (
                          <View style={styles.paymentsSection}>
                            <Text style={styles.paymentsSectionTitle}>Payments</Text>
                            {loan.payments.map((payment) => (
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
                                  onPress={() => handleDeletePayment(loan.id, payment.id)}
                                >
                                  <Trash2 size={16} color="#EF4444" />
                                </Pressable>
                              </View>
                            ))}
                          </View>
                        )}

                        <View style={styles.loanActions}>
                          {!isPaidOff && !loan.isArchived && (
                            <Pressable
                              style={({ pressed }) => [
                                styles.actionBtn,
                                styles.paymentBtn,
                                pressed && styles.actionBtnPressed,
                              ]}
                              onPress={() => setShowPaymentModal(loan.id)}
                            >
                              <DollarSign size={16} color="#FFFFFF" />
                              <Text style={styles.actionBtnText}>Payment</Text>
                            </Pressable>
                          )}
                          {!loan.isArchived && (
                            <Pressable
                              style={({ pressed }) => [
                                styles.actionBtn,
                                styles.additionBtn,
                                pressed && styles.actionBtnPressed,
                              ]}
                              onPress={() => setShowAdditionModal(loan.id)}
                            >
                              <PlusCircle size={16} color="#F59E0B" />
                              <Text style={styles.additionBtnText}>Add More</Text>
                            </Pressable>
                          )}
                        </View>
                        <View style={styles.loanActions}>
                          <Pressable
                            style={({ pressed }) => [
                              styles.actionBtn,
                              styles.editBtn,
                              pressed && styles.actionBtnPressed,
                            ]}
                            onPress={() => handleEditLoan(loan)}
                          >
                            <Pencil size={16} color="#9D4EDD" />
                            <Text style={styles.editBtnText}>Edit</Text>
                          </Pressable>
                          <Pressable
                            style={({ pressed }) => [
                              styles.actionBtn,
                              styles.archiveBtn,
                              pressed && styles.actionBtnPressed,
                            ]}
                            onPress={() => loan.isArchived ? unarchiveLoan(loan.id) : archiveLoan(loan.id)}
                          >
                            {loan.isArchived ? (
                              <ArchiveRestore size={16} color="#3B82F6" />
                            ) : (
                              <Archive size={16} color="#3B82F6" />
                            )}
                            <Text style={styles.archiveBtnText}>
                              {loan.isArchived ? 'Unarchive' : 'Archive'}
                            </Text>
                          </Pressable>
                          <Pressable
                            style={({ pressed }) => [
                              styles.actionBtn,
                              styles.deleteBtn,
                              pressed && styles.actionBtnPressed,
                            ]}
                            onPress={() => handleDeleteLoan(loan.id)}
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
                <Text style={styles.modalTitle}>Add New Loan</Text>
                <View style={styles.modalBody}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Borrower Name</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Who did you loan to?"
                      placeholderTextColor="rgba(36, 0, 70, 0.4)"
                      value={borrowerName}
                      onChangeText={setBorrowerName}
                      testID="borrower-name-input"
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Amount</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="$0.00"
                      placeholderTextColor="rgba(36, 0, 70, 0.4)"
                      value={displayCurrency(loanAmount)}
                      onChangeText={(text) => handleCurrencyChange(text, setLoanAmount)}
                      keyboardType="numeric"
                      testID="loan-amount-input"
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Date (Optional)</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="MM/DD/YYYY"
                      placeholderTextColor="rgba(36, 0, 70, 0.4)"
                      value={displayDate(loanDate)}
                      onChangeText={handleDateChange}
                      keyboardType="numeric"
                      testID="loan-date-input"
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
                      (!borrowerName.trim() || !loanAmount) && styles.confirmButtonDisabled,
                      pressed && styles.modalButtonPressed,
                    ]}
                    onPress={handleAddLoan}
                    disabled={!borrowerName.trim() || !loanAmount}
                    testID="confirm-add-loan"
                  >
                    <Text style={styles.confirmButtonText}>Add Loan</Text>
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
                <Text style={styles.modalTitle}>Edit Loan</Text>
                <View style={styles.modalBody}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Borrower Name</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Who did you loan to?"
                      placeholderTextColor="rgba(36, 0, 70, 0.4)"
                      value={borrowerName}
                      onChangeText={setBorrowerName}
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Original Amount</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="$0.00"
                      placeholderTextColor="rgba(36, 0, 70, 0.4)"
                      value={displayCurrency(loanAmount)}
                      onChangeText={(text) => handleCurrencyChange(text, setLoanAmount)}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Date</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="MM/DD/YYYY"
                      placeholderTextColor="rgba(36, 0, 70, 0.4)"
                      value={displayDate(loanDate)}
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
                      (!borrowerName.trim() || !loanAmount) && styles.confirmButtonDisabled,
                      pressed && styles.modalButtonPressed,
                    ]}
                    onPress={handleUpdateLoan}
                    disabled={!borrowerName.trim() || !loanAmount}
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
                      testID="loan-payment-amount-input"
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
                    testID="confirm-loan-payment"
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
        visible={!!showAdditionModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => { setAdditionAmount(''); setShowAdditionModal(null); }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={styles.modal}>
                <Text style={styles.modalTitle}>Add to Loan</Text>
                <View style={styles.modalBody}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Additional Amount</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="$0.00"
                      placeholderTextColor="rgba(36, 0, 70, 0.4)"
                      value={displayCurrency(additionAmount)}
                      onChangeText={(text) => handleCurrencyChange(text, setAdditionAmount)}
                      keyboardType="numeric"
                      testID="loan-addition-amount-input"
                    />
                  </View>
                </View>
                <View style={styles.modalFooter}>
                  <Pressable
                    style={({ pressed }) => [styles.modalButton, styles.cancelButton, pressed && styles.modalButtonPressed]}
                    onPress={() => { setAdditionAmount(''); setShowAdditionModal(null); }}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [
                      styles.modalButton, styles.confirmButton,
                      !additionAmount && styles.confirmButtonDisabled,
                      pressed && styles.modalButtonPressed,
                    ]}
                    onPress={handleAddAddition}
                    disabled={!additionAmount}
                    testID="confirm-loan-addition"
                  >
                    <Text style={styles.confirmButtonText}>Add to Loan</Text>
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
    color: '#FFD700',
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
  collectedValue: {
    color: '#10B981',
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  tabButtonActive: {
    backgroundColor: 'rgba(157, 78, 221, 0.4)',
  },
  tabButtonPressed: {
    opacity: 0.7,
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  tabButtonTextActive: {
    color: '#FFFFFF',
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
  loansList: {
    gap: 16,
  },
  loanCard: {
    backgroundColor: 'rgba(220, 190, 255, 0.95)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    overflow: 'hidden' as const,
  },
  loanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  loanHeaderPressed: {
    opacity: 0.7,
  },
  loanHeaderLeft: {
    flex: 1,
    gap: 4,
  },
  loanTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  borrowerName: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#240046',
  },
  loanDate: {
    fontSize: 12,
    color: 'rgba(36, 0, 70, 0.6)',
    fontWeight: '500' as const,
  },
  loanHeaderRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  loanAmountValue: {
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
  loanDetails: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(157, 78, 221, 0.2)',
    paddingTop: 16,
  },
  loanAmountRow: {
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
  additionAmount: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#F59E0B',
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
  loanActions: {
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
  additionBtn: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  additionBtnText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#F59E0B',
  },
  editBtn: {
    backgroundColor: 'rgba(157, 78, 221, 0.15)',
  },
  editBtnText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#9D4EDD',
  },
  archiveBtn: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
  },
  archiveBtnText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#3B82F6',
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
