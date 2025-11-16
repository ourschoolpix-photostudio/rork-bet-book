import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Expense, RecurringBill, ExpenseCategory, ExpenseType, MonthlyUtilities } from '@/types/expense';

const EXPENSES_STORAGE_KEY = '@casino_tracker_expenses';
const RECURRING_BILLS_STORAGE_KEY = '@casino_tracker_recurring_bills';
const UTILITIES_STORAGE_KEY = '@casino_tracker_utilities';

export const [ExpensesProvider, useExpenses] = createContextHook(() => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [recurringBills, setRecurringBills] = useState<RecurringBill[]>([]);
  const [utilities, setUtilities] = useState<MonthlyUtilities[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadExpenses = useCallback(async () => {
    try {
      const expensesJson = await AsyncStorage.getItem(EXPENSES_STORAGE_KEY);
      if (expensesJson) {
        try {
          setExpenses(JSON.parse(expensesJson));
        } catch (parseError) {
          console.error('Error parsing expenses JSON, clearing corrupted data:', parseError);
          await AsyncStorage.removeItem(EXPENSES_STORAGE_KEY);
          setExpenses([]);
        }
      }
    } catch (error) {
      console.error('Error loading expenses:', error);
    }
  }, []);

  const loadRecurringBills = useCallback(async () => {
    try {
      const billsJson = await AsyncStorage.getItem(RECURRING_BILLS_STORAGE_KEY);
      if (billsJson) {
        try {
          setRecurringBills(JSON.parse(billsJson));
        } catch (parseError) {
          console.error('Error parsing recurring bills JSON, clearing corrupted data:', parseError);
          await AsyncStorage.removeItem(RECURRING_BILLS_STORAGE_KEY);
          setRecurringBills([]);
        }
      }
    } catch (error) {
      console.error('Error loading recurring bills:', error);
    }
  }, []);

  const loadUtilities = useCallback(async () => {
    try {
      const utilitiesJson = await AsyncStorage.getItem(UTILITIES_STORAGE_KEY);
      if (utilitiesJson) {
        try {
          setUtilities(JSON.parse(utilitiesJson));
        } catch (parseError) {
          console.error('Error parsing utilities JSON, clearing corrupted data:', parseError);
          await AsyncStorage.removeItem(UTILITIES_STORAGE_KEY);
          setUtilities([]);
        }
      }
    } catch (error) {
      console.error('Error loading utilities:', error);
    }
  }, []);

  const loadAllData = useCallback(async () => {
    try {
      await Promise.all([loadExpenses(), loadRecurringBills(), loadUtilities()]);
    } catch (error) {
      console.error('Error loading expenses data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [loadExpenses, loadRecurringBills, loadUtilities]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const addExpense = useCallback(async (
    userId: string,
    category: ExpenseCategory,
    amount: number,
    description: string,
    date: Date,
    merchant?: string,
    isRecurring?: boolean,
    notes?: string,
    expenseType?: ExpenseType
  ) => {
    const newExpense: Expense = {
      id: `expense-${Date.now()}`,
      userId,
      category,
      amount,
      description,
      merchant,
      date: date.toISOString(),
      createdAt: new Date().toISOString(),
      isRecurring,
      notes,
      expenseType: expenseType || 'standard',
    };

    const updatedExpenses = [...expenses, newExpense];
    setExpenses(updatedExpenses);
    await AsyncStorage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(updatedExpenses));
  }, [expenses]);

  const updateExpense = useCallback(async (
    expenseId: string,
    category: ExpenseCategory,
    amount: number,
    description: string,
    date: Date,
    merchant?: string,
    notes?: string,
    expenseType?: ExpenseType
  ) => {
    const updatedExpenses = expenses.map(e =>
      e.id === expenseId
        ? { ...e, category, amount, description, date: date.toISOString(), merchant, notes, expenseType: expenseType || e.expenseType || 'standard' }
        : e
    );
    setExpenses(updatedExpenses);
    await AsyncStorage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(updatedExpenses));
  }, [expenses]);

  const deleteExpense = useCallback(async (expenseId: string) => {
    const updatedExpenses = expenses.filter(e => e.id !== expenseId);
    setExpenses(updatedExpenses);
    await AsyncStorage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(updatedExpenses));
  }, [expenses]);

  const addRecurringBill = useCallback(async (
    userId: string,
    name: string,
    amount: number,
    dueDay: number,
    category: ExpenseCategory
  ) => {
    const newBill: RecurringBill = {
      id: `recurring-${Date.now()}`,
      userId,
      name,
      amount,
      dueDay,
      category,
      createdAt: new Date().toISOString(),
      isActive: true,
    };

    const updatedBills = [...recurringBills, newBill];
    setRecurringBills(updatedBills);
    await AsyncStorage.setItem(RECURRING_BILLS_STORAGE_KEY, JSON.stringify(updatedBills));
  }, [recurringBills]);

  const updateRecurringBill = useCallback(async (
    billId: string,
    name: string,
    amount: number,
    dueDay: number,
    category: ExpenseCategory
  ) => {
    const updatedBills = recurringBills.map(b =>
      b.id === billId
        ? { ...b, name, amount, dueDay, category }
        : b
    );
    setRecurringBills(updatedBills);
    await AsyncStorage.setItem(RECURRING_BILLS_STORAGE_KEY, JSON.stringify(updatedBills));
  }, [recurringBills]);

  const deleteRecurringBill = useCallback(async (billId: string) => {
    const updatedBills = recurringBills.filter(b => b.id !== billId);
    setRecurringBills(updatedBills);
    await AsyncStorage.setItem(RECURRING_BILLS_STORAGE_KEY, JSON.stringify(updatedBills));
  }, [recurringBills]);

  const toggleRecurringBill = useCallback(async (billId: string) => {
    const updatedBills = recurringBills.map(b =>
      b.id === billId
        ? { ...b, isActive: !b.isActive }
        : b
    );
    setRecurringBills(updatedBills);
    await AsyncStorage.setItem(RECURRING_BILLS_STORAGE_KEY, JSON.stringify(updatedBills));
  }, [recurringBills]);

  const updateUtilities = useCallback(async (
    userId: string,
    monthKey: string,
    electric: number,
    naturalGas: number,
    water: number
  ) => {
    const existingUtility = utilities.find(
      u => u.userId === userId && u.monthKey === monthKey
    );

    let updatedUtilities: MonthlyUtilities[];
    if (existingUtility) {
      updatedUtilities = utilities.map(u =>
        u.id === existingUtility.id
          ? { ...u, electric, naturalGas, water }
          : u
      );
    } else {
      const newUtility: MonthlyUtilities = {
        id: `utility-${Date.now()}`,
        userId,
        monthKey,
        electric,
        naturalGas,
        water,
        createdAt: new Date().toISOString(),
      };
      updatedUtilities = [...utilities, newUtility];
    }

    setUtilities(updatedUtilities);
    await AsyncStorage.setItem(UTILITIES_STORAGE_KEY, JSON.stringify(updatedUtilities));
  }, [utilities]);

  const reloadAllData = useCallback(async () => {
    await loadAllData();
  }, [loadAllData]);

  return useMemo(() => ({
    expenses,
    recurringBills,
    utilities,
    isLoading,
    addExpense,
    updateExpense,
    deleteExpense,
    addRecurringBill,
    updateRecurringBill,
    deleteRecurringBill,
    toggleRecurringBill,
    updateUtilities,
    reloadAllData,
  }), [
    expenses,
    recurringBills,
    utilities,
    isLoading,
    addExpense,
    updateExpense,
    deleteExpense,
    addRecurringBill,
    updateRecurringBill,
    deleteRecurringBill,
    toggleRecurringBill,
    updateUtilities,
    reloadAllData,
  ]);
});

