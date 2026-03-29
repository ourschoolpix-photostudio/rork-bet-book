import { useAuth } from '@/contexts/AuthContext';
import { useSportsBets, SportsBet } from '@/contexts/SportsBetsContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowLeft, Plus, Trash2, Trophy, Pencil, Calendar, DollarSign, Key } from 'lucide-react-native';
import { useState, useEffect, useCallback } from 'react';
import { Alert, ImageBackground, Keyboard, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableWithoutFeedback, View, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PlaceBetModal from '@/components/PlaceBetModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { formatDateEST, formatGameTimeEST, getEasternStartOfDay, getEasternEndOfDay } from '@/lib/dateUtils';

interface NFLGame {
  id: string;
  homeTeam: string;
  awayTeam: string;
  commenceTime: string;
  completed: boolean;
  homeScore?: number;
  awayScore?: number;
  bookmakers: {
    key: string;
    title: string;
    markets: {
      key: string;
      outcomes: {
        name: string;
        price: number;
        point?: number;
      }[];
    }[];
  }[];
}

export default function SportsScreen() {
  const { currentUser } = useAuth();
  const { sportsBets, addSportsBet, updateSportsBet, deleteSportsBet } = useSportsBets();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [showAddBetModal, setShowAddBetModal] = useState<boolean>(false);
  const [showEditBetModal, setShowEditBetModal] = useState<string | null>(null);
  const [sport, setSport] = useState<string>('');
  const [teams, setTeams] = useState<string>('');
  const [betType, setBetType] = useState<string>('');
  const [betAmount, setBetAmount] = useState<string>('');
  const [betOdds, setBetOdds] = useState<string>('');
  const [betPayout, setBetPayout] = useState<string>('');
  const [betDate, setBetDate] = useState<string>('');
  const [won, setWon] = useState<boolean | null>(null);
  const [nflGames, setNflGames] = useState<NFLGame[]>([]);
  const [liveGames, setLiveGames] = useState<NFLGame[]>([]);
  const [cachedGamesData, setCachedGamesData] = useState<{ [key: string]: { nfl: NFLGame[], live: NFLGame[], timestamp: number } }>({});
  const [loadingGames, setLoadingGames] = useState<boolean>(false);
  const [gamesError, setGamesError] = useState<string | null>(null);
  const [selectedSport, setSelectedSport] = useState<'nfl' | 'college' | 'nba' | 'soccer'>('nfl');
  const [showPlaceBetModal, setShowPlaceBetModal] = useState<boolean>(false);
  const [selectedGameForBet, setSelectedGameForBet] = useState<NFLGame | null>(null);
  const [apiKey, setApiKey] = useState<string>('');
  const [newApiKeyInput, setNewApiKeyInput] = useState<string>('');
  const [showApiKeyExpired, setShowApiKeyExpired] = useState<boolean>(false);
  const [expandedSports, setExpandedSports] = useState<Set<string>>(new Set());

  const userBets = sportsBets.filter(b => b.userId === currentUser?.id);
  const totalWon = userBets.filter(b => b.won === true).reduce((sum, bet) => {
    const profit = (bet.payout || 0) - bet.amount;
    return sum + profit;
  }, 0);
  const totalLost = userBets.filter(b => b.won === false).reduce((sum, bet) => sum + bet.amount, 0);
  const netBets = totalWon - totalLost;

  useEffect(() => {
    const loadApiKey = async () => {
      try {
        const storedKey = await AsyncStorage.getItem('@odds_api_key');
        if (storedKey) {
          setApiKey(storedKey);
        } else {
          const defaultKey = process.env.EXPO_PUBLIC_ODDS_API_KEY || '4b01f78f0aa7ea9993b2ff090ed7fa9f';
          setApiKey(defaultKey);
        }
      } catch (error) {
        console.error('Error loading API key:', error);
      }
    };
    loadApiKey();
  }, []);

  useEffect(() => {
    const loadCachedGames = async () => {
      try {
        const cachedData = await AsyncStorage.getItem('@sports_games_cache');
        if (cachedData) {
          try {
            const parsed = JSON.parse(cachedData);
            setCachedGamesData(parsed);
            if (parsed[selectedSport]) {
              setNflGames(parsed[selectedSport].nfl || []);
              setLiveGames(parsed[selectedSport].live || []);
            }
          } catch (parseError) {
            console.error('Error parsing cached games, clearing corrupted cache:', parseError);
            await AsyncStorage.removeItem('@sports_games_cache');
            setCachedGamesData({});
          }
        }
      } catch (error) {
        console.error('Error loading cached games:', error);
      }
    };
    loadCachedGames();
  }, [selectedSport]);

  useEffect(() => {
    if (cachedGamesData[selectedSport]) {
      setNflGames(cachedGamesData[selectedSport].nfl || []);
      setLiveGames(cachedGamesData[selectedSport].live || []);
    } else {
      setNflGames([]);
      setLiveGames([]);
    }
  }, [selectedSport, cachedGamesData]);

  const handleUpdateApiKey = async () => {
    if (!newApiKeyInput.trim()) return;
    
    try {
      await AsyncStorage.setItem('@odds_api_key', newApiKeyInput.trim());
      setApiKey(newApiKeyInput.trim());
      setNewApiKeyInput('');
      setShowApiKeyExpired(false);
      setGamesError(null);
    } catch (error) {
      console.error('Error saving API key:', error);
      Alert.alert('Error', 'Failed to save API key. Please try again.');
    }
  };

  const fetchGames = useCallback(async () => {
    if (!apiKey) return;
    
    setLoadingGames(true);
    setGamesError(null);
    setShowApiKeyExpired(false);
    try {
      const currentApiKey = apiKey;

      
      let sportKey = '';
      
      if (selectedSport === 'nfl') {
        sportKey = 'americanfootball_nfl';
      } else if (selectedSport === 'college') {
        sportKey = 'americanfootball_ncaaf';
      } else if (selectedSport === 'nba') {
        sportKey = 'basketball_nba';
      } else if (selectedSport === 'soccer') {
        sportKey = 'soccer_epl';
      }
      
      const oddsUrl = `https://api.the-odds-api.com/v4/sports/${sportKey}/odds/?apiKey=${currentApiKey}&regions=us&markets=h2h,spreads,totals&oddsFormat=american`;
      const scoresUrl = `https://api.the-odds-api.com/v4/sports/${sportKey}/scores/?apiKey=${currentApiKey}&daysFrom=1`;
      
      console.log('Fetching odds from:', oddsUrl.replace(currentApiKey, 'API_KEY_HIDDEN'));
      console.log('Fetching scores from:', scoresUrl.replace(currentApiKey, 'API_KEY_HIDDEN'));
      
      const [oddsResponse, scoresResponse] = await Promise.all([
        fetch(oddsUrl, { method: 'GET' }),
        fetch(scoresUrl, { method: 'GET' })
      ]);
      
      if (!oddsResponse.ok) {
        const errorData = await oddsResponse.json().catch(() => ({}));
        console.error('Odds API Error:', oddsResponse.status, errorData);
        
        if (oddsResponse.status === 401 || oddsResponse.status === 403) {
          setShowApiKeyExpired(true);
          throw new Error('API_KEY_EXPIRED');
        } else if (oddsResponse.status === 429) {
          setShowApiKeyExpired(true);
          throw new Error('API_QUOTA_EXCEEDED');
        } else {
          throw new Error(`Failed to fetch games (${oddsResponse.status})`);
        }
      }
      
      const oddsData = await oddsResponse.json();
      const scoresData = scoresResponse.ok ? await scoresResponse.json() : [];
      
      console.log('Odds API Response count:', Array.isArray(oddsData) ? oddsData.length : 0);
      console.log('Scores API Response count:', Array.isArray(scoresData) ? scoresData.length : 0);
      
      const scoresMap = new Map();
      if (Array.isArray(scoresData)) {
        scoresData.forEach((game: any) => {
          scoresMap.set(game.id, {
            completed: game.completed || false,
            homeScore: game.scores?.find((s: any) => s.name === game.home_team)?.score,
            awayScore: game.scores?.find((s: any) => s.name === game.away_team)?.score,
          });
        });
      }
      
      if (Array.isArray(oddsData) && oddsData.length > 0) {
        const now = new Date();
        const todayStart = getEasternStartOfDay(now);
        const todayEnd = getEasternEndOfDay(now);
        
        const transformedGames: NFLGame[] = oddsData.map((game: any) => {
          const scoreInfo = scoresMap.get(game.id) || {};
          return {
            id: game.id || Math.random().toString(),
            homeTeam: game.home_team || 'Home Team',
            awayTeam: game.away_team || 'Away Team',
            commenceTime: game.commence_time || new Date().toISOString(),
            completed: scoreInfo.completed || false,
            homeScore: scoreInfo.homeScore,
            awayScore: scoreInfo.awayScore,
            bookmakers: game.bookmakers || []
          };
        });
        
        const liveInProgressGames = transformedGames.filter(game => {
          const gameDate = new Date(game.commenceTime);
          const timeSinceStart = now.getTime() - gameDate.getTime();
          const hoursElapsed = timeSinceStart / (1000 * 60 * 60);
          return !game.completed && gameDate <= now && hoursElapsed < 5;
        });
        
        const todayGames = transformedGames.filter(game => {
          const gameDate = new Date(game.commenceTime);
          return gameDate >= todayStart && gameDate < todayEnd && gameDate > now;
        });
        
        const upcomingGames = transformedGames.filter(game => {
          const gameDate = new Date(game.commenceTime);
          return gameDate >= todayEnd;
        });
        
        const sortedUpcomingGames = [...todayGames, ...upcomingGames].slice(0, 15);
        
        console.log('Total games:', transformedGames.length);
        console.log('Live games:', liveInProgressGames.length);
        console.log('Today upcoming games:', todayGames.length);
        console.log('Future upcoming games:', upcomingGames.length);
        
        setLiveGames(liveInProgressGames);
        setNflGames(sortedUpcomingGames);
        
        const updatedCache = {
          ...cachedGamesData,
          [selectedSport]: {
            nfl: sortedUpcomingGames,
            live: liveInProgressGames,
            timestamp: Date.now(),
          },
        };
        setCachedGamesData(updatedCache);
        await AsyncStorage.setItem('@sports_games_cache', JSON.stringify(updatedCache));
      } else {
        console.log('No games found in response');
        setLiveGames([]);
        setNflGames([]);
        
        const updatedCache = {
          ...cachedGamesData,
          [selectedSport]: {
            nfl: [],
            live: [],
            timestamp: Date.now(),
          },
        };
        setCachedGamesData(updatedCache);
        await AsyncStorage.setItem('@sports_games_cache', JSON.stringify(updatedCache));
      }
    } catch (error) {
      console.error('Error fetching games:', error);
      if (error instanceof Error) {
        if (error.message === 'API_KEY_EXPIRED' || error.message === 'API_QUOTA_EXCEEDED') {
          setGamesError('');
        } else {
          setGamesError(error.message);
        }
      } else {
        setGamesError('Unable to load games. Please check your internet connection.');
      }
    } finally {
      setLoadingGames(false);
    }
  }, [selectedSport, apiKey, cachedGamesData]);



  const handleCurrencyChange = (text: string, setter: (value: string) => void) => {
    const numbers = text.replace(/[^0-9]/g, '');
    setter(numbers);
  };

  const handleOddsChange = (text: string) => {
    const cleaned = text.replace(/[^0-9+\-]/g, '');
    setBetOdds(cleaned);
    
    if (cleaned && betAmount) {
      const odds = parseFloat(cleaned);
      const amount = parseFloat(betAmount) / 100;
      
      if (!isNaN(odds) && !isNaN(amount) && odds !== 0) {
        let calculatedPayout: number;
        
        if (odds > 0) {
          calculatedPayout = amount + (amount * (odds / 100));
        } else {
          calculatedPayout = amount + (amount * (100 / Math.abs(odds)));
        }
        
        setBetPayout((calculatedPayout * 100).toString());
      }
    }
  };

  const handleDateChange = (text: string) => {
    const numbers = text.replace(/[^0-9]/g, '');
    if (numbers.length <= 8) {
      setBetDate(numbers);
    }
  };

  const displayDate = (value: string): string => {
    if (!value) return '';
    const numbers = value.replace(/[^0-9]/g, '');
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 4) return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
    return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`;
  };

  const displayCurrency = (value: string): string => {
    if (!value) return '';
    const amount = parseFloat(value) / 100;
    return `${amount.toFixed(2)}`;
  };

  const handleAddBet = async () => {
    if (!currentUser || !sport.trim() || !teams.trim() || !betType.trim() || !betAmount) return;

    const amount = parseFloat(betAmount) / 100;
    let dateToUse: string | undefined = undefined;
    
    if (betDate) {
      const numbers = betDate.replace(/[^0-9]/g, '');
      if (numbers.length === 8) {
        const month = numbers.slice(0, 2);
        const day = numbers.slice(2, 4);
        const year = numbers.slice(4, 8);
        dateToUse = new Date(`${year}-${month}-${day}`).toISOString();
      }
    }
    
    const odds = betOdds ? parseFloat(betOdds) : undefined;
    const payout = betPayout ? parseFloat(betPayout) / 100 : undefined;
    
    await addSportsBet(currentUser.id, sport.trim(), teams.trim(), betType.trim(), amount, won ?? false, dateToUse, odds, payout);
    setSport('');
    setTeams('');
    setBetType('');
    setBetAmount('');
    setBetOdds('');
    setBetPayout('');
    setBetDate('');
    setWon(null);
    setShowAddBetModal(false);
  };

  const handleEditBet = (betId: string) => {
    const bet = sportsBets.find(b => b.id === betId);
    if (!bet) return;

    setSport(bet.sport);
    setTeams(bet.teams);
    setBetType(bet.betType);
    setBetAmount((bet.amount * 100).toString());
    setBetOdds(bet.odds?.toString() || '');
    setBetPayout((bet.payout ? bet.payout * 100 : 0).toString());
    setWon(bet.won);
    
    const date = new Date(bet.betDate);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = String(date.getFullYear());
    setBetDate(`${month}${day}${year}`);
    
    setShowEditBetModal(betId);
  };

  const handleUpdateBet = async () => {
    if (!showEditBetModal || !sport.trim() || !teams.trim() || !betType.trim() || !betAmount) return;

    const amount = parseFloat(betAmount) / 100;
    let dateToUse = new Date().toISOString();
    
    if (betDate) {
      const numbers = betDate.replace(/[^0-9]/g, '');
      if (numbers.length === 8) {
        const month = numbers.slice(0, 2);
        const day = numbers.slice(2, 4);
        const year = numbers.slice(4, 8);
        dateToUse = new Date(`${year}-${month}-${day}`).toISOString();
      }
    }
    
    const odds = betOdds ? parseFloat(betOdds) : undefined;
    const payout = betPayout ? parseFloat(betPayout) / 100 : undefined;
    
    await updateSportsBet(showEditBetModal, sport.trim(), teams.trim(), betType.trim(), amount, won, dateToUse, odds, payout);
    setSport('');
    setTeams('');
    setBetType('');
    setBetAmount('');
    setBetOdds('');
    setBetPayout('');
    setBetDate('');
    setWon(null);
    setShowEditBetModal(null);
  };

  const handleDeleteBet = (betId: string) => {
    Alert.alert(
      'Delete Sports Bet',
      'Are you sure you want to delete this sports bet? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteSportsBet(betId),
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    return formatDateEST(dateString);
  };

  const formatGameTime = (dateString: string) => {
    return formatGameTimeEST(dateString);
  };

  const getOddsDisplay = (game: NFLGame) => {
    if (!game.bookmakers || game.bookmakers.length === 0) {
      return null;
    }

    const bookmaker = game.bookmakers[0];
    const h2hMarket = bookmaker.markets.find(m => m.key === 'h2h');
    const spreadsMarket = bookmaker.markets.find(m => m.key === 'spreads');
    const totalsMarket = bookmaker.markets.find(m => m.key === 'totals');

    return {
      h2h: h2hMarket?.outcomes || [],
      spreads: spreadsMarket?.outcomes || [],
      totals: totalsMarket?.outcomes || [],
      bookmakerName: bookmaker.title,
    };
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/pmhxsgkxjukxadd3cvfc3' }}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      >
        <View style={styles.purpleOverlay} />
      </ImageBackground>
      <LinearGradient
        colors={['rgba(157, 78, 221, 0.7)', 'rgba(123, 44, 191, 0.7)', 'rgba(90, 24, 154, 0.7)', 'rgba(36, 0, 70, 0.7)', 'rgba(16, 0, 43, 0.7)']}
        style={styles.gradientOverlay}
      />
      <View style={styles.contentWrapper}>
        <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
          <Pressable
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.backButtonPressed,
            ]}
            onPress={() => router.back()}
            testID="back-button"
          >
            <ArrowLeft size={24} color="#FFFFFF" />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>SPORTS BETS</Text>
            <Text style={[styles.headerTotal, netBets >= 0 ? styles.positiveNet : styles.negativeNet]}>
              {netBets >= 0 ? '+' : ''}${netBets.toFixed(2)}
            </Text>
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.addButton,
              pressed && styles.addButtonPressed,
            ]}
            onPress={() => setShowAddBetModal(true)}
            testID="add-sports-bet-button"
          >
            <Plus size={24} color="#FFFFFF" />
          </Pressable>
        </View>

        <View style={styles.sportsSelectionContainer}>
          <View style={styles.sportsSelectionRow}>
            <Pressable
              onPress={() => setSelectedSport('nfl')}
              style={({ pressed }) => [
                styles.sportButton,
                selectedSport === 'nfl' && styles.sportButtonActive,
                pressed && styles.sportButtonPressed,
              ]}
              testID="nfl-button"
            >
              <Text style={[styles.sportButtonText, selectedSport === 'nfl' && styles.sportButtonTextActive]}>NFL</Text>
            </Pressable>
            <Pressable
              onPress={() => setSelectedSport('college')}
              style={({ pressed }) => [
                styles.sportButton,
                selectedSport === 'college' && styles.sportButtonActive,
                pressed && styles.sportButtonPressed,
              ]}
              testID="college-button"
            >
              <Text style={[styles.sportButtonText, selectedSport === 'college' && styles.sportButtonTextActive]}>College</Text>
            </Pressable>
            <Pressable
              onPress={() => setSelectedSport('nba')}
              style={({ pressed }) => [
                styles.sportButton,
                selectedSport === 'nba' && styles.sportButtonActive,
                pressed && styles.sportButtonPressed,
              ]}
              testID="nba-button"
            >
              <Text style={[styles.sportButtonText, selectedSport === 'nba' && styles.sportButtonTextActive]}>NBA</Text>
            </Pressable>
            <Pressable
              onPress={() => setSelectedSport('soccer')}
              style={({ pressed }) => [
                styles.sportButton,
                selectedSport === 'soccer' && styles.sportButtonActive,
                pressed && styles.sportButtonPressed,
              ]}
              testID="soccer-button"
            >
              <Text style={[styles.sportButtonText, selectedSport === 'soccer' && styles.sportButtonTextActive]}>Soccer</Text>
            </Pressable>
          </View>
        </View>

        <ScrollView
          style={styles.scrollContent}
          contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
        >
          {userBets.length === 0 ? (
            <View style={styles.emptyState}>
              <Trophy size={48} color="rgba(36, 0, 70, 0.4)" />
              <Text style={styles.emptyStateText}>No sports bets yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Track your football, basketball, and other sports bets
              </Text>
            </View>
          ) : (
            <View style={styles.betsList}>
              {(() => {
                const pendingBets = userBets.filter(bet => bet.won === null);
                const pastBets = userBets.filter(bet => bet.won !== null);
                
                const groupedPastBets = pastBets.reduce((acc, bet) => {
                  const sportKey = bet.sport.toUpperCase();
                  if (!acc[sportKey]) {
                    acc[sportKey] = [];
                  }
                  acc[sportKey].push(bet);
                  return acc;
                }, {} as Record<string, SportsBet[]>);

                const sortedSportKeys = Object.keys(groupedPastBets).sort();

                return (
                  <>
                    {pendingBets.map((bet) => (
                      <View key={bet.id} style={styles.betCard}>
                        <View style={styles.betHeader}>
                          <View style={styles.betHeaderLeft}>
                            <View style={styles.betTitleRow}>
                              <Text style={styles.sportName}>{bet.sport}</Text>
                              <View style={[styles.resultBadge, styles.pendingBadge]}>
                                <Text style={styles.resultBadgeText}>PENDING</Text>
                              </View>
                            </View>
                            <Text style={styles.betTeams}>{bet.teams}</Text>
                            <Text style={styles.betType}>{bet.betType}</Text>
                            {bet.odds && (
                              <Text style={styles.betOdds}>Odds: {bet.odds > 0 ? '+' : ''}{bet.odds}</Text>
                            )}
                            <Text style={styles.betDate}>{formatDate(bet.betDate)}</Text>
                          </View>
                          <View style={styles.betHeaderActions}>
                            <Pressable
                              onPress={() => handleEditBet(bet.id)}
                              style={({ pressed }) => [
                                styles.editButton,
                                pressed && styles.editButtonPressed,
                              ]}
                              testID={`edit-sports-bet-${bet.id}`}
                            >
                              <Pencil size={18} color="#9D4EDD" />
                            </Pressable>
                            <Pressable
                              onPress={() => handleDeleteBet(bet.id)}
                              style={({ pressed }) => [
                                styles.deleteButton,
                                pressed && styles.deleteButtonPressed,
                              ]}
                              testID={`delete-sports-bet-${bet.id}`}
                            >
                              <Trash2 size={20} color="#000000" />
                            </Pressable>
                          </View>
                        </View>

                        <View style={styles.betResultActions}>
                          <View style={styles.betAmountRow}>
                            <Text style={styles.betAmountLabel}>Bet Amount:</Text>
                            <Text style={styles.betAmountValue}>${bet.amount.toFixed(2)}</Text>
                          </View>
                          {bet.payout !== undefined && bet.payout > 0 && (
                            <View style={styles.betAmountRow}>
                              <Text style={styles.betAmountLabel}>Potential Profit:</Text>
                              <Text style={[styles.betAmountValue, styles.wonAmount]}>+${(bet.payout - bet.amount).toFixed(2)}</Text>
                            </View>
                          )}
                          <View style={styles.resultButtonsContainer}>
                            <Pressable
                              onPress={() => updateSportsBet(bet.id, bet.sport, bet.teams, bet.betType, bet.amount, false, bet.betDate, bet.odds, bet.payout)}
                              style={({ pressed }) => [
                                styles.resultButton,
                                styles.lostButtonSelected,
                                pressed && styles.resultButtonPressed,
                              ]}
                              testID={`mark-lost-${bet.id}`}
                            >
                              <Text style={[styles.resultButtonText, styles.resultButtonTextSelected]}>Lost</Text>
                            </Pressable>
                            <Pressable
                              onPress={() => updateSportsBet(bet.id, bet.sport, bet.teams, bet.betType, bet.amount, true, bet.betDate, bet.odds, bet.payout)}
                              style={({ pressed }) => [
                                styles.resultButton,
                                styles.wonButtonSelected,
                                pressed && styles.resultButtonPressed,
                              ]}
                              testID={`mark-won-${bet.id}`}
                            >
                              <Text style={[styles.resultButtonText, styles.resultButtonTextSelected]}>Won</Text>
                            </Pressable>
                          </View>
                        </View>
                      </View>
                    ))}

                    {sortedSportKeys.map((sportKey) => {
                      const bets = groupedPastBets[sportKey];
                      const isExpanded = expandedSports.has(sportKey);
                      
                      const totalWonInSport = bets.filter(b => b.won === true).reduce((sum, bet) => {
                        const profit = (bet.payout || 0) - bet.amount;
                        return sum + profit;
                      }, 0);
                      const totalLostInSport = bets.filter(b => b.won === false).reduce((sum, bet) => sum + bet.amount, 0);
                      const netInSport = totalWonInSport - totalLostInSport;

                      return (
                        <View key={sportKey}>
                          <Pressable
                            style={({ pressed }) => [
                              styles.sportGroupCard,
                              pressed && styles.sportGroupCardPressed,
                            ]}
                            onPress={() => {
                              setExpandedSports(prev => {
                                const next = new Set(prev);
                                if (next.has(sportKey)) {
                                  next.delete(sportKey);
                                } else {
                                  next.add(sportKey);
                                }
                                return next;
                              });
                            }}
                            testID={`sport-group-${sportKey}`}
                          >
                            <View style={styles.sportGroupHeader}>
                              <View style={styles.sportGroupLeft}>
                                <Text style={styles.sportGroupTitle}>{sportKey}</Text>
                                <Text style={styles.sportGroupCount}>{bets.length} bet{bets.length !== 1 ? 's' : ''}</Text>
                              </View>
                              <View style={styles.sportGroupRight}>
                                <Text style={[styles.sportGroupTotal, netInSport >= 0 ? styles.sportGroupPositive : styles.sportGroupNegative]}>
                                  {netInSport >= 0 ? '+' : ''}${netInSport.toFixed(2)}
                                </Text>
                                <Text style={styles.sportGroupArrow}>{isExpanded ? '▼' : '▶'}</Text>
                              </View>
                            </View>
                          </Pressable>

                          {isExpanded && (
                            <View style={styles.sportGroupBets}>
                              {bets.map((bet) => (
                                <View key={bet.id} style={styles.sportGroupBetCard}>
                                  <View style={styles.betHeader}>
                                    <View style={styles.betHeaderLeft}>
                                      <Text style={styles.betTeams}>{bet.teams}</Text>
                                      <Text style={styles.betType}>{bet.betType}</Text>
                                      {bet.odds && (
                                        <Text style={styles.betOdds}>Odds: {bet.odds > 0 ? '+' : ''}{bet.odds}</Text>
                                      )}
                                      <Text style={styles.betDate}>{formatDate(bet.betDate)}</Text>
                                      <View style={styles.betResultRow}>
                                        <Text style={styles.betAmountLabel}>Bet: ${bet.amount.toFixed(2)}</Text>
                                        <Text style={[styles.betResultAmount, bet.won ? styles.collapsedWon : styles.collapsedLost]}>
                                          {bet.won ? '+' : '-'}${bet.won ? ((bet.payout || 0) - bet.amount).toFixed(2) : bet.amount.toFixed(2)}
                                        </Text>
                                      </View>
                                    </View>
                                    <View style={styles.betHeaderActions}>
                                      <Pressable
                                        onPress={() => handleEditBet(bet.id)}
                                        style={({ pressed }) => [
                                          styles.editButton,
                                          pressed && styles.editButtonPressed,
                                        ]}
                                        testID={`edit-sports-bet-${bet.id}`}
                                      >
                                        <Pencil size={18} color="#9D4EDD" />
                                      </Pressable>
                                      <Pressable
                                        onPress={() => handleDeleteBet(bet.id)}
                                        style={({ pressed }) => [
                                          styles.deleteButton,
                                          pressed && styles.deleteButtonPressed,
                                        ]}
                                        testID={`delete-sports-bet-${bet.id}`}
                                      >
                                        <Trash2 size={20} color="#000000" />
                                      </Pressable>
                                    </View>
                                  </View>
                                </View>
                              ))}
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </>
                );
              })()}
            </View>
          )}

          <View style={styles.nflSection}>
            <View style={styles.nflHeader}>
              <View style={styles.nflHeaderLeft}>
                <Calendar size={20} color="#FFFFFF" />
                <Text style={styles.nflTitle}>
                  {selectedSport === 'nfl' ? 'NFL Schedule' : selectedSport === 'college' ? 'NCAA Football Schedule' : selectedSport === 'nba' ? 'NBA Schedule' : 'Soccer Schedule'}
                </Text>
              </View>
              <Pressable
                onPress={fetchGames}
                style={({ pressed }) => [
                  styles.refreshButton,
                  pressed && styles.refreshButtonPressed,
                ]}
                testID="refresh-games-button"
              >
                <Text style={styles.refreshButtonText}>Refresh</Text>
              </Pressable>
            </View>

            {loadingGames ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#9D4EDD" />
                <Text style={styles.loadingText}>Loading games...</Text>
              </View>
            ) : showApiKeyExpired ? (
              <View style={styles.apiKeyExpiredContainer}>
                <View style={styles.apiKeyExpiredHeader}>
                  <Key size={32} color="#F59E0B" />
                  <Text style={styles.apiKeyExpiredTitle}>API Quota Exceeded</Text>
                </View>
                <Text style={styles.apiKeyExpiredMessage}>
                  The API quota for your current key has been met. You can either wait until it renews or add a new API key to continue.
                </Text>
                <Text style={styles.apiKeyExpiredSubtext}>
                  Get a free API key from{' '}
                  <Text style={styles.apiKeyExpiredLink}>the-odds-api.com</Text>
                </Text>
                <View style={styles.apiKeyInputContainer}>
                  <TextInput
                    style={styles.apiKeyInput}
                    placeholder="Enter new API key"
                    placeholderTextColor="rgba(36, 0, 70, 0.4)"
                    value={newApiKeyInput}
                    onChangeText={setNewApiKeyInput}
                    autoCapitalize="none"
                    autoCorrect={false}
                    testID="new-api-key-input"
                  />
                  <Pressable
                    onPress={handleUpdateApiKey}
                    disabled={!newApiKeyInput.trim()}
                    style={({ pressed }) => [
                      styles.addApiKeyButton,
                      !newApiKeyInput.trim() && styles.addApiKeyButtonDisabled,
                      pressed && styles.addApiKeyButtonPressed,
                    ]}
                    testID="add-api-key-button"
                  >
                    <Text style={styles.addApiKeyButtonText}>Add Key</Text>
                  </Pressable>
                </View>
              </View>
            ) : gamesError ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{gamesError}</Text>
                <Pressable
                  onPress={fetchGames}
                  style={({ pressed }) => [
                    styles.retryButton,
                    pressed && styles.retryButtonPressed,
                  ]}
                >
                  <Text style={styles.retryButtonText}>Retry</Text>
                </Pressable>
              </View>
            ) : nflGames.length === 0 && liveGames.length === 0 ? (
              <View style={styles.noGamesContainer}>
                <Text style={styles.noGamesText}>Click the refresh button to load games</Text>
              </View>
            ) : (
              <View style={styles.gamesContainer}>
                {liveGames.length > 0 && (
                  <View style={styles.sectionContainer}>
                    <View style={styles.sectionHeader}>
                      <View style={styles.liveBadge}>
                        <View style={styles.liveIndicator} />
                        <Text style={styles.sectionTitle}>LIVE IN PROGRESS</Text>
                      </View>
                    </View>
                    <View style={styles.gamesList}>
                      {liveGames.map((game) => {
                        const odds = getOddsDisplay(game);
                        return (
                          <View key={game.id} style={[styles.gameCard, styles.liveGameCard]}>
                            <View style={styles.gameHeader}>
                              <View style={styles.liveBadgeRow}>
                                <View style={styles.liveGameBadge}>
                                  <View style={styles.liveGameIndicator} />
                                  <Text style={styles.liveGameText}>LIVE</Text>
                                </View>
                                <Pressable
                                  onPress={() => {
                                    setSelectedGameForBet(game);
                                    setShowPlaceBetModal(true);
                                  }}
                                  style={({ pressed }) => [
                                    styles.liveBetIcon,
                                    pressed && styles.betIconPressed,
                                  ]}
                                >
                                  <DollarSign size={18} color="#C8A2FF" />
                                </Pressable>
                              </View>
                              {odds && (
                                <Text style={styles.bookmakerName}>{odds.bookmakerName}</Text>
                              )}
                            </View>

                            <View style={styles.matchup}>
                              <View style={styles.teamRow}>
                                <Text style={styles.liveTeamName}>{game.awayTeam}</Text>
                                <View style={styles.scoreContainer}>
                                  {game.awayScore !== undefined && (
                                    <Text style={styles.scoreText}>{game.awayScore}</Text>
                                  )}
                                </View>
                              </View>

                              <Text style={styles.vsText}>@</Text>

                              <View style={styles.teamRow}>
                                <Text style={styles.liveTeamName}>{game.homeTeam}</Text>
                                <View style={styles.scoreContainer}>
                                  {game.homeScore !== undefined && (
                                    <Text style={styles.scoreText}>{game.homeScore}</Text>
                                  )}
                                </View>
                              </View>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                )}

                {nflGames.length > 0 && (
                  <View style={styles.sectionContainer}>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionTitle}>UPCOMING GAMES</Text>
                    </View>
                    <View style={styles.gamesList}>
                      {nflGames.map((game) => {
                        const odds = getOddsDisplay(game);
                        return (
                          <View key={game.id} style={styles.gameCard}>
                            <Pressable
                              onPress={() => {
                                setSelectedGameForBet(game);
                                setShowPlaceBetModal(true);
                              }}
                              style={({ pressed }) => [
                                styles.betIcon,
                                pressed && styles.betIconPressed,
                              ]}
                            >
                              <DollarSign size={20} color="#5A189A" />
                            </Pressable>
                            <View style={styles.gameHeader}>
                              <Text style={styles.gameTime}>{formatGameTime(game.commenceTime)}</Text>
                              {odds && (
                                <Text style={styles.bookmakerName}>{odds.bookmakerName}</Text>
                              )}
                            </View>

                            <View style={styles.matchup}>
                              <View style={styles.teamRow}>
                                <Text style={styles.teamName}>{game.awayTeam}</Text>
                                {odds && odds.spreads.length > 0 && (
                                  <View style={styles.oddsRow}>
                                    {odds.spreads.find(o => o.name === game.awayTeam) && (
                                      <Text style={styles.spreadText}>
                                        {odds.spreads.find(o => o.name === game.awayTeam)?.point! > 0 ? '+' : ''}
                                        {odds.spreads.find(o => o.name === game.awayTeam)?.point}
                                      </Text>
                                    )}
                                    {odds.h2h.find(o => o.name === game.awayTeam) && (
                                      <Text style={styles.moneylineText}>
                                        {odds.h2h.find(o => o.name === game.awayTeam)?.price! > 0 ? '+' : ''}
                                        {odds.h2h.find(o => o.name === game.awayTeam)?.price}
                                      </Text>
                                    )}
                                  </View>
                                )}
                              </View>

                              <Text style={styles.vsText}>@</Text>

                              <View style={styles.teamRow}>
                                <Text style={styles.teamName}>{game.homeTeam}</Text>
                                {odds && odds.spreads.length > 0 && (
                                  <View style={styles.oddsRow}>
                                    {odds.spreads.find(o => o.name === game.homeTeam) && (
                                      <Text style={styles.spreadText}>
                                        {odds.spreads.find(o => o.name === game.homeTeam)?.point! > 0 ? '+' : ''}
                                        {odds.spreads.find(o => o.name === game.homeTeam)?.point}
                                      </Text>
                                    )}
                                    {odds.h2h.find(o => o.name === game.homeTeam) && (
                                      <Text style={styles.moneylineText}>
                                        {odds.h2h.find(o => o.name === game.homeTeam)?.price! > 0 ? '+' : ''}
                                        {odds.h2h.find(o => o.name === game.homeTeam)?.price}
                                      </Text>
                                    )}
                                  </View>
                                )}
                              </View>
                            </View>

                            {odds && odds.totals.length > 0 && (
                              <View style={styles.totalsRow}>
                                <Text style={styles.totalsLabel}>Total:</Text>
                                {odds.totals.map((total, idx) => (
                                  <Text key={idx} style={styles.totalText}>
                                    {total.name} {total.point} ({total.price > 0 ? '+' : ''}{total.price})
                                  </Text>
                                ))}
                              </View>
                            )}
                          </View>
                        );
                      })}
                    </View>
                  </View>
                )}

                {liveGames.length === 0 && nflGames.length === 0 && (
                  <View style={styles.noGamesContainer}>
                    <Text style={styles.noGamesText}>No games available</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </ScrollView>
      </View>

      <Modal
        visible={showAddBetModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddBetModal(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={styles.modal}>
                <Text style={styles.modalTitle}>Add Sports Bet</Text>
                
                <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Sport</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Football, Basketball, etc."
                      placeholderTextColor="rgba(36, 0, 70, 0.4)"
                      value={sport}
                      onChangeText={setSport}
                      testID="sport-input"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Teams / Match</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Team A vs Team B"
                      placeholderTextColor="rgba(36, 0, 70, 0.4)"
                      value={teams}
                      onChangeText={setTeams}
                      testID="teams-input"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Bet Type</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Moneyline, Spread, Over/Under, etc."
                      placeholderTextColor="rgba(36, 0, 70, 0.4)"
                      value={betType}
                      onChangeText={setBetType}
                      testID="bet-type-input"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Bet Amount</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="$0.00"
                      placeholderTextColor="rgba(36, 0, 70, 0.4)"
                      value={displayCurrency(betAmount)}
                      onChangeText={(text) => handleCurrencyChange(text, setBetAmount)}
                      keyboardType="numeric"
                      testID="bet-amount-input"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Odds (Optional)</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g., -110, +150"
                      placeholderTextColor="rgba(36, 0, 70, 0.4)"
                      value={betOdds}
                      onChangeText={handleOddsChange}
                      keyboardType="numbers-and-punctuation"
                      testID="bet-odds-input"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Total Payout (Optional)</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="$0.00"
                      placeholderTextColor="rgba(36, 0, 70, 0.4)"
                      value={displayCurrency(betPayout)}
                      onChangeText={(text) => handleCurrencyChange(text, setBetPayout)}
                      keyboardType="numeric"
                      testID="bet-payout-input"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Date of Bet (Optional)</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="MM/DD/YYYY"
                      placeholderTextColor="rgba(36, 0, 70, 0.4)"
                      value={displayDate(betDate)}
                      onChangeText={handleDateChange}
                      keyboardType="numeric"
                      testID="bet-date-input"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Result</Text>
                    <View style={styles.resultButtonsContainer}>
                      <Pressable
                        onPress={() => setWon(false)}
                        style={({ pressed }) => [
                          styles.resultButton,
                          won === false && styles.resultButtonSelected,
                          won === false && styles.lostButtonSelected,
                          pressed && styles.resultButtonPressed,
                        ]}
                        testID="lost-button"
                      >
                        <Text style={[styles.resultButtonText, won === false && styles.resultButtonTextSelected]}>Lost</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => setWon(true)}
                        style={({ pressed }) => [
                          styles.resultButton,
                          won === true && styles.resultButtonSelected,
                          won === true && styles.wonButtonSelected,
                          pressed && styles.resultButtonPressed,
                        ]}
                        testID="won-button"
                      >
                        <Text style={[styles.resultButtonText, won === true && styles.resultButtonTextSelected]}>Won</Text>
                      </Pressable>
                    </View>
                  </View>
                </ScrollView>

                <View style={styles.modalFooter}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.modalButton,
                      styles.cancelButton,
                      pressed && styles.modalButtonPressed,
                    ]}
                    onPress={() => {
                      setSport('');
                      setTeams('');
                      setBetType('');
                      setBetAmount('');
                      setBetOdds('');
                      setBetPayout('');
                      setBetDate('');
                      setWon(null);
                      setShowAddBetModal(false);
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [
                      styles.modalButton,
                      styles.confirmButton,
                      (!sport.trim() || !teams.trim() || !betType.trim() || !betAmount) && styles.confirmButtonDisabled,
                      pressed && styles.modalButtonPressed,
                    ]}
                    onPress={handleAddBet}
                    disabled={!sport.trim() || !teams.trim() || !betType.trim() || !betAmount}
                    testID="confirm-add-sports-bet"
                  >
                    <Text style={styles.confirmButtonText}>Add Bet</Text>
                  </Pressable>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal
        visible={!!showEditBetModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditBetModal(null)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={styles.modal}>
                <Text style={styles.modalTitle}>Edit Sports Bet</Text>
                
                <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Sport</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Football, Basketball, etc."
                      placeholderTextColor="rgba(36, 0, 70, 0.4)"
                      value={sport}
                      onChangeText={setSport}
                      testID="edit-sport-input"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Teams / Match</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Team A vs Team B"
                      placeholderTextColor="rgba(36, 0, 70, 0.4)"
                      value={teams}
                      onChangeText={setTeams}
                      testID="edit-teams-input"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Bet Type</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Moneyline, Spread, Over/Under, etc."
                      placeholderTextColor="rgba(36, 0, 70, 0.4)"
                      value={betType}
                      onChangeText={setBetType}
                      testID="edit-bet-type-input"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Bet Amount</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="$0.00"
                      placeholderTextColor="rgba(36, 0, 70, 0.4)"
                      value={displayCurrency(betAmount)}
                      onChangeText={(text) => handleCurrencyChange(text, setBetAmount)}
                      keyboardType="numeric"
                      testID="edit-bet-amount-input"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Odds (Optional)</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g., -110, +150"
                      placeholderTextColor="rgba(36, 0, 70, 0.4)"
                      value={betOdds}
                      onChangeText={handleOddsChange}
                      keyboardType="numbers-and-punctuation"
                      testID="edit-bet-odds-input"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Total Payout (Optional)</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="$0.00"
                      placeholderTextColor="rgba(36, 0, 70, 0.4)"
                      value={displayCurrency(betPayout)}
                      onChangeText={(text) => handleCurrencyChange(text, setBetPayout)}
                      keyboardType="numeric"
                      testID="edit-bet-payout-input"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Date of Bet</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="MM/DD/YYYY"
                      placeholderTextColor="rgba(36, 0, 70, 0.4)"
                      value={displayDate(betDate)}
                      onChangeText={handleDateChange}
                      keyboardType="numeric"
                      testID="edit-bet-date-input"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Result</Text>
                    <View style={styles.resultButtonsContainer}>
                      <Pressable
                        onPress={() => setWon(false)}
                        style={({ pressed }) => [
                          styles.resultButton,
                          won === false && styles.resultButtonSelected,
                          won === false && styles.lostButtonSelected,
                          pressed && styles.resultButtonPressed,
                        ]}
                        testID="edit-lost-button"
                      >
                        <Text style={[styles.resultButtonText, won === false && styles.resultButtonTextSelected]}>Lost</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => setWon(true)}
                        style={({ pressed }) => [
                          styles.resultButton,
                          won === true && styles.resultButtonSelected,
                          won === true && styles.wonButtonSelected,
                          pressed && styles.resultButtonPressed,
                        ]}
                        testID="edit-won-button"
                      >
                        <Text style={[styles.resultButtonText, won === true && styles.resultButtonTextSelected]}>Won</Text>
                      </Pressable>
                    </View>
                  </View>
                </ScrollView>

                <View style={styles.modalFooter}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.modalButton,
                      styles.cancelButton,
                      pressed && styles.modalButtonPressed,
                    ]}
                    onPress={() => {
                      setSport('');
                      setTeams('');
                      setBetType('');
                      setBetAmount('');
                      setBetOdds('');
                      setBetPayout('');
                      setBetDate('');
                      setWon(null);
                      setShowEditBetModal(null);
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [
                      styles.modalButton,
                      styles.confirmButton,
                      (!sport.trim() || !teams.trim() || !betType.trim() || !betAmount) && styles.confirmButtonDisabled,
                      pressed && styles.modalButtonPressed,
                    ]}
                    onPress={handleUpdateBet}
                    disabled={!sport.trim() || !teams.trim() || !betType.trim() || !betAmount}
                    testID="confirm-edit-sports-bet"
                  >
                    <Text style={styles.confirmButtonText}>Update Bet</Text>
                  </Pressable>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {selectedGameForBet && (
        <PlaceBetModal
          visible={showPlaceBetModal}
          onClose={() => {
            setShowPlaceBetModal(false);
            setSelectedGameForBet(null);
          }}
          gameData={{
            homeTeam: selectedGameForBet.homeTeam,
            awayTeam: selectedGameForBet.awayTeam,
            homeSpread: getOddsDisplay(selectedGameForBet)?.spreads.find(o => o.name === selectedGameForBet.homeTeam)?.point,
            awaySpread: getOddsDisplay(selectedGameForBet)?.spreads.find(o => o.name === selectedGameForBet.awayTeam)?.point,
            homeSpreadOdds: getOddsDisplay(selectedGameForBet)?.spreads.find(o => o.name === selectedGameForBet.homeTeam)?.price,
            awaySpreadOdds: getOddsDisplay(selectedGameForBet)?.spreads.find(o => o.name === selectedGameForBet.awayTeam)?.price,
            homeMoneyline: getOddsDisplay(selectedGameForBet)?.h2h.find(o => o.name === selectedGameForBet.homeTeam)?.price,
            awayMoneyline: getOddsDisplay(selectedGameForBet)?.h2h.find(o => o.name === selectedGameForBet.awayTeam)?.price,
            overPoint: getOddsDisplay(selectedGameForBet)?.totals.find(o => o.name === 'Over')?.point,
            overPrice: getOddsDisplay(selectedGameForBet)?.totals.find(o => o.name === 'Over')?.price,
            underPoint: getOddsDisplay(selectedGameForBet)?.totals.find(o => o.name === 'Under')?.point,
            underPrice: getOddsDisplay(selectedGameForBet)?.totals.find(o => o.name === 'Under')?.price,
          }}
          sport={selectedSport === 'nfl' ? 'NFL' : selectedSport === 'college' ? 'College Football' : selectedSport === 'nba' ? 'NBA' : 'Soccer'}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  purpleOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(157, 78, 221, 0.3)',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  contentWrapper: {
    flex: 1,
  },
  header: {
    minHeight: 155,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(157, 78, 221, 0.9)',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButtonPressed: {
    opacity: 0.6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  headerTotal: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  positiveNet: {
    color: '#FFD700',
  },
  negativeNet: {
    color: '#EF4444',
  },
  addButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  addButtonPressed: {
    opacity: 0.6,
  },
  scrollContent: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    gap: 16,
  },
  emptyState: {
    backgroundColor: 'rgba(200, 162, 255, 0.95)',
    borderRadius: 16,
    padding: 48,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  emptyStateText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#240046',
  },
  emptyStateSubtext: {
    fontSize: 12,
    color: 'rgba(36, 0, 70, 0.8)',
    textAlign: 'center',
  },
  betsList: {
    gap: 16,
  },
  betCard: {
    backgroundColor: 'rgba(220, 190, 255, 0.95)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    gap: 16,
  },
  betHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  betHeaderLeft: {
    flex: 1,
    gap: 6,
  },
  betTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  betHeaderActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(157, 78, 221, 0.15)',
  },
  editButtonPressed: {
    opacity: 0.7,
  },
  sportName: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#240046',
  },
  betTeams: {
    fontSize: 14,
    color: 'rgba(36, 0, 70, 0.85)',
    fontWeight: '600' as const,
  },
  betType: {
    fontSize: 13,
    color: 'rgba(36, 0, 70, 0.75)',
    fontWeight: '500' as const,
  },
  betDate: {
    fontSize: 12,
    color: 'rgba(36, 0, 70, 0.7)',
    fontWeight: '500' as const,
  },
  betOdds: {
    fontSize: 12,
    color: 'rgba(90, 24, 154, 0.9)',
    fontWeight: '600' as const,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  deleteButtonPressed: {
    opacity: 0.7,
  },
  resultBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  wonBadge: {
    backgroundColor: '#10B981',
  },
  lostBadge: {
    backgroundColor: '#EF4444',
  },
  pendingBadge: {
    backgroundColor: '#F59E0B',
  },
  resultBadgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  betAmount: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(157, 78, 221, 0.2)',
  },
  betResultActions: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(157, 78, 221, 0.2)',
    gap: 12,
  },
  betAmountLabel: {
    fontSize: 13,
    color: 'rgba(36, 0, 70, 0.8)',
    fontWeight: '600' as const,
  },
  betAmountValue: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  wonAmount: {
    color: '#FFD700',
  },
  lostAmount: {
    color: '#EF4444',
  },
  betAmountSection: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(157, 78, 221, 0.2)',
    gap: 8,
  },
  betAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#240046',
    padding: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(36, 0, 70, 0.1)',
  },
  modalBody: {
    padding: 24,
    maxHeight: 400,
  },
  inputGroup: {
    gap: 8,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#240046',
  },
  textInput: {
    backgroundColor: 'rgba(157, 78, 221, 0.05)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#240046',
    borderWidth: 1,
    borderColor: 'rgba(157, 78, 221, 0.2)',
  },
  resultButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  resultButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 50,
    alignItems: 'center',
    backgroundColor: 'rgba(157, 78, 221, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(157, 78, 221, 0.3)',
  },
  resultButtonSelected: {
    borderWidth: 2,
  },
  lostButtonSelected: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  wonButtonSelected: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  resultButtonPressed: {
    opacity: 0.7,
  },
  resultButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#9D4EDD',
  },
  resultButtonTextSelected: {
    color: '#FFFFFF',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(36, 0, 70, 0.1)',
  },
  modalButton: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  modalButtonPressed: {
    opacity: 0.7,
  },
  cancelButton: {
    backgroundColor: 'rgba(157, 78, 221, 0.1)',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#9D4EDD',
  },
  confirmButton: {
    backgroundColor: '#9D4EDD',
  },
  confirmButtonDisabled: {
    backgroundColor: 'rgba(157, 78, 221, 0.3)',
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  nflSection: {
    marginTop: 24,
    gap: 16,
  },
  nflHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  nflHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nflTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  refreshButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(157, 78, 221, 0.3)',
  },
  refreshButtonPressed: {
    opacity: 0.6,
  },
  refreshButtonText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  loadingContainer: {
    backgroundColor: 'rgba(200, 162, 255, 0.95)',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#240046',
    fontWeight: '600' as const,
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
    fontWeight: '600' as const,
  },
  retryButton: {
    backgroundColor: '#9D4EDD',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonPressed: {
    opacity: 0.7,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700' as const,
    fontSize: 14,
  },
  noGamesContainer: {
    backgroundColor: 'rgba(200, 162, 255, 0.95)',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  noGamesText: {
    fontSize: 14,
    color: 'rgba(36, 0, 70, 0.7)',
    fontWeight: '600' as const,
  },
  gamesContainer: {
    gap: 24,
  },
  sectionContainer: {
    gap: 12,
  },
  sectionHeader: {
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  liveIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FCD34D',
  },
  gamesList: {
    gap: 12,
  },
  liveGameCard: {
    borderWidth: 2,
    borderColor: '#EF4444',
    backgroundColor: 'rgba(90, 24, 154, 1)',
  },
  liveGameBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EF4444',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  liveGameIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  liveGameText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  scoreContainer: {
    minWidth: 40,
    alignItems: 'flex-end',
  },
  scoreText: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  gameCard: {
    backgroundColor: 'rgba(220, 190, 255, 0.95)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    gap: 12,
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(157, 78, 221, 0.2)',
  },
  gameTime: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#1E3A8A',
  },
  bookmakerName: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500' as const,
  },
  matchup: {
    gap: 8,
  },
  teamRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  teamName: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#240046',
    flex: 1,
  },
  liveTeamName: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    flex: 1,
  },
  oddsRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  spreadText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#1E3A8A',
    backgroundColor: 'rgba(157, 78, 221, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  moneylineText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#1E3A8A',
    backgroundColor: 'rgba(36, 0, 70, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  vsText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    fontWeight: '600' as const,
  },
  totalsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(157, 78, 221, 0.15)',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  totalsLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#1E3A8A',
  },
  totalText: {
    fontSize: 12,
    color: '#1E3A8A',
    fontWeight: '500' as const,
  },
  sportsSelectionContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(90, 24, 154, 0.6)',
  },
  sportsSelectionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  sportButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: 'rgba(157, 78, 221, 0.3)',
    borderWidth: 2,
    borderColor: 'rgba(157, 78, 221, 0.5)',
  },
  sportButtonActive: {
    backgroundColor: '#9D4EDD',
    borderColor: '#9D4EDD',
  },
  sportButtonPressed: {
    opacity: 0.7,
  },
  sportButtonText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  sportButtonTextActive: {
    color: '#FFFFFF',
  },
  betIcon: {
    position: 'absolute',
    bottom: 8,
    right: 12,
    backgroundColor: 'rgba(90, 24, 154, 0.2)',
    borderRadius: 20,
    padding: 8,
    borderWidth: 2,
    borderColor: '#5A189A',
    zIndex: 10,
  },
  betIconPressed: {
    opacity: 0.7,
  },
  liveBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  liveBetIcon: {
    backgroundColor: 'rgba(200, 162, 255, 0.25)',
    borderRadius: 20,
    padding: 6,
    borderWidth: 2,
    borderColor: '#C8A2FF',
  },
  apiKeyExpiredContainer: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 16,
    padding: 24,
    gap: 16,
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  apiKeyExpiredHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  apiKeyExpiredTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#F59E0B',
  },
  apiKeyExpiredMessage: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
    fontWeight: '500' as const,
  },
  apiKeyExpiredSubtext: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500' as const,
  },
  apiKeyExpiredLink: {
    color: '#60A5FA',
    fontWeight: '700' as const,
    textDecorationLine: 'underline',
  },
  apiKeyInputContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  apiKeyInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    color: '#240046',
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  addApiKeyButton: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addApiKeyButtonDisabled: {
    backgroundColor: 'rgba(245, 158, 11, 0.4)',
  },
  addApiKeyButtonPressed: {
    opacity: 0.7,
  },
  addApiKeyButtonText: {
    color: '#FFFFFF',
    fontWeight: '700' as const,
    fontSize: 14,
  },
  betCardCollapsed: {
    backgroundColor: 'rgba(220, 190, 255, 0.95)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  betCardCollapsedPressed: {
    opacity: 0.8,
  },
  betCardPressed: {
    opacity: 0.8,
  },
  collapsedContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  collapsedLeft: {
    flex: 1,
    gap: 2,
  },
  collapsedSport: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#240046',
  },
  collapsedTeams: {
    fontSize: 12,
    color: 'rgba(36, 0, 70, 0.8)',
    fontWeight: '500' as const,
  },
  collapsedResult: {
    fontSize: 15,
    fontWeight: '700' as const,
    marginTop: 2,
  },
  collapsedWon: {
    color: '#10B981',
  },
  collapsedLost: {
    color: '#EF4444',
  },
  collapsedActions: {
    flexDirection: 'row',
    gap: 6,
    marginLeft: 12,
  },
  collapsedIconButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(157, 78, 221, 0.1)',
  },
  sportGroupCard: {
    backgroundColor: 'rgba(157, 78, 221, 0.85)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 12,
  },
  sportGroupCardPressed: {
    opacity: 0.8,
  },
  sportGroupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sportGroupLeft: {
    flex: 1,
    gap: 4,
  },
  sportGroupTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  sportGroupCount: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500' as const,
  },
  sportGroupRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sportGroupTotal: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  sportGroupPositive: {
    color: '#FFD700',
  },
  sportGroupNegative: {
    color: '#EF4444',
  },
  sportGroupArrow: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700' as const,
  },
  sportGroupBets: {
    marginTop: 12,
    gap: 8,
  },
  sportGroupBetCard: {
    backgroundColor: 'rgba(220, 190, 255, 0.95)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  betResultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(157, 78, 221, 0.2)',
  },
  betResultAmount: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
});
