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

export type MainCategory = 'Standard Expenses' | 'Vacation Expenses';

export interface Expense {
  id: string;
  userId: string;
  mainCategory: MainCategory;
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
  isAutomatic?: boolean;
  variableAmount?: boolean;
}
