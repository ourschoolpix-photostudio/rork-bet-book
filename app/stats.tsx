import { useAuth } from '@/contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
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
          <Text style={styles.headerTitle}>MY STATS</Text>
          <Text style={styles.netBalanceHeader}>
            {netBalance >= 0 ? '+' : ''}${netBalance.toFixed(2)}
          </Text>
        </View>

        <View style={styles.emptyContent} />
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
  emptyContent: {
    flex: 1,
  },
});
