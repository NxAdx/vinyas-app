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
  'cat-other': 'more-horiz',
};

// Specialized bento colors combining tint + opacity for background
const BENTO_THEMES: Record<string, { bg: string; icon: string }> = {
  'cat-img': { bg: 'rgba(66, 153, 225, 0.12)', icon: '#63B3ED' },     // Blue
  'cat-doc': { bg: 'rgba(245, 101, 101, 0.12)', icon: '#FC8181' },     // Red
  'cat-vid': { bg: 'rgba(26, 32, 44, 0.40)', icon: '#4A5568' },        // Dark Video
  'cat-aud': { bg: 'rgba(159, 122, 234, 0.12)', icon: '#B794F4' },     // Purple
  'cat-apk': { bg: 'rgba(237, 137, 54, 0.12)', icon: '#F6AD55' },      // Orange
  'cat-other': { bg: 'rgba(160, 174, 192, 0.12)', icon: '#CBD5E0' },   // Gray
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
  const storageSources = useFileStore((state) => state.storageSources);
  const hasStoragePermission = useFileStore((state) => state.hasStoragePermission);
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
  const [didAutoPrompt, setDidAutoPrompt] = useState(false);

  useEffect(() => {
    if (initialized && !hasStoragePermission && !didAutoPrompt) {
      setDidAutoPrompt(true);
      grantAccess();
    }
  }, [initialized, hasStoragePermission, didAutoPrompt, grantAccess]);

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
      try {
        if (!initialized) await initialize();
        await hydrateVault();
      } catch (err) {
        console.warn('[Vinyas] Home screen DB init failed safely:', err);
      } finally {
        if (isMounted) setHasLoadedApp(true);
      }
    };
    init();
    return () => { isMounted = false; };
  }, [hydrateVault, initialize, initialized, setHasLoadedApp]);

  useEffect(() => {
    if (unlockedVault) setGlobalMode('kosh');
    else if (globalMode === 'kosh') setGlobalMode('warm');
  }, [globalMode, setGlobalMode, unlockedVault]);

  const totalBookmarks = ghostLinks.length;
  const totalStorageBytes = ghostLinks.reduce((sum, link) => sum + (link.fileSize || 0), 0);
  const koshCount = ghostLinks.filter((link) => link.isKosh).length;
  
  const sdCardSource = storageSources.find((s) => s.type === 'sd_card');
  const hasSdCard = ghostLinks.some((link) => link.storageSource === 'sd_card');
  const isSdCardConnected = sdCardSource?.isConnected ?? false;

  const recentLinks = useMemo(
    () => [...ghostLinks].filter(l => !l.isKosh).sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? '')).slice(0, 5),
    [ghostLinks]
  );

  const handleSecretGesture = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.push('/(tabs)/vault');
  };

  const handleFileSearch = () => {
    if (!searchQuery.trim()) return;
    router.push({ pathname: '/(tabs)/explorer', params: { search: searchQuery } });
  };

  return (
    <AppScreen style={{ backgroundColor: colors.void }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 20, paddingBottom: 44, paddingHorizontal: 16 }}>
        
        {/* Header */}
        <View className="flex-row justify-between items-start mt-4">
          <Pressable onLongPress={handleSecretGesture} delayLongPress={700} className="flex-1">
            <Text style={{ color: colors.textPrimary, fontSize: 32, fontWeight: '800' }}>Vinyas</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }}>
              Long-press logo for hidden Kosh entry.
            </Text>
          </Pressable>
          <Pressable
            onPress={() => router.push('/settings')}
            className="w-10 h-10 rounded-full items-center justify-center mt-1"
            style={{ backgroundColor: colors.glass07 }}
          >
            <MaterialIcons name="settings" size={20} color={colors.textSecondary} />
          </Pressable>
        </View>

        {/* Stats Row */}
        <View className="flex-row gap-3">
          <View style={{ flex: 1, backgroundColor: colors.glass04, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: colors.rim }}>
            <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' }}>Bookmarks</Text>
            <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: '800', marginTop: 8 }} numberOfLines={1} adjustsFontSizeToFit>{totalBookmarks}</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: colors.glass04, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: colors.rim }}>
            <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' }}>Storage</Text>
            <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: '800', marginTop: 8 }} numberOfLines={1} adjustsFontSizeToFit>{formatBytes(totalStorageBytes)}</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: colors.glass04, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: colors.rim }}>
            <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' }}>Kosh</Text>
            <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: '800', marginTop: 8 }} numberOfLines={1} adjustsFontSizeToFit>{koshCount}</Text>
          </View>
        </View>

        {/* Search */}
        <View style={{ backgroundColor: 'transparent', borderRadius: 18, borderWidth: 1, borderColor: colors.rim, paddingHorizontal: 16, paddingVertical: 14 }}>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleFileSearch}
            returnKeyType="search"
            placeholder="Search files..."
            placeholderTextColor={colors.textSecondary}
            style={{ color: colors.textPrimary, fontSize: 15 }}
          />
        </View>

        {/* 2-Column Bento Grid */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 16 }}>
          {displayCategories.map((cat) => {
            const bookmarkCount = ghostLinks.filter((l) => l.categoryId === cat.id).length;
            const iconName = CATEGORY_ICONS[cat.id] || cat.icon || 'folder';
            const themeNode = BENTO_THEMES[cat.id] || BENTO_THEMES['cat-other'];
            
            return (
              <Pressable
                key={cat.id}
                onPress={() => router.push({ pathname: '/category/[id]' as never, params: { id: cat.id } })}
                style={({ pressed }) => ({
                  width: '48%', 
                  minHeight: 110,
                  backgroundColor: themeNode.bg,
                  borderRadius: 20,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.05)',
                  opacity: pressed ? 0.8 : 1,
                  justifyContent: 'space-between',
                })}
              >
                <MaterialIcons name={iconName as any} size={28} color={themeNode.icon} />
                <View className="mt-4">
                  <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '800' }} numberOfLines={1} adjustsFontSizeToFit>{cat.name}</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 4 }}>{bookmarkCount} items</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Storage Devices Bounding Box */}
        <View style={{ marginTop: 8 }}>
          <Text style={{ color: colors.textPrimary, fontSize: 17, fontWeight: '700', marginBottom: 12, marginLeft: 4 }}>Storage devices</Text>
          <View style={{ backgroundColor: colors.glass04, borderRadius: 20, borderWidth: 1, borderColor: colors.rim, overflow: 'hidden' }}>
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
                  <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 15 }}>Internal Storage</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>Emulated device storage</Text>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={colors.textSecondary} />
            </Pressable>

            {hasSdCard && (
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
                    <Text style={{ color: isSdCardConnected ? colors.textPrimary : colors.textSecondary, fontWeight: '700', fontSize: 15 }}>
                      SD Card {!isSdCardConnected && '(Disconnected)'}
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>
                      {isSdCardConnected ? 'External volume attached' : 'Insert card to view files'}
                    </Text>
                  </View>
                </View>
                <MaterialIcons 
                  name={isSdCardConnected ? "chevron-right" : "warning"} 
                  size={20} 
                  color={isSdCardConnected ? colors.textSecondary : colors.warm500} 
                />
              </Pressable>
            )}
          </View>
        </View>

        {/* Recent Activity */}
        {recentLinks.length > 0 && (
          <View style={{ marginTop: 8 }}>
            <Text style={{ color: colors.textPrimary, fontSize: 17, fontWeight: '700', marginBottom: 12, paddingHorizontal: 4 }}>Recent files</Text>
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
