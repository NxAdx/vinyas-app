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
  const initialize = useFileStore((state) => state.initialize);
  const grantAccess = useFileStore((state) => state.grantAccess);

  const hydrateVault = useVaultStore((state) => state.hydrate);
  const unlockedVault = useVaultStore((state) => state.unlocked);

  const setHasLoadedApp = useAppStore((state) => state.setHasLoadedApp);
  const globalMode = useAppStore((state) => state.globalMode);
  const setGlobalMode = useAppStore((state) => state.setGlobalMode);

  const handleStoragePress = async () => {
    await grantAccess();
    router.push('/(tabs)/explorer');
  };


  const [searchQuery, setSearchQuery] = useState('');

  // We explicitly inject "Other" into the UI render array without modifying the database yet
  const displayCategories = useMemo(() => {
    const base = categories.filter((c) => !c.isKosh);
    if (!base.find(c => c.id === 'cat-other')) {
      base.push({
        id: 'cat-other',
        name: 'Other',
        icon: 'more-horiz',
        gradient: ['#718096', '#2D3748'],
        isKosh: false,
        isSystem: true,
        sortOrder: 100,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    return base;
  }, [categories]);

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
    if (!searchQuery.trim()) return displayCategories;
    const q = searchQuery.toLowerCase();
    return displayCategories.filter((c) => c.name.toLowerCase().includes(q));
  }, [displayCategories, searchQuery]);

  const recentLinks = useMemo(
    () => [...ghostLinks].sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? '')).slice(0, 5),
    [ghostLinks]
  );

  const handleSecretGesture = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.push('/(tabs)/vault');
  };

  return (
    <AppScreen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="gap-md pb-xxl">
        {/* Header (with embedded subtitle) */}
        <View className="flex-row justify-between items-start mt-2">
          <Pressable onLongPress={handleSecretGesture} delayLongPress={700} className="flex-1">
            <Text className="text-textPrimary text-[28px] font-extrabold">Vinyas</Text>
            <Text className="text-textSecondary text-[13px] leading-[18px] pr-4 mt-1">
              Long-press logo for hidden Kosh entry.
            </Text>
          </Pressable>
          <Pressable
            onPress={() => router.push('/settings')}
            className="w-10 h-10 rounded-full bg-glass07 items-center justify-center active:bg-glass10"
          >
            <MaterialIcons name="settings" size={20} color={colors.textSecondary} />
          </Pressable>
        </View>

        {/* Stats Row */}
        <View className="flex-row gap-sm mt-1">
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
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search files and categories..."
            placeholderTextColor={colors.textTertiary}
            className="border border-rim rounded-chip text-textPrimary bg-glass04 px-4 py-3 text-sm"
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
                  className="rounded-[16px] p-4 min-h-[95px] justify-between"
                  style={{ backgroundColor: `${gradientStart}22`, borderWidth: 1, borderColor: `${gradientStart}44` }}
                >
                  <MaterialIcons name={iconName as any} size={28} color={gradientStart} />
                  <View className="mt-3 flex-row items-center justify-between">
                    <View>
                      <Text className="text-textPrimary text-[15px] font-bold">{cat.name}</Text>
                      <Text className="text-textSecondary text-[11px] mt-0.5">{bookmarkCount} items</Text>
                    </View>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Storage Locations (Files by Google Style) */}
        <GlassCard className="mt-2">
          <Text className="text-textPrimary text-[15px] font-bold mb-sm">Storage devices</Text>
          <View className="gap-[2px]">
            <Pressable
              onPress={handleStoragePress}
              className="flex-row items-center justify-between bg-glass04 px-4 py-3 rounded-t-chip border border-rim active:bg-glass07"
            >
              <View className="flex-row items-center gap-3">
                <MaterialIcons name="smartphone" size={24} color={colors.warm300} />
                <View>
                  <Text className="text-textPrimary font-semibold text-[14px]">Internal Storage</Text>
                  <Text className="text-textSecondary text-[11px] mt-[2px]">Emulated device storage</Text>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={colors.textTertiary} />
            </Pressable>
            
            <Pressable
              onPress={handleStoragePress}
              className="flex-row items-center justify-between bg-glass04 px-4 py-3 rounded-b-chip border border-rim active:bg-glass07"
            >
              <View className="flex-row items-center gap-3">
                <MaterialIcons name="sd-storage" size={24} color={colors.warm300} />
                <View>
                  <Text className="text-textPrimary font-semibold text-[14px]">SD Card</Text>
                  <Text className="text-textSecondary text-[11px] mt-[2px]">External volume</Text>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={colors.textTertiary} />
            </Pressable>
          </View>
        </GlassCard>

        {/* Recent Activity (Google Files Inspired) */}
        {recentLinks.length > 0 && (
          <View className="mt-2 mb-sm">
            <Text className="text-textPrimary text-[15px] font-bold mb-sm px-1">Recent files</Text>
            <FlatList
              data={recentLinks}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              contentContainerClassName="gap-sm py-1"
              renderItem={({ item }) => (
                <Pressable
                  className="bg-glass04 border border-rim rounded-card p-3 w-[140px] h-[100px] justify-between active:bg-glass07"
                  onPress={() => router.push('/(tabs)/explorer')}
                >
                  <View className="flex-row justify-between items-start">
                    <MaterialIcons name="insert-drive-file" size={24} color={colors.warm300} />
                  </View>
                  <View>
                    <Text numberOfLines={1} className="text-textPrimary text-[13px] font-semibold">{item.fileName}</Text>
                    <Text className="text-textSecondary text-[10px] mt-1">{formatBytes(item.fileSize || 0)}</Text>
                  </View>
                </Pressable>
              )}
            />
          </View>
        )}
      </ScrollView>
    </AppScreen>
  );
}
