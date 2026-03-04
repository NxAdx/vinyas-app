import { useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

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
  const error = useFileStore((state) => state.error);

  const { q } = useLocalSearchParams<{ q?: string }>();
  const [query, setQuery] = useState(q ?? '');

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

  const renderItem = ({ item }: { item: ExplorerFileItem }) => {
    const linksForFile = ghostLinks.filter((link) => link.fileUri === item.uri);
    const isBookmarkedInSelectedCategory = linksForFile.some((link) => link.categoryId === selectedCategoryId);
    const hasBookmarks = linksForFile.length > 0;

    return (
      <GlassCard style={styles.fileCard}>
        <View style={styles.fileTopRow}>
          <Text style={styles.fileName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.fileSize}>{formatBytes(item.size)}</Text>
        </View>
        <Text style={styles.fileMeta}>
          {item.mimeType} • {item.storageSource}
        </Text>
        <Text style={styles.fileMeta}>
          {hasBookmarks ? `${linksForFile.length} bookmark(s)` : 'Not bookmarked'}
        </Text>
        <View style={styles.fileActions}>
          <Pressable
            style={[styles.actionButton, styles.primaryAction]}
            onPress={async () => {
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
            <Text style={styles.primaryActionText}>
              {isBookmarkedInSelectedCategory ? 'Remove' : 'Ghost Bookmark'}
            </Text>
          </Pressable>
        </View>
      </GlassCard>
    );
  };

  return (
    <AppScreen>
      <View style={styles.header}>
        <Text style={styles.title}>Explorer</Text>
        <Text style={styles.subtitle}>Browsing source files and pinning ghost bookmarks.</Text>
      </View>

      <GlassCard>
        <Text style={styles.sectionTitle}>Search files</Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search by file name or type"
          placeholderTextColor={colors.textTertiary}
          style={styles.input}
        />
      </GlassCard>

      <View style={styles.categoryRow}>
        <Text style={styles.categoryLabel}>Category:</Text>
        <Text style={styles.categoryValue}>{selectedCategoryName}</Text>
      </View>

      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
        renderItem={({ item }) => {
          const selected = item.id === selectedCategoryId;
          return (
            <Pressable
              onPress={() => setSelectedCategoryId(item.id)}
              style={[styles.chip, selected ? styles.chipSelected : undefined]}
            >
              <Text style={[styles.chipText, selected ? styles.chipTextSelected : undefined]}>
                {item.name}
              </Text>
            </Pressable>
          );
        }}
      />

      <FlatList
        data={explorerFiles}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.fileList}
        renderItem={renderItem}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            No files found for this query. Try a different name or clear the filter.
          </Text>
        }
      />

      {loading ? <Text style={styles.infoText}>Updating explorer...</Text> : null}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: spacing.md,
    gap: 4,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 26,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
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
    color: colors.textPrimary,
    backgroundColor: colors.glass04,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  categoryRow: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryLabel: {
    color: colors.textTertiary,
    fontSize: 12,
    textTransform: 'uppercase',
  },
  categoryValue: {
    color: colors.warm300,
    fontSize: 12,
    fontWeight: '700',
  },
  chipRow: {
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.rim,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.glass04,
  },
  chipSelected: {
    backgroundColor: 'rgba(217,123,60,0.16)',
    borderColor: 'rgba(217,123,60,0.4)',
  },
  chipText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: colors.warm300,
  },
  fileList: {
    gap: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  fileCard: {
    marginBottom: spacing.sm,
  },
  fileTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  fileName: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  fileSize: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  fileMeta: {
    color: colors.textTertiary,
    fontSize: 12,
    marginTop: 5,
  },
  fileActions: {
    marginTop: spacing.sm,
    flexDirection: 'row',
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
  },
  primaryAction: {
    backgroundColor: colors.warm500,
  },
  primaryActionText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  infoText: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: spacing.sm,
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
    marginTop: spacing.sm,
  },
});
