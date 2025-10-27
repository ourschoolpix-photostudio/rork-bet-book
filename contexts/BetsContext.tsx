import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Bet } from '@/types/user';

const BETS_STORAGE_KEY = '@casino_tracker_bets';

export const [BetsProvider, useBets] = createContextHook(() => {
  const [bets, setBets] = useState<Bet[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadBets();
  }, []);

  const loadBets = async () => {
    try {
      const betsJson = await AsyncStorage.getItem(BETS_STORAGE_KEY);
      if (betsJson) {
        try {
          setBets(JSON.parse(betsJson));
        } catch (parseError) {
          console.error('Error parsing bets JSON, clearing corrupted data:', parseError);
          await AsyncStorage.removeItem(BETS_STORAGE_KEY);
          setBets([]);
        }
      }
    } catch (error) {
      console.error('Error loading bets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addBet = useCallback(async (userId: string, opponent: string, description: string, amount: number, won: boolean, betDate?: string) => {
    const now = new Date().toISOString();
    const newBet: Bet = {
      id: `bet-${Date.now()}`,
      userId,
      opponent,
      description,
      amount,
      won,
      betDate: betDate || now,
      createdAt: now,
    };

    const updatedBets = [...bets, newBet];
    setBets(updatedBets);
    await AsyncStorage.setItem(BETS_STORAGE_KEY, JSON.stringify(updatedBets));
  }, [bets]);

  const updateBet = useCallback(async (betId: string, opponent: string, description: string, amount: number, won: boolean, betDate: string) => {
    const bet = bets.find(b => b.id === betId);
    if (!bet) return;

    const updatedBet: Bet = {
      ...bet,
      opponent,
      description,
      amount,
      won,
      betDate,
    };

    const updatedBets = bets.map(b => b.id === betId ? updatedBet : b);
    setBets(updatedBets);
    await AsyncStorage.setItem(BETS_STORAGE_KEY, JSON.stringify(updatedBets));
  }, [bets]);

  const deleteBet = useCallback(async (betId: string) => {
    const updatedBets = bets.filter(b => b.id !== betId);
    setBets(updatedBets);
    await AsyncStorage.setItem(BETS_STORAGE_KEY, JSON.stringify(updatedBets));
  }, [bets]);

  return useMemo(() => ({
    bets,
    isLoading,
    addBet,
    updateBet,
    deleteBet,
  }), [bets, isLoading, addBet, updateBet, deleteBet]);
});
