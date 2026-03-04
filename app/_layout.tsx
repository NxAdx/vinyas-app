import '../global.css';
import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { colors } from '@/src/theme/tokens';
import { useAuthStore } from '@/src/stores/useAuthStore';
import { OtaUpdater } from '@/src/components/OtaUpdater';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();

  const initialize = useAuthStore((state) => state.initialize);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasPin = useAuthStore((state) => state.hasPin);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  useEffect(() => {
    if (hasPin === null) return; // Still loading

    // We are on the root level, redirect to login if not authenticated
    const inTabsGroup = segments[0] === '(tabs)' || segments[0] === 'settings' || segments[0] === 'category';

    if (!isAuthenticated && inTabsGroup) {
      router.replace('/login');
    } else if (isAuthenticated && segments[0] === 'login') {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, hasPin, segments, router]);

  if (hasPin === null) return null; // Show splash natively

  return (
    <>
      <OtaUpdater />
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: colors.void,
          },
          animation: 'fade', // Smoother transition for login
        }}
      >
        <Stack.Screen name="login" options={{ gestureEnabled: false }} />
        <Stack.Screen name="(tabs)" options={{ gestureEnabled: false }} />
        <Stack.Screen
          name="category/[id]"
          options={{
            headerShown: true,
            title: 'Category',
            headerStyle: { backgroundColor: colors.void01 },
            headerTintColor: colors.textPrimary,
          }}
        />
        <Stack.Screen
          name="settings/index"
          options={{
            headerShown: true,
            title: 'Settings',
            headerStyle: { backgroundColor: colors.void01 },
            headerTintColor: colors.textPrimary,
          }}
        />
      </Stack>
    </>
  );
}
