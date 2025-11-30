import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Expense, RecurringBill, ExpenseCategory, ExpenseType, MonthlyUtilities, Vehicle, VehicleExpense, VehicleExpenseCategory, VehicleYearArchive } from '@/types/expense';
import { getEasternStartOfDay } from '@/lib/dateUtils';

const EST_TIMEZONE = 'America/New_York';

function getEasternDate(date?: Date): { year: number; month: number; day: number } {
  const d = date || new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: EST_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  
  const parts = formatter.formatToParts(d);
  const values: Record<string, string> = {};
  
  parts.forEach(part => {
    if (part.type !== 'literal') {
      values[part.type] = part.value;
    }
  });
  
  return {
    year: parseInt(values.year, 10),
    month: parseInt(values.month, 10) - 1,
    day: parseInt(values.day, 10),
  };
}

const EXPENSES_STORAGE_KEY = '@casino_tracker_expenses';
const RECURRING_BILLS_STORAGE_KEY = '@casino_tracker_recurring_bills';
const UTILITIES_STORAGE_KEY = '@casino_tracker_utilities';
const VEHICLES_STORAGE_KEY = '@casino_tracker_vehicles';
const VEHICLE_EXPENSES_STORAGE_KEY = '@casino_tracker_vehicle_expenses';
const VEHICLE_ARCHIVES_STORAGE_KEY = '@casino_tracker_vehicle_archives';

