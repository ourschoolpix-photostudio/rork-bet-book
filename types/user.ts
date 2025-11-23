export interface User {
  id: string;
  username: string;
  pin: string;
  createdAt: string;
}

export type GameType = 'Baccarat' | 'Blackjack' | 'Roulette' | 'Slots';

export interface GamblingSession {
  id: string;
  userId: string;
  casinoName: string;
  state: string;
  gameType?: GameType;
  startAmount: number;
  isFreeBet?: boolean;
  addOnAmount: number;
  addOnCategory?: 'ATM' | 'Borrow' | 'Cash Advance';
  borrowFrom?: string;
  endAmount?: number;
  totalInvestment: number;
  winLoss?: number;
  startTime: string;
  endTime?: string;
  isActive: boolean;
}

export interface Loan {
  id: string;
  userId: string;
  borrowerName: string;
  amount: number;
  amountPaid: number;
  loanDate: string;
  createdAt: string;
  payments: LoanPayment[];
  loanAdditions: LoanAddition[];
}

export interface LoanPayment {
  id: string;
  amount: number;
  date: string;
}

export interface LoanAddition {
  id: string;
  amount: number;
  date: string;
}

export interface Borrow {
  id: string;
  userId: string;
  lenderName: string;
  amount: number;
  amountPaid: number;
  borrowDate: string;
  createdAt: string;
  payments: BorrowPayment[];
  sessionId?: string;
  description?: string;
}

export interface BorrowPayment {
  id: string;
  amount: number;
  date: string;
}

export interface Bet {
  id: string;
  userId: string;
  opponent: string;
  description: string;
  amount: number;
  won: boolean;
  betDate: string;
  createdAt: string;
}
