import { useEffect, useMemo, useState } from 'react';
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
import { darkColors, lightColors } from '@/src/theme/tokens';

function formatBytes(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  if (mb < 1) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${mb.toFixed(1)} MB`;
}

export default function ExplorerScreen() {
  const theme = useAppStore((state) => state.theme);
  const colors = theme === 'dark' ? darkColors : lightColors;

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
      } catch {}
      
      if (!map[folderName]) map[folderName] = [];
      map[folderName].push(file);
    });

    return Object.keys(map).sort().map((folder) => ({
      title: folder,
      originalData: map[folder],
      data: expandedFolders.has(folder) ? map[folder] : [],
    }));
  }, [explorerFiles, query, expandedFolders]);

  const toggleFolder = (folder: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folder)) next.delete(folder);
      else next.add(folder);
      return next;
    });
  };

  const renderItem = ({ item }: { item: ExplorerFileItem }) => {
    const linksForFile = ghostLinks.filter((link) => link.fileUri === item.uri);
    const isBookmarkedInSelectedCategory = linksForFile.some((link) => link.categoryId === selectedCategoryId);
    const hasBookmarks = linksForFile.length > 0;
    const isSelectedMode = selectedUris.has(item.uri);

    const toggleSelection = () => {
      setSelectedUris((prev) => {
        const next = new Set(prev);
        if (next.has(item.uri)) {
          next.delete(item.uri);
        } else {
          next.add(item.uri);
        }
        return next;
      });
    };

    return (
      <Pressable
        onLongPress={toggleSelection}
        onPress={() => {
          if (selectedUris.size > 0) {
            toggleSelection();
          }
        }}
        delayLongPress={200}
      >
        <GlassCard 
          style={{ 
            marginBottom: 8, 
            borderColor: isSelectedMode ? colors.warm500 : colors.rim,
            backgroundColor: isSelectedMode ? `${colors.warm500}11` : colors.glass04
          }}
        >
          <View className="flex-row justify-between gap-md">
            <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '700', flex: 1 }} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{formatBytes(item.size)}</Text>
          </View>
          <Text style={{ color: colors.textTertiary, fontSize: 12, marginTop: 5 }}>
            {item.mimeType} • {item.storageSource}
          </Text>
          <Text style={{ color: colors.textTertiary, fontSize: 12, marginTop: 5 }}>
            {hasBookmarks ? `${linksForFile.length} bookmark(s)` : 'Not bookmarked'}
          </Text>
          <View className="mt-2 flex-row">
            <Pressable
              className="px-3 py-2 rounded-pill border"
              style={{ 
                backgroundColor: isBookmarkedInSelectedCategory ? colors.glass10 : colors.warm500,
                borderColor: isBookmarkedInSelectedCategory ? colors.rim : colors.warm500
              }}
              onPress={async () => {
                if (selectedUris.size > 0) return; // Disable single action in batch mode
                if (!selectedCategoryId) {
                  Alert.alert('Select a category', 'Choose a category before bookmarking.');
                  return;
                }

                try {
                  if (isBookmarkedInSelectedCategory) {
                    await removeGhostLinkByUri(item.uri, selectedCategoryId);
                  } else {
                    await bookmarkFile(item, selectedCategoryId);
                  }
                } catch (actionError) {
                  const message =
                    actionError instanceof Error ? actionError.message : 'Could not update bookmark.';
                  Alert.alert('Bookmark action failed', message);
                }
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '800', color: isBookmarkedInSelectedCategory ? colors.textSecondary : colors.void }}>
                {isBookmarkedInSelectedCategory ? 'Remove' : 'Ghost Bookmark'}
              </Text>
            </Pressable>
          </View>
        </GlassCard>
      </Pressable>
    );
  };

  return (
    <AppScreen style={{ backgroundColor: colors.void }}>
      <View className="mb-md gap-[4px]">
        <Text style={{ color: colors.textPrimary, fontSize: 26, fontWeight: '800' }}>Explorer</Text>
        <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 19 }}>Browsing source files and pinning ghost bookmarks.</Text>
      </View>

      <View 
        className="flex-row items-center gap-2 border rounded-pill px-4 py-1"
        style={{ backgroundColor: colors.glass04, borderColor: colors.rim }}
      >
        <MaterialIcons name="search" size={20} color={colors.textTertiary} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search by file name or type..."
          placeholderTextColor={colors.textTertiary}
          style={{ flex: 1, color: colors.textPrimary, paddingVertical: 12, fontSize: 15 }}
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery('')} className="p-2 -mr-2">
            <MaterialIcons name="close" size={20} color={colors.textSecondary} />
          </Pressable>
        )}
      </View>

      <SectionList
        sections={sections as any}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ gap: 2, paddingBottom: 80 }}
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
              marginTop: 4,
              marginBottom: 4,
              gap: 8,
              opacity: pressed ? 0.7 : 1
            })}
          >
            {!query.trim() && (
              <MaterialIcons
                name={expandedFolders.has(section.title) ? "keyboard-arrow-down" : "keyboard-arrow-right"}
                size={20}
                color={colors.textSecondary}
              />
            )}
            <MaterialIcons
              name={expandedFolders.has(section.title) ? "folder-open" : "folder"}
              size={20}
              color={colors.warm300}
            />
            <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '700', flex: 1 }}>
              {section.title}
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
              {section.originalData?.length ?? section.data.length} files
            </Text>
          </Pressable>
        )}
        renderItem={({ item, section }) => (
          <View style={{ paddingLeft: 24, borderLeftWidth: 1, borderLeftColor: colors.rim, marginLeft: 8 }}>
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
              borderColor: colors.warm500,
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
