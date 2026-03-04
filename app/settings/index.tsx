import { useState } from 'react';
import Constants from 'expo-constants';
import * as Updates from 'expo-updates';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { AppScreen } from '@/src/components/AppScreen';
import { GlassCard } from '@/src/components/GlassCard';
import { useAppStore } from '@/src/stores/useAppStore';
import { useAuthStore } from '@/src/stores/useAuthStore';
import { useFileStore } from '@/src/stores/useFileStore';
import { useVaultStore } from '@/src/stores/useVaultStore';
import { colors } from '@/src/theme/tokens';

const CHANGELOG = [
  {
    version: '1.0.0',
    date: '2026-03-04',
    changes: [
      'Premium Bento Dashboard with gradient category cards',
      'Local PIN authentication via Secure Store',
      'Background OTA update syncer',
      'Screenshot restriction scoped to Kosh Vault only',
      'SAF-based file explorer with folder tree',
      'Ghost Bookmarking with batch select',
      'Kosh Vault with secret gesture entry',
      'AMOLED Liquid Glassmorphism UI',
      'Optimized CI pipeline for fast builds',
    ],
  },
  {
    version: '0.1.0',
    date: '2026-03-01',
    changes: [
      'Initial prototype with tab navigation',
      'SQLite database integration',
      'Basic category management',
      'File explorer baseline',
    ],
  },
];

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

  const hasPin = useAuthStore((state) => state.hasPin);
  const setPin = useAuthStore((state) => state.setPin);
  const clearPin = useAuthStore((state) => state.clearPin);
  const logout = useAuthStore((state) => state.logout);

  const [showChangelog, setShowChangelog] = useState(false);

  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  const checkForUpdate = async () => {
    try {
      if (!Updates.isEmergencyLaunch && Constants.expoConfig?.updates?.url) {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          Alert.alert(
            'OTA Update Available',
            'A new patch is available. Installing this will refresh the app to the latest version.',
            [
              { text: 'Later', style: 'cancel' },
              {
                text: 'Update & Restart',
                onPress: async () => {
                  try {
                    await Updates.fetchUpdateAsync();
                    await Updates.reloadAsync();
                  } catch (e) {
                    Alert.alert('Update Failed', 'The download was interrupted. Please try again later.');
                  }
                },
              },
            ]
          );
        } else {
          Alert.alert('System Up to Date', 'Vinyas is running the latest production bundle.');
        }
      } else {
        Alert.alert('Developer Build', 'OTA Updates are disabled in development or unlinked builds.');
      }
    } catch (e: any) {
      console.error('OTA Error:', e);
      Alert.alert('Sync Error', 'Could not reach the update server. Please check your internet connection.');
    }
  };

  const handleSetPin = () => {
    // In a production app, we would use a numeric keypad modal.
    // For this prototype, we simulate setting a 4-digit PIN for demo.
    Alert.alert('Set Master PIN', 'Enter a 6-digit PIN to secure your Vinyas vault.', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Set PIN (123456)', 
        onPress: async () => {
          await setPin('123456');
          Alert.alert('PIN Set', 'Your Master PIN is now active. Use it to unlock the app.');
        } 
      },
    ]);
  };

  return (
    <AppScreen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="gap-md pb-xxl px-2 pt-2">
        <Text className="text-textSecondary text-[13px] leading-[18px]">
          Control theme mode, security, and environment details.
        </Text>

        {/* Theme */}
        <GlassCard>
          <Text className="text-textPrimary text-[15px] font-bold mb-xs">Theme mode</Text>
          <Text className="text-textSecondary text-[12px] mb-md font-medium">
            Toggle between Amoled Dark and Glass Light variants.
          </Text>
          <Pressable
            onPress={async () => {
              toggleGlobalMode();
              Alert.alert('Theme Override', 'The app will now reload to apply the new design system globally.', [
                {
                  text: 'Apply & Restart',
                  onPress: async () => {
                    await Updates.reloadAsync();
                  }
                }
              ]);
            }}
            className="bg-warm500 rounded-pill py-3 items-center active:bg-warm300"
          >
            <Text className="text-void font-extrabold text-[13px]">Apply Theme Switch</Text>
          </Pressable>
        </GlassCard>

        {/* Security / PIN */}
        <GlassCard>
          <Text className="text-textPrimary text-[15px] font-bold mb-sm">Security</Text>
          <View className="flex-row justify-between py-2 border-b border-rim">
            <Text className="text-textSecondary text-xs">Master PIN</Text>
            <Text className="text-textPrimary text-xs font-bold">{hasPin ? 'Enabled' : 'Not Set'}</Text>
          </View>
          <View className="flex-row gap-sm mt-sm">
            {hasPin ? (
              <>
                <Pressable
                  onPress={() => {
                    Alert.alert('Remove PIN', 'Anyone will be able to open Vinyas without authentication. Continue?', [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Remove', style: 'destructive', onPress: () => void clearPin() },
                    ]);
                  }}
                  className="flex-1 rounded-pill border border-[rgba(255,71,87,0.4)] bg-[rgba(255,71,87,0.1) ] py-2.5 items-center active:bg-[rgba(255,71,87,0.2)]"
                >
                  <Text className="text-[#FF9EA6] text-xs font-bold">Remove PIN</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    logout();
                    Alert.alert('Security Locked', 'Vinyas is now locked. Re-enter your PIN to continue.');
                  }}
                  className="flex-1 rounded-pill border border-rim bg-glass07 py-2.5 items-center active:bg-glass10"
                >
                  <Text className="text-textPrimary text-xs font-bold">Lock Now</Text>
                </Pressable>
              </>
            ) : (
              <Pressable
                onPress={handleSetPin}
                className="flex-1 bg-warm500 rounded-pill py-2.5 items-center active:bg-warm300"
              >
                <Text className="text-void text-xs font-bold">Set Master PIN</Text>
              </Pressable>
            )}
          </View>
        </GlassCard>

        {/* OTA Updates */}
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

        {/* Data Actions (Hidden for Production) */}

        {/* App Info */}
        <GlassCard>
          <Text className="text-textPrimary text-[15px] font-bold mb-sm">App info</Text>
          <View className="flex-row justify-between py-2 border-b border-rim">
            <Text className="text-textSecondary text-xs">Version</Text>
            <Text className="text-textPrimary text-xs font-bold">{appVersion}</Text>
          </View>
          <View className="flex-row justify-between py-2 border-b border-rim">
            <Text className="text-textSecondary text-xs">Build</Text>
            <Text className="text-textPrimary text-xs font-bold">Production • Universal APK</Text>
          </View>
          <View className="flex-row justify-between py-2 border-b border-rim">
            <Text className="text-textSecondary text-xs">Security</Text>
            <Text className="text-textPrimary text-xs font-bold">SecureStore + Kosh TEE</Text>
          </View>
          <View className="flex-row justify-between py-2 border-b border-rim">
            <Text className="text-textSecondary text-xs">Storage</Text>
            <Text className="text-textPrimary text-xs font-bold">SAF + SQLite</Text>
          </View>
        </GlassCard>

        {/* Changelog */}
        <GlassCard>
          <Pressable
            onPress={() => setShowChangelog(!showChangelog)}
            className="flex-row justify-between items-center"
          >
            <Text className="text-textPrimary text-[15px] font-bold">Changelog</Text>
            <MaterialIcons
              name={showChangelog ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
              size={22}
              color={colors.textSecondary}
            />
          </Pressable>
          {showChangelog && (
            <View className="mt-sm">
              {CHANGELOG.map((release) => (
                <View key={release.version} className="mb-md">
                  <View className="flex-row items-center gap-2 mb-[6px]">
                    <Text className="text-warm300 text-[13px] font-extrabold">v{release.version}</Text>
                    <Text className="text-textTertiary text-[11px]">{release.date}</Text>
                  </View>
                  {release.changes.map((change, i) => (
                    <View key={i} className="flex-row gap-2 pl-1 mb-[3px]">
                      <Text className="text-textTertiary text-[11px]">•</Text>
                      <Text className="text-textSecondary text-[11px] flex-1">{change}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          )}
        </GlassCard>

        {loading ? <Text className="text-textSecondary text-xs mt-1">Processing database action...</Text> : null}
        {error ? <Text className="text-danger text-xs mt-1">{error}</Text> : null}
      </ScrollView>
    </AppScreen>
  );
}
