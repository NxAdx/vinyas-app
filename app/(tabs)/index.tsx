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
  InteractionManager
} from 'react-native';

import { AppScreen } from '@/src/components/AppScreen';
import { GlassCard } from '@/src/components/GlassCard';
import { useAppStore } from '@/src/stores/useAppStore';
import { useFileStore } from '@/src/stores/useFileStore';
import { useVaultStore } from '@/src/stores/useVaultStore';
import { THEME_DARK, THEME_LIGHT } from '../../src/theme/tokens';

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
  const theme = useAppStore((state) => state.theme);
  const colors = theme === 'dark' ? THEME_DARK : THEME_LIGHT;

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
    let isMounted = true;
    const init = async () => {
      console.log('[Vinyas] HomeScreen: Starting DB/Vault Init...');
      try {
        if (!initialized) {
          console.log('[Vinyas] HomeScreen: Initializing FileStore...');
          await initialize();
        }
        console.log('[Vinyas] HomeScreen: Hydrating VaultStore...');
        await hydrateVault();
        console.log('[Vinyas] HomeScreen: Initialization Complete.');
      } catch (err) {
        console.warn('[Vinyas] Home screen DB init failed safely:', err);
      } finally {
        if (isMounted) {
          setHasLoadedApp(true);
        }
      }
    };
    init();

    return () => {
      isMounted = false;
    };
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
    <AppScreen style={{ backgroundColor: colors.void }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingBottom: 44 }}>
        {/* Header (with embedded subtitle) */}
        <View className="flex-row justify-between items-start mt-2">
          <Pressable onLongPress={handleSecretGesture} delayLongPress={700} className="flex-1">
            <Text style={{ color: colors.textPrimary, fontSize: 28, fontWeight: '800' }}>Vinyas</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 18, paddingRight: 16, marginTop: 4 }}>
              Long-press logo for hidden Kosh entry.
            </Text>
          </Pressable>
          <Pressable
            onPress={() => router.push('/settings')}
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: colors.glass07 }}
          >
            <MaterialIcons name="settings" size={20} color={colors.textSecondary} />
          </Pressable>
        </View>

        {/* Stats Row */}
        <View className="flex-row gap-3">
          <GlassCard style={{ flex: 1 }}>
            <Text style={{ color: colors.textTertiary, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' }}>Bookmarks</Text>
            <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: '800', marginTop: 4 }}>{totalBookmarks}</Text>
          </GlassCard>
          <GlassCard style={{ flex: 1 }}>
            <Text style={{ color: colors.textTertiary, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' }}>Storage</Text>
            <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: '800', marginTop: 4 }}>{formatBytes(totalStorageBytes)}</Text>
          </GlassCard>
          <GlassCard style={{ flex: 1 }}>
            <Text style={{ color: colors.textTertiary, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' }}>Kosh</Text>
            <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: '800', marginTop: 4 }}>{koshCount}</Text>
          </GlassCard>
        </View>

        {/* Search */}
        <GlassCard>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search files and categories..."
            placeholderTextColor={colors.textTertiary}
            style={{
              borderColor: colors.rim,
              borderWidth: 1,
              borderRadius: 24,
              color: colors.textPrimary,
              backgroundColor: colors.glass04,
              paddingHorizontal: 16,
              paddingVertical: 12,
              fontSize: 14
            }}
          />
        </GlassCard>

        {/* Category Grid */}
        <View className="flex-row flex-wrap gap-2 justify-between">
          {filteredCategories.map((cat) => {
            const bookmarkCount = ghostLinks.filter((l) => l.categoryId === cat.id).length;
            const iconName = CATEGORY_ICONS[cat.id] || cat.icon || 'folder';
            const gradientStart = Array.isArray(cat.gradient) && cat.gradient.length > 0 ? cat.gradient[0] : (theme === 'dark' ? '#1C2A33' : '#E2E8F0');
            return (
              <Pressable
                key={cat.id}
                onPress={() => router.push({ pathname: '/category/[id]' as never, params: { id: cat.id } })}
                style={({ pressed }) => ({
                  width: '48%',
                  opacity: pressed ? 0.8 : 1,
                  borderRadius: 16,
                  padding: 16,
                  minHeight: 100,
                  justifyContent: 'space-between',
                  backgroundColor: `${gradientStart}22`,
                  borderWidth: 1,
                  borderColor: `${gradientStart}44`
                })}
              >
                <MaterialIcons name={iconName as any} size={28} color={gradientStart} />
                <View className="mt-3">
                  <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: '700' }}>{cat.name}</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 2 }}>{bookmarkCount} items</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Storage Locations (Files by Google Style) */}
        <GlassCard style={{ marginTop: 8 }}>
          <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: '700', marginBottom: 12 }}>Storage devices</Text>
          <View className="gap-[2px]">
            <Pressable
              onPress={handleStoragePress}
              className="flex-row items-center justify-between px-4 py-3 rounded-t-chip border"
              style={({ pressed }) => ({
                backgroundColor: pressed ? colors.glass07 : colors.glass04,
                borderColor: colors.rim,
              })}
            >
              <View className="flex-row items-center gap-3">
                <MaterialIcons name="smartphone" size={24} color={colors.warm300} />
                <View>
                  <Text style={{ color: colors.textPrimary, fontWeight: '600', fontSize: 14 }}>Internal Storage</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 2 }}>Full path access</Text>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={colors.textTertiary} />
            </Pressable>

            <Pressable
              onPress={handleStoragePress}
              className="flex-row items-center justify-between px-4 py-3 rounded-b-chip border"
              style={({ pressed }) => ({
                backgroundColor: pressed ? colors.glass07 : colors.glass04,
                borderColor: colors.rim,
              })}
            >
              <View className="flex-row items-center gap-3">
                <MaterialIcons name="sd-storage" size={24} color={colors.warm300} />
                <View>
                  <Text style={{ color: colors.textPrimary, fontWeight: '600', fontSize: 14 }}>SD Card / OTG</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 2 }}>External volumes</Text>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={colors.textTertiary} />
            </Pressable>
          </View>
        </GlassCard>

        {/* Recent Activity (Google Files Inspired) */}
        {recentLinks.length > 0 && (
          <View style={{ marginTop: 8, marginBottom: 12 }}>
            <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: '700', marginBottom: 12, paddingHorizontal: 4 }}>Recent files</Text>
            <FlatList
              data={recentLinks}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ gap: 12, paddingVertical: 4 }}
              renderItem={({ item }) => (
                <Pressable
                  className="border rounded-xl p-3 justify-between"
                  style={({ pressed }) => ({
                    backgroundColor: pressed ? colors.glass07 : colors.glass04,
                    borderColor: colors.rim,
                    width: 140,
                    height: 100
                  })}
                  onPress={() => router.push('/(tabs)/explorer')}
                >
                  <View className="flex-row justify-between items-start">
                    <MaterialIcons name="insert-drive-file" size={24} color={colors.warm300} />
                  </View>
                  <View>
                    <Text numberOfLines={1} style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '600' }}>{item.fileName}</Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 10, marginTop: 4 }}>{formatBytes(item.fileSize || 0)}</Text>
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
