import { useAuth } from '@/contexts/AuthContext';
import { WALLPAPER_URL } from '@/constants/wallpaper';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function StatsScreen() {
  const { completedSessions } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const totalStats = completedSessions.reduce(
    (acc, session) => {
      const winLoss = session.winLoss || 0;
      if (winLoss > 0) {
        acc.totalWinnings += winLoss;
      } else {
        acc.totalLosses += Math.abs(winLoss);
      }
      return acc;
    },
    { totalWinnings: 0, totalLosses: 0 }
  );

  const netBalance = totalStats.totalWinnings - totalStats.totalLosses;

  const venueStats = completedSessions.reduce((acc, session) => {
    const venue = session.casinoName;
    if (!acc[venue]) {
      acc[venue] = {
        totalSessions: 0,
        wins: 0,
        losses: 0,
        pushes: 0,
      };
    }
    
    acc[venue].totalSessions++;
    
    const winLoss = session.winLoss || 0;
    if (winLoss > 0) {
      acc[venue].wins++;
    } else if (winLoss < 0) {
      acc[venue].losses++;
    } else {
      acc[venue].pushes++;
    }
    
    return acc;
  }, {} as Record<string, { totalSessions: number; wins: number; losses: number; pushes: number }>);

  const venueStatsArray = Object.entries(venueStats)
    .map(([venue, stats]) => ({
      venue,
      ...stats,
      winPercentage: stats.totalSessions > 0 ? (stats.wins / stats.totalSessions) * 100 : 0,
      lossPercentage: stats.totalSessions > 0 ? (stats.losses / stats.totalSessions) * 100 : 0,
    }))
    .sort((a, b) => b.totalSessions - a.totalSessions);

  return (
    <View style={styles.container}>
      <ImageBackground
        source={{ uri: WALLPAPER_URL }}
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
          <Text style={styles.headerTitle}>MY STATS</Text>
          <Text style={styles.netBalanceHeader}>
            {netBalance >= 0 ? '+' : ''}${netBalance.toFixed(2)}
          </Text>
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {venueStatsArray.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No completed sessions yet</Text>
            </View>
          ) : (
            <View style={styles.venueList}>
              <Text style={styles.sectionTitle}>Win/Loss by Venue</Text>
              {venueStatsArray.map((venue) => (
                <View key={venue.venue} style={styles.venueCard}>
                  <Text style={styles.venueName}>{venue.venue}</Text>
                  <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>Total Sessions</Text>
                      <Text style={styles.statValue}>{venue.totalSessions}</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>Wins</Text>
                      <Text style={[styles.statValue, styles.winValue]}>{venue.wins}</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>Losses</Text>
                      <Text style={[styles.statValue, styles.lossValue]}>{venue.losses}</Text>
                    </View>
                  </View>
                  <View style={styles.percentageRow}>
                    <View style={styles.percentageItem}>
                      <Text style={styles.percentageLabel}>Win %</Text>
                      <Text style={[styles.percentageValue, styles.winPercentage]}>
                        {venue.winPercentage.toFixed(1)}%
                      </Text>
                    </View>
                    <View style={styles.percentageItem}>
                      <Text style={styles.percentageLabel}>Loss %</Text>
                      <Text style={[styles.percentageValue, styles.lossPercentage]}>
                        {venue.lossPercentage.toFixed(1)}%
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: 'rgba(157, 78, 221, 0.9)',
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
  netBalanceHeader: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#FFD700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyStateText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '500' as const,
  },
  venueList: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  venueCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  venueName: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 12,
    borderRadius: 12,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 6,
    fontWeight: '500' as const,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  winValue: {
    color: '#4ADE80',
  },
  lossValue: {
    color: '#F87171',
  },
  percentageRow: {
    flexDirection: 'row',
    gap: 12,
  },
  percentageItem: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  percentageLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 8,
    fontWeight: '600' as const,
  },
  percentageValue: {
    fontSize: 24,
    fontWeight: '700' as const,
  },
  winPercentage: {
    color: '#4ADE80',
  },
  lossPercentage: {
    color: '#F87171',
  },
});
