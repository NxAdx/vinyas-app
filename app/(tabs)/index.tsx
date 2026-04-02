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

const CAT_COLORS: Record<string, string> = {
    'cat-img': '#4299E1', // Blue
    'cat-doc': '#F56565', // Red
    'cat-vid': '#48BB78', // Green
    'cat-aud': '#9F7AEA', // Purple
    'cat-apk': '#ED8936', // Orange
    'cat-other': '#A0AEC0', // Gray
  };

  return (
    <AppScreen style={{ backgroundColor: colors.void }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingBottom: 44, paddingHorizontal: 16 }}>
        
        {/* Header */}
        <View className="flex-row justify-between items-start mt-4">
          <Pressable onLongPress={handleSecretGesture} delayLongPress={700} className="flex-1">
            <Text style={{ color: colors.textPrimary, fontSize: 32, fontWeight: '800' }}>Vinyas</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 14, marginTop: 4 }}>
              Long-press logo for hidden Kosh entry.
            </Text>
          </Pressable>
          <Pressable
            onPress={() => router.push('/settings')}
            className="w-10 h-10 rounded-full items-center justify-center mt-1"
            style={{ backgroundColor: colors.glass07 }}
          >
            <MaterialIcons name="settings" size={22} color={colors.textSecondary} />
          </Pressable>
        </View>

        {/* Stats Row */}
        <View className="flex-row gap-3">
          <View style={{ flex: 1, backgroundColor: 'transparent', borderRadius: 20, padding: 12, borderWidth: 1, borderColor: colors.rim }}>
            <Text style={{ color: colors.textSecondary, fontSize: 9, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>Bookmarks</Text>
            <Text style={{ color: colors.textPrimary, fontSize: 24, fontWeight: '800', marginTop: 6 }} numberOfLines={1} adjustsFontSizeToFit>{totalBookmarks}</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: 'transparent', borderRadius: 20, padding: 12, borderWidth: 1, borderColor: colors.rim }}>
            <Text style={{ color: colors.textSecondary, fontSize: 9, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>Storage</Text>
            <Text style={{ color: colors.textPrimary, fontSize: 24, fontWeight: '800', marginTop: 6 }} numberOfLines={1} adjustsFontSizeToFit>{formatBytes(totalStorageBytes)}</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: 'transparent', borderRadius: 20, padding: 12, borderWidth: 1, borderColor: colors.rim }}>
            <Text style={{ color: colors.textSecondary, fontSize: 9, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>Kosh</Text>
            <Text style={{ color: colors.textPrimary, fontSize: 24, fontWeight: '800', marginTop: 6 }} numberOfLines={1} adjustsFontSizeToFit>{koshCount}</Text>
          </View>
        </View>

        {/* Search */}
        <View style={{ backgroundColor: 'transparent', borderRadius: 999, borderWidth: 1, borderColor: colors.rim, paddingHorizontal: 16, paddingVertical: 14 }}>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search files and categories..."
            placeholderTextColor={colors.textSecondary}
            style={{ color: colors.textPrimary, fontSize: 15 }}
          />
        </View>

        {/* Category Grid */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 28, columnGap: 12 }}>
          {filteredCategories.map((cat) => {
            const bookmarkCount = ghostLinks.filter((l) => l.categoryId === cat.id).length;
            const iconName = CATEGORY_ICONS[cat.id] || cat.icon || 'folder';
            const catColor = CAT_COLORS[cat.id] || '#A0AEC0';
            
            return (
              <Pressable
                key={cat.id}
                onPress={() => router.push({ pathname: '/category/[id]' as never, params: { id: cat.id } })}
                style={({ pressed }) => ({
                  width: '18%', // Fits ~5 items per row with gaps
                  opacity: pressed ? 0.7 : 1,
                  alignItems: 'flex-start',
                })}
              >
                <MaterialIcons name={iconName as any} size={30} color={catColor} />
                <View className="mt-3">
                  <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '700' }} numberOfLines={1} adjustsFontSizeToFit>{cat.name}</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 2 }}>{bookmarkCount} items</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Storage Locations */}
        <View style={{ marginTop: 12 }}>
          <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: '700', marginBottom: 12, marginLeft: 4 }}>Storage devices</Text>
          <View style={{ backgroundColor: colors.glass04, borderRadius: 24, borderWidth: 1, borderColor: colors.rim, overflow: 'hidden' }}>
            <Pressable
              onPress={handleStoragePress}
              className="flex-row items-center justify-between px-5 py-4 border-b"
              style={({ pressed }) => ({
                backgroundColor: pressed ? colors.glass07 : 'transparent',
                borderColor: colors.rim,
              })}
            >
              <View className="flex-row items-center gap-4">
                <MaterialIcons name="smartphone" size={24} color={colors.textSecondary} />
                <View>
                  <Text style={{ color: colors.textPrimary, fontWeight: '600', fontSize: 15 }}>Internal Storage</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>Emulated device storage</Text>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={colors.textSecondary} />
            </Pressable>

            <Pressable
              onPress={handleStoragePress}
              className="flex-row items-center justify-between px-5 py-4"
              style={({ pressed }) => ({
                backgroundColor: pressed ? colors.glass07 : 'transparent',
              })}
            >
              <View className="flex-row items-center gap-4">
                <MaterialIcons name="sd-storage" size={24} color={colors.textSecondary} />
                <View>
                  <Text style={{ color: colors.textPrimary, fontWeight: '600', fontSize: 15 }}>SD Card</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>External volume</Text>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={colors.textSecondary} />
            </Pressable>
          </View>
        </View>

        {/* Recent Activity */}
        {recentLinks.length > 0 && (
          <View style={{ marginTop: 16 }}>
            <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: '700', marginBottom: 12, paddingHorizontal: 4 }}>Recent files</Text>
            <FlatList
              data={recentLinks}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ gap: 12, paddingHorizontal: 4 }}
              renderItem={({ item }) => (
                <Pressable
                  className="border rounded-2xl p-4 justify-between"
                  style={({ pressed }) => ({
                    backgroundColor: pressed ? colors.glass07 : colors.glass04,
                    borderColor: colors.rim,
                    width: 150,
                    height: 110
                  })}
                  onPress={() => router.push('/(tabs)/explorer')}
                >
                  <View className="flex-row justify-between items-start">
                    <MaterialIcons name="insert-drive-file" size={28} color={colors.warm300} />
                  </View>
                  <View>
                    <Text numberOfLines={1} style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '600' }}>{item.fileName}</Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 4 }}>{formatBytes(item.fileSize || 0)}</Text>
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
