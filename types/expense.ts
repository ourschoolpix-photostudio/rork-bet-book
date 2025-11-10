export type ExpenseCategory = 
  | 'Grocery'
  | 'Household'
  | 'Fast Food'
  | 'Convenience Store'
  | 'Clothing'
  | 'Travel'
  | 'Monthly Bill'
  | 'Entertainment'
  | 'Auto Repair';

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
