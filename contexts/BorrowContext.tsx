import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Borrow, BorrowPayment } from '@/types/user';

const BORROWS_STORAGE_KEY = '@casino_tracker_borrows';

export const [BorrowProvider, useBorrows] = createContextHook(() => {
  const [borrows, setBorrows] = useState<Borrow[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadBorrows();
  }, []);

  const loadBorrows = async () => {
    try {
      const borrowsJson = await AsyncStorage.getItem(BORROWS_STORAGE_KEY);
      if (borrowsJson) {
        try {
          setBorrows(JSON.parse(borrowsJson));
        } catch (parseError) {
          console.error('Error parsing borrows JSON, clearing corrupted data:', parseError);
          await AsyncStorage.removeItem(BORROWS_STORAGE_KEY);
          setBorrows([]);
        }
      }
    } catch (error) {
      console.error('Error loading borrows:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addBorrow = useCallback(async (userId: string, lenderName: string, amount: number, borrowDate?: string, sessionId?: string, description?: string) => {
    const now = new Date().toISOString();
    const newBorrow: Borrow = {
      id: `borrow-${Date.now()}`,
      userId,
      lenderName,
      amount,
      amountPaid: 0,
      borrowDate: borrowDate || now,
      createdAt: now,
      payments: [],
      sessionId,
      description,
    };

    const updatedBorrows = [...borrows, newBorrow];
    setBorrows(updatedBorrows);
    await AsyncStorage.setItem(BORROWS_STORAGE_KEY, JSON.stringify(updatedBorrows));
    return newBorrow.id;
  }, [borrows]);

  const addPayment = useCallback(async (borrowId: string, paymentAmount: number) => {
    const borrow = borrows.find(b => b.id === borrowId);
    if (!borrow) return;

    const newPayment: BorrowPayment = {
      id: `payment-${Date.now()}`,
      amount: paymentAmount,
      date: new Date().toISOString(),
    };

    const updatedBorrow: Borrow = {
      ...borrow,
      amountPaid: borrow.amountPaid + paymentAmount,
      payments: [...borrow.payments, newPayment],
    };

    const updatedBorrows = borrows.map(b => b.id === borrowId ? updatedBorrow : b);
    setBorrows(updatedBorrows);
    await AsyncStorage.setItem(BORROWS_STORAGE_KEY, JSON.stringify(updatedBorrows));
  }, [borrows]);

  const deleteBorrow = useCallback(async (borrowId: string) => {
    const updatedBorrows = borrows.filter(b => b.id !== borrowId);
    setBorrows(updatedBorrows);
    await AsyncStorage.setItem(BORROWS_STORAGE_KEY, JSON.stringify(updatedBorrows));
  }, [borrows]);

  const deletePayment = useCallback(async (borrowId: string, paymentId: string) => {
    const borrow = borrows.find(b => b.id === borrowId);
    if (!borrow) return;

    const payment = borrow.payments.find(p => p.id === paymentId);
    if (!payment) return;

    const updatedBorrow: Borrow = {
      ...borrow,
      amountPaid: borrow.amountPaid - payment.amount,
      payments: borrow.payments.filter(p => p.id !== paymentId),
    };

    const updatedBorrows = borrows.map(b => b.id === borrowId ? updatedBorrow : b);
    setBorrows(updatedBorrows);
    await AsyncStorage.setItem(BORROWS_STORAGE_KEY, JSON.stringify(updatedBorrows));
  }, [borrows]);

  const updateBorrow = useCallback(async (borrowId: string, lenderName: string, amount: number, borrowDate: string) => {
    const borrow = borrows.find(b => b.id === borrowId);
    if (!borrow) return;

    const updatedBorrow: Borrow = {
      ...borrow,
      lenderName,
      amount,
      borrowDate,
    };

    const updatedBorrows = borrows.map(b => b.id === borrowId ? updatedBorrow : b);
    setBorrows(updatedBorrows);
    await AsyncStorage.setItem(BORROWS_STORAGE_KEY, JSON.stringify(updatedBorrows));
  }, [borrows]);

  return useMemo(() => ({
    borrows,
    isLoading,
    addBorrow,
    addPayment,
    deleteBorrow,
    deletePayment,
    updateBorrow,
  }), [borrows, isLoading, addBorrow, addPayment, deleteBorrow, deletePayment, updateBorrow]);
});
