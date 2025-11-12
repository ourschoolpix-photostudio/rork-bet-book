export type MainExpenseCategory = 'Standard Expense' | 'Vacation Expense';

export type ExpenseSubCategory = 
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

export type ExpenseCategory = ExpenseSubCategory;

export interface Expense {
  id: string;
  userId: string;
  mainCategory: MainExpenseCategory;
  subCategory: ExpenseSubCategory;
  category: ExpenseCategory;
  amount: number;
  description: string;
  merchant?: string;
  date: string;
  createdAt: string;
  isRecurring?: boolean;
  notes?: string;
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

export interface MonthlyUtility {
  id: string;
  userId: string;
  monthKey: string;
  electricity: number;
  water: number;
}
