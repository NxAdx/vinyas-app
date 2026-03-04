import { MaterialIcons } from '@expo/vector-icons';
import { Tabs, useSegments } from 'expo-router';
import type { ComponentProps } from 'react';
import { useEffect } from 'react';

import { useAppStore } from '@/src/stores/useAppStore';
import { THEME_DARK, THEME_LIGHT } from '../../src/theme/tokens';

function TabIcon({
  color,
  size,
  name,
}: {
  color: string;
  size: number;
  name: ComponentProps<typeof MaterialIcons>['name'];
}) {
  return <MaterialIcons name={name} size={size} color={color} />;
}

export default function TabLayout() {
  const setActiveTab = useAppStore((state) => state.setActiveTab);
  const globalMode = useAppStore((state) => state.globalMode);
  const theme = useAppStore((state) => state.theme);
  const colors = theme === 'dark' ? THEME_DARK : THEME_LIGHT;
  const segments = useSegments();

  const activeTint = globalMode === 'kosh' ? colors.tealGlow : colors.warm500;

  useEffect(() => {
    const currentSegment = segments[segments.length - 1] ?? 'index';
    setActiveTab(String(currentSegment));
  }, [segments, setActiveTab]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.void01,
          borderTopColor: colors.rim,
          height: 64,
          paddingTop: 6,
          paddingBottom: 6,
          elevation: 0,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: activeTint,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <TabIcon color={color} size={size} name="dashboard" />,
        }}
      />
      <Tabs.Screen
        name="explorer"
        options={{
          title: 'Explorer',
          tabBarIcon: ({ color, size }) => <TabIcon color={color} size={size} name="folder-open" />,
        }}
      />
      <Tabs.Screen
        name="vault"
        options={{
          title: 'Kosh',
          tabBarIcon: ({ color, size }) => <TabIcon color={color} size={size} name="lock" />,
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ color, size }) => <TabIcon color={color} size={size} name="insights" />,
        }}
      />
    </Tabs>
  );
}
