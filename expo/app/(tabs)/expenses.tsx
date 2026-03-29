import { useAuth } from '@/contexts/AuthContext';
import { useExpenses, useFilteredExpenses, useExpensesByCategory, useMonthlyExpenses, useYearToDateExpenses, useExpensesByMonth, useUtilitiesByMonth } from '@/contexts/ExpensesContext';
import { ExpenseCategory, Expense } from '@/types/expense';
import { WALLPAPER_URL } from '@/constants/wallpaper';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Plus, Receipt, CreditCard, ChevronDown, Trash2, BarChart3, ChevronRight, Zap, Copy, Car } from 'lucide-react-native';
import React, { useEffect, useState, useRef } from 'react';
import { Alert, ImageBackground, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | undefined>(undefined);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState<boolean>(false);
  const [showReceiptScanner, setShowReceiptScanner] = useState<boolean>(false);
  const [showRecurringBillsModal, setShowRecurringBillsModal] = useState<boolean>(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState<boolean>(false);
  const [showSummary, setShowSummary] = useState<boolean>(false);
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
  const [expandedYears, setExpandedYears] = useState<Set<number>>(new Set());
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

function UtilitiesSection({ userId, monthKey, onUpdateUtilities }: {
  userId: string;
  monthKey: string;
  onUpdateUtilities: (userId: string, monthKey: string, electric: number, naturalGas: number, water: number) => Promise<void>;
}) {
  const existingUtilities = useUtilitiesByMonth(userId, monthKey);
  const [electric, setElectric] = useState<string>(
    existingUtilities?.electric.toString() || ''
  );
  const [naturalGas, setNaturalGas] = useState<string>(
    existingUtilities?.naturalGas.toString() || ''
  );
  const [water, setWater] = useState<string>(
    existingUtilities?.water.toString() || ''
  );

  useEffect(() => {
    if (existingUtilities) {
      setElectric(existingUtilities.electric.toString());
      setNaturalGas(existingUtilities.naturalGas.toString());
      setWater(existingUtilities.water.toString());
    }
  }, [existingUtilities]);

  const handleSave = async () => {
    const electricNum = parseFloat(electric) || 0;
    const naturalGasNum = parseFloat(naturalGas) || 0;
    const waterNum = parseFloat(water) || 0;

    await onUpdateUtilities(userId, monthKey, electricNum, naturalGasNum, waterNum);
  };

  const utilitiesTotal = (parseFloat(electric) || 0) + (parseFloat(naturalGas) || 0) + (parseFloat(water) || 0);

  return (
    <View style={styles.utilitiesSection}>
      <View style={styles.utilitiesSectionHeader}>
        <Zap size={20} color="#FFFFFF" />
        <Text style={styles.utilitiesSectionTitle}>Monthly Utilities</Text>
        <Text style={styles.utilitiesTotal}>${utilitiesTotal.toFixed(2)}</Text>
      </View>
      <View style={styles.utilitiesGrid}>
        <View style={styles.utilityInput}>
          <Text style={styles.utilityLabel}>Electric</Text>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputPrefix}>$</Text>
            <TextInput
              style={styles.utilityTextInput}
              placeholder="0.00"
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              value={electric}
              onChangeText={setElectric}
              keyboardType="decimal-pad"
              onBlur={handleSave}
            />
          </View>
        </View>
        <View style={styles.utilityInput}>
          <Text style={styles.utilityLabel}>Natural Gas</Text>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputPrefix}>$</Text>
            <TextInput
              style={styles.utilityTextInput}
              placeholder="0.00"
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              value={naturalGas}
              onChangeText={setNaturalGas}
              keyboardType="decimal-pad"
              onBlur={handleSave}
            />
          </View>
        </View>
        <View style={styles.utilityInput}>
          <Text style={styles.utilityLabel}>Water</Text>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputPrefix}>$</Text>
            <TextInput
              style={styles.utilityTextInput}
              placeholder="0.00"
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              value={water}
              onChangeText={setWater}
              keyboardType="decimal-pad"
              onBlur={handleSave}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

  useEffect(() => {
    if (!currentUser) {
      router.replace('/login');
    }
  }, [currentUser, router]);

  const expenses = useFilteredExpenses(currentUser?.id || '', selectedCategory);
  const expensesByCategory = useExpensesByCategory(currentUser?.id || '');
  const monthlyExpenses = useMonthlyExpenses(currentUser?.id || '');
  const ytdExpenses = useYearToDateExpenses(currentUser?.id || '');
  const expensesByMonth = useExpensesByMonth(currentUser?.id || '');
  const { deleteExpense, addExpense, updateExpense, addRecurringBill, deleteRecurringBill, updateUtilities } = useExpenses();

  const currentYear = new Date().getFullYear();
  const currentYearExpenses = expenses.filter(exp => new Date(exp.date).getFullYear() === currentYear);
  const totalExpenses = currentYearExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const standardTotal = currentYearExpenses.filter(e => (e.expenseType || 'standard') === 'standard').reduce((sum, exp) => sum + exp.amount, 0);
  const businessTotal = currentYearExpenses.filter(e => e.expenseType === 'business').reduce((sum, exp) => sum + exp.amount, 0);
  const vacationTotal = currentYearExpenses.filter(e => e.expenseType === 'vacation').reduce((sum, exp) => sum + exp.amount, 0);

  const toggleMonth = (monthKey: string) => {
    setExpandedMonths(prev => {
      const newSet = new Set(prev);
      if (newSet.has(monthKey)) {
        newSet.delete(monthKey);
      } else {
        newSet.add(monthKey);
      }
      return newSet;
    });
  };

  const toggleYear = (year: number) => {
    setExpandedYears(prev => {
      const newSet = new Set(prev);
      if (newSet.has(year)) {
        newSet.delete(year);
      } else {
        newSet.add(year);
      }
      return newSet;
    });
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setShowAddExpenseModal(true);
  };

  const handleDuplicateExpense = (expense: Expense) => {
    const duplicatedExpense = {
      ...expense,
      id: `temp-duplicate-${Date.now()}`,
    };
    setEditingExpense(duplicatedExpense);
    setShowAddExpenseModal(true);
  };

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

  const handleCloseModal = () => {
    setShowAddExpenseModal(false);
    setEditingExpense(null);
  };

  if (!currentUser) {
    return null;
  }

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

      <KeyboardAvoidingView 
        style={styles.contentWrapper}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
          <View style={styles.headerTop}>
            <View style={styles.headerCenter}>
              <Text style={styles.casinoTitle}>MY EXPENSES</Text>
            </View>
          </View>
        </View>

        <View style={styles.topSection}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>
              {selectedCategory ? `${selectedCategory} Total (${currentYear})` : `Total Expenses (${currentYear})`}
            </Text>
            <Text style={styles.summaryAmount}>${totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
          </View>

          <View style={styles.typesSummaryRow}>
            <View style={styles.typeSummaryCard}>
              <Text style={styles.typeSummaryLabel}>Standard</Text>
              <Text style={styles.typeSummaryAmount}>${standardTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
            </View>
            <View style={styles.typeSummaryCard}>
              <Text style={styles.typeSummaryLabel}>Business</Text>
              <Text style={styles.typeSummaryAmount}>${businessTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
            </View>
            <View style={styles.typeSummaryCard}>
              <Text style={styles.typeSummaryLabel}>Vacation</Text>
              <Text style={styles.typeSummaryAmount}>${vacationTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
            </View>
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
              <Plus size={18} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Add Expense</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.actionButton,
                pressed && styles.actionButtonPressed,
              ]}
              onPress={() => setShowReceiptScanner(true)}
            >
              <Receipt size={18} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Scan Receipt</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.actionButton,
                pressed && styles.actionButtonPressed,
              ]}
              onPress={() => router.push('/vehicles')}
            >
              <Car size={18} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Vehicle Expenses</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.actionButton,
                pressed && styles.actionButtonPressed,
              ]}
              onPress={() => setShowRecurringBillsModal(true)}
            >
              <CreditCard size={18} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Recurring Bills</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.actionButton,
                pressed && styles.actionButtonPressed,
              ]}
              onPress={() => setShowSummary(true)}
            >
              <BarChart3 size={18} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Summary</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.listContainer}>
          <Text style={styles.listTitle}>
            {selectedCategory ? `${selectedCategory} - By Month` : 'Expenses By Month'}
          </Text>
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {expensesByMonth.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No expenses yet</Text>
                <Text style={styles.emptySubtext}>
                  Add an expense or scan a receipt to get started
                </Text>
              </View>
            ) : (() => {
              const filteredMonths = expensesByMonth.filter(monthGroup => 
                !selectedCategory || 
                monthGroup.expenses.some(e => e.category === selectedCategory)
              );

              const groupedByYear = filteredMonths.reduce((acc, monthGroup) => {
                const year = monthGroup.year;
                if (!acc[year]) {
                  acc[year] = [];
                }
                acc[year].push(monthGroup);
                return acc;
              }, {} as Record<number, typeof filteredMonths>);

              const currentYear = new Date().getFullYear();
              const years = Object.keys(groupedByYear)
                .map(Number)
                .sort((a, b) => b - a);

              return years.map((year) => {
                const yearMonths = groupedByYear[year];
                const isPastYear = year < currentYear;
                const isYearExpanded = expandedYears.has(year);
                
                const yearTotal = yearMonths.reduce((sum, m) => {
                  const monthFilteredExpenses = selectedCategory
                    ? m.expenses.filter(e => e.category === selectedCategory)
                    : m.expenses;
                  return sum + monthFilteredExpenses.reduce((s, e) => s + e.amount, 0);
                }, 0);
                
                const yearExpenseCount = yearMonths.reduce((sum, m) => {
                  const monthFilteredExpenses = selectedCategory
                    ? m.expenses.filter(e => e.category === selectedCategory)
                    : m.expenses;
                  return sum + monthFilteredExpenses.length;
                }, 0);

                if (isPastYear) {
                  return (
                    <View key={`year-${year}`} style={styles.yearCard}>
                      <Pressable
                        style={({ pressed }) => [
                          styles.yearHeader,
                          pressed && styles.yearHeaderPressed,
                        ]}
                        onPress={() => toggleYear(year)}
                      >
                        <View style={styles.yearHeaderLeft}>
                          <View style={styles.yearIconContainer}>
                            <ChevronRight
                              size={22}
                              color="#FFFFFF"
                              style={{
                                transform: [{ rotate: isYearExpanded ? '90deg' : '0deg' }],
                              }}
                            />
                          </View>
                          <View>
                            <Text style={styles.yearLabel}>{year}</Text>
                            <Text style={styles.yearCount}>
                              {yearExpenseCount} expense{yearExpenseCount !== 1 ? 's' : ''}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.yearTotal}>${yearTotal.toFixed(2)}</Text>
                      </Pressable>

                      {isYearExpanded && (
                        <View style={styles.yearMonthsList}>
                          {yearMonths.map((monthGroup) => {
                            const isExpanded = expandedMonths.has(monthGroup.monthKey);
                            const filteredExpenses = selectedCategory
                              ? monthGroup.expenses.filter(e => e.category === selectedCategory)
                              : monthGroup.expenses;
                            const displayTotal = selectedCategory
                              ? filteredExpenses.reduce((sum, e) => sum + e.amount, 0)
                              : monthGroup.total;

                            return (
                              <View key={monthGroup.monthKey} style={styles.monthCard}>
                                <Pressable
                                  style={({ pressed }) => [
                                    styles.monthHeader,
                                    pressed && styles.monthHeaderPressed,
                                  ]}
                                  onPress={() => toggleMonth(monthGroup.monthKey)}
                                >
                                  <View style={styles.monthHeaderLeft}>
                                    <View style={styles.monthIconContainer}>
                                      <ChevronRight
                                        size={20}
                                        color="#FFFFFF"
                                        style={{
                                          transform: [{ rotate: isExpanded ? '90deg' : '0deg' }],
                                        }}
                                      />
                                    </View>
                                    <View>
                                      <Text style={styles.monthLabel}>
                                        {monthGroup.monthLabel}
                                      </Text>
                                      <Text style={styles.monthCount}>
                                        {filteredExpenses.length} expense{filteredExpenses.length !== 1 ? 's' : ''}
                                      </Text>
                                    </View>
                                  </View>
                                  <Text style={styles.monthTotal}>${displayTotal.toFixed(2)}</Text>
                                </Pressable>

                                {isExpanded && (() => {
                                  const groupedByType = {
                                    standard: filteredExpenses.filter(e => (e.expenseType || 'standard') === 'standard'),
                                    business: filteredExpenses.filter(e => e.expenseType === 'business'),
                                    vacation: filteredExpenses.filter(e => e.expenseType === 'vacation'),
                                  };

                                  return (
                                    <View style={styles.monthExpensesList}>
                                      <UtilitiesSection
                                        userId={currentUser?.id || ''}
                                        monthKey={monthGroup.monthKey}
                                        onUpdateUtilities={updateUtilities}
                                      />
                                      {groupedByType.standard.length > 0 && (
                                        <View style={styles.expenseTypeSection}>
                                          <Text style={styles.expenseTypeLabel}>Standard</Text>
                                          {groupedByType.standard.map((item) => (
                                            <Pressable
                                              key={item.id}
                                              style={({ pressed }) => [
                                                styles.expenseItem,
                                                pressed && styles.expenseItemPressed,
                                              ]}
                                              onPress={() => handleEditExpense(item)}
                                            >
                                              <View style={styles.expenseInfo}>
                                                <Text style={styles.expenseCategory}>{item.category}</Text>
                                                <Text style={styles.expenseDescription}>{item.description}</Text>
                                                {item.merchant && (
                                                  <Text style={styles.expenseMerchant}>{item.merchant}</Text>
                                                )}
                                                {item.notes && (
                                                  <Text style={styles.expenseNotes}>{item.notes}</Text>
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
                                                    onPress={() => handleDuplicateExpense(item)}
                                                  >
                                                    <Copy size={18} color="#FFFFFF" />
                                                  </Pressable>
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
                                            </Pressable>
                                          ))}
                                        </View>
                                      )}
                                      {groupedByType.business.length > 0 && (
                                        <View style={styles.expenseTypeSection}>
                                          <Text style={styles.expenseTypeLabel}>Business</Text>
                                          {groupedByType.business.map((item) => (
                                            <Pressable
                                              key={item.id}
                                              style={({ pressed }) => [
                                                styles.expenseItem,
                                                pressed && styles.expenseItemPressed,
                                              ]}
                                              onPress={() => handleEditExpense(item)}
                                            >
                                              <View style={styles.expenseInfo}>
                                                <Text style={styles.expenseCategory}>{item.category}</Text>
                                                <Text style={styles.expenseDescription}>{item.description}</Text>
                                                {item.merchant && (
                                                  <Text style={styles.expenseMerchant}>{item.merchant}</Text>
                                                )}
                                                {item.notes && (
                                                  <Text style={styles.expenseNotes}>{item.notes}</Text>
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
                                                    onPress={() => handleDuplicateExpense(item)}
                                                  >
                                                    <Copy size={18} color="#FFFFFF" />
                                                  </Pressable>
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
                                            </Pressable>
                                          ))}
                                        </View>
                                      )}
                                      {groupedByType.vacation.length > 0 && (
                                        <View style={styles.expenseTypeSection}>
                                          <Text style={styles.expenseTypeLabel}>Vacation</Text>
                                          {groupedByType.vacation.map((item) => (
                                            <Pressable
                                              key={item.id}
                                              style={({ pressed }) => [
                                                styles.expenseItem,
                                                pressed && styles.expenseItemPressed,
                                              ]}
                                              onPress={() => handleEditExpense(item)}
                                            >
                                              <View style={styles.expenseInfo}>
                                                <Text style={styles.expenseCategory}>{item.category}</Text>
                                                <Text style={styles.expenseDescription}>{item.description}</Text>
                                                {item.merchant && (
                                                  <Text style={styles.expenseMerchant}>{item.merchant}</Text>
                                                )}
                                                {item.notes && (
                                                  <Text style={styles.expenseNotes}>{item.notes}</Text>
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
                                                    onPress={() => handleDuplicateExpense(item)}
                                                  >
                                                    <Copy size={18} color="#FFFFFF" />
                                                  </Pressable>
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
                                            </Pressable>
                                          ))}
                                        </View>
                                      )}
                                    </View>
                                  );
                                })()}
                              </View>
                            );
                          })}
                        </View>
                      )}
                    </View>
                  );
                }

                return yearMonths.map((monthGroup) => {
                  const isExpanded = expandedMonths.has(monthGroup.monthKey);
                  const filteredExpenses = selectedCategory
                    ? monthGroup.expenses.filter(e => e.category === selectedCategory)
                    : monthGroup.expenses;
                  const displayTotal = selectedCategory
                    ? filteredExpenses.reduce((sum, e) => sum + e.amount, 0)
                    : monthGroup.total;

                  return (
                    <View key={monthGroup.monthKey} style={styles.monthCard}>
                      <Pressable
                        style={({ pressed }) => [
                          styles.monthHeader,
                          pressed && styles.monthHeaderPressed,
                        ]}
                        onPress={() => toggleMonth(monthGroup.monthKey)}
                      >
                        <View style={styles.monthHeaderLeft}>
                          <View style={styles.monthIconContainer}>
                            <ChevronRight
                              size={20}
                              color="#FFFFFF"
                              style={{
                                transform: [{ rotate: isExpanded ? '90deg' : '0deg' }],
                              }}
                            />
                          </View>
                          <View>
                            <Text style={styles.monthLabel}>
                              {monthGroup.monthLabel}
                              {monthGroup.isCurrentMonth && (
                                <Text style={styles.currentMonthBadge}> • Current</Text>
                              )}
                            </Text>
                            <Text style={styles.monthCount}>
                              {filteredExpenses.length} expense{filteredExpenses.length !== 1 ? 's' : ''}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.monthTotal}>${displayTotal.toFixed(2)}</Text>
                      </Pressable>

                      {isExpanded && (() => {
                        const groupedByType = {
                          standard: filteredExpenses.filter(e => (e.expenseType || 'standard') === 'standard'),
                          business: filteredExpenses.filter(e => e.expenseType === 'business'),
                          vacation: filteredExpenses.filter(e => e.expenseType === 'vacation'),
                        };

                        return (
                          <View style={styles.monthExpensesList}>
                            <UtilitiesSection
                              userId={currentUser?.id || ''}
                              monthKey={monthGroup.monthKey}
                              onUpdateUtilities={updateUtilities}
                            />
                            {groupedByType.standard.length > 0 && (
                              <View style={styles.expenseTypeSection}>
                                <Text style={styles.expenseTypeLabel}>Standard</Text>
                                {groupedByType.standard.map((item) => (
                                  <Pressable
                                    key={item.id}
                                    style={({ pressed }) => [
                                      styles.expenseItem,
                                      pressed && styles.expenseItemPressed,
                                    ]}
                                    onPress={() => handleEditExpense(item)}
                                  >
                                    <View style={styles.expenseInfo}>
                                      <Text style={styles.expenseCategory}>{item.category}</Text>
                                      <Text style={styles.expenseDescription}>{item.description}</Text>
                                      {item.merchant && (
                                        <Text style={styles.expenseMerchant}>{item.merchant}</Text>
                                      )}
                                      {item.notes && (
                                        <Text style={styles.expenseNotes}>{item.notes}</Text>
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
                                          onPress={() => handleDuplicateExpense(item)}
                                        >
                                          <Copy size={18} color="#FFFFFF" />
                                        </Pressable>
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
                                  </Pressable>
                                ))}
                              </View>
                            )}
                            {groupedByType.business.length > 0 && (
                              <View style={styles.expenseTypeSection}>
                                <Text style={styles.expenseTypeLabel}>Business</Text>
                                {groupedByType.business.map((item) => (
                                  <Pressable
                                    key={item.id}
                                    style={({ pressed }) => [
                                      styles.expenseItem,
                                      pressed && styles.expenseItemPressed,
                                    ]}
                                    onPress={() => handleEditExpense(item)}
                                  >
                                    <View style={styles.expenseInfo}>
                                      <Text style={styles.expenseCategory}>{item.category}</Text>
                                      <Text style={styles.expenseDescription}>{item.description}</Text>
                                      {item.merchant && (
                                        <Text style={styles.expenseMerchant}>{item.merchant}</Text>
                                      )}
                                      {item.notes && (
                                        <Text style={styles.expenseNotes}>{item.notes}</Text>
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
                                          onPress={() => handleDuplicateExpense(item)}
                                        >
                                          <Copy size={18} color="#FFFFFF" />
                                        </Pressable>
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
                                  </Pressable>
                                ))}
                              </View>
                            )}
                            {groupedByType.vacation.length > 0 && (
                              <View style={styles.expenseTypeSection}>
                                <Text style={styles.expenseTypeLabel}>Vacation</Text>
                                {groupedByType.vacation.map((item) => (
                                  <Pressable
                                    key={item.id}
                                    style={({ pressed }) => [
                                      styles.expenseItem,
                                      pressed && styles.expenseItemPressed,
                                    ]}
                                    onPress={() => handleEditExpense(item)}
                                  >
                                    <View style={styles.expenseInfo}>
                                      <Text style={styles.expenseCategory}>{item.category}</Text>
                                      <Text style={styles.expenseDescription}>{item.description}</Text>
                                      {item.merchant && (
                                        <Text style={styles.expenseMerchant}>{item.merchant}</Text>
                                      )}
                                      {item.notes && (
                                        <Text style={styles.expenseNotes}>{item.notes}</Text>
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
                                          onPress={() => handleDuplicateExpense(item)}
                                        >
                                          <Copy size={18} color="#FFFFFF" />
                                        </Pressable>
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
                                  </Pressable>
                                ))}
                              </View>
                            )}
                          </View>
                        );
                      })()}
                    </View>
                  );
                });
              });
            })()}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

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
        onClose={handleCloseModal}
        editingExpense={editingExpense}
        onSubmit={async (category, amount, description, date, merchant, notes, expenseType) => {
          if (currentUser) {
            if (editingExpense && !editingExpense.id.startsWith('temp-duplicate-')) {
              await updateExpense(editingExpense.id, category, amount, description, date, merchant, notes, expenseType);
            } else {
              await addExpense(currentUser.id, category, amount, description, date, merchant, false, notes, expenseType);
            }
          }
        }}
      />

      <ReceiptScannerModal
        visible={showReceiptScanner}
        onClose={() => setShowReceiptScanner(false)}
        onSubmit={async (category, amount, description, date, merchant, notes, expenseType) => {
          if (currentUser) {
            await addExpense(currentUser.id, category, amount, description, date, merchant, false, notes, expenseType);
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
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#3D1F66',
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
  casinoTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  topSection: {
    padding: 20,
    gap: 16,
  },
  summaryCard: {
    backgroundColor: '#9D4EDD',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  categoryFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#9D4EDD',
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
    backgroundColor: '#9D4EDD',
    borderRadius: 10,
    padding: 8,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  actionButtonPressed: {
    opacity: 0.7,
  },
  actionButtonText: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: '#FFFFFF',
    textAlign: 'center' as const,
  },
  listContainer: {
    flex: 1,
    backgroundColor: '#D4A5F5',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  listTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  expenseItem: {
    flexDirection: 'row',
    backgroundColor: '#5A189A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    gap: 12,
  },
  expenseItemPressed: {
    opacity: 0.8,
    backgroundColor: '#7B2CBF',
  },
  expenseInfo: {
    flex: 1,
    gap: 4,
  },
  expenseCategory: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  expenseDescription: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  expenseMerchant: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  expenseNotes: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.75)',
    fontStyle: 'italic' as const,
    lineHeight: 18,
  },
  expenseDate: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  expenseActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  expenseAmount: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  expenseButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
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
    color: '#FFFFFF',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
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
  monthCard: {
    backgroundColor: '#9D4EDD',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden' as const,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#9D4EDD',
  },
  monthHeaderPressed: {
    opacity: 0.7,
  },
  monthHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  monthIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthLabel: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  currentMonthBadge: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FFD700',
  },
  monthCount: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  monthTotal: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  monthExpensesList: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 8,
  },
  yearCard: {
    backgroundColor: '#7B2CBF',
    borderRadius: 18,
    marginBottom: 20,
    overflow: 'hidden' as const,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  yearHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    backgroundColor: '#7B2CBF',
  },
  yearHeaderPressed: {
    opacity: 0.7,
  },
  yearHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  yearIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  yearLabel: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  yearCount: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 3,
  },
  yearTotal: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  yearMonthsList: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 12,
  },
  utilitiesSection: {
    backgroundColor: '#7B2CBF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  utilitiesSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  utilitiesSectionTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  utilitiesTotal: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFD700',
  },
  utilitiesGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  utilityInput: {
    flex: 1,
  },
  utilityLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  inputPrefix: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FFFFFF',
    marginRight: 4,
  },
  utilityTextInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FFFFFF',
    paddingVertical: 8,
  },
  expenseTypeSection: {
    marginTop: 8,
    marginBottom: 4,
  },
  expenseTypeLabel: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#FFD700',
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
  },
  typesSummaryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  typeSummaryCard: {
    flex: 1,
    backgroundColor: '#7B2CBF',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  typeSummaryLabel: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  typeSummaryAmount: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
});
