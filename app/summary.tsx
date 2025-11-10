import { useAuth } from '@/contexts/AuthContext';
import { useBets } from '@/contexts/BetsContext';
import { useSportsBets } from '@/contexts/SportsBetsContext';
import { useMonthlyExpenses, useYearToDateExpenses, useRecurringBillsByUser, useExpensesByMonth } from '@/contexts/ExpensesContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign, Receipt, Calendar, ChevronRight } from 'lucide-react-native';
import { ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState } from 'react';

export default function SummaryScreen() {
  const { currentUser, completedSessions } = useAuth();
  const { bets } = useBets();
  const { sportsBets } = useSportsBets();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());

  const monthlyExpenses = useMonthlyExpenses(currentUser?.id || '');
  const ytdExpenses = useYearToDateExpenses(currentUser?.id || '');
  const recurringBills = useRecurringBillsByUser(currentUser?.id || '');
  const expensesByMonth = useExpensesByMonth(currentUser?.id || '');

  const activeRecurringBills = recurringBills.filter(bill => bill.isActive);
  const monthlyRecurringTotal = activeRecurringBills.reduce((sum, bill) => sum + bill.amount, 0);
  const additionalExpensesTotal = monthlyExpenses.total - monthlyRecurringTotal;

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

  const casinoStats = completedSessions.reduce(
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
  const casinoNet = casinoStats.totalWinnings - casinoStats.totalLosses;

  const userBets = bets.filter(b => b.userId === currentUser?.id);
  const betsWon = userBets.filter(b => b.won).reduce((sum, bet) => sum + bet.amount, 0);
  const betsLost = userBets.filter(b => !b.won).reduce((sum, bet) => sum + bet.amount, 0);
  const betsNet = betsWon - betsLost;

  const userSportsBets = sportsBets.filter(b => b.userId === currentUser?.id);
  const sportsBetsWon = userSportsBets.filter(b => b.won).reduce((sum, bet) => sum + bet.amount, 0);
  const sportsBetsLost = userSportsBets.filter(b => !b.won).reduce((sum, bet) => sum + bet.amount, 0);
  const sportsBetsNet = sportsBetsWon - sportsBetsLost;

  const grandTotalWinnings = casinoStats.totalWinnings + betsWon + sportsBetsWon;
  const grandTotalLosses = casinoStats.totalLosses + betsLost + sportsBetsLost;
  const grandNet = grandTotalWinnings - grandTotalLosses;

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
            <Text style={styles.headerTitle}>SUMMARY</Text>
            <Text style={[styles.headerTotal, grandNet >= 0 ? styles.positiveNet : styles.negativeNet]}>
              {grandNet >= 0 ? '+' : ''}${grandNet.toFixed(2)}
            </Text>
          </View>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.scrollContent}
          contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.grandTotalCard}>
            <View style={styles.grandTotalHeader}>
              <DollarSign size={32} color="#FFD700" />
              <Text style={styles.grandTotalLabel}>Grand Total</Text>
            </View>
            <Text style={[styles.grandTotalValue, grandNet >= 0 ? styles.positiveValue : styles.negativeValue]}>
              {grandNet >= 0 ? '+' : ''}${grandNet.toFixed(2)}
            </Text>
            <View style={styles.grandTotalStats}>
              <View style={styles.grandTotalStatItem}>
                <TrendingUp size={20} color="#10B981" />
                <Text style={styles.grandTotalStatLabel}>Total Won</Text>
                <Text style={styles.grandTotalStatValue}>${grandTotalWinnings.toFixed(2)}</Text>
              </View>
              <View style={styles.grandTotalStatItem}>
                <TrendingDown size={20} color="#EF4444" />
                <Text style={styles.grandTotalStatLabel}>Total Lost</Text>
                <Text style={styles.grandTotalStatValue}>${grandTotalLosses.toFixed(2)}</Text>
              </View>
            </View>
          </View>

          <View style={styles.categoriesContainer}>
            <Text style={styles.sectionTitle}>By Category</Text>

            <View style={styles.categoryCard}>
              <View style={styles.categoryHeader}>
                <Text style={styles.categoryName}>Casino Sessions</Text>
                <Text style={[styles.categoryNet, casinoNet >= 0 ? styles.positiveNet : styles.negativeNet]}>
                  {casinoNet >= 0 ? '+' : ''}${casinoNet.toFixed(2)}
                </Text>
              </View>
              <View style={styles.categoryStats}>
                <View style={styles.categoryStatItem}>
                  <Text style={styles.categoryStatLabel}>Won</Text>
                  <Text style={styles.categoryStatValue}>${casinoStats.totalWinnings.toFixed(2)}</Text>
                </View>
                <View style={styles.categoryStatItem}>
                  <Text style={styles.categoryStatLabel}>Lost</Text>
                  <Text style={styles.categoryStatValue}>${casinoStats.totalLosses.toFixed(2)}</Text>
                </View>
                <View style={styles.categoryStatItem}>
                  <Text style={styles.categoryStatLabel}>Sessions</Text>
                  <Text style={styles.categoryStatValue}>{completedSessions.length}</Text>
                </View>
              </View>
            </View>

            <View style={styles.categoryCard}>
              <View style={styles.categoryHeader}>
                <Text style={styles.categoryName}>Personal Bets</Text>
                <Text style={[styles.categoryNet, betsNet >= 0 ? styles.positiveNet : styles.negativeNet]}>
                  {betsNet >= 0 ? '+' : ''}${betsNet.toFixed(2)}
                </Text>
              </View>
              <View style={styles.categoryStats}>
                <View style={styles.categoryStatItem}>
                  <Text style={styles.categoryStatLabel}>Won</Text>
                  <Text style={styles.categoryStatValue}>${betsWon.toFixed(2)}</Text>
                </View>
                <View style={styles.categoryStatItem}>
                  <Text style={styles.categoryStatLabel}>Lost</Text>
                  <Text style={styles.categoryStatValue}>${betsLost.toFixed(2)}</Text>
                </View>
                <View style={styles.categoryStatItem}>
                  <Text style={styles.categoryStatLabel}>Bets</Text>
                  <Text style={styles.categoryStatValue}>{userBets.length}</Text>
                </View>
              </View>
            </View>

            <View style={styles.categoryCard}>
              <View style={styles.categoryHeader}>
                <Text style={styles.categoryName}>Sports Bets</Text>
                <Text style={[styles.categoryNet, sportsBetsNet >= 0 ? styles.positiveNet : styles.negativeNet]}>
                  {sportsBetsNet >= 0 ? '+' : ''}${sportsBetsNet.toFixed(2)}
                </Text>
              </View>
              <View style={styles.categoryStats}>
                <View style={styles.categoryStatItem}>
                  <Text style={styles.categoryStatLabel}>Won</Text>
                  <Text style={styles.categoryStatValue}>${sportsBetsWon.toFixed(2)}</Text>
                </View>
                <View style={styles.categoryStatItem}>
                  <Text style={styles.categoryStatLabel}>Lost</Text>
                  <Text style={styles.categoryStatValue}>${sportsBetsLost.toFixed(2)}</Text>
                </View>
                <View style={styles.categoryStatItem}>
                  <Text style={styles.categoryStatLabel}>Bets</Text>
                  <Text style={styles.categoryStatValue}>{userSportsBets.length}</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.categoriesContainer}>
            <Text style={styles.sectionTitle}>Expenses</Text>

            <View style={styles.categoryCard}>
              <View style={styles.categoryHeader}>
                <View style={styles.categoryHeaderLeft}>
                  <Calendar size={20} color="#240046" />
                  <Text style={styles.categoryName}>Monthly Recurring Bills</Text>
                </View>
                <Text style={styles.expenseValue}>${monthlyRecurringTotal.toFixed(2)}</Text>
              </View>
              <View style={styles.categoryStats}>
                <View style={styles.categoryStatItem}>
                  <Text style={styles.categoryStatLabel}>Active Bills</Text>
                  <Text style={styles.categoryStatValue}>{activeRecurringBills.length}</Text>
                </View>
              </View>
            </View>

            <View style={styles.categoryCard}>
              <View style={styles.categoryHeader}>
                <View style={styles.categoryHeaderLeft}>
                  <Receipt size={20} color="#240046" />
                  <Text style={styles.categoryName}>Additional Expenses (Month)</Text>
                </View>
                <Text style={styles.expenseValue}>${additionalExpensesTotal.toFixed(2)}</Text>
              </View>
              <View style={styles.categoryStats}>
                <View style={styles.categoryStatItem}>
                  <Text style={styles.categoryStatLabel}>Total Expenses</Text>
                  <Text style={styles.categoryStatValue}>${monthlyExpenses.total.toFixed(2)}</Text>
                </View>
                <View style={styles.categoryStatItem}>
                  <Text style={styles.categoryStatLabel}>YTD Expenses</Text>
                  <Text style={styles.categoryStatValue}>${ytdExpenses.total.toFixed(2)}</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.categoriesContainer}>
            <Text style={styles.sectionTitle}>Monthly Expense History</Text>
            
            {expensesByMonth.length === 0 ? (
              <View style={styles.emptyMonthsContainer}>
                <Text style={styles.emptyMonthsText}>No expenses recorded yet</Text>
              </View>
            ) : (
              expensesByMonth.map((monthGroup) => {
                const isExpanded = expandedMonths.has(monthGroup.monthKey);
                return (
                  <View key={monthGroup.monthKey} style={styles.monthCard}>
                    <Pressable
                      style={({ pressed }) => [
                        styles.monthCardHeader,
                        pressed && styles.monthCardHeaderPressed,
                      ]}
                      onPress={() => toggleMonth(monthGroup.monthKey)}
                    >
                      <View style={styles.monthCardHeaderLeft}>
                        <View style={styles.monthIconContainer}>
                          <ChevronRight
                            size={18}
                            color="#240046"
                            style={{
                              transform: [{ rotate: isExpanded ? '90deg' : '0deg' }],
                            }}
                          />
                        </View>
                        <View>
                          <Text style={styles.monthCardLabel}>
                            {monthGroup.monthLabel}
                            {monthGroup.isCurrentMonth && (
                              <Text style={styles.currentMonthBadge}> • Current</Text>
                            )}
                          </Text>
                          <Text style={styles.monthCardCount}>
                            {monthGroup.expenses.length} expense{monthGroup.expenses.length !== 1 ? 's' : ''}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.monthCardTotal}>${monthGroup.total.toFixed(2)}</Text>
                    </Pressable>

                    {isExpanded && (
                      <View style={styles.monthExpensesList}>
                        {monthGroup.expenses.map((expense) => (
                          <View key={expense.id} style={styles.expenseRow}>
                            <View style={styles.expenseRowLeft}>
                              <Text style={styles.expenseRowCategory}>{expense.category}</Text>
                              <Text style={styles.expenseRowDescription}>{expense.description}</Text>
                              {expense.merchant && (
                                <Text style={styles.expenseRowMerchant}>{expense.merchant}</Text>
                              )}
                              <Text style={styles.expenseRowDate}>
                                {new Date(expense.date).toLocaleDateString()}
                              </Text>
                            </View>
                            <Text style={styles.expenseRowAmount}>${expense.amount.toFixed(2)}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>
      </View>
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
  placeholder: {
    width: 40,
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
  scrollContent: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    gap: 24,
  },
  grandTotalCard: {
    backgroundColor: 'rgba(157, 78, 221, 0.95)',
    borderRadius: 20,
    padding: 24,
    borderWidth: 2,
    borderColor: '#FFD700',
    gap: 16,
  },
  grandTotalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  grandTotalLabel: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  grandTotalValue: {
    fontSize: 42,
    fontWeight: '700' as const,
    textAlign: 'center',
  },
  positiveValue: {
    color: '#FFD700',
  },
  negativeValue: {
    color: '#EF4444',
  },
  grandTotalStats: {
    flexDirection: 'row',
    gap: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  grandTotalStatItem: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  grandTotalStatLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600' as const,
  },
  grandTotalStatValue: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  categoriesContainer: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  categoryCard: {
    backgroundColor: 'rgba(220, 190, 255, 0.95)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    gap: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(157, 78, 221, 0.2)',
  },
  categoryName: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#240046',
  },
  categoryNet: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  categoryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  categoryStatItem: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  categoryStatLabel: {
    fontSize: 12,
    color: 'rgba(36, 0, 70, 0.7)',
    fontWeight: '600' as const,
  },
  categoryStatValue: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#240046',
  },
  categoryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  expenseValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#240046',
  },
  emptyMonthsContainer: {
    backgroundColor: 'rgba(220, 190, 255, 0.95)',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  emptyMonthsText: {
    fontSize: 16,
    color: 'rgba(36, 0, 70, 0.7)',
    fontWeight: '600' as const,
  },
  monthCard: {
    backgroundColor: 'rgba(220, 190, 255, 0.95)',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden' as const,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  monthCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  monthCardHeaderPressed: {
    opacity: 0.7,
  },
  monthCardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  monthIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthCardLabel: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#240046',
  },
  currentMonthBadge: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#9D4EDD',
  },
  monthCardCount: {
    fontSize: 12,
    color: '#5A189A',
    marginTop: 2,
  },
  monthCardTotal: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#240046',
  },
  monthExpensesList: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(157, 78, 221, 0.2)',
  },
  expenseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  expenseRowLeft: {
    flex: 1,
    gap: 2,
  },
  expenseRowCategory: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#5A189A',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  expenseRowDescription: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#240046',
  },
  expenseRowMerchant: {
    fontSize: 12,
    color: '#7B2CBF',
  },
  expenseRowDate: {
    fontSize: 11,
    color: '#9D4EDD',
  },
  expenseRowAmount: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#240046',
  },
});
