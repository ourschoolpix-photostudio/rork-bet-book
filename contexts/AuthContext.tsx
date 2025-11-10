import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { User, GamblingSession, GameType } from '@/types/user';

const USERS_STORAGE_KEY = '@casino_tracker_users';
const CURRENT_USER_KEY = '@casino_tracker_current_user';
const LAST_CASINO_KEY = '@casino_tracker_last_casino';
const SESSIONS_STORAGE_KEY = '@casino_tracker_sessions';

const ADMIN_USER: User = {
  id: 'admin-bruce',
  username: 'Bruce Pham',
  pin: '0000',
  createdAt: new Date().toISOString(),
};

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastCasino, setLastCasino] = useState<{ state: string; casinoName: string } | null>(null);
  const [sessions, setSessions] = useState<GamblingSession[]>([]);

  useEffect(() => {
    const initializeData = async () => {
      await Promise.all([
        loadData(),
        loadLastCasino(),
        loadSessions(),
      ]);
    };
    
    initializeData();
  }, []);

  const loadData = async () => {
    try {
      const usersJson = await AsyncStorage.getItem(USERS_STORAGE_KEY);
      const currentUserJson = await AsyncStorage.getItem(CURRENT_USER_KEY);

      let loadedUsers: User[] = [];
      
      if (usersJson) {
        try {
          loadedUsers = JSON.parse(usersJson);
        } catch (parseError) {
          console.error('Error parsing users JSON, clearing corrupted data:', parseError);
          await AsyncStorage.removeItem(USERS_STORAGE_KEY);
          loadedUsers = [ADMIN_USER];
          await AsyncStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(loadedUsers));
        }
      } else {
        loadedUsers = [ADMIN_USER];
        await AsyncStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(loadedUsers));
      }

      setUsers(loadedUsers);

      if (currentUserJson) {
        try {
          const savedUser = JSON.parse(currentUserJson);
          const user = loadedUsers.find(u => u.id === savedUser.id);
          if (user) {
            setCurrentUser(user);
          }
        } catch (parseError) {
          console.error('Error parsing current user JSON, clearing corrupted data:', parseError);
          await AsyncStorage.removeItem(CURRENT_USER_KEY);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setUsers([ADMIN_USER]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadLastCasino = async () => {
    try {
      const lastCasinoJson = await AsyncStorage.getItem(LAST_CASINO_KEY);
      if (lastCasinoJson) {
        try {
          setLastCasino(JSON.parse(lastCasinoJson));
        } catch (parseError) {
          console.error('Error parsing last casino JSON, clearing corrupted data:', parseError);
          await AsyncStorage.removeItem(LAST_CASINO_KEY);
        }
      }
    } catch (error) {
      console.error('Error loading last casino:', error);
    }
  };

  const loadSessions = async () => {
    try {
      const sessionsJson = await AsyncStorage.getItem(SESSIONS_STORAGE_KEY);
      if (sessionsJson) {
        try {
          setSessions(JSON.parse(sessionsJson));
        } catch (parseError) {
          console.error('Error parsing sessions JSON, clearing corrupted data:', parseError);
          await AsyncStorage.removeItem(SESSIONS_STORAGE_KEY);
          setSessions([]);
        }
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  };

  const saveLastCasino = useCallback(async (state: string, casinoName: string) => {
    try {
      const casinoData = { state, casinoName };
      setLastCasino(casinoData);
      await AsyncStorage.setItem(LAST_CASINO_KEY, JSON.stringify(casinoData));
    } catch (error) {
      console.error('Error saving last casino:', error);
    }
  }, []);

  const startSession = useCallback(async (casinoName: string, state: string, startAmount: number, isFreeBet: boolean, gameType?: GameType, addOnAmount?: number, addOnCategory?: 'ATM' | 'Borrow' | 'Cash Advance', borrowFrom?: string) => {
    if (!currentUser) return;

    const actualInvestment = isFreeBet ? 0 : startAmount;
    const addOn = addOnAmount || 0;
    const totalInvestment = actualInvestment + addOn;

    const newSession: GamblingSession = {
      id: `session-${Date.now()}`,
      userId: currentUser.id,
      casinoName,
      state,
      gameType,
      startAmount,
      isFreeBet,
      addOnAmount: addOn,
      addOnCategory,
      borrowFrom,
      totalInvestment,
      startTime: new Date().toISOString(),
      isActive: true,
    };

    const updatedSessions = [...sessions, newSession];
    setSessions(updatedSessions);
    await AsyncStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(updatedSessions));
    await saveLastCasino(state, casinoName);
    return newSession.id;
  }, [currentUser, sessions, saveLastCasino]);

  const updateSession = useCallback(async (sessionId: string, data: {
    casinoName: string;
    state: string;
    gameType?: GameType;
    startAmount: number;
    addOnAmount: number;
    addOnCategory?: 'ATM' | 'Borrow' | 'Cash Advance';
    borrowFrom?: string;
    startDate: Date;
    endDate?: Date;
    endAmount?: number;
  }) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;

    const baseInvestment = session.isFreeBet ? 0 : data.startAmount;
    const totalInvestment = baseInvestment + data.addOnAmount;

    const updatedSession: GamblingSession = {
      ...session,
      casinoName: data.casinoName,
      state: data.state,
      gameType: data.gameType,
      startAmount: data.startAmount,
      addOnAmount: data.addOnAmount,
      addOnCategory: data.addOnCategory,
      borrowFrom: data.borrowFrom,
      totalInvestment,
      startTime: data.startDate.toISOString(),
      endTime: data.endDate ? data.endDate.toISOString() : session.endTime,
      endAmount: data.endAmount !== undefined ? data.endAmount : session.endAmount,
    };

    if (updatedSession.endAmount !== undefined) {
      updatedSession.winLoss = updatedSession.endAmount - updatedSession.totalInvestment;
    }

    const updatedSessions = sessions.map(s => s.id === sessionId ? updatedSession : s);
    setSessions(updatedSessions);
    await AsyncStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(updatedSessions));
    await saveLastCasino(data.state, data.casinoName);
  }, [sessions, saveLastCasino]);

  const endSession = useCallback(async (sessionId: string, endAmount: number) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;

    const winLoss = endAmount - session.totalInvestment;
    const updatedSession: GamblingSession = {
      ...session,
      endAmount,
      winLoss,
      endTime: new Date().toISOString(),
      isActive: false,
    };

    const updatedSessions = sessions.map(s => s.id === sessionId ? updatedSession : s);
    setSessions(updatedSessions);
    await AsyncStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(updatedSessions));
  }, [sessions]);

  const updateSessionAddOn = useCallback(async (sessionId: string, addOnAmount: number) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;

    const baseInvestment = session.isFreeBet ? 0 : session.startAmount;
    const totalInvestment = baseInvestment + addOnAmount;

    const updatedSession: GamblingSession = {
      ...session,
      addOnAmount,
      totalInvestment,
    };

    const updatedSessions = sessions.map(s => s.id === sessionId ? updatedSession : s);
    setSessions(updatedSessions);
    await AsyncStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(updatedSessions));
  }, [sessions]);

  const deleteSession = useCallback(async (sessionId: string) => {
    const updatedSessions = sessions.filter(s => s.id !== sessionId);
    setSessions(updatedSessions);
    await AsyncStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(updatedSessions));
  }, [sessions]);

  const login = useCallback(async (username: string, pin: string): Promise<boolean> => {
    const user = users.find(
      u => u.username.toLowerCase() === username.toLowerCase() && u.pin === pin
    );

    if (user) {
      setCurrentUser(user);
      await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      return true;
    }

    return false;
  }, [users]);

  const logout = useCallback(async () => {
    setCurrentUser(null);
    await AsyncStorage.removeItem(CURRENT_USER_KEY);
  }, []);

  const register = useCallback(async (username: string, pin: string): Promise<boolean> => {
    const existingUser = users.find(
      u => u.username.toLowerCase() === username.toLowerCase()
    );

    if (existingUser) {
      return false;
    }

    const newUser: User = {
      id: `user-${Date.now()}`,
      username,
      pin,
      createdAt: new Date().toISOString(),
    };

    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    await AsyncStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));

    setCurrentUser(newUser);
    await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));

    return true;
  }, [users]);

  const updatePin = useCallback(async (newPin: string): Promise<boolean> => {
    if (!currentUser) return false;

    const updatedUser: User = {
      ...currentUser,
      pin: newPin,
    };

    const updatedUsers = users.map(u => u.id === currentUser.id ? updatedUser : u);
    setUsers(updatedUsers);
    await AsyncStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));

    setCurrentUser(updatedUser);
    await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));

    return true;
  }, [currentUser, users]);

  const updateProfile = useCallback(async (username: string, newPin: string): Promise<boolean> => {
    if (!currentUser) return false;

    const existingUser = users.find(
      u => u.username.toLowerCase() === username.toLowerCase() && u.id !== currentUser.id
    );

    if (existingUser) {
      return false;
    }

    const updatedUser: User = {
      ...currentUser,
      username,
      pin: newPin,
    };

    const updatedUsers = users.map(u => u.id === currentUser.id ? updatedUser : u);
    setUsers(updatedUsers);
    await AsyncStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));

    setCurrentUser(updatedUser);
    await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));

    return true;
  }, [currentUser, users]);



  const currentSession = useMemo(() => {
    if (!currentUser) return null;
    return sessions.find(s => s.userId === currentUser.id && s.isActive) || null;
  }, [sessions, currentUser]);

  const completedSessions = useMemo(() => {
    if (!currentUser) return [];
    return sessions
      .filter(s => s.userId === currentUser.id && !s.isActive)
      .sort((a, b) => new Date(b.endTime!).getTime() - new Date(a.endTime!).getTime());
  }, [sessions, currentUser]);

  const reloadAllData = useCallback(async () => {
    await Promise.all([
      loadData(),
      loadLastCasino(),
      loadSessions(),
    ]);
  }, []);

  return useMemo(() => ({
    currentUser,
    users,
    isLoading,
    login,
    logout,
    register,
    updatePin,
    updateProfile,
    lastCasino,
    saveLastCasino,
    sessions,
    currentSession,
    completedSessions,
    startSession,
    endSession,
    updateSessionAddOn,
    updateSession,
    deleteSession,
    reloadAllData,
  }), [currentUser, users, isLoading, login, logout, register, updatePin, updateProfile, lastCasino, saveLastCasino, sessions, currentSession, completedSessions, startSession, endSession, updateSessionAddOn, updateSession, deleteSession, reloadAllData]);
});
