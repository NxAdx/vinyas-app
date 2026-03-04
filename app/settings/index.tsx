import Constants from 'expo-constants';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppScreen } from '@/src/components/AppScreen';
import { GlassCard } from '@/src/components/GlassCard';
import { useAppStore } from '@/src/stores/useAppStore';
import { useFileStore } from '@/src/stores/useFileStore';
import { useVaultStore } from '@/src/stores/useVaultStore';
import { colors, radius, spacing } from '@/src/theme/tokens';

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

  return (
    <AppScreen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Control theme mode, data refresh, and environment details.</Text>
        </View>

        <GlassCard>
          <Text style={styles.sectionTitle}>Theme mode</Text>
          <Text style={styles.sectionText}>Current mode: {globalMode.toUpperCase()}</Text>
          <Pressable onPress={toggleGlobalMode} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Toggle mode</Text>
          </Pressable>
        </GlassCard>

        <GlassCard>
          <Text style={styles.sectionTitle}>Data actions</Text>
          <View style={styles.row}>
            <Pressable
              onPress={async () => {
                await refreshData();
                await refreshExplorer();
                await hydrateVault();
              }}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryButtonText}>Refresh all</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                Alert.alert(
                  'Reset data',
                  'This removes all categories and bookmarks and recreates system defaults.',
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
              style={styles.dangerButton}
            >
              <Text style={styles.dangerButtonText}>Reset data</Text>
            </Pressable>
          </View>
        </GlassCard>

        <GlassCard>
          <Text style={styles.sectionTitle}>App info</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Version</Text>
            <Text style={styles.infoValue}>{appVersion}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Build</Text>
            <Text style={styles.infoValue}>Offline local mode</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Security</Text>
            <Text style={styles.infoValue}>Kosh session lock enabled</Text>
          </View>
        </GlassCard>

        {loading ? <Text style={styles.infoText}>Processing setting action...</Text> : null}
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
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  sectionText: {
    color: colors.textSecondary,
    fontSize: 13,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  primaryButton: {
    backgroundColor: colors.warm500,
    borderRadius: radius.pill,
    paddingVertical: 10,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 13,
  },
  secondaryButton: {
    flex: 1,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.rim,
    backgroundColor: colors.glass07,
    paddingVertical: 10,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  dangerButton: {
    flex: 1,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,71,87,0.4)',
    backgroundColor: 'rgba(255,71,87,0.16)',
    paddingVertical: 10,
    alignItems: 'center',
  },
  dangerButtonText: {
    color: '#FF9EA6',
    fontSize: 12,
    fontWeight: '700',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.rim,
  },
  infoLabel: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  infoValue: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
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
