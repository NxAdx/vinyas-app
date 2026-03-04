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
      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="gap-md pb-xxl">
        <View className="flex-row justify-between items-center">
          <Pressable onLongPress={handleOpenVaultGesture} delayLongPress={260} className="gap-[2px]">
            <Text className="text-textPrimary text-[28px] font-extrabold tracking-[-0.6px]">Vinyas</Text>
            <Text className="text-textTertiary text-xs tracking-[0.4px] uppercase">Private Explorer</Text>
          </Pressable>

          <Pressable onPress={() => router.push('/settings')} className="w-[38px] h-[38px] rounded-pill bg-glass10 border border-rim items-center justify-center">
            <MaterialIcons name="settings" size={20} color={colors.textPrimary} />
          </Pressable>
        </View>

        <Text className="text-textPrimary text-2xl font-extrabold">Dashboard</Text>
        <Text className="text-textSecondary text-[13px] leading-[19px]">
          Long-press logo for hidden Kosh entry. Current mode: {globalMode.toUpperCase()}
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-sm py-xs"
        >
          <GlassCard className="min-w-[120px]" highlighted={globalMode === 'warm'}>
            <Text className="text-textTertiary text-xs mb-[6px] uppercase">Bookmarks</Text>
            <Text className="text-textPrimary text-lg font-bold">{ghostLinks.length}</Text>
          </GlassCard>
          <GlassCard className="min-w-[120px]">
            <Text className="text-textTertiary text-xs mb-[6px] uppercase">Storage</Text>
            <Text className="text-textPrimary text-lg font-bold">{totalSize}</Text>
          </GlassCard>
          <GlassCard className="min-w-[120px]" highlighted={configuredVault}>
            <Text className="text-textTertiary text-xs mb-[6px] uppercase">Kosh</Text>
            <Text className="text-textPrimary text-lg font-bold">{ghostLinks.filter((link) => link.isKosh).length}</Text>
          </GlassCard>
        </ScrollView>

        <GlassCard>
          <Text className="text-textPrimary text-[15px] font-bold mb-sm">Search files</Text>
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
            className="border border-rim rounded-chip px-3 py-2.5 text-textPrimary bg-glass04 text-sm"
            returnKeyType="search"
          />
        </GlassCard>

        <View>
          <Text className="text-textPrimary text-[15px] font-bold mb-sm">My Collections</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="gap-sm py-xs"
          >
            {categoriesWithCount.map((category) => (
              <Pressable
                key={category.id}
                onPress={() =>
                  router.push({
                    pathname: '/category/[id]' as never,
                    params: { id: category.id },
                  })
                }
                className="w-[140px] rounded-card border bg-glass07 p-md min-h-[110px] justify-between"
                style={{ borderColor: category.gradient[0] }}
              >
                <MaterialIcons
                  name={category.icon as any}
                  size={28}
                  color={category.gradient[0]}
                  style={{ marginBottom: 4 }}
                />
                <View>
                  <Text className="text-textPrimary text-[15px] font-bold" numberOfLines={1}>{category.name}</Text>
                  <Text className="text-textSecondary text-xs">{category.count} bookmarks</Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>



        <GlassCard>
          <Text className="text-textPrimary text-[15px] font-bold mb-sm">Recent activity</Text>
          {recentLinks.length === 0 ? (
            <Text className="text-textSecondary text-[13px]">No bookmarks yet. Open Explorer to start ghost bookmarking.</Text>
          ) : (
            recentLinks.map((link) => (
              <View key={link.id} className="flex-row justify-between items-center gap-md py-2 border-b border-rim">
                <Text numberOfLines={1} className="text-textSecondary flex-1 text-[13px]">
                  {link.fileName}
                </Text>
                <Text className="text-warm300 text-[11px] font-bold">{link.isKosh ? 'KOSH' : link.storageSource}</Text>
              </View>
            ))
          )}
        </GlassCard>

        {loading ? <Text className="text-textSecondary text-xs mt-sm">Loading...</Text> : null}
        {error ? <Text className="text-danger text-xs mt-sm">{error}</Text> : null}
      </ScrollView>
    </AppScreen>
  );
}
