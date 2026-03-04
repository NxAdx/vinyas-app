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

import { AppScreen } from '@/src/components/AppScreen';
import { GlassCard } from '@/src/components/GlassCard';
import { useAppStore } from '@/src/stores/useAppStore';
import { useFileStore } from '@/src/stores/useFileStore';
import { useVaultStore } from '@/src/stores/useVaultStore';
import { colors, radius, spacing } from '@/src/theme/tokens';

export default function VaultScreen() {
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

  const handleSetup = async () => {
    if (!setupPasscode.trim()) {
      Alert.alert('Setup failed', 'Enter a passcode first.');
      return;
    }
    if (setupPasscode !== setupConfirmPasscode) {
      Alert.alert('Setup failed', 'Passcode and confirmation do not match.');
      return;
    }

    try {
      await setup(setupPasscode);
      setSetupPasscode('');
      setSetupConfirmPasscode('');
      await refreshEntries();
      await refreshData();
    } catch (setupError) {
      const message = setupError instanceof Error ? setupError.message : 'Could not setup vault.';
      Alert.alert('Setup failed', message);
    }
  };

  const handleUnlock = async () => {
    const success = await unlock(unlockPasscode);
    if (!success) {
      Alert.alert('Unlock failed', 'Invalid passcode. Try again.');
      return;
    }

    setUnlockPasscode('');
    await refreshEntries();
    await refreshData();
  };

  const handleLock = () => {
    lock();
    setUnlockPasscode('');
  };

  return (
    <AppScreen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="gap-md pb-xxl">
        <View className="gap-1">
          <Text className="text-textPrimary text-[26px] font-extrabold">Kosh Vault</Text>
          <Text className="text-textSecondary text-[13px] leading-[19px]">Secure area for private ghost bookmarks.</Text>
        </View>

        {!configured ? (
          <GlassCard>
            <Text className="text-textPrimary text-[15px] font-bold mb-sm">Setup vault</Text>
            <TextInput
              value={setupPasscode}
              onChangeText={setSetupPasscode}
              placeholder="Create passcode"
              secureTextEntry
              placeholderTextColor={colors.textTertiary}
              className="border border-rim rounded-chip text-textPrimary bg-glass04 px-3 py-2.5 mb-sm"
            />
            <TextInput
              value={setupConfirmPasscode}
              onChangeText={setSetupConfirmPasscode}
              placeholder="Confirm passcode"
              secureTextEntry
              placeholderTextColor={colors.textTertiary}
              className="border border-rim rounded-chip text-textPrimary bg-glass04 px-3 py-2.5 mb-sm"
            />
            <Pressable className="bg-warm500 rounded-pill py-2.5 items-center mt-[2px]" onPress={handleSetup}>
              <Text className="text-void font-extrabold text-[13px]">Enable Kosh</Text>
            </Pressable>
          </GlassCard>
        ) : null}

        {configured && !unlocked ? (
          <GlassCard>
            <Text className="text-textPrimary text-[15px] font-bold mb-sm">Unlock vault</Text>
            <TextInput
              value={unlockPasscode}
              onChangeText={setUnlockPasscode}
              placeholder="Enter passcode"
              secureTextEntry
              placeholderTextColor={colors.textTertiary}
              className="border border-rim rounded-chip text-textPrimary bg-glass04 px-3 py-2.5 mb-sm"
            />
            <Pressable className="bg-warm500 rounded-pill py-2.5 items-center mt-[2px]" onPress={handleUnlock}>
              <Text className="text-void font-extrabold text-[13px]">Unlock</Text>
            </Pressable>
          </GlassCard>
        ) : null}

        {configured && unlocked ? (
          <>
            <GlassCard>
              <View className="flex-row justify-between items-center mb-sm">
                <Text className="text-textPrimary text-[15px] font-bold">Vault entries ({vaultLinks.length})</Text>
                <Pressable onPress={handleLock} className="px-3 py-[7px] rounded-pill border border-rim bg-glass04">
                  <Text className="text-textSecondary text-xs font-semibold">Lock</Text>
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
