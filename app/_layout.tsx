import '../global.css';
import { useEffect, useRef } from 'react';
import { InteractionManager } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';

import { colors } from '@/src/theme/tokens';
import { useAuthStore } from '@/src/stores/useAuthStore';
import { OtaUpdater } from '@/src/components/OtaUpdater';

// Keep the native splash visible until we've resolved auth state
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const hasRedirected = useRef(false);

  const initialize = useAuthStore((state) => state.initialize);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasPin = useAuthStore((state) => state.hasPin);

  // Fire auth initialization ASAP, but don't block the render tree
  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(async () => {
      await initialize();
    });
    return () => task.cancel();
  }, [initialize]);

  // Auth-based navigation guard
  useEffect(() => {
    if (hasPin === null) return; // Still initializing

    // Hide splash the instant we know the auth state
    void SplashScreen.hideAsync();

    const inProtected = segments[0] === '(tabs)' || segments[0] === 'settings' || segments[0] === 'category';

    if (!isAuthenticated && hasPin && inProtected) {
      router.replace('/login');
    } else if (isAuthenticated && segments[0] === 'login') {
      router.replace('/(tabs)');
    } else if (!hasPin && !hasRedirected.current) {
      // No PIN set — skip login entirely, go straight to app
      hasRedirected.current = true;
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, hasPin, segments, router]);

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
          animation: 'fade',
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
