import { useAuth } from '@/contexts/AuthContext';
import { useLoans } from '@/contexts/LoanContext';
import { WALLPAPER_URL } from '@/constants/wallpaper';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowLeft, Plus, Trash2, DollarSign, Pencil, PlusCircle, Copy, Archive, ArchiveRestore, ChevronDown, ChevronUp } from 'lucide-react-native';
import { useState, useMemo } from 'react';
import { Alert, ImageBackground, Keyboard, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableWithoutFeedback, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatCurrency } from '@/lib/dateUtils';

export default function LoansScreen() {
  const { currentUser } = useAuth();
  const { loans, addLoan, addPayment, deleteLoan, deletePayment, updateLoan, addLoanAddition, deleteLoanAddition, archiveLoan, unarchiveLoan } = useLoans();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [showAddLoanModal, setShowAddLoanModal] = useState<boolean>(false);
  const [showEditLoanModal, setShowEditLoanModal] = useState<string | null>(null);
  const [showAddPaymentModal, setShowAddPaymentModal] = useState<string | null>(null);

  const [showAddToLoanModal, setShowAddToLoanModal] = useState<string | null>(null);
  const [borrowerName, setBorrowerName] = useState<string>('');
  const [loanAmount, setLoanAmount] = useState<string>('');
  const [loanDate, setLoanDate] = useState<string>('');
  const [paymentAmount, setPaymentAmount] = useState<string>('');

  const [addToLoanAmount, setAddToLoanAmount] = useState<string>('');
  const [addToLoanDate, setAddToLoanDate] = useState<string>('');
  const [showArchivedLoans, setShowArchivedLoans] = useState<boolean>(false);
  const [expandedLoanIds, setExpandedLoanIds] = useState<Set<string>>(new Set());

  const userLoans = useMemo(() => {
    return loans
      .filter(l => l.userId === currentUser?.id)
      .filter(l => showArchivedLoans ? l.isArchived === true : l.isArchived !== true)
      .sort((a, b) => {
        if (showArchivedLoans) {
          const nameCompare = a.borrowerName.localeCompare(b.borrowerName);
          if (nameCompare !== 0) return nameCompare;
          return new Date(a.loanDate).getTime() - new Date(b.loanDate).getTime();
        }
        return new Date(a.loanDate).getTime() - new Date(b.loanDate).getTime();
      });
  }, [loans, currentUser?.id, showArchivedLoans]);

  const totalLoansRemaining = userLoans.reduce((sum, loan) => sum + (loan.amount - loan.amountPaid), 0);
  const archivedCount = loans.filter(l => l.userId === currentUser?.id && l.isArchived === true).length;

  const handleCurrencyChange = (text: string, setter: (value: string) => void) => {
    const numbers = text.replace(/[^0-9]/g, '');
    setter(numbers);
  };

  const handleLoanDateChange = (text: string) => {
    const numbers = text.replace(/[^0-9]/g, '');
    if (numbers.length <= 8) {
      setLoanDate(numbers);
    }
  };

  const handleAddToLoanDateChange = (text: string) => {
    const numbers = text.replace(/[^0-9]/g, '');
    if (numbers.length <= 8) {
      setAddToLoanDate(numbers);
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
        const utcDate = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day), 12, 0, 0));
        dateToUse = utcDate.toISOString();
      }
    }
    
    await addLoan(currentUser.id, borrowerName.trim(), amount, dateToUse);
    setBorrowerName('');
    setLoanAmount('');
    setLoanDate('');
    setShowAddLoanModal(false);
  };

  const handleAddPayment = async (loanId: string) => {
    if (!paymentAmount) return;

    const amount = parseFloat(paymentAmount) / 100;
    await addPayment(loanId, amount);
    setPaymentAmount('');
    setShowAddPaymentModal(null);
  };

