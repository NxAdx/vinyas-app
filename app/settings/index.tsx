import { useState } from 'react';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as Updates from 'expo-updates';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { AppScreen } from '@/src/components/AppScreen';
import { GlassCard } from '@/src/components/GlassCard';
import { useAppStore } from '@/src/stores/useAppStore';
import { useAuthStore } from '@/src/stores/useAuthStore';
import { useFileStore } from '@/src/stores/useFileStore';
import { useVaultStore } from '@/src/stores/useVaultStore';
import { THEME_DARK, THEME_LIGHT } from '../../src/theme/tokens';

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
  const theme = useAppStore((state) => state.theme);
  const setTheme = useAppStore((state) => state.setTheme);
  const colors = theme === 'dark' ? THEME_DARK : THEME_LIGHT;

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
        Alert.alert('Local Context', 'OTA Updates are disabled in developer builds or when unlinked from EAS.');
      }
    } catch (e: any) {
      Alert.alert('Sync Status', 'Could not reach the update server. Ensure you have an internet connection and the app is linked to EAS.');
    }
  };

  const handleSetPin = () => {
    // Standardizing on 6-digit PIN as per user request
    Alert.alert('Set Master PIN', 'Security requires a 6-digit access code for Vinyas.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Proceed to Lock Screen',
        onPress: () => {
          logout(); // Force them back to the login screen where the setup logic lives
          router.replace('/login');
        }
      },
    ]);
  };

  const router = useRouter(); // Need router for navigation

  return (
    <AppScreen style={{ backgroundColor: colors.void }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingBottom: 44 }}>
        <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 18 }}>
          Control theme mode, security, and environment details.
        </Text>

        {/* Theme */}
        <GlassCard>
          <View className="flex-row justify-between items-center mb-xs">
            <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: '700' }}>Theme mode</Text>
            <MaterialIcons
              name={theme === 'dark' ? "dark-mode" : "light-mode"}
              size={20}
              color={colors.tealGlow}
            />
          </View>
          <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 16 }}>
            Switch between AMOLED Liquid and Glass Light variants.
          </Text>
          <Pressable
            onPress={() => {
              const newTheme = theme === 'dark' ? 'light' : 'dark';
              setTheme(newTheme);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }}
            className="rounded-pill py-3 items-center"
            style={{ backgroundColor: colors.warm500 }}
          >
            <Text style={{ color: colors.void, fontWeight: '800', fontSize: 13 }}>
              Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode
            </Text>
          </Pressable>
        </GlassCard>

        {/* Security / PIN */}
        <GlassCard>
          <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: 'bold', marginBottom: 8 }}>Security</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.rim }}>
            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Master PIN</Text>
            <Text style={{ color: colors.textPrimary, fontSize: 12, fontWeight: 'bold' }}>{hasPin ? 'Enabled' : 'Not Set'}</Text>
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
                  className="flex-1 rounded-pill border py-2.5 items-center"
                  style={({ pressed }) => ({
                    backgroundColor: pressed ? colors.glass10 : colors.glass07,
                    borderColor: colors.rim
                  })}
                >
                  <Text style={{ color: colors.textPrimary, fontSize: 12, fontWeight: 'bold' }}>Lock Now</Text>
                </Pressable>
              </>
            ) : (
              <Pressable
                onPress={handleSetPin}
                className="flex-1 rounded-pill py-2.5 items-center"
                style={({ pressed }) => ({
                  backgroundColor: pressed ? colors.warm300 : colors.warm500
                })}
              >
                <Text style={{ color: colors.void, fontSize: 12, fontWeight: 'bold' }}>Set Master PIN</Text>
              </Pressable>
            )}
          </View>
        </GlassCard>

        {/* OTA Updates */}
        <GlassCard>
          <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: 'bold', marginBottom: 8 }}>OTA Updates</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 8 }}>
            Instantly download JavaScript bundle patches without waiting for an APK compiling cycle.
          </Text>
          <Pressable
            onPress={checkForUpdate}
            className="border rounded-pill py-2.5 items-center"
            style={({ pressed }) => ({
              backgroundColor: pressed ? colors.glass10 : colors.glass07,
              borderColor: colors.rim
            })}
          >
            <Text style={{ color: colors.textPrimary, fontWeight: 'bold', fontSize: 13 }}>Check for Update</Text>
          </Pressable>
        </GlassCard>

        {/* Data Actions (Hidden for Production) */}

        {/* App Info */}
        <GlassCard>
          <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: 'bold', marginBottom: 8 }}>App info</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.rim }}>
            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Version</Text>
            <Text style={{ color: colors.textPrimary, fontSize: 12, fontWeight: 'bold' }}>{appVersion}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.rim }}>
            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Build</Text>
            <Text style={{ color: colors.textPrimary, fontSize: 12, fontWeight: 'bold' }}>Production • Universal APK</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.rim }}>
            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Security</Text>
            <Text style={{ color: colors.textPrimary, fontSize: 12, fontWeight: 'bold' }}>SecureStore + Kosh TEE</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.rim }}>
            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Storage</Text>
            <Text style={{ color: colors.textPrimary, fontSize: 12, fontWeight: 'bold' }}>SAF + SQLite</Text>
          </View>
        </GlassCard>

        {/* Changelog */}
        <GlassCard>
          <Pressable
            onPress={() => setShowChangelog(!showChangelog)}
            className="flex-row justify-between items-center"
          >
            <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: 'bold' }}>Changelog</Text>
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
                    <Text style={{ color: colors.warm300, fontSize: 13, fontWeight: 'bold' }}>v{release.version}</Text>
                    <Text style={{ color: colors.textTertiary, fontSize: 11 }}>{release.date}</Text>
                  </View>
                  {release.changes.map((change, i) => (
                    <View key={i} className="flex-row gap-2 pl-1 mb-[3px]">
                      <Text style={{ color: colors.textTertiary, fontSize: 11 }}>•</Text>
                      <Text style={{ color: colors.textSecondary, fontSize: 11, flex: 1 }}>{change}</Text>
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
