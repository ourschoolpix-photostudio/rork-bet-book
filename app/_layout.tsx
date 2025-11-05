import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { StyleSheet, LogBox } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider } from "@/contexts/AuthContext";
import { LoanProvider } from "@/contexts/LoanContext";
import { BorrowProvider } from "@/contexts/BorrowContext";
import { BetsProvider } from "@/contexts/BetsContext";
import { SportsBetsProvider } from "@/contexts/SportsBetsContext";
import { BackupProvider } from "@/contexts/BackupContext";

LogBox.ignoreLogs([
  'Deep imports from the \'react-native\' package are deprecated',
]);

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="dashboard" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="bets" options={{ headerShown: false }} />
      <Stack.Screen name="stats" options={{ headerShown: false }} />
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    const hideSplash = async () => {
      try {
        await SplashScreen.hideAsync();
      } catch (error) {
        console.error('Error hiding splash screen:', error);
      }
    };
    
    const timer = setTimeout(hideSplash, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LoanProvider>
          <BorrowProvider>
            <BetsProvider>
              <SportsBetsProvider>
                <BackupProvider>
                  <GestureHandlerRootView style={styles.container}>
                    <RootLayoutNav />
                  </GestureHandlerRootView>
                </BackupProvider>
              </SportsBetsProvider>
            </BetsProvider>
          </BorrowProvider>
        </LoanProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