const handleAddToLoan = async (loanId: string) => {
    if (!addToLoanAmount) return;

    const amount = parseFloat(addToLoanAmount) / 100;
    let dateToUse: string | undefined = undefined;
    
    if (addToLoanDate) {
      const numbers = addToLoanDate.replace(/[^0-9]/g, '');
      if (numbers.length === 8) {
        const month = numbers.slice(0, 2);
        const day = numbers.slice(2, 4);
        const year = numbers.slice(4, 8);
        const utcDate = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day), 12, 0, 0));
        dateToUse = utcDate.toISOString();
      }
    }
    
    await addLoanAddition(loanId, amount, dateToUse);
    setAddToLoanAmount('');
    setAddToLoanDate('');
    setShowAddToLoanModal(null);
  };

  const handleEditLoan = (loanId: string) => {
    const loan = loans.find(l => l.id === loanId);
    if (!loan) return;

    setBorrowerName(loan.borrowerName);
    const originalAmount = loan.originalAmount || loan.amount;
    setLoanAmount((originalAmount * 100).toString());
    
    const date = new Date(loan.loanDate);
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const year = String(date.getUTCFullYear());
    setLoanDate(`${month}${day}${year}`);
    
    setShowEditLoanModal(loanId);
  };

  const handleUpdateLoan = async () => {
    if (!showEditLoanModal || !borrowerName.trim() || !loanAmount) return;

    const amount = parseFloat(loanAmount) / 100;
    
    const loan = loans.find(l => l.id === showEditLoanModal);
    let dateToUse = loan?.loanDate || new Date().toISOString();
    
    if (loanDate) {
      const numbers = loanDate.replace(/[^0-9]/g, '');
      console.log('Edit loan - date numbers:', numbers);
      if (numbers.length === 8) {
        const month = numbers.slice(0, 2);
        const day = numbers.slice(2, 4);
        const year = numbers.slice(4, 8);
        const utcDate = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day), 12, 0, 0));
        dateToUse = utcDate.toISOString();
        console.log('Edit loan - converted date:', dateToUse);
      }
    }
    
    console.log('Updating loan with date:', dateToUse);
    await updateLoan(showEditLoanModal, borrowerName.trim(), amount, dateToUse);
    setBorrowerName('');
    setLoanAmount('');
    setLoanDate('');
    setShowEditLoanModal(null);
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

  const handleDeleteLoanAddition = (loanId: string, additionId: string) => {
    Alert.alert(
      'Delete Loan Addition',
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      timeZone: 'UTC'
    });
  };

  const handleArchiveLoan = (loanId: string) => {
    Alert.alert(
      'Archive Loan',
      'Move this paid-off loan to the archive?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive',
          onPress: () => archiveLoan(loanId),
        },
      ]
    );
  };

  const handleUnarchiveLoan = (loanId: string) => {
    unarchiveLoan(loanId);
  };

  const handleCopyLoanInfo = async (loan: any) => {
    const remaining = loan.amount - loan.amountPaid;
    const originalAmount = loan.originalAmount || loan.amount;
    
    let message = `📋 Loan Reminder\n\n`;
    message += `Borrower: ${loan.borrowerName}\n`;
    message += `Original Loan Date: ${formatDate(loan.loanDate)}\n\n`;
    
    message += `💰 Financial Summary:\n`;
    message += `Original Loan: ${formatCurrency(originalAmount)}\n`;
    
    if (loan.loanAdditions && loan.loanAdditions.length > 0) {
      const totalAdditions = loan.loanAdditions.reduce((sum: number, add: any) => sum + add.amount, 0);
      message += `Additional Loans: ${formatCurrency(totalAdditions)}\n`;
      message += `Total Loaned: ${formatCurrency(loan.amount)}\n`;
    }
    
    if (loan.payments && loan.payments.length > 0) {
      message += `Total Paid: ${formatCurrency(loan.amountPaid)}\n`;
    }
    
    message += `Remaining Balance: ${formatCurrency(remaining)}\n\n`;
    
    if (loan.loanAdditions && loan.loanAdditions.length > 0) {
      message += `📝 Loan History:\n`;
      message += `• ${formatDate(loan.loanDate)} - ${formatCurrency(originalAmount)} (Original)\n`;
      
      [...loan.loanAdditions]
        .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .forEach((addition: any) => {
          message += `• ${formatDate(addition.date)} - ${formatCurrency(addition.amount)} (Addition)\n`;
        });
      message += `\n`;
    }
    
    if (loan.payments && loan.payments.length > 0) {
      message += `💵 Payment History:\n`;
      loan.payments.forEach((payment: any) => {
        message += `• ${formatDate(payment.date)} - ${formatCurrency(payment.amount)}\n`;
      });
    }
    
    await Clipboard.setStringAsync(message);
    Alert.alert('Copied!', 'Loan information has been copied to clipboard');
  };

  const toggleExpanded = (loanId: string) => {
    const newSet = new Set(expandedLoanIds);
    if (expandedLoanIds.has(loanId)) {
      newSet.delete(loanId);
    } else {
      newSet.add(loanId);
    }
    setExpandedLoanIds(newSet);
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
            <Text style={styles.headerTitle}>LOANED OUT</Text>
            <Text style={styles.headerTotal}>${formatCurrency(totalLoansRemaining)}</Text>
            {archivedCount > 0 && (
              <Pressable
                style={({ pressed }) => [
                  styles.archiveToggle,
                  pressed && styles.archiveTogglePressed,
                ]}
                onPress={() => setShowArchivedLoans(!showArchivedLoans)}
                testID="toggle-archive-view"
              >
                <Archive size={14} color="#FFD700" />
                <Text style={styles.archiveToggleText}>
                  {showArchivedLoans ? 'Show Active' : `View Archive (${archivedCount})`}
                </Text>
              </Pressable>
            )}
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.addButton,
              pressed && styles.addButtonPressed,
            ]}
            onPress={() => setShowAddLoanModal(true)}
            testID="add-loan-button"
          >
            <Plus size={24} color="#FFFFFF" />
          </Pressable>
        </View>

        <ScrollView
          style={styles.scrollContent}
          contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
        >
          {userLoans.length === 0 ? (
            <View style={styles.emptyState}>
              <DollarSign size={48} color="rgba(36, 0, 70, 0.4)" />
              <Text style={styles.emptyStateText}>No loans yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Track money you&apos;ve loaned out to others
              </Text>
            </View>
          ) : (
            <View style={styles.loansList}>
              {userLoans.map((loan) => {
                const remaining = loan.amount - loan.amountPaid;
                const isPaidOff = remaining <= 0;
                const isExpanded = expandedLoanIds.has(loan.id);

                return (
                  <View key={loan.id} style={styles.loanCard}>
                    <Pressable
                      onPress={() => toggleExpanded(loan.id)}
                      style={styles.loanHeaderWrapper}
                    >
                      <View style={styles.loanHeader}>
                        <View style={styles.loanHeaderLeft}>
                          <Text style={styles.borrowerName}>{loan.borrowerName}</Text>
                          {isExpanded && (
                            <Text style={styles.loanDate}>Loaned on {formatDate(loan.loanDate)}</Text>
                          )}
                        </View>
                        <View style={styles.expandIcon}>
                          {isExpanded ? (
                            <ChevronUp size={20} color="#9D4EDD" />
                          ) : (
                            <ChevronDown size={20} color="#9D4EDD" />
                          )}
                        </View>
                      </View>
                    </Pressable>

                    {isExpanded && (
                      <>
                        <View style={styles.loanHeaderActionsRow}>
                          <Pressable
                            onPress={() => handleCopyLoanInfo(loan)}
                            style={({ pressed }) => [
                              styles.copyButton,
                              pressed && styles.copyButtonPressed,
                            ]}
                            testID={`copy-loan-${loan.id}`}
                          >
                            <Copy size={18} color="#FFD700" />
                          </Pressable>
                          <Pressable
                            onPress={() => handleEditLoan(loan.id)}
                            style={({ pressed }) => [
                              styles.editButton,
                              pressed && styles.editButtonPressed,
                            ]}
                            testID={`edit-loan-${loan.id}`}
                          >
                            <Pencil size={18} color="#9D4EDD" />
                          </Pressable>
                          <Pressable
                            onPress={() => handleDeleteLoan(loan.id)}
                            style={({ pressed }) => [
                              styles.deleteButton,
                              pressed && styles.deleteButtonPressed,
                            ]}
                            testID={`delete-loan-${loan.id}`}
                          >
                            <Trash2 size={20} color="#000000" />
                          </Pressable>
                        </View>

                        <View style={styles.loanStats}>
                          <View style={styles.loanStatItem}>
                            <Text style={styles.loanStatLabel}>Loaned</Text>
                            <Text style={styles.loanStatValue}>${formatCurrency(loan.amount)}</Text>
                          </View>
                          <View style={styles.loanStatItem}>
                            <Text style={styles.loanStatLabel}>Paid</Text>
                            <Text style={styles.loanStatValue}>${formatCurrency(loan.amountPaid)}</Text>
                          </View>
                          <View style={styles.loanStatItem}>
                            <Text style={styles.loanStatLabel}>Remaining</Text>
                            <Text style={[styles.loanStatValue, isPaidOff ? styles.paidOffText : styles.remainingText]}>
                              ${formatCurrency(remaining)}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.paymentsSection}>
                          <Text style={styles.paymentsSectionTitle}>Loan History</Text>
                          <View style={styles.paymentRow}>
                            <View style={styles.paymentInfo}>
                              <Text style={styles.paymentAmount}>${formatCurrency(loan.originalAmount || loan.amount)}</Text>
                              <Text style={styles.paymentDate}>{formatDate(loan.loanDate)}</Text>
                            </View>
                            <View style={styles.originalLoanBadge}>
                              <Text style={styles.originalLoanBadgeText}>Original</Text>
                            </View>
                          </View>
                          {loan.loanAdditions && loan.loanAdditions.length > 0 && (
                            [...loan.loanAdditions]
                              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                              .map((addition) => (
                              <View key={addition.id} style={styles.paymentRow}>
                                <View style={styles.paymentInfo}>
                                  <Text style={styles.paymentAmount}>${formatCurrency(addition.amount)}</Text>
                                  <Text style={styles.paymentDate}>{formatDate(addition.date)}</Text>
                                </View>
                                <Pressable
                                  onPress={() => handleDeleteLoanAddition(loan.id, addition.id)}
                                  style={({ pressed }) => [
                                    styles.deletePaymentButton,
                                    pressed && styles.deletePaymentButtonPressed,
                                  ]}
                                  testID={`delete-addition-${addition.id}`}
                                >
                                  <Trash2 size={16} color="rgba(36, 0, 70, 0.6)" />
                                </Pressable>
                              </View>
                            ))
                          )}
                        </View>

                        {loan.payments.length > 0 && (
                          <View style={styles.paymentsSection}>
                            <Text style={styles.paymentsSectionTitle}>Payment History</Text>
                            {loan.payments.map((payment) => (
                              <View key={payment.id} style={styles.paymentRow}>
                                <View style={styles.paymentInfo}>
                                  <Text style={styles.paymentAmount}>${formatCurrency(payment.amount)}</Text>
                                  <Text style={styles.paymentDate}>{formatDate(payment.date)}</Text>
                                </View>
                                <Pressable
                                  onPress={() => handleDeletePayment(loan.id, payment.id)}
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
                          <View style={styles.actionsRow}>
                            <Pressable
                              style={({ pressed }) => [
                                styles.actionButton,
                                pressed && styles.actionButtonPressed,
                              ]}
                              onPress={() => setShowAddPaymentModal(loan.id)}
                              testID={`add-payment-${loan.id}`}
                            >
                              <Plus size={18} color="#9D4EDD" />
                              <Text style={styles.actionButtonText}>Add Payment</Text>
                            </Pressable>
                            <Pressable
                              style={({ pressed }) => [
                                styles.actionButton,
                                styles.addToLoanButton,
                                pressed && styles.actionButtonPressed,
                              ]}
                              onPress={() => setShowAddToLoanModal(loan.id)}
                              testID={`add-to-loan-${loan.id}`}
                            >
                              <PlusCircle size={18} color="#10B981" />
                              <Text style={[styles.actionButtonText, styles.addToLoanButtonText]}>Add to Loan</Text>
                            </Pressable>
                          </View>
                        )}
                        {isPaidOff && !showArchivedLoans && (
                          <Pressable
                            style={({ pressed }) => [
                              styles.archiveButton,
                              pressed && styles.actionButtonPressed,
                            ]}
                            onPress={() => handleArchiveLoan(loan.id)}
                            testID={`archive-loan-${loan.id}`}
                          >
                            <Archive size={18} color="#FFD700" />
                            <Text style={styles.archiveButtonText}>Archive Loan</Text>
                          </Pressable>
                        )}
                        {showArchivedLoans && (
                          <Pressable
                            style={({ pressed }) => [
                              styles.unarchiveButton,
                              pressed && styles.actionButtonPressed,
                            ]}
                            onPress={() => handleUnarchiveLoan(loan.id)}
                            testID={`unarchive-loan-${loan.id}`}
                          >
                            <ArchiveRestore size={18} color="#9D4EDD" />
                            <Text style={styles.unarchiveButtonText}>Restore to Active</Text>
                          </Pressable>
                        )}
                      </>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      </View>

      <Modal
        visible={showAddLoanModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddLoanModal(false)}
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
                      placeholder="Enter name"
                      placeholderTextColor="rgba(36, 0, 70, 0.4)"
                      value={borrowerName}
                      onChangeText={setBorrowerName}
                      testID="borrower-name-input"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Loan Amount</Text>
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
                    <Text style={styles.inputLabel}>Date of Loan (Optional)</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="MM/DD/YYYY"
                      placeholderTextColor="rgba(36, 0, 70, 0.4)"
                      value={displayDate(loanDate)}
                      onChangeText={handleLoanDateChange}
                      keyboardType="numeric"
                      testID="loan-date-input"
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
                      setBorrowerName('');
                      setLoanAmount('');
                      setLoanDate('');
                      setShowAddLoanModal(false);
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [
                      styles.modalButton,
                      styles.confirmButton,
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
        visible={!!showEditLoanModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditLoanModal(null)}
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
                      placeholder="Enter name"
                      placeholderTextColor="rgba(36, 0, 70, 0.4)"
                      value={borrowerName}
                      onChangeText={setBorrowerName}
                      testID="edit-borrower-name-input"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Loan Amount</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="$0.00"
                      placeholderTextColor="rgba(36, 0, 70, 0.4)"
                      value={displayCurrency(loanAmount)}
                      onChangeText={(text) => handleCurrencyChange(text, setLoanAmount)}
                      keyboardType="numeric"
                      testID="edit-loan-amount-input"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Date of Loan</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="MM/DD/YYYY"
                      placeholderTextColor="rgba(36, 0, 70, 0.4)"
                      value={displayDate(loanDate)}
                      onChangeText={handleLoanDateChange}
                      keyboardType="numeric"
                      testID="edit-loan-date-input"
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
                      setBorrowerName('');
                      setLoanAmount('');
                      setLoanDate('');
                      setShowEditLoanModal(null);
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [
                      styles.modalButton,
                      styles.confirmButton,
                      (!borrowerName.trim() || !loanAmount) && styles.confirmButtonDisabled,
                      pressed && styles.modalButtonPressed,
                    ]}
                    onPress={handleUpdateLoan}
                    disabled={!borrowerName.trim() || !loanAmount}
                    testID="confirm-edit-loan"
                  >
                    <Text style={styles.confirmButtonText}>Update Loan</Text>
                  </Pressable>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal
        visible={!!showAddToLoanModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddToLoanModal(null)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={styles.modal}>
                <Text style={styles.modalTitle}>Add to Loan</Text>
                
                <View style={styles.modalBody}>
                  <Text style={styles.modalDescription}>
                    Add an additional amount to this existing loan
                  </Text>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Additional Amount</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="$0.00"
                      placeholderTextColor="rgba(36, 0, 70, 0.4)"
                      value={displayCurrency(addToLoanAmount)}
                      onChangeText={(text) => handleCurrencyChange(text, setAddToLoanAmount)}
                      keyboardType="numeric"
                      testID="add-to-loan-amount-input"
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Date of Addition (Optional)</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="MM/DD/YYYY"
                      placeholderTextColor="rgba(36, 0, 70, 0.4)"
                      value={displayDate(addToLoanDate)}
                      onChangeText={handleAddToLoanDateChange}
                      keyboardType="numeric"
                      testID="add-to-loan-date-input"
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
                      setAddToLoanAmount('');
                      setAddToLoanDate('');
                      setShowAddToLoanModal(null);
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [
                      styles.modalButton,
                      styles.confirmButton,
                      !addToLoanAmount && styles.confirmButtonDisabled,
                      pressed && styles.modalButtonPressed,
                    ]}
                    onPress={() => showAddToLoanModal && handleAddToLoan(showAddToLoanModal)}
                    disabled={!addToLoanAmount}
                    testID="confirm-add-to-loan"
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
  loansList: {
    gap: 16,
  },
  loanCard: {
    backgroundColor: 'rgba(220, 190, 255, 0.95)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    gap: 16,
  },
  loanHeaderWrapper: {
    marginBottom: 0,
  },
  loanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  loanHeaderLeft: {
    flex: 1,
    gap: 4,
  },
  expandIcon: {
    padding: 4,
  },
  loanHeaderActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  copyButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
  },
  copyButtonPressed: {
    opacity: 0.7,
  },
  editButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(157, 78, 221, 0.15)',
  },
  editButtonPressed: {
    opacity: 0.7,
  },
  borrowerName: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#240046',
  },
  loanDate: {
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
  loanStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  loanStatItem: {
    flex: 1,
    gap: 4,
  },
  loanStatLabel: {
    fontSize: 11,
    color: 'rgba(36, 0, 70, 0.8)',
    fontWeight: '500' as const,
  },
  loanStatValue: {
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
  originalLoanBadge: {
    backgroundColor: 'rgba(157, 78, 221, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  originalLoanBadgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#9D4EDD',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
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
  addToLoanButton: {
    backgroundColor: '#9D4EDD',
    borderColor: '#9D4EDD',
  },
  actionButtonPressed: {
    opacity: 0.7,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#9D4EDD',
  },
  addToLoanButtonText: {
    color: '#FFD700',
  },
  archiveToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    marginTop: 8,
  },
  archiveTogglePressed: {
    opacity: 0.7,
  },
  archiveToggleText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#FFD700',
  },
  archiveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderRadius: 12,
    padding: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  archiveButtonText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#FFD700',
  },
  unarchiveButton: {
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
  unarchiveButtonText: {
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
  modalDescription: {
    fontSize: 14,
    color: 'rgba(36, 0, 70, 0.7)',
    lineHeight: 20,
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
