import { useAuth } from '@/contexts/AuthContext';
import { useExpenses, useFilteredExpenses, useExpensesByCategory, useMonthlyExpenses, useYearToDateExpenses } from '@/contexts/ExpensesContext';
import { ExpenseCategory } from '@/types/expense';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import { Plus, Receipt, CreditCard, ChevronDown, Trash2, BarChart3 } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Alert, FlatList, ImageBackground, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import AddExpenseModal from '@/components/AddExpenseModal';
import ReceiptScannerModal from '@/components/ReceiptScannerModal';
import RecurringBillsModal from '@/components/RecurringBillsModal';

const categories: ExpenseCategory[] = [
  'Auto Repair',
  'Clothing',
  'Convenience Store',
  'Electronics',
  'Entertainment',
  'Fast Food',
  'Gas',
  'Grocery',
  'Household',
  'Lottery',
  'Monthly Bill',
  'Recreation',
  'Shoes',
  'Travel',
];

export default function ExpensesScreen() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | undefined>(undefined);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState<boolean>(false);
  const [showReceiptScanner, setShowReceiptScanner] = useState<boolean>(false);
  const [showRecurringBillsModal, setShowRecurringBillsModal] = useState<boolean>(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState<boolean>(false);
  const [showSummary, setShowSummary] = useState<boolean>(false);

  useEffect(() => {
    if (!currentUser) {
      router.replace('/login');
    }
  }, [currentUser, router]);

  const expenses = useFilteredExpenses(currentUser?.id || '', selectedCategory);
  const expensesByCategory = useExpensesByCategory(currentUser?.id || '');
  const monthlyExpenses = useMonthlyExpenses(currentUser?.id || '');
  const ytdExpenses = useYearToDateExpenses(currentUser?.id || '');
  const { deleteExpense, addExpense, addRecurringBill, deleteRecurringBill } = useExpenses();

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  const handleDeleteExpense = (expenseId: string) => {
    Alert.alert(
      'Delete Expense',
      'Are you sure you want to delete this expense?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteExpense(expenseId);
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
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'My Expenses',
          headerStyle: { backgroundColor: '#9D4EDD' },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: '700' as const },
        }}
      />

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
        <View style={styles.topSection}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>
              {selectedCategory ? `${selectedCategory} Total` : 'Total Expenses'}
            </Text>
            <Text style={styles.summaryAmount}>${totalExpenses.toFixed(2)}</Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.categoryFilterButton,
              pressed && styles.categoryFilterButtonPressed,
            ]}
            onPress={() => setShowCategoryPicker(true)}
          >
            <Text style={styles.categoryFilterText}>
              {selectedCategory || 'All Categories'}
            </Text>
            <ChevronDown size={20} color="#FFFFFF" />
          </Pressable>

          <View style={styles.actionButtons}>
            <Pressable
              style={({ pressed }) => [
                styles.actionButton,
                pressed && styles.actionButtonPressed,
              ]}
              onPress={() => setShowAddExpenseModal(true)}
            >
              <Plus size={24} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Add Expense</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.actionButton,
                pressed && styles.actionButtonPressed,
              ]}
              onPress={() => setShowReceiptScanner(true)}
            >
              <Receipt size={24} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Scan Receipt</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.actionButton,
                pressed && styles.actionButtonPressed,
              ]}
              onPress={() => setShowRecurringBillsModal(true)}
            >
              <CreditCard size={24} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Recurring Bills</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.actionButton,
                pressed && styles.actionButtonPressed,
              ]}
              onPress={() => setShowSummary(true)}
            >
              <BarChart3 size={24} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Summary</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.listContainer}>
          <Text style={styles.listTitle}>Recent Expenses</Text>
          <FlatList
            data={expenses}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <View style={styles.expenseItem}>
                <View style={styles.expenseInfo}>
                  <Text style={styles.expenseCategory}>{item.category}</Text>
                  <Text style={styles.expenseDescription}>{item.description}</Text>
                  {item.merchant && (
                    <Text style={styles.expenseMerchant}>{item.merchant}</Text>
                  )}
                  <Text style={styles.expenseDate}>
                    {new Date(item.date).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.expenseActions}>
                  <Text style={styles.expenseAmount}>${item.amount.toFixed(2)}</Text>
                  <View style={styles.expenseButtons}>
                    <Pressable
                      style={({ pressed }) => [
                        styles.iconButton,
                        pressed && styles.iconButtonPressed,
                      ]}
                      onPress={() => handleDeleteExpense(item.id)}
                    >
                      <Trash2 size={18} color="#FFFFFF" />
                    </Pressable>
                  </View>
                </View>
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No expenses yet</Text>
                <Text style={styles.emptySubtext}>
                  Add an expense or scan a receipt to get started
                </Text>
              </View>
            }
          />
        </View>
      </View>

      <Modal
        visible={showCategoryPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCategoryPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable 
            style={StyleSheet.absoluteFill}
            onPress={() => setShowCategoryPicker(false)}
          />
          <View style={styles.categoryPickerModal}>
            <Text style={styles.categoryPickerTitle}>Select Category</Text>
            <ScrollView style={styles.categoryPickerList}>
              <Pressable
                style={({ pressed }) => [
                  styles.categoryOption,
                  !selectedCategory && styles.categoryOptionSelected,
                  pressed && styles.categoryOptionPressed,
                ]}
                onPress={() => {
                  setSelectedCategory(undefined);
                  setShowCategoryPicker(false);
                }}
              >
                <Text style={styles.categoryOptionText}>All Categories</Text>
              </Pressable>
              {categories.map((category) => (
                <Pressable
                  key={category}
                  style={({ pressed }) => [
                    styles.categoryOption,
                    selectedCategory === category && styles.categoryOptionSelected,
                    pressed && styles.categoryOptionPressed,
                  ]}
                  onPress={() => {
                    setSelectedCategory(category);
                    setShowCategoryPicker(false);
                  }}
                >
                  <Text style={styles.categoryOptionText}>{category}</Text>
                  <Text style={styles.categoryOptionAmount}>
                    ${expensesByCategory[category].toFixed(2)}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showSummary}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSummary(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable 
            style={StyleSheet.absoluteFill}
            onPress={() => setShowSummary(false)}
          />
          <View style={styles.summaryModal}>
            <View style={styles.summaryHeader}>
              <Text style={styles.summaryTitle}>Expense Summary</Text>
              <Pressable
                style={({ pressed }) => [
                  styles.summaryCloseButton,
                  pressed && styles.closeButtonPressed,
                ]}
                onPress={() => setShowSummary(false)}
              >
                <Text style={styles.summaryCloseText}>Done</Text>
              </Pressable>
            </View>
            <ScrollView style={styles.summaryContent}>
              <View style={styles.summarySection}>
                <Text style={styles.sectionTitle}>Current Month</Text>
                <View style={styles.summaryTotalCard}>
                  <Text style={styles.summaryTotalLabel}>
                    {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </Text>
                  <Text style={styles.summaryTotalAmount}>${monthlyExpenses.total.toFixed(2)}</Text>
                  <Text style={styles.summaryCount}>{monthlyExpenses.expenses.length} expense{monthlyExpenses.expenses.length !== 1 ? 's' : ''}</Text>
                </View>
                
                {Object.entries(monthlyExpenses.byCategory)
                  .filter(([_, amount]) => amount > 0)
                  .sort(([_, a], [__, b]) => b - a)
                  .map(([category, amount]) => {
                    const percentage = monthlyExpenses.total > 0 ? (amount / monthlyExpenses.total) * 100 : 0;
                    return (
                      <View key={`monthly-${category}`} style={styles.categoryRow}>
                        <View style={styles.categoryRowInfo}>
                          <Text style={styles.categoryRowName}>{category}</Text>
                          <Text style={styles.categoryRowPercentage}>{percentage.toFixed(1)}%</Text>
                        </View>
                        <View style={styles.categoryRowBar}>
                          <View
                            style={[
                              styles.categoryRowBarFill,
                              { width: `${percentage}%` },
                            ]}
                          />
                        </View>
                        <Text style={styles.categoryRowAmount}>${amount.toFixed(2)}</Text>
                      </View>
                    );
                  })}
                {Object.values(monthlyExpenses.byCategory).every(amount => amount === 0) && (
                  <View style={styles.emptySummary}>
                    <Text style={styles.emptySummaryText}>No expenses this month</Text>
                  </View>
                )}
              </View>

              <View style={styles.summaryDivider} />

              <View style={styles.summarySection}>
                <Text style={styles.sectionTitle}>Year to Date</Text>
                <View style={styles.summaryTotalCard}>
                  <Text style={styles.summaryTotalLabel}>
                    {new Date().getFullYear()} Total
                  </Text>
                  <Text style={styles.summaryTotalAmount}>${ytdExpenses.total.toFixed(2)}</Text>
                  <Text style={styles.summaryCount}>{ytdExpenses.expenses.length} expense{ytdExpenses.expenses.length !== 1 ? 's' : ''}</Text>
                </View>
                
                {Object.entries(ytdExpenses.byCategory)
                  .filter(([_, amount]) => amount > 0)
                  .sort(([_, a], [__, b]) => b - a)
                  .map(([category, amount]) => {
                    const percentage = ytdExpenses.total > 0 ? (amount / ytdExpenses.total) * 100 : 0;
                    return (
                      <View key={`ytd-${category}`} style={styles.categoryRow}>
                        <View style={styles.categoryRowInfo}>
                          <Text style={styles.categoryRowName}>{category}</Text>
                          <Text style={styles.categoryRowPercentage}>{percentage.toFixed(1)}%</Text>
                        </View>
                        <View style={styles.categoryRowBar}>
                          <View
                            style={[
                              styles.categoryRowBarFill,
                              { width: `${percentage}%` },
                            ]}
                          />
                        </View>
                        <Text style={styles.categoryRowAmount}>${amount.toFixed(2)}</Text>
                      </View>
                    );
                  })}
                {Object.values(ytdExpenses.byCategory).every(amount => amount === 0) && (
                  <View style={styles.emptySummary}>
                    <Text style={styles.emptySummaryText}>No expenses this year</Text>
                  </View>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <AddExpenseModal
        visible={showAddExpenseModal}
        onClose={() => setShowAddExpenseModal(false)}
        onSubmit={async (category, amount, description, date, merchant) => {
          if (currentUser) {
            await addExpense(currentUser.id, category, amount, description, date, merchant);
          }
        }}
      />

      <ReceiptScannerModal
        visible={showReceiptScanner}
        onClose={() => setShowReceiptScanner(false)}
        onSubmit={async (category, amount, description, date, merchant) => {
          if (currentUser) {
            await addExpense(currentUser.id, category, amount, description, date, merchant);
          }
        }}
      />

      <RecurringBillsModal
        visible={showRecurringBillsModal}
        onClose={() => setShowRecurringBillsModal(false)}
        userId={currentUser?.id || ''}
        onAddBill={async (name, amount, dueDay, category) => {
          if (currentUser) {
            await addRecurringBill(currentUser.id, name, amount, dueDay, category);
          }
        }}
        onDeleteBill={async (billId) => {
          await deleteRecurringBill(billId);
        }}
      />
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
  topSection: {
    padding: 20,
    gap: 16,
  },
  summaryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  summaryAmount: {
    fontSize: 36,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  categoryFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  categoryFilterButtonPressed: {
    opacity: 0.7,
  },
  categoryFilterText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap' as const,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  actionButtonPressed: {
    opacity: 0.7,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#FFFFFF',
    textAlign: 'center' as const,
  },
  listContainer: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
  },
  listTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#240046',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  expenseItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(157, 78, 221, 0.2)',
    gap: 12,
  },
  expenseInfo: {
    flex: 1,
    gap: 4,
  },
  expenseCategory: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#9D4EDD',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  expenseDescription: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#240046',
  },
  expenseMerchant: {
    fontSize: 14,
    color: '#5A189A',
  },
  expenseDate: {
    fontSize: 12,
    color: 'rgba(36, 0, 70, 0.6)',
  },
  expenseActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  expenseAmount: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#240046',
  },
  expenseButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(157, 78, 221, 0.1)',
  },
  iconButtonPressed: {
    opacity: 0.6,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#240046',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: 'rgba(36, 0, 70, 0.6)',
    textAlign: 'center' as const,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  categoryPickerModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '70%',
    paddingTop: 24,
  },
  categoryPickerTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#240046',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  categoryPickerList: {
    flex: 1,
  },
  categoryOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(157, 78, 221, 0.1)',
  },
  categoryOptionSelected: {
    backgroundColor: 'rgba(157, 78, 221, 0.1)',
  },
  categoryOptionPressed: {
    opacity: 0.6,
  },
  categoryOptionText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#240046',
  },
  categoryOptionAmount: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#9D4EDD',
  },
  closeButtonPressed: {
    opacity: 0.6,
  },
  summaryModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '85%',
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(157, 78, 221, 0.1)',
  },
  summaryTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#240046',
  },
  summaryCloseButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(157, 78, 221, 0.1)',
  },
  summaryCloseText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#9D4EDD',
  },
  summaryContent: {
    flex: 1,
    padding: 20,
  },
  summaryTotalCard: {
    backgroundColor: 'rgba(157, 78, 221, 0.1)',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  summaryTotalLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#5A189A',
    marginBottom: 8,
  },
  summaryTotalAmount: {
    fontSize: 40,
    fontWeight: '700' as const,
    color: '#9D4EDD',
  },
  summarySubtitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#240046',
    marginBottom: 16,
  },
  categoryRow: {
    marginBottom: 16,
  },
  categoryRowInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  categoryRowName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#240046',
  },
  categoryRowPercentage: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#5A189A',
  },
  categoryRowBar: {
    height: 8,
    backgroundColor: 'rgba(157, 78, 221, 0.1)',
    borderRadius: 4,
    marginBottom: 6,
    overflow: 'hidden' as const,
  },
  categoryRowBarFill: {
    height: '100%',
    backgroundColor: '#9D4EDD',
    borderRadius: 4,
  },
  categoryRowAmount: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#9D4EDD',
  },
  emptySummary: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptySummaryText: {
    fontSize: 16,
    color: 'rgba(36, 0, 70, 0.6)',
  },
  summarySection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: '#240046',
    marginBottom: 16,
  },
  summaryCount: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#7B2CBF',
    marginTop: 8,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: 'rgba(157, 78, 221, 0.2)',
    marginVertical: 24,
  },
});
