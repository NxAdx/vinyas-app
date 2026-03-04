import Constants from 'expo-constants';
import * as Updates from 'expo-updates';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { AppScreen } from '@/src/components/AppScreen';
import { GlassCard } from '@/src/components/GlassCard';
import { useAppStore } from '@/src/stores/useAppStore';
import { useFileStore } from '@/src/stores/useFileStore';
import { useVaultStore } from '@/src/stores/useVaultStore';
import { colors } from '@/src/theme/tokens';

export default function SettingsScreen() {
  const globalMode = useAppStore((state) => state.globalMode);
  const toggleGlobalMode = useAppStore((state) => state.toggleGlobalMode);

  const loading = useFileStore((state) => state.loading);
  const resetAllData = useFileStore((state) => state.resetAllData);
  const refreshData = useFileStore((state) => state.refreshData);
  const refreshExplorer = useFileStore((state) => state.refreshExplorer);
  const error = useFileStore((state) => state.error);

  const lockVault = useVaultStore((state) => state.lock);
  const hydrateVault = useVaultStore((state) => state.hydrate);

  const appVersion = Constants.expoConfig?.version ?? '0.1.0';

  const checkForUpdate = async () => {
    try {
      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) {
        Alert.alert(
          'Update Available',
          'A new Over-The-Air update is available. Download and restart?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Install',
              onPress: async () => {
                await Updates.fetchUpdateAsync();
                await Updates.reloadAsync();
              },
            },
          ]
        );
      } else {
        Alert.alert('Up to date', 'Vinyas is running the latest version.');
      }
    } catch (e: any) {
      Alert.alert('Update Error', e.message || 'Could not connect to update server.');
    }
  };

  return (
    <AppScreen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="gap-md pb-xxl px-2">
        <View className="gap-1 mt-4">
          <Text className="text-textPrimary text-2xl font-extrabold">Settings</Text>
          <Text className="text-textSecondary text-[13px] leading-[18px]">
            Control theme mode, data refresh, and environment details.
          </Text>
        </View>

        <GlassCard>
          <Text className="text-textPrimary text-[15px] font-bold mb-sm">Theme mode</Text>
          <Text className="text-textSecondary text-[13px] mb-sm">
            Current mode: {globalMode.toUpperCase()}
          </Text>
          <Pressable 
            onPress={toggleGlobalMode} 
            className="bg-textPrimary rounded-pill py-2.5 items-center active:bg-textSecondary"
          >
            <Text className="text-void font-bold text-[13px]">Force Toggle Theme</Text>
          </Pressable>
        </GlassCard>

        <GlassCard>
          <Text className="text-textPrimary text-[15px] font-bold mb-sm">OTA Updates</Text>
          <Text className="text-textSecondary text-[13px] mb-sm">
            Instantly download JavaScript bundle patches without waiting for an APK compiling cycle.
          </Text>
          <Pressable 
            onPress={checkForUpdate} 
            className="border border-rim bg-glass07 rounded-pill py-2.5 items-center active:bg-glass10"
          >
            <Text className="text-textPrimary font-bold text-[13px]">Check for Update</Text>
          </Pressable>
        </GlassCard>

        <GlassCard>
          <Text className="text-textPrimary text-[15px] font-bold mb-sm">Data actions</Text>
          <View className="flex-row gap-sm">
            <Pressable
              onPress={async () => {
                await refreshData();
                await refreshExplorer();
                await hydrateVault();
              }}
              className="flex-1 rounded-pill border border-rim bg-glass07 py-2.5 items-center active:bg-glass10"
            >
              <Text className="text-textPrimary text-xs font-bold">Refresh all</Text>
            </Pressable>
            
            <Pressable
              onPress={() => {
                Alert.alert(
                  'Reset data',
                  'This removes all categories and bookmarks from the local SQLite database. Are you sure?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Reset',
                      style: 'destructive',
                      onPress: async () => {
                        await resetAllData();
                        lockVault();
                        await hydrateVault();
                      },
                    },
                  ],
                );
              }}
              className="flex-1 rounded-pill border border-[rgba(255,71,87,0.4)] bg-[rgba(255,71,87,0.16)] py-2.5 items-center active:bg-[rgba(255,71,87,0.3)]"
            >
              <Text className="text-[#FF9EA6] text-xs font-bold">Reset database</Text>
            </Pressable>
          </View>
        </GlassCard>

        <GlassCard>
          <Text className="text-textPrimary text-[15px] font-bold mb-sm">App info</Text>
          <View className="flex-row justify-between py-2 border-b border-rim">
            <Text className="text-textSecondary text-xs">Version</Text>
            <Text className="text-textPrimary text-xs font-bold">{appVersion}</Text>
          </View>
          <View className="flex-row justify-between py-2 border-b border-rim">
            <Text className="text-textSecondary text-xs">Build</Text>
            <Text className="text-textPrimary text-xs font-bold">SQLite OTA Ready</Text>
          </View>
          <View className="flex-row justify-between py-2 border-b border-rim">
            <Text className="text-textSecondary text-xs">Security</Text>
            <Text className="text-textPrimary text-xs font-bold">Kosh session lock enabled</Text>
          </View>
        </GlassCard>

        {loading ? <Text className="text-textSecondary text-xs mt-1">Processing database action...</Text> : null}
        {error ? <Text className="text-danger text-xs mt-1">{error}</Text> : null}
      </ScrollView>
    </AppScreen>
  );
}
