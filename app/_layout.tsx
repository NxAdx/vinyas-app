import '../global.css';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { colors } from '@/src/theme/tokens';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: colors.void,
          },
        }}
      >
        <Stack.Screen name="(tabs)" />
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