export function useFilteredExpenses(userId: string, categoryFilter?: ExpenseCategory, startDate?: Date, endDate?: Date) {
  const { expenses } = useExpenses();
  
  return useMemo(() => {
    let filtered = expenses.filter(e => e.userId === userId);
    
    if (categoryFilter) {
      filtered = filtered.filter(e => e.category === categoryFilter);
    }
    
    if (startDate) {
      filtered = filtered.filter(e => new Date(e.date) >= startDate);
    }
    
    if (endDate) {
      filtered = filtered.filter(e => new Date(e.date) <= endDate);
    }
    
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, userId, categoryFilter, startDate, endDate]);
}

export function useExpensesByCategory(userId: string) {
  const { expenses } = useExpenses();
  
  return useMemo(() => {
    const userExpenses = expenses.filter(e => e.userId === userId);
    const byCategory: Record<ExpenseCategory, number> = {
      'Auto Repair': 0,
      'Beauty & Health': 0,
      'Clothing': 0,
      'Convenience Store': 0,
      'Electronics': 0,
      'Entertainment': 0,
      'Fast Food': 0,
      'Gas': 0,
      'Grocery': 0,
      'Household': 0,
      'Lottery': 0,
      'Monthly Bill': 0,
      'Recreation': 0,
      'Restaurant': 0,
      'Shoes': 0,
      'Travel': 0,
    };
    
    userExpenses.forEach(expense => {
      byCategory[expense.category] += expense.amount;
    });
    
    return byCategory;
  }, [expenses, userId]);
}

export function useRecurringBillsByUser(userId: string) {
  const { recurringBills } = useExpenses();
  
  return useMemo(() => {
    return recurringBills
      .filter(b => b.userId === userId)
      .sort((a, b) => a.dueDay - b.dueDay);
  }, [recurringBills, userId]);
}

