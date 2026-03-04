import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
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

export default function HomeScreen() {
  const router = useRouter();

  const initialized = useFileStore((state) => state.initialized);
  const categories = useFileStore((state) => state.categories);
  const ghostLinks = useFileStore((state) => state.ghostLinks);
  const loading = useFileStore((state) => state.loading);
  const error = useFileStore((state) => state.error);
  const initialize = useFileStore((state) => state.initialize);
  const createNewCategory = useFileStore((state) => state.createNewCategory);

  const hydrateVault = useVaultStore((state) => state.hydrate);
  const configuredVault = useVaultStore((state) => state.configured);
  const unlockedVault = useVaultStore((state) => state.unlocked);

  const setHasLoadedApp = useAppStore((state) => state.setHasLoadedApp);
  const globalMode = useAppStore((state) => state.globalMode);
  const setGlobalMode = useAppStore((state) => state.setGlobalMode);

  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    void (async () => {
      if (!initialized) {
        await initialize();
      }
      await hydrateVault();
      setHasLoadedApp(true);
    })();
  }, [hydrateVault, initialize, initialized, setHasLoadedApp]);

  useEffect(() => {
    if (unlockedVault) {
      setGlobalMode('kosh');
    } else if (globalMode === 'kosh') {
      setGlobalMode('warm');
    }
  }, [globalMode, setGlobalMode, unlockedVault]);

  const categoriesWithCount = useMemo(() => {
    return categories.map((category) => ({
      ...category,
      count: ghostLinks.filter((link) => link.categoryId === category.id).length,
    }));
  }, [categories, ghostLinks]);

  const recentLinks = useMemo(() => {
    return [...ghostLinks].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);
  }, [ghostLinks]);

  const totalSize = useMemo(() => {
    const bytes = ghostLinks.reduce((acc, link) => acc + link.fileSize, 0);
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  }, [ghostLinks]);


  const handleOpenVaultGesture = async () => {
    await Haptics.selectionAsync();
    router.push('/(tabs)/vault');
  };

  return (
    <AppScreen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Pressable onLongPress={handleOpenVaultGesture} delayLongPress={260} style={styles.logoWrap}>
            <Text style={styles.logo}>Vinyas</Text>
            <Text style={styles.logoSub}>Private Explorer</Text>
          </Pressable>

          <Pressable onPress={() => router.push('/settings')} style={styles.settingsButton}>
            <MaterialIcons name="settings" size={20} color={colors.textPrimary} />
          </Pressable>
        </View>

        <Text style={styles.heroTitle}>Dashboard</Text>
        <Text style={styles.heroSubtitle}>
          Long-press logo for hidden Kosh entry. Current mode: {globalMode.toUpperCase()}
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.metricsRow}
        >
          <GlassCard style={styles.metricCard} highlighted={globalMode === 'warm'}>
            <Text style={styles.metricLabel}>Bookmarks</Text>
            <Text style={styles.metricValue}>{ghostLinks.length}</Text>
          </GlassCard>
          <GlassCard style={styles.metricCard}>
            <Text style={styles.metricLabel}>Storage</Text>
            <Text style={styles.metricValue}>{totalSize}</Text>
          </GlassCard>
          <GlassCard style={styles.metricCard} highlighted={configuredVault}>
            <Text style={styles.metricLabel}>Kosh</Text>
            <Text style={styles.metricValue}>{ghostLinks.filter((link) => link.isKosh).length}</Text>
          </GlassCard>
        </ScrollView>

        <GlassCard>
          <Text style={styles.sectionTitle}>Search files</Text>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={() => {
              if (searchQuery.trim()) {
                router.push({ pathname: '/explorer' as never, params: { q: searchQuery.trim() } });
              }
            }}
            placeholder="Search by file name or type"
            placeholderTextColor={colors.textTertiary}
            style={styles.input}
            returnKeyType="search"
          />
        </GlassCard>

        <View style={styles.categoryGrid}>
          {categoriesWithCount.map((category) => (
            <Pressable
              key={category.id}
              onPress={() =>
                router.push({
                  pathname: '/category/[id]' as never,
                  params: { id: category.id },
                })
              }
              style={[styles.categoryCard, { borderColor: category.gradient[0] }]}
            >
              <MaterialIcons
                name={category.icon as any}
                size={28}
                color={category.gradient[0]}
                style={{ marginBottom: 4 }}
              />
              <View>
                <Text style={styles.categoryTitle}>{category.name}</Text>
                <Text style={styles.categoryCount}>{category.count} bookmarks</Text>
              </View>
            </Pressable>
          ))}
        </View>



        <GlassCard>
          <Text style={styles.sectionTitle}>Recent activity</Text>
          {recentLinks.length === 0 ? (
            <Text style={styles.emptyText}>No bookmarks yet. Open Explorer to start ghost bookmarking.</Text>
          ) : (
            recentLinks.map((link) => (
              <View key={link.id} style={styles.activityRow}>
                <Text numberOfLines={1} style={styles.activityText}>
                  {link.fileName}
                </Text>
                <Text style={styles.activityMeta}>{link.isKosh ? 'KOSH' : link.storageSource}</Text>
              </View>
            ))
          )}
        </GlassCard>

        {loading ? <Text style={styles.infoText}>Loading...</Text> : null}
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoWrap: {
    gap: 2,
  },
  logo: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  logoSub: {
    color: colors.textTertiary,
    fontSize: 12,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  settingsButton: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: colors.glass10,
    borderWidth: 1,
    borderColor: colors.rim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
  },
  heroSubtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  metricsRow: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  metricCard: {
    minWidth: 120,
    padding: spacing.md,
  },
  metricLabel: {
    color: colors.textTertiary,
    fontSize: 12,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  metricValue: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.rim,
    borderRadius: radius.chip,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.textPrimary,
    backgroundColor: colors.glass04,
    fontSize: 14,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  categoryCard: {
    width: '48%',
    borderRadius: radius.card,
    borderWidth: 1,
    backgroundColor: colors.glass07,
    padding: spacing.md,
    minHeight: 96,
    justifyContent: 'space-between',
  },
  categoryTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  categoryCount: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  inlineRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  inlineInput: {
    flex: 1,
  },
  primaryButton: {
    borderRadius: radius.pill,
    backgroundColor: colors.warm500,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  primaryButtonText: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 13,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  activityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.rim,
  },
  activityText: {
    color: colors.textSecondary,
    flex: 1,
    fontSize: 13,
  },
  activityMeta: {
    color: colors.warm300,
    fontSize: 11,
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
