import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useState } from 'react';

export interface SportsBet {
  id: string;
  userId: string;
  sport: string;
  teams: string;
  betType: string;
  amount: number;
  odds?: number;
  payout?: number;
  won: boolean | null;
  betDate: string;
  createdAt: string;
}

const SPORTS_BETS_STORAGE_KEY = '@casino_tracker_sports_bets';

export const [SportsBetsProvider, useSportsBets] = createContextHook(() => {
  const [sportsBets, setSportsBets] = useState<SportsBet[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadSportsBets();
  }, []);

  const loadSportsBets = async () => {
    try {
      const betsJson = await AsyncStorage.getItem(SPORTS_BETS_STORAGE_KEY);
      if (betsJson) {
        try {
          setSportsBets(JSON.parse(betsJson));
        } catch (parseError) {
          console.error('Error parsing sports bets JSON, clearing corrupted data:', parseError);
          await AsyncStorage.removeItem(SPORTS_BETS_STORAGE_KEY);
          setSportsBets([]);
        }
      }
    } catch (error) {
      console.error('Error loading sports bets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addSportsBet = useCallback(async (userId: string, sport: string, teams: string, betType: string, amount: number, won: boolean | null, betDate?: string, odds?: number, payout?: number) => {
    const now = new Date().toISOString();
    const newBet: SportsBet = {
      id: `sports-bet-${Date.now()}`,
      userId,
      sport,
      teams,
      betType,
      amount,
      odds,
      payout,
      won,
      betDate: betDate || now,
      createdAt: now,
    };

    const updatedBets = [...sportsBets, newBet];
    setSportsBets(updatedBets);
    await AsyncStorage.setItem(SPORTS_BETS_STORAGE_KEY, JSON.stringify(updatedBets));
  }, [sportsBets]);

  const updateSportsBet = useCallback(async (betId: string, sport: string, teams: string, betType: string, amount: number, won: boolean | null, betDate: string, odds?: number, payout?: number) => {
    const bet = sportsBets.find(b => b.id === betId);
    if (!bet) return;

    const updatedBet: SportsBet = {
      ...bet,
      sport,
      teams,
      betType,
      amount,
      odds,
      payout,
      won,
      betDate,
    };

    const updatedBets = sportsBets.map(b => b.id === betId ? updatedBet : b);
    setSportsBets(updatedBets);
    await AsyncStorage.setItem(SPORTS_BETS_STORAGE_KEY, JSON.stringify(updatedBets));
  }, [sportsBets]);

  const deleteSportsBet = useCallback(async (betId: string) => {
    const updatedBets = sportsBets.filter(b => b.id !== betId);
    setSportsBets(updatedBets);
    await AsyncStorage.setItem(SPORTS_BETS_STORAGE_KEY, JSON.stringify(updatedBets));
  }, [sportsBets]);

  return useMemo(() => ({
    sportsBets,
    isLoading,
    addSportsBet,
    updateSportsBet,
    deleteSportsBet,
  }), [sportsBets, isLoading, addSportsBet, updateSportsBet, deleteSportsBet]);
});