export const [ExpensesProvider, useExpenses] = createContextHook(() => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [recurringBills, setRecurringBills] = useState<RecurringBill[]>([]);
  const [utilities, setUtilities] = useState<MonthlyUtilities[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleExpenses, setVehicleExpenses] = useState<VehicleExpense[]>([]);
  const [vehicleArchives, setVehicleArchives] = useState<VehicleYearArchive[]>([]);
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

  const loadVehicles = useCallback(async () => {
    try {
      const vehiclesJson = await AsyncStorage.getItem(VEHICLES_STORAGE_KEY);
      if (vehiclesJson) {
        try {
          setVehicles(JSON.parse(vehiclesJson));
        } catch (parseError) {
          console.error('Error parsing vehicles JSON, clearing corrupted data:', parseError);
          await AsyncStorage.removeItem(VEHICLES_STORAGE_KEY);
          setVehicles([]);
        }
      }
    } catch (error) {
      console.error('Error loading vehicles:', error);
    }
  }, []);

  const loadVehicleExpenses = useCallback(async () => {
    try {
      const vehicleExpensesJson = await AsyncStorage.getItem(VEHICLE_EXPENSES_STORAGE_KEY);
      if (vehicleExpensesJson) {
        try {
          setVehicleExpenses(JSON.parse(vehicleExpensesJson));
        } catch (parseError) {
          console.error('Error parsing vehicle expenses JSON, clearing corrupted data:', parseError);
          await AsyncStorage.removeItem(VEHICLE_EXPENSES_STORAGE_KEY);
          setVehicleExpenses([]);
        }
      }
    } catch (error) {
      console.error('Error loading vehicle expenses:', error);
    }
  }, []);

  const loadVehicleArchives = useCallback(async () => {
    try {
      const vehicleArchivesJson = await AsyncStorage.getItem(VEHICLE_ARCHIVES_STORAGE_KEY);
      if (vehicleArchivesJson) {
        try {
          setVehicleArchives(JSON.parse(vehicleArchivesJson));
        } catch (parseError) {
          console.error('Error parsing vehicle archives JSON, clearing corrupted data:', parseError);
          await AsyncStorage.removeItem(VEHICLE_ARCHIVES_STORAGE_KEY);
          setVehicleArchives([]);
        }
      }
    } catch (error) {
      console.error('Error loading vehicle archives:', error);
    }
  }, []);

  const loadAllData = useCallback(async () => {
    try {
      await Promise.all([loadExpenses(), loadRecurringBills(), loadUtilities(), loadVehicles(), loadVehicleExpenses(), loadVehicleArchives()]);
    } catch (error) {
      console.error('Error loading expenses data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [loadExpenses, loadRecurringBills, loadUtilities, loadVehicles, loadVehicleExpenses, loadVehicleArchives]);

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

  const addVehicle = useCallback(async (
    userId: string,
    name: string,
    make: string,
    model: string,
    year: number,
    startingMileage: number,
    color?: string,
    licensePlate?: string,
    yearStartMileage?: number,
    yearEndingMileage?: number
  ) => {
    const newVehicle: Vehicle = {
      id: `vehicle-${Date.now()}`,
      userId,
      name,
      make,
      model,
      year,
      color,
      licensePlate,
      startingMileage,
      currentMileage: startingMileage,
      yearStartMileage: yearStartMileage || startingMileage,
      yearEndingMileage,
      createdAt: new Date().toISOString(),
      isActive: true,
    };

    const updatedVehicles = [...vehicles, newVehicle];
    setVehicles(updatedVehicles);
    await AsyncStorage.setItem(VEHICLES_STORAGE_KEY, JSON.stringify(updatedVehicles));
  }, [vehicles]);

  const updateVehicle = useCallback(async (
    vehicleId: string,
    name: string,
    make: string,
    model: string,
    year: number,
    startingMileage: number,
    currentMileage: number,
    color?: string,
    licensePlate?: string,
    yearStartMileage?: number,
    yearEndingMileage?: number
  ) => {
    const updatedVehicles = vehicles.map(v =>
      v.id === vehicleId
        ? { ...v, name, make, model, year, color, licensePlate, startingMileage, currentMileage, yearStartMileage, yearEndingMileage }
        : v
    );
    setVehicles(updatedVehicles);
    await AsyncStorage.setItem(VEHICLES_STORAGE_KEY, JSON.stringify(updatedVehicles));
  }, [vehicles]);

  const deleteVehicle = useCallback(async (vehicleId: string) => {
    const updatedVehicles = vehicles.filter(v => v.id !== vehicleId);
    setVehicles(updatedVehicles);
    await AsyncStorage.setItem(VEHICLES_STORAGE_KEY, JSON.stringify(updatedVehicles));
    
    const updatedVehicleExpenses = vehicleExpenses.filter(ve => ve.vehicleId !== vehicleId);
    setVehicleExpenses(updatedVehicleExpenses);
    await AsyncStorage.setItem(VEHICLE_EXPENSES_STORAGE_KEY, JSON.stringify(updatedVehicleExpenses));
  }, [vehicles, vehicleExpenses]);

  const toggleVehicleActive = useCallback(async (vehicleId: string) => {
    const updatedVehicles = vehicles.map(v =>
      v.id === vehicleId
        ? { ...v, isActive: !v.isActive }
        : v
    );
    setVehicles(updatedVehicles);
    await AsyncStorage.setItem(VEHICLES_STORAGE_KEY, JSON.stringify(updatedVehicles));
  }, [vehicles]);

  const addVehicleExpense = useCallback(async (
    userId: string,
    vehicleId: string,
    category: VehicleExpenseCategory,
    amount: number,
    description: string,
    date: Date,
    merchant?: string,
    mileage?: number,
    gallons?: number,
    pricePerGallon?: number,
    notes?: string,
    receiptImage?: string
  ) => {
    const expenseDate = new Date(date);
    const year = expenseDate.getFullYear();
    const month = expenseDate.getMonth() + 1;
    const monthKey = `${year}-${String(month).padStart(2, '0')}`;

    const newExpense: VehicleExpense = {
      id: `vehicle-expense-${Date.now()}`,
      userId,
      vehicleId,
      category,
      amount,
      description,
      merchant,
      date: date.toISOString(),
      mileage,
      gallons,
      pricePerGallon,
      notes,
      receiptImage,
      monthKey,
      createdAt: new Date().toISOString(),
    };

    const updatedExpenses = [...vehicleExpenses, newExpense];
    setVehicleExpenses(updatedExpenses);
    await AsyncStorage.setItem(VEHICLE_EXPENSES_STORAGE_KEY, JSON.stringify(updatedExpenses));

    if (mileage && mileage > 0) {
      const vehicle = vehicles.find(v => v.id === vehicleId);
      if (vehicle && mileage > vehicle.currentMileage) {
        const updatedVehicles = vehicles.map(v =>
          v.id === vehicleId
            ? { ...v, currentMileage: mileage }
            : v
        );
        setVehicles(updatedVehicles);
        await AsyncStorage.setItem(VEHICLES_STORAGE_KEY, JSON.stringify(updatedVehicles));
      }
    }
  }, [vehicleExpenses, vehicles]);

  const updateVehicleExpense = useCallback(async (
    expenseId: string,
    category: VehicleExpenseCategory,
    amount: number,
    description: string,
    date: Date,
    merchant?: string,
    mileage?: number,
    gallons?: number,
    pricePerGallon?: number,
    notes?: string
  ) => {
    const expenseDate = new Date(date);
    const year = expenseDate.getFullYear();
    const month = expenseDate.getMonth() + 1;
    const monthKey = `${year}-${String(month).padStart(2, '0')}`;

    const updatedExpenses = vehicleExpenses.map(e =>
      e.id === expenseId
        ? { ...e, category, amount, description, date: date.toISOString(), merchant, mileage, gallons, pricePerGallon, notes, monthKey }
        : e
    );
    setVehicleExpenses(updatedExpenses);
    await AsyncStorage.setItem(VEHICLE_EXPENSES_STORAGE_KEY, JSON.stringify(updatedExpenses));

    if (mileage && mileage > 0) {
      const expense = vehicleExpenses.find(e => e.id === expenseId);
      if (expense) {
        const vehicle = vehicles.find(v => v.id === expense.vehicleId);
        if (vehicle && mileage > vehicle.currentMileage) {
          const updatedVehicles = vehicles.map(v =>
            v.id === expense.vehicleId
              ? { ...v, currentMileage: mileage }
              : v
          );
          setVehicles(updatedVehicles);
          await AsyncStorage.setItem(VEHICLES_STORAGE_KEY, JSON.stringify(updatedVehicles));
        }
      }
    }
  }, [vehicleExpenses, vehicles]);

  const deleteVehicleExpense = useCallback(async (expenseId: string) => {
    const updatedExpenses = vehicleExpenses.filter(e => e.id !== expenseId);
    setVehicleExpenses(updatedExpenses);
    await AsyncStorage.setItem(VEHICLE_EXPENSES_STORAGE_KEY, JSON.stringify(updatedExpenses));
  }, [vehicleExpenses]);

  const archiveVehicleYear = useCallback(async (vehicleId: string, year: number) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (!vehicle) return;

    const yearExpenses = vehicleExpenses.filter(e => {
      const expenseYear = new Date(e.date).getFullYear();
      return e.vehicleId === vehicleId && expenseYear === year;
    });

    const monthlyExpenses: Record<string, VehicleExpense[]> = {};
    yearExpenses.forEach(expense => {
      if (!monthlyExpenses[expense.monthKey]) {
        monthlyExpenses[expense.monthKey] = [];
      }
      monthlyExpenses[expense.monthKey].push(expense);
    });

    const totalExpenses = yearExpenses.reduce((sum, e) => sum + e.amount, 0);
    const startMileage = vehicle.yearStartMileage || vehicle.startingMileage;
    const endMileage = vehicle.yearEndingMileage || vehicle.currentMileage;

    const archive: VehicleYearArchive = {
      id: `archive-${vehicleId}-${year}-${Date.now()}`,
      userId: vehicle.userId,
      vehicleId,
      year,
      startMileage,
      endMileage,
      totalExpenses,
      monthlyExpenses,
      createdAt: new Date().toISOString(),
    };

    const updatedArchives = [...vehicleArchives, archive];
    setVehicleArchives(updatedArchives);
    await AsyncStorage.setItem(VEHICLE_ARCHIVES_STORAGE_KEY, JSON.stringify(updatedArchives));

    const updatedExpenses = vehicleExpenses.filter(e => {
      const expenseYear = new Date(e.date).getFullYear();
      return !(e.vehicleId === vehicleId && expenseYear === year);
    });
    setVehicleExpenses(updatedExpenses);
    await AsyncStorage.setItem(VEHICLE_EXPENSES_STORAGE_KEY, JSON.stringify(updatedExpenses));

    const newYearStartMileage = endMileage;
    const updatedVehicles = vehicles.map(v =>
      v.id === vehicleId
        ? { ...v, yearStartMileage: newYearStartMileage, yearEndingMileage: undefined }
        : v
    );
    setVehicles(updatedVehicles);
    await AsyncStorage.setItem(VEHICLES_STORAGE_KEY, JSON.stringify(updatedVehicles));
  }, [vehicles, vehicleExpenses, vehicleArchives]);

  const reloadAllData = useCallback(async () => {
    await loadAllData();
  }, [loadAllData]);

  return useMemo(() => ({
    expenses,
    recurringBills,
    utilities,
    vehicles,
    vehicleExpenses,
    vehicleArchives,
    isLoading,
    addExpense,
    updateExpense,
    deleteExpense,
    addRecurringBill,
    updateRecurringBill,
    deleteRecurringBill,
    toggleRecurringBill,
    updateUtilities,
    addVehicle,
    updateVehicle,
    deleteVehicle,
    toggleVehicleActive,
    addVehicleExpense,
    updateVehicleExpense,
    deleteVehicleExpense,
    archiveVehicleYear,
    reloadAllData,
  }), [
    expenses,
    recurringBills,
    utilities,
    vehicles,
    vehicleExpenses,
    vehicleArchives,
    isLoading,
    addExpense,
    updateExpense,
    deleteExpense,
    addRecurringBill,
    updateRecurringBill,
    deleteRecurringBill,
    toggleRecurringBill,
    updateUtilities,
    addVehicle,
    updateVehicle,
    deleteVehicle,
    toggleVehicleActive,
    addVehicleExpense,
    updateVehicleExpense,
    deleteVehicleExpense,
    archiveVehicleYear,
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
    const easternDate = getEasternDate(now);
    const firstDayOfMonth = getEasternStartOfDay(new Date(easternDate.year, easternDate.month, 1));
    const lastDayOfMonth = getEasternStartOfDay(new Date(easternDate.year, easternDate.month + 1, 1));
    
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
    const easternDate = getEasternDate(now);
    const firstDayOfYear = getEasternStartOfDay(new Date(easternDate.year, 0, 1));
    
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

export function useMonthlyBusinessExpenses(userId: string) {
  const { expenses } = useExpenses();
  
  return useMemo(() => {
    const now = new Date();
    const easternDate = getEasternDate(now);
    const firstDayOfMonth = getEasternStartOfDay(new Date(easternDate.year, easternDate.month, 1));
    const lastDayOfMonth = getEasternStartOfDay(new Date(easternDate.year, easternDate.month + 1, 1));
    
    const businessExpenses = expenses.filter(e => {
      if (e.userId !== userId) return false;
      if (e.expenseType !== 'business') return false;
      const expenseDate = new Date(e.date);
      return expenseDate >= firstDayOfMonth && expenseDate <= lastDayOfMonth;
    });
    
    const total = businessExpenses.reduce((sum, e) => sum + e.amount, 0);
    
    return { total, expenses: businessExpenses };
  }, [expenses, userId]);
}

export function useYearToDateBusinessExpenses(userId: string) {
  const { expenses } = useExpenses();
  
  return useMemo(() => {
    const now = new Date();
    const easternDate = getEasternDate(now);
    const firstDayOfYear = getEasternStartOfDay(new Date(easternDate.year, 0, 1));
    
    const businessExpenses = expenses.filter(e => {
      if (e.userId !== userId) return false;
      if (e.expenseType !== 'business') return false;
      const expenseDate = new Date(e.date);
      return expenseDate >= firstDayOfYear;
    });
    
    const total = businessExpenses.reduce((sum, e) => sum + e.amount, 0);
    
    return { total, expenses: businessExpenses };
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
      const easternDate = getEasternDate(expenseDate);
      const year = easternDate.year;
      const month = easternDate.month;
      const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
      
      if (!acc[monthKey]) {
        acc[monthKey] = [];
      }
      acc[monthKey].push(expense);
      return acc;
    }, {} as Record<string, Expense[]>);
    
    const now = new Date();
    const easternNow = getEasternDate(now);
    const currentMonthKey = `${easternNow.year}-${String(easternNow.month + 1).padStart(2, '0')}`;
    
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
    const easternDate = getEasternDate(now);
    const currentMonthKey = `${easternDate.year}-${String(easternDate.month + 1).padStart(2, '0')}`;
    
    const currentUtility = utilities.find(
      u => u.userId === userId && u.monthKey === currentMonthKey
    );
    
    if (!currentUtility) return 0;
    
    return currentUtility.electric + currentUtility.naturalGas + currentUtility.water;
  }, [utilities, userId]);
}
