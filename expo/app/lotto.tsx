import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useFocusEffect } from 'expo-router';
import { ArrowLeft, Sparkles, TrendingUp, Save, Trash2, Brain, Trophy } from 'lucide-react-native';
import { useState, useEffect, useCallback } from 'react';
import { ImageBackground, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

type GenerationMethod = 'R' | '6' | 'SP';

interface SavedNumbers {
  id: string;
  numbers: number[];
  specialBall: number;
  timestamp: number;
  method: GenerationMethod;
}

interface WinningNumbers {
  numbers: number[];
  specialBall: number;
  drawDate: string;
  nextDrawDate: string;
  nextJackpot: string;
}

const SAVED_POWERBALL_KEY = '@casino_tracker_saved_powerball';
const SAVED_MEGA_MILLIONS_KEY = '@casino_tracker_saved_mega_millions';

export default function LottoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [powerballNumbers, setPowerballNumbers] = useState<number[]>([]);
  const [powerballPowerball, setPowerballPowerball] = useState<number | null>(null);
  const [powerballMethod, setPowerballMethod] = useState<GenerationMethod>('R');
  const [megaMillionsNumbers, setMegaMillionsNumbers] = useState<number[]>([]);
  const [megaMillionsMegaBall, setMegaMillionsMegaBall] = useState<number | null>(null);
  const [megaMillionsMethod, setMegaMillionsMethod] = useState<GenerationMethod>('R');
  const [savedPowerball, setSavedPowerball] = useState<SavedNumbers[]>([]);
  const [savedMegaMillions, setSavedMegaMillions] = useState<SavedNumbers[]>([]);
  const [currentPowerball, setCurrentPowerball] = useState<WinningNumbers | null>(null);
  const [currentMegaMillions, setCurrentMegaMillions] = useState<WinningNumbers | null>(null);
  const [loadingCurrent, setLoadingCurrent] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCurrentWinningNumbers = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoadingCurrent(true);
    }
    console.log('Fetching lottery data...');
    try {
      const [powerballResponse, megaResponse] = await Promise.all([
        fetch('https://data.ny.gov/resource/d6yy-54nr.json?$order=draw_date%20DESC&$limit=1'),
        fetch('https://data.ny.gov/resource/5xaw-6ayf.json?$order=draw_date%20DESC&$limit=1'),
      ]);
      
      const powerballData = await powerballResponse.json();
      console.log('Powerball data received:', powerballData.length > 0 ? 'Success' : 'No data');
      let powerballJackpot = await scrapePowerballJackpot();
      console.log('Powerball jackpot scraped:', powerballJackpot);
      
      if (powerballData && powerballData.length > 0) {
        const latest = powerballData[0];
        const numbers = [
          parseInt(latest.winning_numbers.split(' ')[0]),
          parseInt(latest.winning_numbers.split(' ')[1]),
          parseInt(latest.winning_numbers.split(' ')[2]),
          parseInt(latest.winning_numbers.split(' ')[3]),
          parseInt(latest.winning_numbers.split(' ')[4]),
        ].sort((a, b) => a - b);
        const powerball = parseInt(latest.winning_numbers.split(' ')[5]);
        const lastDrawDate = new Date(latest.draw_date);
        
        setCurrentPowerball({
          numbers,
          specialBall: powerball,
          drawDate: lastDrawDate.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
          }),
          nextDrawDate: getNextDrawDate(lastDrawDate, [1, 3, 6]),
          nextJackpot: powerballJackpot,
        });
      }

      const megaData = await megaResponse.json();
      console.log('Mega Millions data received:', megaData.length > 0 ? 'Success' : 'No data');
      let megaJackpot = await scrapeMegaMillionsJackpot();
      console.log('Mega Millions jackpot scraped:', megaJackpot);
      
      if (megaData && megaData.length > 0) {
        const latest = megaData[0];
        const numbers = [
          parseInt(latest.winning_numbers.split(' ')[0]),
          parseInt(latest.winning_numbers.split(' ')[1]),
          parseInt(latest.winning_numbers.split(' ')[2]),
          parseInt(latest.winning_numbers.split(' ')[3]),
          parseInt(latest.winning_numbers.split(' ')[4]),
        ].sort((a, b) => a - b);
        const megaBall = parseInt(latest.mega_ball);
        const lastDrawDate = new Date(latest.draw_date);
        
        setCurrentMegaMillions({
          numbers,
          specialBall: megaBall,
          drawDate: lastDrawDate.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
          }),
          nextDrawDate: getNextDrawDate(lastDrawDate, [2, 5]),
          nextJackpot: megaJackpot,
        });
      }
    } catch (error) {
      console.error('Error fetching current winning numbers:', error);
    } finally {
      setLoadingCurrent(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadSavedNumbers();
  }, []);

  useFocusEffect(
    useCallback(() => {
      console.log('Lotto screen focused - fetching fresh data...');
      fetchCurrentWinningNumbers();
    }, [fetchCurrentWinningNumbers])
  );

  const getNextDrawDate = (lastDrawDate: Date, drawDays: number[]): string => {
    const today = new Date();
    const nextDraw = new Date(today);
    
    for (let i = 0; i < 7; i++) {
      nextDraw.setDate(today.getDate() + i);
      if (drawDays.includes(nextDraw.getDay()) && nextDraw > lastDrawDate) {
        return nextDraw.toLocaleDateString('en-US', { 
          weekday: 'short',
          month: 'short', 
          day: 'numeric'
        });
      }
    }
    return 'TBD';
  };

  const scrapePowerballJackpot = async (): Promise<string> => {
    try {
      const response = await fetch('https://www.lotteryusa.com/powerball/');
      const html = await response.text();
      
      const patterns = [
        /\$(\d+(?:,\d+)*(?:\.\d+)?)\s*(Million|Billion)/gi,
        /jackpot[^<]*?\$(\d+(?:,\d+)*(?:\.\d+)?)\s*(Million|Billion)/gi,
        /estimated[^<]*?\$(\d+(?:,\d+)*(?:\.\d+)?)\s*(Million|Billion)/gi,
      ];
      
      for (const pattern of patterns) {
        const matches = Array.from(html.matchAll(pattern));
        for (const match of matches) {
          const amount = match[1];
          const unit = match[2] || 'Million';
          const numericValue = parseFloat(amount.replace(/,/g, ''));
          
          if (numericValue >= 20 && numericValue <= 5000) {
            const normalizedUnit = unit.toLowerCase().startsWith('b') ? 'Billion' : 'Million';
            return `${amount} ${normalizedUnit}`;
          }
        }
      }
      
      const fallbackResponse = await fetch('https://www.lottonumbers.com/powerball');
      const fallbackHtml = await fallbackResponse.text();
      
      const fallbackPatterns = [
        /\$(\d+(?:,\d+)*(?:\.\d+)?)\s*(Million|Billion)/gi,
        /jackpot[\s\S]*?\$(\d+(?:,\d+)*(?:\.\d+)?)\s*(Million|Billion)/gi,
      ];
      
      for (const pattern of fallbackPatterns) {
        const matches = Array.from(fallbackHtml.matchAll(pattern));
        for (const match of matches) {
          const amount = match[1];
          const unit = match[2] || 'Million';
          const numericValue = parseFloat(amount.replace(/,/g, ''));
          
          if (numericValue >= 20 && numericValue <= 5000) {
            const normalizedUnit = unit.toLowerCase().startsWith('b') ? 'Billion' : 'Million';
            return `${amount} ${normalizedUnit}`;
          }
        }
      }
      
      return 'Check powerball.com';
    } catch (error) {
      console.error('Error scraping Powerball jackpot:', error);
      return 'Check powerball.com';
    }
  };

  const scrapeMegaMillionsJackpot = async (): Promise<string> => {
    try {
      const response = await fetch('https://www.lotteryusa.com/mega-millions/');
      const html = await response.text();
      
      console.log('Mega Millions HTML length:', html.length);
      
      const patterns = [
        /\$(\d+(?:,\d+)*(?:\.\d+)?)\s*(Million|Billion)/gi,
        /jackpot[^<]*?\$(\d+(?:,\d+)*(?:\.\d+)?)\s*(Million|Billion)/gi,
        /estimated[^<]*?\$(\d+(?:,\d+)*(?:\.\d+)?)\s*(Million|Billion)/gi,
        /next[^<]*?\$(\d+(?:,\d+)*(?:\.\d+)?)\s*(Million|Billion)/gi,
      ];
      
      for (const pattern of patterns) {
        const matches = Array.from(html.matchAll(pattern));
        console.log(`MM Pattern found ${matches.length} matches`);
        
        for (const match of matches) {
          const amount = match[1];
          const unit = match[2] || 'Million';
          const numericValue = parseFloat(amount.replace(/,/g, ''));
          
          console.log(`MM Found: ${amount} ${unit} (${numericValue})`);
          
          if (numericValue >= 20 && numericValue <= 5000) {
            const normalizedUnit = unit.toLowerCase().startsWith('b') ? 'Billion' : 'Million';
            return `${amount} ${normalizedUnit}`;
          }
        }
      }
      
      console.log('No valid Mega Millions jackpot found, trying fallback...');
      
      const fallbackResponse = await fetch('https://www.lottonumbers.com/mega-millions');
      const fallbackHtml = await fallbackResponse.text();
      
      const fallbackPatterns = [
        /\$(\d+(?:,\d+)*(?:\.\d+)?)\s*(Million|Billion)/gi,
        /jackpot[\s\S]*?\$(\d+(?:,\d+)*(?:\.\d+)?)\s*(Million|Billion)/gi,
      ];
      
      for (const pattern of fallbackPatterns) {
        const matches = Array.from(fallbackHtml.matchAll(pattern));
        for (const match of matches) {
          const amount = match[1];
          const unit = match[2] || 'Million';
          const numericValue = parseFloat(amount.replace(/,/g, ''));
          
          if (numericValue >= 20 && numericValue <= 5000) {
            const normalizedUnit = unit.toLowerCase().startsWith('b') ? 'Billion' : 'Million';
            return `${amount} ${normalizedUnit}`;
          }
        }
      }
      
      return 'Check megamillions.com';
    } catch (error) {
      console.error('Error scraping Mega Millions jackpot:', error);
      return 'Check megamillions.com';
    }
  };



  const onRefresh = async () => {
    await fetchCurrentWinningNumbers(true);
  };

  const loadSavedNumbers = async () => {
    try {
      const powerballJson = await AsyncStorage.getItem(SAVED_POWERBALL_KEY);
      const megaMillionsJson = await AsyncStorage.getItem(SAVED_MEGA_MILLIONS_KEY);

      if (powerballJson) {
        try {
          setSavedPowerball(JSON.parse(powerballJson));
        } catch (parseError) {
          console.error('Error parsing saved powerball, clearing corrupted data:', parseError);
          await AsyncStorage.removeItem(SAVED_POWERBALL_KEY);
        }
      }

      if (megaMillionsJson) {
        try {
          setSavedMegaMillions(JSON.parse(megaMillionsJson));
        } catch (parseError) {
          console.error('Error parsing saved mega millions, clearing corrupted data:', parseError);
          await AsyncStorage.removeItem(SAVED_MEGA_MILLIONS_KEY);
        }
      }
    } catch (error) {
      console.error('Error loading saved lotto numbers:', error);
    }
  };

  const generatePowerball = () => {
    const numbers: number[] = [];
    while (numbers.length < 5) {
      const num = Math.floor(Math.random() * 69) + 1;
      if (!numbers.includes(num)) {
        numbers.push(num);
      }
    }
    numbers.sort((a, b) => a - b);
    const powerball = Math.floor(Math.random() * 26) + 1;
    
    setPowerballNumbers(numbers);
    setPowerballPowerball(powerball);
    setPowerballMethod('R');
  };

  const generatePowerballPopular = () => {
    const popularMainNumbers = [32, 41, 16, 28, 22, 23, 39, 42, 36, 10, 15, 31, 13, 69, 64];
    const popularPowerballs = [18, 24, 4, 11, 10, 13, 6, 20, 9, 2];
    
    const selectedNumbers: number[] = [];
    const shuffled = [...popularMainNumbers].sort(() => Math.random() - 0.5);
    for (let i = 0; i < 5; i++) {
      selectedNumbers.push(shuffled[i]);
    }
    selectedNumbers.sort((a, b) => a - b);
    
    const powerball = popularPowerballs[Math.floor(Math.random() * popularPowerballs.length)];
    
    setPowerballNumbers(selectedNumbers);
    setPowerballPowerball(powerball);
    setPowerballMethod('6');
  };

  const generatePowerballSmart = () => {
    const popularMainNumbers = [32, 41, 16, 28, 22, 23, 39, 42, 36, 10, 15, 31, 13, 69, 64];
    const popularPowerballs = [18, 24, 4, 11, 10, 13, 6, 20, 9, 2];
    
    const selectedNumbers: number[] = [];
    const topPicks = popularMainNumbers.slice(0, 10);
    const randomPicks: number[] = [];
    
    while (randomPicks.length < 69 - popularMainNumbers.length) {
      const num = Math.floor(Math.random() * 69) + 1;
      if (!popularMainNumbers.includes(num) && !randomPicks.includes(num)) {
        randomPicks.push(num);
      }
    }
    
    const combined = [...topPicks, ...randomPicks];
    const shuffled = combined.sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < 5; i++) {
      selectedNumbers.push(shuffled[i]);
    }
    selectedNumbers.sort((a, b) => a - b);
    
    const powerball = popularPowerballs[Math.floor(Math.random() * popularPowerballs.length)];
    
    setPowerballNumbers(selectedNumbers);
    setPowerballPowerball(powerball);
    setPowerballMethod('SP');
  };

  const generateMegaMillions = () => {
    const numbers: number[] = [];
    while (numbers.length < 5) {
      const num = Math.floor(Math.random() * 70) + 1;
      if (!numbers.includes(num)) {
        numbers.push(num);
      }
    }
    numbers.sort((a, b) => a - b);
    const megaBall = Math.floor(Math.random() * 25) + 1;
    
    setMegaMillionsNumbers(numbers);
    setMegaMillionsMegaBall(megaBall);
    setMegaMillionsMethod('R');
  };

  const generateMegaMillionsPopular = () => {
    const popularMainNumbers = [17, 31, 4, 20, 10, 14, 46, 38, 3, 43, 11, 7, 64, 51, 53];
    const popularMegaBalls = [22, 11, 18, 9, 25, 4, 24, 13, 3, 10];
    
    const selectedNumbers: number[] = [];
    const shuffled = [...popularMainNumbers].sort(() => Math.random() - 0.5);
    for (let i = 0; i < 5; i++) {
      selectedNumbers.push(shuffled[i]);
    }
    selectedNumbers.sort((a, b) => a - b);
    
    const megaBall = popularMegaBalls[Math.floor(Math.random() * popularMegaBalls.length)];
    
    setMegaMillionsNumbers(selectedNumbers);
    setMegaMillionsMegaBall(megaBall);
    setMegaMillionsMethod('6');
  };

  const generateMegaMillionsSmart = () => {
    const popularMainNumbers = [17, 31, 4, 20, 10, 14, 46, 38, 3, 43, 11, 7, 64, 51, 53];
    const popularMegaBalls = [22, 11, 18, 9, 25, 4, 24, 13, 3, 10];
    
    const selectedNumbers: number[] = [];
    const topPicks = popularMainNumbers.slice(0, 10);
    const randomPicks: number[] = [];
    
    while (randomPicks.length < 70 - popularMainNumbers.length) {
      const num = Math.floor(Math.random() * 70) + 1;
      if (!popularMainNumbers.includes(num) && !randomPicks.includes(num)) {
        randomPicks.push(num);
      }
    }
    
    const combined = [...topPicks, ...randomPicks];
    const shuffled = combined.sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < 5; i++) {
      selectedNumbers.push(shuffled[i]);
    }
    selectedNumbers.sort((a, b) => a - b);
    
    const megaBall = popularMegaBalls[Math.floor(Math.random() * popularMegaBalls.length)];
    
    setMegaMillionsNumbers(selectedNumbers);
    setMegaMillionsMegaBall(megaBall);
    setMegaMillionsMethod('SP');
  };

  const savePowerballNumbers = async () => {
    if (powerballNumbers.length === 5 && powerballPowerball !== null) {
      const newSaved: SavedNumbers = {
        id: Date.now().toString(),
        numbers: powerballNumbers,
        specialBall: powerballPowerball,
        timestamp: Date.now(),
        method: powerballMethod,
      };
      const updated = [newSaved, ...savedPowerball];
      setSavedPowerball(updated);
      try {
        await AsyncStorage.setItem(SAVED_POWERBALL_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Error saving powerball numbers:', error);
      }
    }
  };

  const saveMegaMillionsNumbers = async () => {
    if (megaMillionsNumbers.length === 5 && megaMillionsMegaBall !== null) {
      const newSaved: SavedNumbers = {
        id: Date.now().toString(),
        numbers: megaMillionsNumbers,
        specialBall: megaMillionsMegaBall,
        timestamp: Date.now(),
        method: megaMillionsMethod,
      };
      const updated = [newSaved, ...savedMegaMillions];
      setSavedMegaMillions(updated);
      try {
        await AsyncStorage.setItem(SAVED_MEGA_MILLIONS_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Error saving mega millions numbers:', error);
      }
    }
  };

  const deletePowerballNumbers = async (id: string) => {
    const updated = savedPowerball.filter(item => item.id !== id);
    setSavedPowerball(updated);
    try {
      await AsyncStorage.setItem(SAVED_POWERBALL_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error deleting powerball numbers:', error);
    }
  };

  const deleteMegaMillionsNumbers = async (id: string) => {
    const updated = savedMegaMillions.filter(item => item.id !== id);
    setSavedMegaMillions(updated);
    try {
      await AsyncStorage.setItem(SAVED_MEGA_MILLIONS_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error deleting mega millions numbers:', error);
    }
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
            <Text style={styles.headerTitle}>LOTTO BETS</Text>
          </View>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.scrollContent}
          contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#FFFFFF"
              colors={['#9D4EDD', '#7B2CBF', '#5A189A']}
            />
          }
        >
          <View style={styles.lottoCard}>
            <View style={styles.lottoHeader}>
              <Text style={styles.lottoTitle}>Powerball</Text>
              <Text style={styles.lottoSubtitle}>5 numbers (1-69) + Powerball (1-26)</Text>
            </View>

            {loadingCurrent ? (
              <View style={styles.currentWinningSection}>
                <ActivityIndicator size="small" color="#9D4EDD" />
              </View>
            ) : currentPowerball ? (
              <View style={styles.currentWinningSection}>
                <View style={styles.currentWinningHeader}>
                  <Trophy size={16} color="#F59E0B" />
                  <Text style={styles.currentWinningTitle}>Latest Draw - {currentPowerball.drawDate}</Text>
                </View>
                <View style={styles.currentNumbersRow}>
                  {currentPowerball.numbers.map((num, index) => (
                    <View key={index} style={styles.currentNumberBall}>
                      <Text style={styles.currentNumberText}>{num}</Text>
                    </View>
                  ))}
                  <View style={[styles.currentNumberBall, styles.currentPowerballBall]}>
                    <Text style={styles.currentNumberText}>{currentPowerball.specialBall}</Text>
                  </View>
                </View>
                <View style={styles.nextDrawInfo}>
                  <Text style={styles.nextDrawText}>Next Draw: {currentPowerball.nextDrawDate}</Text>
                  <Text style={styles.jackpotText}>{currentPowerball.nextJackpot}</Text>
                </View>
              </View>
            ) : null}

            {powerballNumbers.length > 0 && (
              <View style={styles.numbersContainer}>
                <View style={styles.allNumbersRow}>
                  {powerballNumbers.map((num, index) => (
                    <View key={index} style={styles.numberBall}>
                      <Text style={styles.numberText}>{num}</Text>
                    </View>
                  ))}
                  {powerballPowerball !== null && (
                    <View style={[styles.numberBall, styles.powerballBall]}>
                      <Text style={styles.numberText}>{powerballPowerball}</Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            <View style={styles.buttonsRow}>
              <Pressable
                style={({ pressed }) => [
                  styles.generateButton,
                  styles.thirdButton,
                  pressed && styles.generateButtonPressed,
                ]}
                onPress={generatePowerball}
                testID="generate-powerball"
              >
                <Sparkles size={16} color="#FFFFFF" />
                <Text style={styles.generateButtonText}>Random</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.generateButton,
                  styles.thirdButton,
                  styles.popularButton,
                  pressed && styles.generateButtonPressed,
                ]}
                onPress={generatePowerballPopular}
                testID="generate-powerball-popular"
              >
                <TrendingUp size={16} color="#FFFFFF" />
                <Text style={styles.generateButtonText}>Last 6 Mos</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.generateButton,
                  styles.thirdButton,
                  styles.smartButton,
                  pressed && styles.generateButtonPressed,
                ]}
                onPress={generatePowerballSmart}
                testID="generate-powerball-smart"
              >
                <Brain size={16} color="#FFFFFF" />
                <Text style={styles.generateButtonText}>Smart Pick</Text>
              </Pressable>
            </View>

            {powerballNumbers.length > 0 && powerballPowerball !== null && (
              <Pressable
                style={({ pressed }) => [
                  styles.saveButton,
                  pressed && styles.saveButtonPressed,
                ]}
                onPress={savePowerballNumbers}
                testID="save-powerball"
              >
                <Save size={18} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>Save Numbers</Text>
              </Pressable>
            )}

            {savedPowerball.length > 0 && (
              <View style={styles.savedSection}>
                <Text style={styles.savedTitle}>Saved Numbers</Text>
                {savedPowerball.map((saved) => (
                  <View key={saved.id} style={styles.savedCard}>
                    <View style={styles.methodBadge}>
                      <Text style={styles.methodText}>{saved.method || 'R'}</Text>
                    </View>
                    <View style={styles.savedNumbersRow}>
                      {saved.numbers.map((num, index) => (
                        <View key={index} style={styles.savedNumberBall}>
                          <Text style={styles.savedNumberText}>{num}</Text>
                        </View>
                      ))}
                      <View style={[styles.savedNumberBall, styles.savedPowerballBall]}>
                        <Text style={styles.savedNumberText}>{saved.specialBall}</Text>
                      </View>
                    </View>
                    <Pressable
                      style={({ pressed }) => [
                        styles.deleteButton,
                        pressed && styles.deleteButtonPressed,
                      ]}
                      onPress={() => deletePowerballNumbers(saved.id)}
                      testID={`delete-powerball-${saved.id}`}
                    >
                      <Trash2 size={16} color="#EF4444" />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={styles.lottoCard}>
            <View style={styles.lottoHeader}>
              <Text style={styles.lottoTitle}>Mega Millions</Text>
              <Text style={styles.lottoSubtitle}>5 numbers (1-70) + Mega Ball (1-25)</Text>
            </View>

            {loadingCurrent ? (
              <View style={styles.currentWinningSection}>
                <ActivityIndicator size="small" color="#9D4EDD" />
              </View>
            ) : currentMegaMillions ? (
              <View style={styles.currentWinningSection}>
                <View style={styles.currentWinningHeader}>
                  <Trophy size={16} color="#F59E0B" />
                  <Text style={styles.currentWinningTitle}>Latest Draw - {currentMegaMillions.drawDate}</Text>
                </View>
                <View style={styles.currentNumbersRow}>
                  {currentMegaMillions.numbers.map((num, index) => (
                    <View key={index} style={styles.currentNumberBall}>
                      <Text style={styles.currentNumberText}>{num}</Text>
                    </View>
                  ))}
                  <View style={[styles.currentNumberBall, styles.currentMegaBall]}>
                    <Text style={styles.currentNumberText}>{currentMegaMillions.specialBall}</Text>
                  </View>
                </View>
                <View style={styles.nextDrawInfo}>
                  <Text style={styles.nextDrawText}>Next Draw: {currentMegaMillions.nextDrawDate}</Text>
                  <Text style={styles.jackpotText}>{currentMegaMillions.nextJackpot}</Text>
                </View>
              </View>
            ) : null}

            {megaMillionsNumbers.length > 0 && (
              <View style={styles.numbersContainer}>
                <View style={styles.allNumbersRow}>
                  {megaMillionsNumbers.map((num, index) => (
                    <View key={index} style={styles.numberBall}>
                      <Text style={styles.numberText}>{num}</Text>
                    </View>
                  ))}
                  {megaMillionsMegaBall !== null && (
                    <View style={[styles.numberBall, styles.megaBall]}>
                      <Text style={styles.numberText}>{megaMillionsMegaBall}</Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            <View style={styles.buttonsRow}>
              <Pressable
                style={({ pressed }) => [
                  styles.generateButton,
                  styles.thirdButton,
                  pressed && styles.generateButtonPressed,
                ]}
                onPress={generateMegaMillions}
                testID="generate-mega-millions"
              >
                <Sparkles size={16} color="#FFFFFF" />
                <Text style={styles.generateButtonText}>Random</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.generateButton,
                  styles.thirdButton,
                  styles.popularButton,
                  pressed && styles.generateButtonPressed,
                ]}
                onPress={generateMegaMillionsPopular}
                testID="generate-mega-millions-popular"
              >
                <TrendingUp size={16} color="#FFFFFF" />
                <Text style={styles.generateButtonText}>Last 6 Mos</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.generateButton,
                  styles.thirdButton,
                  styles.smartButton,
                  pressed && styles.generateButtonPressed,
                ]}
                onPress={generateMegaMillionsSmart}
                testID="generate-mega-millions-smart"
              >
                <Brain size={16} color="#FFFFFF" />
                <Text style={styles.generateButtonText}>Smart Pick</Text>
              </Pressable>
            </View>

            {megaMillionsNumbers.length > 0 && megaMillionsMegaBall !== null && (
              <Pressable
                style={({ pressed }) => [
                  styles.saveButton,
                  pressed && styles.saveButtonPressed,
                ]}
                onPress={saveMegaMillionsNumbers}
                testID="save-mega-millions"
              >
                <Save size={18} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>Save Numbers</Text>
              </Pressable>
            )}

            {savedMegaMillions.length > 0 && (
              <View style={styles.savedSection}>
                <Text style={styles.savedTitle}>Saved Numbers</Text>
                {savedMegaMillions.map((saved) => (
                  <View key={saved.id} style={styles.savedCard}>
                    <View style={styles.methodBadge}>
                      <Text style={styles.methodText}>{saved.method || 'R'}</Text>
                    </View>
                    <View style={styles.savedNumbersRow}>
                      {saved.numbers.map((num, index) => (
                        <View key={index} style={styles.savedNumberBall}>
                          <Text style={styles.savedNumberText}>{num}</Text>
                        </View>
                      ))}
                      <View style={[styles.savedNumberBall, styles.savedMegaBall]}>
                        <Text style={styles.savedNumberText}>{saved.specialBall}</Text>
                      </View>
                    </View>
                    <Pressable
                      style={({ pressed }) => [
                        styles.deleteButton,
                        pressed && styles.deleteButtonPressed,
                      ]}
                      onPress={() => deleteMegaMillionsNumbers(saved.id)}
                      testID={`delete-mega-millions-${saved.id}`}
                    >
                      <Trash2 size={16} color="#EF4444" />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </View>
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
  placeholder: {
    width: 40,
  },
  scrollContent: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    gap: 20,
  },
  lottoCard: {
    backgroundColor: 'rgba(220, 190, 255, 0.95)',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    gap: 20,
  },
  lottoHeader: {
    gap: 6,
  },
  lottoTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#240046',
  },
  lottoSubtitle: {
    fontSize: 13,
    color: 'rgba(36, 0, 70, 0.7)',
    fontWeight: '500' as const,
  },
  numbersContainer: {
    gap: 16,
  },
  allNumbersRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  mainNumbers: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  specialBallContainer: {
    alignItems: 'center',
  },
  numberBall: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#9D4EDD',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  powerballBall: {
    borderColor: '#EF4444',
    backgroundColor: '#FEE2E2',
  },
  megaBall: {
    borderColor: '#F59E0B',
    backgroundColor: '#FEF3C7',
  },
  numberText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#240046',
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  generateButton: {
    backgroundColor: '#9D4EDD',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  halfButton: {
    flex: 1,
    paddingHorizontal: 12,
  },
  thirdButton: {
    flex: 1,
    paddingHorizontal: 6,
  },
  popularButton: {
    backgroundColor: '#7B2CBF',
  },
  smartButton: {
    backgroundColor: '#5A189A',
  },
  generateButtonPressed: {
    opacity: 0.7,
  },
  generateButtonText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  saveButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  saveButtonPressed: {
    opacity: 0.7,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  savedSection: {
    gap: 10,
    marginTop: 4,
  },
  savedTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#240046',
    marginBottom: 4,
  },
  savedCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(157, 78, 221, 0.2)',
  },
  savedNumbersRow: {
    flexDirection: 'row',
    gap: 8,
    flex: 1,
  },
  savedNumberBall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#9D4EDD',
  },
  savedPowerballBall: {
    borderColor: '#EF4444',
    backgroundColor: '#FEE2E2',
  },
  savedMegaBall: {
    borderColor: '#F59E0B',
    backgroundColor: '#FEF3C7',
  },
  savedNumberText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#240046',
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  deleteButtonPressed: {
    opacity: 0.6,
  },
  methodBadge: {
    backgroundColor: '#9D4EDD',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
  },
  methodText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  currentWinningSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 12,
    padding: 14,
    gap: 10,
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  currentWinningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  currentWinningTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#240046',
  },
  currentNumbersRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  currentNumberBall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#9D4EDD',
  },
  currentPowerballBall: {
    borderColor: '#EF4444',
    backgroundColor: '#FEE2E2',
  },
  currentMegaBall: {
    borderColor: '#F59E0B',
    backgroundColor: '#FEF3C7',
  },
  currentNumberText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#240046',
  },
  nextDrawInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(157, 78, 221, 0.2)',
  },
  nextDrawText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#240046',
  },
  jackpotText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#10B981',
  },
});
