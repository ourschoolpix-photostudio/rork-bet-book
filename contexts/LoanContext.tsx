import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loan, LoanPayment, LoanAddition } from '@/types/user';

const LOANS_STORAGE_KEY = '@casino_tracker_loans';

export const [LoanProvider, useLoans] = createContextHook(() => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadLoans = useCallback(async () => {
    try {
      const loansJson = await AsyncStorage.getItem(LOANS_STORAGE_KEY);
      if (loansJson) {
        try {
          const parsed = JSON.parse(loansJson);
          console.log('Loaded loans:', parsed);
          setLoans(parsed);
        } catch (parseError) {
          console.error('Error parsing loans JSON:', parseError);
          console.error('Corrupted data:', loansJson);
          await AsyncStorage.removeItem(LOANS_STORAGE_KEY);
          setLoans([]);
        }
      }
    } catch (error) {
      console.error('Error loading loans:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLoans();
  }, [loadLoans]);



  const addLoan = useCallback(async (userId: string, borrowerName: string, amount: number, loanDate?: string) => {
    const now = new Date().toISOString();
    const newLoan: Loan = {
      id: `loan-${Date.now()}`,
      userId,
      borrowerName,
      amount,
      originalAmount: amount,
      amountPaid: 0,
      loanDate: loanDate || now,
      createdAt: now,
      payments: [],
      loanAdditions: [],
    };

    const updatedLoans = [...loans, newLoan];
    setLoans(updatedLoans);
    try {
      await AsyncStorage.setItem(LOANS_STORAGE_KEY, JSON.stringify(updatedLoans));
      console.log('Loan added successfully');
    } catch (error) {
      console.error('Error saving loan:', error);
    }
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

  const addLoanAddition = useCallback(async (loanId: string, additionAmount: number, additionDate?: string) => {
    const loan = loans.find(l => l.id === loanId);
    if (!loan) {
      console.error('Loan not found for addition:', loanId);
      return;
    }

    const newAddition: LoanAddition = {
      id: `addition-${Date.now()}`,
      amount: additionAmount,
      date: additionDate || new Date().toISOString(),
    };

    const updatedLoan: Loan = {
      ...loan,
      amount: loan.amount + additionAmount,
      loanAdditions: [...(loan.loanAdditions || []), newAddition],
    };

    const updatedLoans = loans.map(l => l.id === loanId ? updatedLoan : l);
    console.log('Adding loan addition:', newAddition);
    setLoans(updatedLoans);
    try {
      const jsonString = JSON.stringify(updatedLoans);
      await AsyncStorage.setItem(LOANS_STORAGE_KEY, jsonString);
      console.log('Loan addition saved successfully');
    } catch (error) {
      console.error('Error saving loan addition:', error);
      throw error;
    }
  }, [loans]);

  const deleteLoanAddition = useCallback(async (loanId: string, additionId: string) => {
    const loan = loans.find(l => l.id === loanId);
    if (!loan) return;

    const addition = loan.loanAdditions.find(a => a.id === additionId);
    if (!addition) return;

    const updatedLoan: Loan = {
      ...loan,
      amount: loan.amount - addition.amount,
      loanAdditions: loan.loanAdditions.filter(a => a.id !== additionId),
    };

    const updatedLoans = loans.map(l => l.id === loanId ? updatedLoan : l);
    setLoans(updatedLoans);
    await AsyncStorage.setItem(LOANS_STORAGE_KEY, JSON.stringify(updatedLoans));
  }, [loans]);

  const updateLoan = useCallback(async (loanId: string, borrowerName: string, amount: number, loanDate: string) => {
    const loan = loans.find(l => l.id === loanId);
    if (!loan) {
      console.error('Loan not found:', loanId);
      return;
    }

    const totalAdditions = (loan.loanAdditions || []).reduce((sum, add) => sum + add.amount, 0);
    
    const updatedLoan: Loan = {
      ...loan,
      borrowerName,
      originalAmount: amount,
      amount: amount + totalAdditions,
      loanDate,
    };

    const updatedLoans = loans.map(l => l.id === loanId ? updatedLoan : l);
    console.log('Updating loan:', updatedLoan);
    setLoans(updatedLoans);
    try {
      const jsonString = JSON.stringify(updatedLoans);
      console.log('Saving loans JSON:', jsonString.substring(0, 100));
      await AsyncStorage.setItem(LOANS_STORAGE_KEY, jsonString);
      console.log('Loan updated successfully');
    } catch (error) {
      console.error('Error saving updated loan:', error);
    }
  }, [loans]);

  const reloadLoans = useCallback(async () => {
    await loadLoans();
  }, [loadLoans]);

  const archiveLoan = useCallback(async (loanId: string) => {
    const loan = loans.find(l => l.id === loanId);
    if (!loan) return;

    const updatedLoan: Loan = {
      ...loan,
      isArchived: true,
    };

    const updatedLoans = loans.map(l => l.id === loanId ? updatedLoan : l);
    setLoans(updatedLoans);
    await AsyncStorage.setItem(LOANS_STORAGE_KEY, JSON.stringify(updatedLoans));
  }, [loans]);

  const unarchiveLoan = useCallback(async (loanId: string) => {
    const loan = loans.find(l => l.id === loanId);
    if (!loan) return;

    const updatedLoan: Loan = {
      ...loan,
      isArchived: false,
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
    reloadLoans,
    addLoanAddition,
    deleteLoanAddition,
    archiveLoan,
    unarchiveLoan,
  }), [loans, isLoading, addLoan, addPayment, deleteLoan, deletePayment, updateLoan, reloadLoans, addLoanAddition, deleteLoanAddition, archiveLoan, unarchiveLoan]);
});
