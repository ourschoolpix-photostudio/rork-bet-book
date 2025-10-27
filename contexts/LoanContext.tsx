import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loan, LoanPayment } from '@/types/user';

const LOANS_STORAGE_KEY = '@casino_tracker_loans';

export const [LoanProvider, useLoans] = createContextHook(() => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadLoans();
  }, []);

  const loadLoans = async () => {
    try {
      const loansJson = await AsyncStorage.getItem(LOANS_STORAGE_KEY);
      if (loansJson) {
        try {
          setLoans(JSON.parse(loansJson));
        } catch (parseError) {
          console.error('Error parsing loans JSON, clearing corrupted data:', parseError);
          await AsyncStorage.removeItem(LOANS_STORAGE_KEY);
          setLoans([]);
        }
      }
    } catch (error) {
      console.error('Error loading loans:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addLoan = useCallback(async (userId: string, borrowerName: string, amount: number, loanDate?: string) => {
    const now = new Date().toISOString();
    const newLoan: Loan = {
      id: `loan-${Date.now()}`,
      userId,
      borrowerName,
      amount,
      amountPaid: 0,
      loanDate: loanDate || now,
      createdAt: now,
      payments: [],
    };

    const updatedLoans = [...loans, newLoan];
    setLoans(updatedLoans);
    await AsyncStorage.setItem(LOANS_STORAGE_KEY, JSON.stringify(updatedLoans));
  }, [loans]);

  const addPayment = useCallback(async (loanId: string, paymentAmount: number) => {
    const loan = loans.find(l => l.id === loanId);
    if (!loan) return;

    const newPayment: LoanPayment = {
      id: `payment-${Date.now()}`,
      amount: paymentAmount,
      date: new Date().toISOString(),
    };

    const updatedLoan: Loan = {
      ...loan,
      amountPaid: loan.amountPaid + paymentAmount,
      payments: [...loan.payments, newPayment],
    };

    const updatedLoans = loans.map(l => l.id === loanId ? updatedLoan : l);
    setLoans(updatedLoans);
    await AsyncStorage.setItem(LOANS_STORAGE_KEY, JSON.stringify(updatedLoans));
  }, [loans]);

  const deleteLoan = useCallback(async (loanId: string) => {
    const updatedLoans = loans.filter(l => l.id !== loanId);
    setLoans(updatedLoans);
    await AsyncStorage.setItem(LOANS_STORAGE_KEY, JSON.stringify(updatedLoans));
  }, [loans]);

  const deletePayment = useCallback(async (loanId: string, paymentId: string) => {
    const loan = loans.find(l => l.id === loanId);
    if (!loan) return;

    const payment = loan.payments.find(p => p.id === paymentId);
    if (!payment) return;

    const updatedLoan: Loan = {
      ...loan,
      amountPaid: loan.amountPaid - payment.amount,
      payments: loan.payments.filter(p => p.id !== paymentId),
    };

    const updatedLoans = loans.map(l => l.id === loanId ? updatedLoan : l);
    setLoans(updatedLoans);
    await AsyncStorage.setItem(LOANS_STORAGE_KEY, JSON.stringify(updatedLoans));
  }, [loans]);

  const updateLoan = useCallback(async (loanId: string, borrowerName: string, amount: number, loanDate: string) => {
    const loan = loans.find(l => l.id === loanId);
    if (!loan) return;

    const updatedLoan: Loan = {
      ...loan,
      borrowerName,
      amount,
      loanDate,
    };

    const updatedLoans = loans.map(l => l.id === loanId ? updatedLoan : l);
    setLoans(updatedLoans);
    await AsyncStorage.setItem(LOANS_STORAGE_KEY, JSON.stringify(updatedLoans));
  }, [loans]);

  return useMemo(() => ({
    loans,
    isLoading,
    addLoan,
    addPayment,
    deleteLoan,
    deletePayment,
    updateLoan,
  }), [loans, isLoading, addLoan, addPayment, deleteLoan, deletePayment, updateLoan]);
});
