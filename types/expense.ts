export type ExpenseCategory = 
  | 'Auto Repair'
  | 'Beauty & Health'
  | 'Clothing'
  | 'Convenience Store'
  | 'Electronics'
  | 'Entertainment'
  | 'Fast Food'
  | 'Gas'
  | 'Grocery'
  | 'Household'
  | 'Lottery'
  | 'Monthly Bill'
  | 'Recreation'
  | 'Restaurant'
  | 'Shoes'
  | 'Travel';

export type ExpenseType = 'standard' | 'business' | 'vacation';

export interface Expense {
  id: string;
  userId: string;
  category: ExpenseCategory;
  amount: number;
  description: string;
  merchant?: string;
  date: string;
  createdAt: string;
  isRecurring?: boolean;
  notes?: string;
  expenseType?: ExpenseType;
}

export interface RecurringBill {
  id: string;
  userId: string;
  name: string;
  amount: number;
  dueDay: number;
  category: ExpenseCategory;
  createdAt: string;
  isActive: boolean;
  lastProcessedMonth?: string;
}

export interface MonthlyUtilities {
  id: string;
  userId: string;
  monthKey: string;
  electric: number;
  naturalGas: number;
  water: number;
  createdAt: string;
}

export interface Vehicle {
  id: string;
  userId: string;
  name: string;
  make: string;
  model: string;
  year: number;
  color?: string;
  licensePlate?: string;
  startingMileage: number;
  currentMileage: number;
  yearStartMileage?: number;
  yearEndingMileage?: number;
  createdAt: string;
  isActive: boolean;
}

export type VehicleExpenseCategory = 'Gas' | 'Auto Repair' | 'Maintenance' | 'Insurance' | 'Registration' | 'Car Wash' | 'Parking';

export interface VehicleExpense {
  id: string;
  userId: string;
  vehicleId: string;
  category: VehicleExpenseCategory;
  amount: number;
  description: string;
  merchant?: string;
  date: string;
  mileage?: number;
  gallons?: number;
  pricePerGallon?: number;
  notes?: string;
  receiptImage?: string;
  createdAt: string;
}
