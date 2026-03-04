import '../global.css';
import { useEffect, useRef, useState } from 'react';
import { InteractionManager } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';

import { darkColors, lightColors } from '@/src/theme/tokens';
import { useAuthStore } from '@/src/stores/useAuthStore';
import { useAppStore } from '@/src/stores/useAppStore';
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

  const theme = useAppStore((state) => state.theme);
  const colors = theme === 'dark' ? darkColors : lightColors;

  const [isReady, setIsReady] = useState(false);

  // Fire auth initialization ASAP, but don't block the render tree
  useEffect(() => {
    let isMounted = true;
    const task = InteractionManager.runAfterInteractions(async () => {
      await initialize();
      if (isMounted) {
        setIsReady(true);
      }
    });
    return () => {
      isMounted = false;
      task.cancel();
    };
  }, [initialize]);

  // Auth-based navigation guard
  useEffect(() => {
    if (!isReady || hasPin === null) return;

    // Sequence is CRITICAL to prevent Android crash: 
    // hide splash -> wait a tick -> navigation
    const navigateSafely = async () => {
      try {
        await SplashScreen.hideAsync();
      } catch (e) {
        // Splash might already be hidden
      }

      // Small delay prevents navigation while React Native tree is locking during layout
      setTimeout(() => {
        const inProtected = segments[0] === '(tabs)' || segments[0] === 'settings' || segments[0] === 'category';

        if (!isAuthenticated && hasPin && inProtected) {
          router.replace('/login');
        } else if (isAuthenticated && segments[0] === 'login') {
          router.replace('/(tabs)');
        } else if (!hasPin && !hasRedirected.current) {
          hasRedirected.current = true;
          router.replace('/(tabs)');
        }
      }, 50);
    };

    void navigateSafely();

  }, [isReady, isAuthenticated, hasPin, segments, router]);

  return (
    <>
      <OtaUpdater />
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
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
