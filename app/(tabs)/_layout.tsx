import { Tabs, usePathname, useRouter } from 'expo-router';
import { Home, Clover, Trophy, Wallet, HandCoins, FileText, DollarSign, Target, Receipt } from 'lucide-react-native';
import { useState, useEffect } from 'react';

export default function TabsLayout() {
  const pathname = usePathname();
  const router = useRouter();
  const [showBorrows, setShowBorrows] = useState<boolean>(false);

  useEffect(() => {
    if (pathname === '/borrows') {
      setShowBorrows(false);
    } else if (pathname === '/loans') {
      setShowBorrows(true);
    }
  }, [pathname]);

  const handleLoansPress = () => {
    if (showBorrows) {
      router.push('/borrows');
    } else {
      router.push('/loans');
    }
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.6)',
        tabBarStyle: {
          backgroundColor: '#3D1F66',
          borderTopWidth: 1,
          borderTopColor: 'rgba(157, 78, 221, 0.3)',
        },
        tabBarLabelStyle: {
          fontSize: 8,
          fontWeight: '600' as const,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
          tabBarButton: pathname === '/dashboard' ? () => null : undefined,
        }}
      />
      <Tabs.Screen
        name="bets"
        options={{
          title: 'My Bets',
          tabBarIcon: ({ color, size }) => <Target size={size} color={color} />,
          tabBarButton: pathname === '/bets' ? () => null : undefined,
        }}
      />
      <Tabs.Screen
        name="casino"
        options={{
          title: 'Casino',
          tabBarIcon: ({ color, size }) => <Clover size={size} color={color} />,
          tabBarButton: pathname === '/casino' ? () => null : undefined,
        }}
      />
      <Tabs.Screen
        name="lotto"
        options={{
          title: 'Lotto',
          tabBarIcon: ({ color, size }) => <DollarSign size={size} color={color} />,
          tabBarButton: pathname === '/lotto' ? () => null : undefined,
        }}
      />
      <Tabs.Screen
        name="sports"
        options={{
          title: 'Sports',
          tabBarIcon: ({ color, size }) => <Trophy size={size} color={color} />,
          tabBarButton: pathname === '/sports' ? () => null : undefined,
        }}
      />
      <Tabs.Screen
        name="loans"
        options={{
          title: showBorrows ? 'Borrows' : 'Loans',
          tabBarIcon: ({ color, size }) => 
            showBorrows ? <Wallet size={size} color={color} /> : <HandCoins size={size} color={color} />,
          tabBarButton: (pathname === '/loans' || pathname === '/borrows') ? () => null : undefined,
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            handleLoansPress();
          },
        }}
      />
      <Tabs.Screen
        name="borrows"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="summary"
        options={{
          title: 'Summary',
          tabBarIcon: ({ color, size }) => <FileText size={size} color={color} />,
          tabBarButton: pathname === '/summary' ? () => null : undefined,
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          title: 'My Expenses',
          tabBarIcon: ({ color, size }) => <Receipt size={size} color={color} />,
          tabBarButton: pathname === '/expenses' ? () => null : undefined,
        }}
      />
    </Tabs>
  );
}
