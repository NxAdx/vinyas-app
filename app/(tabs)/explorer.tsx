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
import { useFileStore } from '@/src/stores/useFileStore';
import { colors, radius, spacing } from '@/src/theme/tokens';

function formatBytes(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  if (mb < 1) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${mb.toFixed(1)} MB`;
}

export default function ExplorerScreen() {
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
        <GlassCard className={`mb-sm ${isSelectedMode ? 'border-warm500 bg-warm500/10' : ''}`}>
          <View className="flex-row justify-between gap-md">
            <Text className="text-textPrimary text-sm font-bold flex-1" numberOfLines={1}>
              {item.name}
            </Text>
            <Text className="text-textSecondary text-xs">{formatBytes(item.size)}</Text>
          </View>
          <Text className="text-textTertiary text-xs mt-[5px]">
            {item.mimeType} • {item.storageSource}
          </Text>
          <Text className="text-textTertiary text-xs mt-[5px]">
            {hasBookmarks ? `${linksForFile.length} bookmark(s)` : 'Not bookmarked'}
          </Text>
          <View className="mt-sm flex-row">
            <Pressable
              className={`px-3 py-2 rounded-pill ${isSelectedMode ? 'bg-glass10 border-rim' : 'bg-warm500'}`}
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
              <Text className={`text-xs font-bold ${isSelectedMode ? 'text-textSecondary' : 'text-textPrimary'}`}>
                {isBookmarkedInSelectedCategory ? 'Remove' : 'Ghost Bookmark'}
              </Text>
            </Pressable>
          </View>
        </GlassCard>
      </Pressable>
    );
  };

  return (
    <AppScreen>
      <View className="mb-md gap-[4px]">
        <Text className="text-textPrimary text-[26px] font-extrabold">Explorer</Text>
        <Text className="text-textSecondary text-[13px] leading-[19px]">Browsing source files and pinning ghost bookmarks.</Text>
      </View>

      <View className="flex-row items-center gap-2 bg-glass04 border border-rim rounded-chip px-4 py-1">
        <MaterialIcons name="search" size={20} color={colors.textTertiary} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search by file name or type..."
          placeholderTextColor={colors.textTertiary}
          className="flex-1 text-textPrimary py-3 text-[15px]"
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
        contentContainerClassName="gap-[2px] pb-xxl"
        renderSectionHeader={({ section }) => (
          <Pressable
            onPress={() => {
              if (query.trim()) return;
              toggleFolder(section.title);
            }}
            className="flex-row items-center py-sm mt-xs mb-[4px] gap-2 active:opacity-70"
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
            <Text className="text-textPrimary text-sm font-bold flex-1">
              {section.title}
            </Text>
            <Text className="text-textSecondary text-xs">
              {section.originalData?.length ?? section.data.length} files
            </Text>
          </Pressable>
        )}
        renderItem={({ item, section }) => (
          <View className="pl-6 border-l border-rim ml-xs">
            {renderItem({ item })}
          </View>
        )}
        ListEmptyComponent={
          <Text className="text-textSecondary text-[13px] text-center mt-lg">
            No files found for this query. Try a different name or clear the filter.
          </Text>
        }
      />

      {loading ? <Text className="text-textSecondary text-xs mt-sm text-center">Scanning storage...</Text> : null}
      
      {error && !loading ? (
        <View className="flex-1 items-center justify-center mt-xl px-md">
          <MaterialIcons name="folder-shared" size={64} color={colors.warm300} style={{ opacity: 0.5 }} />
          <Text className="text-textPrimary text-[18px] font-bold mt-md mb-xs text-center">Storage Access Required</Text>
          <Text className="text-textSecondary text-[14px] text-center mb-lg leading-[20px]">
            Vinyas needs permission to read a folder to find files. This is usually your Internal Storage or SD Card.
          </Text>
          <Pressable
            onPress={async () => {
              await grantAccess();
            }}
            className="bg-warm500 rounded-pill px-6 py-3 items-center active:bg-warm300"
          >
            <Text className="text-void text-sm font-bold">Grant Access</Text>
          </Pressable>
        </View>
      ) : null}

      {selectedUris.size > 0 && (
        <View className="absolute bottom-4 left-4 right-4 items-center">
          <GlassCard className="flex-row items-center gap-md py-3 px-lg shadow-black/50 shadow-lg border-warm500 bg-void01">
            <Text className="text-textPrimary text-[15px] font-extrabold">{selectedUris.size} selected</Text>
            
            <View className="flex-row gap-2">
              <Pressable
                className="px-3 py-2 rounded-pill bg-glass10 border border-rim"
                onPress={() => setSelectedUris(new Set())}
              >
                <Text className="text-textSecondary text-xs font-bold">Clear</Text>
              </Pressable>
              <Pressable
                className="px-4 py-2 rounded-pill bg-warm500"
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
                <Text className="text-textPrimary text-xs font-bold">Bookmark All</Text>
              </Pressable>
            </View>
          </GlassCard>
        </View>
      )}
    </AppScreen>
  );
}
