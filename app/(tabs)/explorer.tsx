import { useEffect, useMemo, useState, memo, useCallback } from 'react';
import { useLocalSearchParams } from 'expo-router';
import {
  Alert,
  FlatList,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { AppScreen } from '@/src/components/AppScreen';
import { GlassCard } from '@/src/components/GlassCard';
import type { ExplorerFileItem } from '@/src/types';
import { useAppStore } from '@/src/stores/useAppStore';
import { useFileStore } from '@/src/stores/useFileStore';
import { THEME_DARK, THEME_LIGHT } from '../../src/theme/tokens';

function formatBytes(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  if (mb < 1) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${mb.toFixed(1)} MB`;
}

// Extract row item into a memoized component for list rendering performance
const ExplorerFileRow = memo(({
  item, 
  colors, 
  isSelectedMode, 
  hasBookmarks, 
  isBookmarkedInSelectedCategory, 
  onToggleSelection, 
  onBookmarkPress,
  isAvailable = true
}: {
  item: ExplorerFileItem; 
  colors: any; 
  isSelectedMode: boolean; 
  hasBookmarks: boolean; 
  isBookmarkedInSelectedCategory: boolean;
  onToggleSelection: (uri: string) => void;
  onBookmarkPress: (item: ExplorerFileItem, isBookmarked: boolean) => void;
  isAvailable?: boolean;
}) => {
  // Determine premium distinct icons/colors based on mime type mapping
  let iconName = 'insert-drive-file';
  let iconColor = colors.textSecondary;
  
  if (item.mimeType?.startsWith('image/')) { iconName = 'image'; iconColor = '#4299E1'; }
  else if (item.mimeType?.startsWith('video/')) { iconName = 'movie'; iconColor = '#48BB78'; }
  else if (item.mimeType?.startsWith('audio/')) { iconName = 'audiotrack'; iconColor = '#9F7AEA'; }
  else if (item.mimeType === 'application/vnd.android.package-archive') { iconName = 'android'; iconColor = '#ED8936'; }
  else if (item.mimeType?.includes('pdf') || item.mimeType?.includes('document')) { iconName = 'description'; iconColor = '#F56565'; }

  return (
    <Pressable
      onLongPress={() => onToggleSelection(item.uri)}
      onPress={() => {
        if (isSelectedMode) onToggleSelection(item.uri);
      }}
      delayLongPress={200}
      className="flex-row items-center justify-between px-3 py-3"
      style={({ pressed }) => ({
        backgroundColor: isSelectedMode ? `${colors.warm500}11` : pressed ? colors.glass04 : 'transparent',
        borderRadius: 16,
      })}
    >
      <View className="flex-row items-center gap-4 flex-1">
        <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: `${iconColor}15`, alignItems: 'center', justifyContent: 'center' }}>
          <MaterialIcons name={iconName as any} size={24} color={iconColor} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: isAvailable ? colors.textPrimary : colors.textTertiary, fontSize: 15, fontWeight: '600' }} numberOfLines={1}>{item.name}</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 3 }}>
            {formatBytes(item.size)} {hasBookmarks ? '• Bookmarked' : ''} {!isAvailable && '• (Offline)'}
          </Text>
        </View>
      </View>
      <Pressable
        className="p-2 ml-2"
        onPress={() => onBookmarkPress(item, isBookmarkedInSelectedCategory)}
      >
        <MaterialIcons 
          name={isBookmarkedInSelectedCategory ? "bookmark" : "bookmark-border"} 
          size={24} 
          color={isBookmarkedInSelectedCategory ? colors.warm500 : colors.textTertiary} 
        />
      </Pressable>
    </Pressable>
  );
});

export default function ExplorerScreen() {
  const theme = useAppStore((state) => state.theme);
  const colors = theme === 'dark' ? THEME_DARK : THEME_LIGHT;

  const initialized = useFileStore((state) => state.initialized);
  const loading = useFileStore((state) => state.loading);
  const categories = useFileStore((state) => state.categories);
  const ghostLinks = useFileStore((state) => state.ghostLinks);
  const explorerFiles = useFileStore((state) => state.explorerFiles);
  const selectedCategoryId = useFileStore((state) => state.selectedCategoryId);
  const initialize = useFileStore((state) => state.initialize);
  const refreshExplorer = useFileStore((state) => state.refreshExplorer);
  const setSelectedCategoryId = useFileStore((state) => state.setSelectedCategoryId);
  const bookmarkFile = useFileStore((state) => state.bookmarkFile);
  const removeGhostLinkByUri = useFileStore((state) => state.removeGhostLinkByUri);
  const grantAccess = useFileStore((state) => state.grantAccess);
  const error = useFileStore((state) => state.error);

  const { q } = useLocalSearchParams<{ q?: string }>();
  const [query, setQuery] = useState(q ?? '');
  const [selectedUris, setSelectedUris] = useState<Set<string>>(new Set());
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (typeof q === 'string') {
      setQuery(q);
    }
  }, [q]);

  useEffect(() => {
    void (async () => {
      if (!initialized) {
        await initialize();
      } else {
        await refreshExplorer(query);
      }
    })();
  }, [initialize, initialized, query, refreshExplorer]);

  const selectedCategoryName = useMemo(() => {
    const selected = categories.find((category) => category.id === selectedCategoryId);
    return selected?.name ?? 'None';
  }, [categories, selectedCategoryId]);

  const sections = useMemo(() => {
    if (query.trim()) {
      return [{ title: 'Search Results', data: explorerFiles }];
    }

    const map: Record<string, ExplorerFileItem[]> = {};
    explorerFiles.forEach((file) => {
      let folderName = 'Root';
      try {
        const parts = decodeURIComponent(file.uri).split('/');
        if (parts.length > 2) folderName = parts[parts.length - 2];
      } catch { }

      if (!map[folderName]) map[folderName] = [];
      map[folderName].push(file);
    });

    return Object.keys(map).sort().map((folder) => ({
      title: folder,
      originalData: map[folder],
      data: expandedFolders.has(folder) ? map[folder] : [],
    }));
  }, [explorerFiles, query, expandedFolders]);

  const toggleFolder = useCallback((folder: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folder)) next.delete(folder);
      else next.add(folder);
      return next;
    });
  }, []);

  const handleToggleSelection = useCallback((uri: string) => {
    setSelectedUris((prev) => {
      const next = new Set(prev);
      if (next.has(uri)) next.delete(uri);
      else next.add(uri);
      return next;
    });
  }, []);

  const handleBookmarkPress = useCallback(async (item: ExplorerFileItem, isBookmarked: boolean) => {
    if (selectedUris.size > 0) return; // Disable single action in batch mode
    if (!selectedCategoryId) {
      Alert.alert('Select a category', 'Choose a category before bookmarking.');
      return;
    }

    try {
      if (isBookmarked) {
        await removeGhostLinkByUri(item.uri, selectedCategoryId);
      } else {
        await bookmarkFile(item, selectedCategoryId);
      }
    } catch (actionError) {
      const message = actionError instanceof Error ? actionError.message : 'Could not update bookmark.';
      Alert.alert('Bookmark action failed', message);
    }
  }, [selectedUris.size, selectedCategoryId, removeGhostLinkByUri, bookmarkFile]);

  const renderItem = useCallback(({ item }: { item: ExplorerFileItem }) => {
    const linksForFile = ghostLinks.filter((link) => link.fileUri === item.uri);
    const isBookmarkedInSelectedCategory = linksForFile.some((link) => link.categoryId === selectedCategoryId);
    const hasBookmarks = linksForFile.length > 0;
    const isSelectedMode = selectedUris.has(item.uri);

    const storageSources = useFileStore.getState().storageSources;
    const isAvailable = item.storageSource === 'internal' || 
      (storageSources.find(s => s.type === item.storageSource)?.isConnected ?? true);

    return (
      <ExplorerFileRow
        item={item}
        colors={colors}
        isSelectedMode={isSelectedMode}
        hasBookmarks={hasBookmarks}
        isBookmarkedInSelectedCategory={isBookmarkedInSelectedCategory}
        onToggleSelection={handleToggleSelection}
        onBookmarkPress={handleBookmarkPress}
        isAvailable={isAvailable}
      />
    );
  }, [ghostLinks, selectedCategoryId, selectedUris, colors, handleToggleSelection, handleBookmarkPress]);

  return (
    <AppScreen style={{ backgroundColor: colors.void }}>
      <View className="mb-4 gap-[4px] px-2 mt-4">
        <Text style={{ color: colors.textPrimary, fontSize: 32, fontWeight: '800' }}>Explorer</Text>
        <Text style={{ color: colors.textSecondary, fontSize: 14, marginTop: 4 }}>
          Browse device storage and cast ghost bookmarks.
        </Text>
      </View>

      <View style={{ backgroundColor: colors.glass04, borderRadius: 999, borderWidth: 1, borderColor: colors.rim, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 16, marginHorizontal: 4 }}>
        <View className="flex-row items-center gap-2">
          <MaterialIcons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search by file name or type..."
            placeholderTextColor={colors.textSecondary}
            style={{ flex: 1, color: colors.textPrimary, fontSize: 15 }}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} className="p-1 -mr-2">
              <MaterialIcons name="close" size={20} color={colors.textSecondary} />
            </Pressable>
          )}
        </View>
      </View>

      <SectionList
        sections={sections as any}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80 }}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={5}
        initialNumToRender={15}
        renderSectionHeader={({ section }) => (
          <Pressable
            onPress={() => {
              if (query.trim()) return;
              toggleFolder(section.title);
            }}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 12,
              paddingHorizontal: 8,
              marginTop: 4,
              backgroundColor: colors.void, // Ensures header blocks out scrolling list properly
              opacity: pressed ? 0.7 : 1
            })}
          >
            {!query.trim() && (
              <View className="mr-2">
                <MaterialIcons
                  name={expandedFolders.has(section.title) ? "keyboard-arrow-down" : "keyboard-arrow-right"}
                  size={20}
                  color={colors.textSecondary}
                />
              </View>
            )}
            <View className="mr-3">
              <MaterialIcons
                name={expandedFolders.has(section.title) ? "folder-open" : "folder"}
                size={22}
                color={colors.warm300}
              />
            </View>
            <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: '700', flex: 1 }} numberOfLines={1}>
              {section.title}
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12, marginLeft: 8 }}>
              {section.originalData?.length ?? section.data.length}
            </Text>
          </Pressable>
        )}
        renderItem={({ item, section }) => (
          <View style={{ paddingLeft: 12 }}>
            {renderItem({ item })}
          </View>
        )}
        ListEmptyComponent={
          (!loading && !error) ? (
            <Text style={{ color: colors.textSecondary, fontSize: 13, textAlign: 'center', marginTop: 32 }}>
              No files found for this query. Try a different name or clear the filter.
            </Text>
          ) : null
        }
      />

      {loading ? <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 8, textAlign: 'center' }}>Scanning storage...</Text> : null}

      {error && !loading ? (
        <View className="flex-1 items-center justify-center p-6">
          <MaterialIcons name="folder-shared" size={64} color={colors.warm300} style={{ opacity: 0.5 }} />
          <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: '800', marginTop: 16, marginBottom: 4, textAlign: 'center' }}>Storage Access Required</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 14, textAlign: 'center', marginBottom: 24, lineHeight: 20 }}>
            Android requires you to explicitly select a folder for Vinyas to scan. This is for your privacy.
          </Text>
          <Pressable
            onPress={async () => {
              await grantAccess();
            }}
            className="rounded-pill px-8 py-3 items-center"
            style={{ backgroundColor: colors.warm500 }}
          >
            <Text style={{ color: colors.void, fontSize: 14, fontWeight: '800' }}>Select Folder</Text>
          </Pressable>
        </View>
      ) : null}

      {selectedUris.size > 0 && (
        <View className="absolute bottom-4 left-4 right-4 items-center">
          <GlassCard
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 16,
              paddingVertical: 12,
              paddingHorizontal: 20,
              borderColor: colors.rim,
              borderWidth: 1,
              backgroundColor: colors.void01,
              elevation: 8,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8
            }}
          >
            <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: '800' }}>{selectedUris.size} selected</Text>

            <View className="flex-row gap-2">
              <Pressable
                className="px-3 py-2 rounded-pill border"
                style={{ backgroundColor: colors.glass10, borderColor: colors.rim }}
                onPress={() => setSelectedUris(new Set())}
              >
                <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '800' }}>Clear</Text>
              </Pressable>
              <Pressable
                className="px-4 py-2 rounded-pill"
                style={{ backgroundColor: colors.warm500 }}
                onPress={async () => {
                  if (!selectedCategoryId) {
                    Alert.alert('Select a category', 'Choose a category to bookmark into.');
                    return;
                  }

                  try {
                    const filesToBookmark = explorerFiles.filter(f => selectedUris.has(f.uri));
                    for (const file of filesToBookmark) {
                      await bookmarkFile(file, selectedCategoryId);
                    }
                    setSelectedUris(new Set());
                    Alert.alert('Batch Complete', `Ghost Bookmarked ${filesToBookmark.length} items`);
                  } catch (e) {
                    Alert.alert('Error', 'Failed to bookmark all items');
                  }
                }}
              >
                <Text style={{ color: colors.void, fontSize: 12, fontWeight: '800' }}>Bookmark All</Text>
              </Pressable>
            </View>
          </GlassCard>
        </View>
      )}
    </AppScreen>
  );
}
