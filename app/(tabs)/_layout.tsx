import { Tabs, usePathname } from 'expo-router';
import { Home, Clover, Trophy, Wallet, HandCoins, FileText, DollarSign, Target, Receipt } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CustomTabBar = ({ state, descriptors, navigation }: any) => {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const [showBorrows, setShowBorrows] = useState<boolean>(false);

  useEffect(() => {
    if (pathname === '/borrows') {
      setShowBorrows(false);
    } else if (pathname === '/loans') {
      setShowBorrows(true);
    }
  }, [pathname]);

  const tabs = [
    { name: 'dashboard', title: 'Dashboard', icon: Home, route: '/dashboard' },
    { name: 'bets', title: 'My Bets', icon: Target, route: '/bets' },
    { name: 'casino', title: 'Casino', icon: Clover, route: '/casino' },
    { name: 'lotto', title: 'Lotto', icon: DollarSign, route: '/lotto' },
    { name: 'sports', title: 'Sports', icon: Trophy, route: '/sports' },
    { 
      name: 'loans', 
      title: showBorrows ? 'Borrows' : 'Loans', 
      icon: showBorrows ? Wallet : HandCoins, 
      route: pathname === '/borrows' ? '/borrows' : '/loans',
      isLoansTab: true
    },
    { name: 'summary', title: 'Summary', icon: FileText, route: '/summary' },
    { name: 'expenses', title: 'My Expenses', icon: Receipt, route: '/expenses' },
  ];

  const visibleTabs = tabs.filter(tab => tab.route !== pathname);

  return (
    <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 4) }]}>
      {visibleTabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = pathname === tab.route;
        const color = isActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)';

        return (
          <TouchableOpacity
            key={tab.name}
            style={styles.tabButton}
            onPress={() => {
              if (tab.isLoansTab) {
                if (pathname === '/borrows') {
                  navigation.navigate('loans');
                } else if (pathname === '/loans') {
                  navigation.navigate('borrows');
                } else if (showBorrows) {
                  navigation.navigate('borrows');
                } else {
                  navigation.navigate('loans');
                }
              } else {
                navigation.navigate(tab.name);
              }
            }}
          >
            <Icon size={22} color={color} />
            <Text style={[styles.tabLabel, { color }]}>{tab.title}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default function TabsLayout() {

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="dashboard" />
      <Tabs.Screen name="bets" />
      <Tabs.Screen name="casino" />
      <Tabs.Screen name="lotto" />
      <Tabs.Screen name="sports" />
      <Tabs.Screen name="loans" />
      <Tabs.Screen name="borrows" options={{ href: null }} />
      <Tabs.Screen name="summary" />
      <Tabs.Screen name="expenses" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#3D1F66',
    borderTopWidth: 1,
    borderTopColor: 'rgba(157, 78, 221, 0.3)',
    paddingBottom: 4,
    paddingTop: 4,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  tabLabel: {
    fontSize: 8,
    fontWeight: '600',
    marginTop: 2,
  },
});
