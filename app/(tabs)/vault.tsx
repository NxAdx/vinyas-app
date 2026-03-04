import { useEffect, useMemo, useState } from 'react';
import { usePreventScreenCapture } from 'expo-screen-capture';
import * as ScreenCapture from 'expo-screen-capture';
import { useIsFocused } from '@react-navigation/native';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';

import { MaterialIcons } from '@expo/vector-icons';
import { AppScreen } from '@/src/components/AppScreen';
import { GlassCard } from '@/src/components/GlassCard';
import { useAppStore } from '@/src/stores/useAppStore';
import { useFileStore } from '@/src/stores/useFileStore';
import { useVaultStore } from '@/src/stores/useVaultStore';
import { THEME_DARK, THEME_LIGHT, radius, spacing } from '../../src/theme/tokens';

export default function VaultScreen() {
  const theme = useAppStore((state) => state.theme);
  const globalMode = useAppStore((state) => state.globalMode);
  const colors = theme === 'dark' ? THEME_DARK : THEME_LIGHT;

  // Apply a subtle blue tint when in Kosh mode to indicate security
  const koshBg = globalMode === 'kosh'
    ? (theme === 'dark' ? '#080C14' : '#F0F7FF')
    : colors.void;

  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      ScreenCapture.preventScreenCaptureAsync();
    } else {
      ScreenCapture.allowScreenCaptureAsync();
    }
    return () => {
      ScreenCapture.allowScreenCaptureAsync();
    };
  }, [isFocused]);

  const initialized = useFileStore((state) => state.initialized);
  const ghostLinks = useFileStore((state) => state.ghostLinks);
  const initialize = useFileStore((state) => state.initialize);
  const refreshData = useFileStore((state) => state.refreshData);

  const configured = useVaultStore((state) => state.configured);
  const unlocked = useVaultStore((state) => state.unlocked);
  const loading = useVaultStore((state) => state.loading);
  const error = useVaultStore((state) => state.error);
  const vaultLinkIds = useVaultStore((state) => state.vaultLinkIds);
  const hydrate = useVaultStore((state) => state.hydrate);
  const setup = useVaultStore((state) => state.setup);
  const unlock = useVaultStore((state) => state.unlock);
  const lock = useVaultStore((state) => state.lock);
  const refreshEntries = useVaultStore((state) => state.refreshEntries);
  const addEntry = useVaultStore((state) => state.addEntry);
  const removeEntry = useVaultStore((state) => state.removeEntry);

  const setGlobalMode = useAppStore((state) => state.setGlobalMode);

  const [setupPasscode, setSetupPasscode] = useState('');
  const [setupConfirmPasscode, setSetupConfirmPasscode] = useState('');
  const [unlockPasscode, setUnlockPasscode] = useState('');

  useEffect(() => {
    void (async () => {
      if (!initialized) {
        await initialize();
      }
      await hydrate();
      await refreshData();
    })();
  }, [hydrate, initialize, initialized, refreshData]);

  useEffect(() => {
    setGlobalMode(unlocked ? 'kosh' : 'warm');
  }, [setGlobalMode, unlocked]);

  const vaultLinks = useMemo(() => {
    const idSet = new Set(vaultLinkIds);
    return ghostLinks.filter((link) => idSet.has(link.id) || link.isKosh);
  }, [ghostLinks, vaultLinkIds]);

  const addableLinks = useMemo(() => {
    const idSet = new Set(vaultLinks.map((link) => link.id));
    return ghostLinks.filter((link) => !idSet.has(link.id)).slice(0, 8);
  }, [ghostLinks, vaultLinks]);

  const handleLock = () => {
    lock();
    setUnlockPasscode('');
  };

  const handleSetup = async () => {
    if (setupPasscode.length !== 6) {
      Alert.alert('Setup failed', 'Enter a 6-digit passcode.');
      return;
    }
    if (setupPasscode !== setupConfirmPasscode) {
      Alert.alert('Setup failed', 'Passcodes do not match.');
      return;
    }

    try {
      await setup(setupPasscode);
      setSetupPasscode('');
      setSetupConfirmPasscode('');
      await refreshEntries();
      await refreshData();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (setupError) {
      Alert.alert('Setup failed', 'Could not enable Kosh.');
    }
  };

  const handleUnlock = async () => {
    if (unlockPasscode.length !== 6) return;
    const success = await unlock(unlockPasscode);
    if (!success) {
      Alert.alert('Unlock failed', 'Invalid passcode.');
      setUnlockPasscode('');
      return;
    }

    setUnlockPasscode('');
    await refreshEntries();
    await refreshData();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <AppScreen style={{ backgroundColor: koshBg }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingBottom: 60 }}>
        <View className="flex-row items-center gap-3">
          <View
            className="p-2 rounded-xl border"
            style={{ backgroundColor: colors.glass07, borderColor: colors.rim }}
          >
            <MaterialIcons name="lock-person" size={28} color={globalMode === 'kosh' ? colors.tealGlow : colors.warm300} />
          </View>
          <View>
            <Text
              className="text-[26px] font-extrabold tracking-tight"
              style={{ color: colors.textPrimary }}
            >
              Kosh Vault
            </Text>
            <Text
              className="text-[12px] opacity-80"
              style={{ color: colors.textSecondary }}
            >
              Secure area for private ghost bookmarks.
            </Text>
          </View>
        </View>

        {!configured ? (
          <GlassCard>
            <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '800', marginBottom: 12 }}>Setup Secure Vault</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 16 }}>Create a 6-digit passcode to protect your vault.</Text>
            <TextInput
              value={setupPasscode}
              onChangeText={setSetupPasscode}
              placeholder="6-digit passcode"
              maxLength={6}
              keyboardType="number-pad"
              secureTextEntry
              placeholderTextColor={colors.textTertiary}
              style={{
                borderWidth: 1,
                borderColor: colors.rim,
                borderRadius: 16,
                color: colors.textPrimary,
                backgroundColor: colors.glass04,
                paddingHorizontal: 16,
                paddingVertical: 12,
                marginBottom: 12
              }}
            />
            <TextInput
              value={setupConfirmPasscode}
              onChangeText={setSetupConfirmPasscode}
              placeholder="Confirm passcode"
              maxLength={6}
              keyboardType="number-pad"
              secureTextEntry
              placeholderTextColor={colors.textTertiary}
              style={{
                borderWidth: 1,
                borderColor: colors.rim,
                borderRadius: 16,
                color: colors.textPrimary,
                backgroundColor: colors.glass04,
                paddingHorizontal: 16,
                paddingVertical: 12,
                marginBottom: 20
              }}
            />
            <Pressable
              className="rounded-pill py-3 items-center"
              style={{ backgroundColor: colors.warm500 }}
              onPress={handleSetup}
            >
              <Text style={{ color: colors.void, fontWeight: '800', fontSize: 14 }}>Enable Vault</Text>
            </Pressable>
          </GlassCard>
        ) : null}

        {configured && !unlocked ? (
          <GlassCard>
            <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '800', marginBottom: 12 }}>Unlock Kosh</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 16 }}>Authenticate access to view secure entries.</Text>
            <TextInput
              value={unlockPasscode}
              onChangeText={(txt) => {
                setUnlockPasscode(txt);
                if (txt.length === 6) {
                  // Auto-unlock
                  handleUnlock();
                }
              }}
              placeholder="Enter 6-digit passcode"
              maxLength={6}
              keyboardType="number-pad"
              secureTextEntry
              placeholderTextColor={colors.textTertiary}
              style={{
                borderWidth: 1,
                borderColor: colors.rim,
                borderRadius: 16,
                color: colors.textPrimary,
                backgroundColor: colors.glass04,
                paddingHorizontal: 16,
                paddingVertical: 12,
                marginBottom: 20
              }}
            />
            <Pressable
              className="rounded-pill py-3 items-center"
              style={{ backgroundColor: colors.warm500 }}
              onPress={handleUnlock}
            >
              <Text style={{ color: colors.void, fontWeight: '800', fontSize: 14 }}>Unlock</Text>
            </Pressable>
          </GlassCard>
        ) : null}

        {configured && unlocked ? (
          <>
            <GlassCard>
              <View className="flex-row justify-between items-center mb-4">
                <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '800' }}>Vault entries ({vaultLinks.length})</Text>
                <Pressable
                  onPress={handleLock}
                  className="px-4 py-2 rounded-pill border"
                  style={{ backgroundColor: colors.glass04, borderColor: colors.rim }}
                >
                  <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '700' }}>Lock Vault</Text>
                </Pressable>
              </View>

              {vaultLinks.length === 0 ? (
                <Text className="text-textSecondary text-[13px]">No entries in vault yet.</Text>
              ) : (
                vaultLinks.map((link) => (
                  <View key={link.id} className="flex-row justify-between items-center gap-md py-2 border-b border-rim">
                    <View className="flex-1 min-w-0">
                      <Text numberOfLines={1} className="text-textPrimary text-[13px] font-bold">
                        {link.fileName}
                      </Text>
                      <Text className="text-textTertiary text-[11px] mt-[2px]">{link.storageSource}</Text>
                    </View>
                    <Pressable
                      onPress={async () => {
                        await removeEntry(link.id);
                        await refreshData();
                      }}
                      className="rounded-pill bg-[rgba(255,71,87,0.2)] px-3 py-[7px] border border-[rgba(255,71,87,0.45)]"
                    >
                      <Text className="text-[#FF8E97] text-xs font-bold">Remove</Text>
                    </Pressable>
                  </View>
                ))
              )}
            </GlassCard>

            <GlassCard>
              <Text className="text-textPrimary text-[15px] font-bold mb-sm">Add from existing bookmarks</Text>
              {addableLinks.length === 0 ? (
                <Text className="text-textSecondary text-[13px]">
                  All bookmarks are already in Kosh or no bookmarks exist.
                </Text>
              ) : (
                addableLinks.map((link) => (
                  <View key={link.id} className="flex-row justify-between items-center gap-md py-2 border-b border-rim">
                    <View className="flex-1 min-w-0">
                      <Text numberOfLines={1} className="text-textPrimary text-[13px] font-bold">
                        {link.fileName}
                      </Text>
                      <Text className="text-textTertiary text-[11px] mt-[2px]">{link.storageSource}</Text>
                    </View>
                    <Pressable
                      onPress={async () => {
                        await addEntry(link.id);
                        await refreshData();
                      }}
                      className="rounded-pill bg-warm500 px-3 py-[7px]"
                    >
                      <Text className="text-void text-xs font-bold">Add</Text>
                    </Pressable>
                  </View>
                ))
              )}
            </GlassCard>
          </>
        ) : null}

        {loading ? <Text className="text-textSecondary text-xs">Updating vault...</Text> : null}
        {error ? <Text className="text-danger text-xs">{error}</Text> : null}
      </ScrollView>
    </AppScreen>
  );
}
