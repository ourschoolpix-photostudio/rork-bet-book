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
  | 'Shoes'
  | 'Travel';

export type ExpenseType = 'standard' | 'vacation';

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
