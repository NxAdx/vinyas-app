import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AppScreen } from '@/src/components/AppScreen';
import { GlassCard } from '@/src/components/GlassCard';
import { useAppStore } from '@/src/stores/useAppStore';
import { useFileStore } from '@/src/stores/useFileStore';
import { useVaultStore } from '@/src/stores/useVaultStore';
import { colors } from '@/src/theme/tokens';

const CATEGORY_ICONS: Record<string, string> = {
  'cat-img': 'image',
  'cat-doc': 'description',
  'cat-vid': 'movie',
  'cat-aud': 'audiotrack',
  'cat-apk': 'android',
  'cat-download': 'download',
  'cat-apps': 'apps',
  'cat-other': 'more-horiz',
  'cat-kosh': 'lock',
};

function formatBytes(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export default function HomeScreen() {
  const router = useRouter();

  const initialized = useFileStore((state) => state.initialized);
  const categories = useFileStore((state) => state.categories);
  const ghostLinks = useFileStore((state) => state.ghostLinks);
  const storageSources = useFileStore((state) => state.storageSources);
  const initialize = useFileStore((state) => state.initialize);

  const hydrateVault = useVaultStore((state) => state.hydrate);
  const unlockedVault = useVaultStore((state) => state.unlocked);

  const setHasLoadedApp = useAppStore((state) => state.setHasLoadedApp);
  const globalMode = useAppStore((state) => state.globalMode);
  const setGlobalMode = useAppStore((state) => state.setGlobalMode);

  const [searchQuery, setSearchQuery] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');

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

  const totalBookmarks = ghostLinks.length;
  const totalStorageBytes = ghostLinks.reduce((sum, link) => sum + (link.fileSize || 0), 0);
  const koshCount = ghostLinks.filter((link) => link.isKosh).length;

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories.filter((c) => !c.isKosh);
    const q = searchQuery.toLowerCase();
    return categories.filter((c) => !c.isKosh && c.name.toLowerCase().includes(q));
  }, [categories, searchQuery]);

  const recentLinks = useMemo(
    () => [...ghostLinks].sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? '')).slice(0, 5),
    [ghostLinks]
  );

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      const { createNewCategory } = useFileStore.getState();
      await createNewCategory(newCategoryName.trim());
      setNewCategoryName('');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch { }
  };

  const handleSecretGesture = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.push('/(tabs)/vault');
  };

  return (
    <AppScreen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="gap-md pb-xxl">
        {/* Header */}
        <View className="flex-row justify-between items-center">
          <Pressable onLongPress={handleSecretGesture} delayLongPress={700}>
            <Text className="text-textPrimary text-[28px] font-extrabold">Vinyas</Text>
            <Text className="text-textTertiary text-xs tracking-widest uppercase">Private Explorer</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push('/settings')}
            className="w-10 h-10 rounded-full bg-glass07 items-center justify-center active:bg-glass10"
          >
            <MaterialIcons name="settings" size={20} color={colors.textSecondary} />
          </Pressable>
        </View>

        {/* Title */}
        <View>
          <Text className="text-textPrimary text-[22px] font-extrabold">Bento Dashboard</Text>
          <Text className="text-textSecondary text-[13px] leading-[18px]">
            Long-press logo for hidden Kosh entry. Current mode: {globalMode.toUpperCase()}
          </Text>
        </View>

        {/* Stats Row */}
        <View className="flex-row gap-sm">
          <GlassCard className="flex-1">
            <Text className="text-textTertiary text-[10px] tracking-widest uppercase">Bookmarks</Text>
            <Text className="text-textPrimary text-[22px] font-extrabold mt-1">{totalBookmarks}</Text>
          </GlassCard>
          <GlassCard className="flex-1">
            <Text className="text-textTertiary text-[10px] tracking-widest uppercase">Storage</Text>
            <Text className="text-textPrimary text-[22px] font-extrabold mt-1">{formatBytes(totalStorageBytes)}</Text>
          </GlassCard>
          <GlassCard className="flex-1">
            <Text className="text-textTertiary text-[10px] tracking-widest uppercase">Kosh</Text>
            <Text className="text-textPrimary text-[22px] font-extrabold mt-1">{koshCount}</Text>
          </GlassCard>
        </View>

        {/* Search */}
        <GlassCard>
          <Text className="text-textPrimary text-[15px] font-bold mb-sm">Find categories</Text>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search categories"
            placeholderTextColor={colors.textTertiary}
            className="border border-rim rounded-chip text-textPrimary bg-glass04 px-3 py-2.5 text-sm"
          />
        </GlassCard>

        {/* Category Grid */}
        <View className="flex-row flex-wrap gap-sm">
          {filteredCategories.map((cat) => {
            const bookmarkCount = ghostLinks.filter((l) => l.categoryId === cat.id).length;
            const iconName = CATEGORY_ICONS[cat.id] || cat.icon || 'folder';
            const gradientStart = Array.isArray(cat.gradient) && cat.gradient.length > 0 ? cat.gradient[0] : '#1C2A33';
            return (
              <Pressable
                key={cat.id}
                onPress={() => router.push({ pathname: '/category/[id]' as never, params: { id: cat.id } })}
                className="w-[48%] active:opacity-80"
              >
                <View
                  className="rounded-[16px] p-4 min-h-[100px] justify-between"
                  style={{ backgroundColor: `${gradientStart}44`, borderWidth: 1, borderColor: `${gradientStart}66` }}
                >
                  <MaterialIcons name={iconName as any} size={28} color={gradientStart} />
                  <View className="mt-3">
                    <Text className="text-textPrimary text-[15px] font-bold">{cat.name}</Text>
                    <Text className="text-textSecondary text-xs mt-0.5">{bookmarkCount} bookmarks</Text>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Create Category */}
        <GlassCard>
          <Text className="text-textPrimary text-[15px] font-bold mb-sm">Create category</Text>
          <View className="flex-row gap-sm items-center">
            <TextInput
              value={newCategoryName}
              onChangeText={setNewCategoryName}
              placeholder="Category name"
              placeholderTextColor={colors.textTertiary}
              className="flex-1 border border-rim rounded-chip text-textPrimary bg-glass04 px-3 py-2.5 text-sm"
            />
            <Pressable
              onPress={handleCreateCategory}
              className="bg-warm500 rounded-chip px-4 py-2.5 active:bg-warm300"
            >
              <Text className="text-textPrimary text-sm font-bold">Add</Text>
            </Pressable>
          </View>
        </GlassCard>

        {/* Recent Activity */}
        <GlassCard>
          <Text className="text-textPrimary text-[15px] font-bold mb-sm">Recent activity</Text>
          {recentLinks.length === 0 ? (
            <Text className="text-textSecondary text-[13px]">No recent bookmarks yet. Start exploring!</Text>
          ) : (
            recentLinks.map((link) => (
              <View key={link.id} className="flex-row justify-between items-center py-2 border-b border-rim">
                <View className="flex-1 min-w-0 mr-2">
                  <Text numberOfLines={1} className="text-textPrimary text-[13px] font-semibold">{link.fileName}</Text>
                  <Text className="text-textTertiary text-[11px] mt-[2px]">{link.storageSource} • {link.mimeType}</Text>
                </View>
                <Text className="text-textSecondary text-[11px]">{formatBytes(link.fileSize || 0)}</Text>
              </View>
            ))
          )}
        </GlassCard>
      </ScrollView>
    </AppScreen>
  );
}