export function useMonthlyExpenses(userId: string) {
  const { expenses } = useExpenses();
  
  return useMemo(() => {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const monthlyExpenses = expenses.filter(e => {
      if (e.userId !== userId) return false;
      const expenseDate = new Date(e.date);
      return expenseDate >= firstDayOfMonth && expenseDate <= lastDayOfMonth;
    });
    
    const total = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);
    
    const byCategory: Record<ExpenseCategory, number> = {
      'Auto Repair': 0,
      'Beauty & Health': 0,
      'Clothing': 0,
      'Convenience Store': 0,
      'Electronics': 0,
      'Entertainment': 0,
      'Fast Food': 0,
      'Gas': 0,
      'Grocery': 0,
      'Household': 0,
      'Lottery': 0,
      'Monthly Bill': 0,
      'Recreation': 0,
      'Restaurant': 0,
      'Shoes': 0,
      'Travel': 0,
    };
    
    monthlyExpenses.forEach(expense => {
      byCategory[expense.category] += expense.amount;
    });
    
    return { total, byCategory, expenses: monthlyExpenses };
  }, [expenses, userId]);
}

export function useYearToDateExpenses(userId: string) {
  const { expenses } = useExpenses();
  
  return useMemo(() => {
    const now = new Date();
    const firstDayOfYear = new Date(now.getFullYear(), 0, 1);
    
    const ytdExpenses = expenses.filter(e => {
      if (e.userId !== userId) return false;
      const expenseDate = new Date(e.date);
      return expenseDate >= firstDayOfYear;
    });
    
    const total = ytdExpenses.reduce((sum, e) => sum + e.amount, 0);
    
    const byCategory: Record<ExpenseCategory, number> = {
      'Auto Repair': 0,
      'Beauty & Health': 0,
      'Clothing': 0,
      'Convenience Store': 0,
      'Electronics': 0,
      'Entertainment': 0,
      'Fast Food': 0,
      'Gas': 0,
      'Grocery': 0,
      'Household': 0,
      'Lottery': 0,
      'Monthly Bill': 0,
      'Recreation': 0,
      'Restaurant': 0,
      'Shoes': 0,
      'Travel': 0,
    };
    
    ytdExpenses.forEach(expense => {
      byCategory[expense.category] += expense.amount;
    });
    
    return { total, byCategory, expenses: ytdExpenses };
  }, [expenses, userId]);
}

export interface MonthlyExpenseGroup {
  monthKey: string;
  monthLabel: string;
  year: number;
  month: number;
  expenses: Expense[];
  total: number;
  isCurrentMonth: boolean;
}

export function useExpensesByMonth(userId: string) {
  const { expenses } = useExpenses();
  
  return useMemo(() => {
    const userExpenses = expenses.filter(e => e.userId === userId);
    
    const groupedByMonth = userExpenses.reduce((acc, expense) => {
      const expenseDate = new Date(expense.date);
      const year = expenseDate.getFullYear();
      const month = expenseDate.getMonth();
      const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
      
      if (!acc[monthKey]) {
        acc[monthKey] = [];
      }
      acc[monthKey].push(expense);
      return acc;
    }, {} as Record<string, Expense[]>);
    
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    const monthlyGroups: MonthlyExpenseGroup[] = Object.entries(groupedByMonth)
      .map(([monthKey, monthExpenses]) => {
        const [yearStr, monthStr] = monthKey.split('-');
        const year = parseInt(yearStr, 10);
        const month = parseInt(monthStr, 10) - 1;
        
        const monthDate = new Date(year, month, 1);
        const monthLabel = monthDate.toLocaleDateString('en-US', { 
          month: 'long', 
          year: 'numeric' 
        });
        
        const total = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
        
        return {
          monthKey,
          monthLabel,
          year,
          month,
          expenses: monthExpenses.sort((a, b) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
          ),
          total,
          isCurrentMonth: monthKey === currentMonthKey,
        };
      })
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      });
    
    return monthlyGroups;
  }, [expenses, userId]);
}

export function useUtilitiesByMonth(userId: string, monthKey: string) {
  const { utilities } = useExpenses();
  
  return useMemo(() => {
    return utilities.find(u => u.userId === userId && u.monthKey === monthKey);
  }, [utilities, userId, monthKey]);
}

export function useMonthlyUtilitiesTotal(userId: string) {
  const { utilities } = useExpenses();
  
  return useMemo(() => {
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    const currentUtility = utilities.find(
      u => u.userId === userId && u.monthKey === currentMonthKey
    );
    
    if (!currentUtility) return 0;
    
    return currentUtility.electric + currentUtility.naturalGas + currentUtility.water;
  }, [utilities, userId]);
}
