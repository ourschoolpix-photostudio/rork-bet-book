import { Tabs, usePathname, useRouter } from 'expo-router';
import { Home, Clover, Trophy, Wallet, HandCoins, FileText, DollarSign } from 'lucide-react-native';
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
          fontSize: 9,
          fontWeight: '600' as const,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="casino"
        options={{
          title: 'Casino',
          tabBarIcon: ({ color, size }) => <Clover size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="lotto"
        options={{
          title: 'Lotto',
          tabBarIcon: ({ color, size }) => <DollarSign size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="sports"
        options={{
          title: 'Sports',
          tabBarIcon: ({ color, size }) => <Trophy size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="loans"
        options={{
          title: showBorrows ? 'Borrows' : 'Loans',
          tabBarIcon: ({ color, size, focused }) => {
            const isActive = focused || pathname === '/loans';
            const iconColor = isActive ? '#FFFFFF' : color;
            return showBorrows ? <Wallet size={size} color={iconColor} /> : <HandCoins size={size} color={iconColor} />;
          },
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
        }}
      />
    </Tabs>
  );
}
