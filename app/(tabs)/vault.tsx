import { useEffect, useMemo, useState } from 'react';
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
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Kosh Vault</Text>
          <Text style={styles.subtitle}>Secure area for private ghost bookmarks. Theme shifts to teal.</Text>
        </View>

        {!configured ? (
          <GlassCard style={styles.koshCard}>
            <Text style={styles.sectionTitle}>Setup vault</Text>
            <TextInput
              value={setupPasscode}
              onChangeText={setSetupPasscode}
              placeholder="Create passcode"
              secureTextEntry
              placeholderTextColor={colors.textTertiary}
              style={styles.input}
            />
            <TextInput
              value={setupConfirmPasscode}
              onChangeText={setSetupConfirmPasscode}
              placeholder="Confirm passcode"
              secureTextEntry
              placeholderTextColor={colors.textTertiary}
              style={styles.input}
            />
            <Pressable style={styles.tealButton} onPress={handleSetup}>
              <Text style={styles.tealButtonText}>Enable Kosh</Text>
            </Pressable>
          </GlassCard>
        ) : null}

        {configured && !unlocked ? (
          <GlassCard style={styles.koshCard}>
            <Text style={styles.sectionTitle}>Unlock vault</Text>
            <TextInput
              value={unlockPasscode}
              onChangeText={setUnlockPasscode}
              placeholder="Enter passcode"
              secureTextEntry
              placeholderTextColor={colors.textTertiary}
              style={styles.input}
            />
            <Pressable style={styles.tealButton} onPress={handleUnlock}>
              <Text style={styles.tealButtonText}>Unlock</Text>
            </Pressable>
          </GlassCard>
        ) : null}

        {configured && unlocked ? (
          <>
            <GlassCard style={styles.koshCard}>
              <View style={styles.rowBetween}>
                <Text style={styles.sectionTitle}>Vault entries ({vaultLinks.length})</Text>
                <Pressable onPress={handleLock} style={styles.secondaryButton}>
                  <Text style={styles.secondaryButtonText}>Lock</Text>
                </Pressable>
              </View>

              {vaultLinks.length === 0 ? (
                <Text style={styles.emptyText}>No entries in vault yet.</Text>
              ) : (
                vaultLinks.map((link) => (
                  <View key={link.id} style={styles.entryRow}>
                    <View style={styles.entryTextWrap}>
                      <Text numberOfLines={1} style={styles.entryTitle}>
                        {link.fileName}
                      </Text>
                      <Text style={styles.entryMeta}>{link.storageSource}</Text>
                    </View>
                    <Pressable
                      onPress={async () => {
                        await removeEntry(link.id);
                        await refreshData();
                      }}
                      style={styles.removeButton}
                    >
                      <Text style={styles.removeButtonText}>Remove</Text>
                    </Pressable>
                  </View>
                ))
              )}
            </GlassCard>

            <GlassCard>
              <Text style={styles.sectionTitle}>Add from existing bookmarks</Text>
              {addableLinks.length === 0 ? (
                <Text style={styles.emptyText}>
                  All bookmarks are already in Kosh or no bookmarks exist.
                </Text>
              ) : (
                addableLinks.map((link) => (
                  <View key={link.id} style={styles.entryRow}>
                    <View style={styles.entryTextWrap}>
                      <Text numberOfLines={1} style={styles.entryTitle}>
                        {link.fileName}
                      </Text>
                      <Text style={styles.entryMeta}>{link.storageSource}</Text>
                    </View>
                    <Pressable
                      onPress={async () => {
                        await addEntry(link.id);
                        await refreshData();
                      }}
                      style={styles.addButton}
                    >
                      <Text style={styles.addButtonText}>Add</Text>
                    </Pressable>
                  </View>
                ))
              )}
            </GlassCard>
          </>
        ) : null}

        {loading ? <Text style={styles.infoText}>Updating vault...</Text> : null}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  header: {
    gap: 4,
  },
  title: {
    color: colors.tealGlow,
    fontSize: 26,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  koshCard: {
    borderColor: 'rgba(0,229,204,0.35)',
    backgroundColor: 'rgba(29,43,83,0.26)',
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(0,229,204,0.25)',
    borderRadius: radius.chip,
    color: colors.textPrimary,
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: spacing.sm,
  },
  tealButton: {
    backgroundColor: colors.tealGlow,
    borderRadius: radius.pill,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 2,
  },
  tealButtonText: {
    color: '#042A26',
    fontWeight: '800',
    fontSize: 13,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  secondaryButton: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.rim,
    backgroundColor: colors.glass04,
  },
  secondaryButtonText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  entryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.rim,
  },
  entryTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  entryTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  entryMeta: {
    color: colors.textTertiary,
    fontSize: 11,
    marginTop: 2,
  },
  addButton: {
    borderRadius: radius.pill,
    backgroundColor: colors.tealGlow,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  addButtonText: {
    color: '#03231F',
    fontSize: 12,
    fontWeight: '700',
  },
  removeButton: {
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,71,87,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: 'rgba(255,71,87,0.45)',
  },
  removeButtonText: {
    color: '#FF8E97',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  infoText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
  },
});
