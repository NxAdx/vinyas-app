import { useLocalSearchParams, useRouter } from 'expo-router';
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
import { useFileStore } from '@/src/stores/useFileStore';
import { useVaultStore } from '@/src/stores/useVaultStore';
import { colors, radius, spacing } from '@/src/theme/tokens';

export default function CategoryDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const categoryId = params.id;

  const initialized = useFileStore((state) => state.initialized);
  const initialize = useFileStore((state) => state.initialize);
  const refreshData = useFileStore((state) => state.refreshData);
  const categories = useFileStore((state) => state.categories);
  const ghostLinks = useFileStore((state) => state.ghostLinks);
  const removeGhostLink = useFileStore((state) => state.removeGhostLink);
  const loading = useFileStore((state) => state.loading);
  const error = useFileStore((state) => state.error);

  const unlocked = useVaultStore((state) => state.unlocked);
  const hydrateVault = useVaultStore((state) => state.hydrate);
  const addEntry = useVaultStore((state) => state.addEntry);
  const removeEntry = useVaultStore((state) => state.removeEntry);

  const [query, setQuery] = useState('');

  useEffect(() => {
    void (async () => {
      if (!initialized) {
        await initialize();
      } else {
        await refreshData();
      }
      await hydrateVault();
    })();
  }, [hydrateVault, initialize, initialized, refreshData]);

  const category = categories.find((item) => item.id === categoryId);
  const filteredLinks = useMemo(() => {
    const lower = query.trim().toLowerCase();
    return ghostLinks.filter((link) => {
      if (link.categoryId !== categoryId) {
        return false;
      }
      if (!lower) {
        return true;
      }
      return (
        link.fileName.toLowerCase().includes(lower) ||
        link.mimeType.toLowerCase().includes(lower) ||
        link.storageSource.toLowerCase().includes(lower)
      );
    });
  }, [categoryId, ghostLinks, query]);

  return (
    <AppScreen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{category?.name ?? 'Category'}</Text>
          <Text style={styles.subtitle}>Ghost links pinned under this category.</Text>
        </View>

        <GlassCard>
          <Text style={styles.sectionTitle}>Filter links</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search file name/type"
            placeholderTextColor={colors.textTertiary}
            style={styles.input}
          />
        </GlassCard>

        {filteredLinks.length === 0 ? (
          <GlassCard>
            <Text style={styles.emptyText}>No bookmarks in this category yet.</Text>
          </GlassCard>
        ) : (
          filteredLinks.map((link) => (
            <GlassCard key={link.id}>
              <Text style={styles.linkTitle} numberOfLines={1}>
                {link.fileName}
              </Text>
              <Text style={styles.linkMeta}>
                {link.mimeType} • {link.storageSource} • {link.isKosh ? 'Kosh' : 'Standard'}
              </Text>
              <View style={styles.row}>
                <Pressable
                  onPress={async () => {
                    await removeGhostLink(link.id);
                  }}
                  style={styles.removeButton}
                >
                  <Text style={styles.removeButtonText}>Remove</Text>
                </Pressable>

                {link.isKosh ? (
                  <Pressable
                    onPress={async () => {
                      if (!unlocked) {
                        Alert.alert('Vault locked', 'Unlock Kosh first before removing an entry.');
                        return;
                      }
                      await removeEntry(link.id);
                      await refreshData();
                    }}
                    style={styles.koshButton}
                  >
                    <Text style={styles.koshButtonText}>Remove Kosh</Text>
                  </Pressable>
                ) : (
                  <Pressable
                    onPress={async () => {
                      if (!unlocked) {
                        Alert.alert(
                          'Vault locked',
                          'Open Kosh tab and unlock the vault before adding secure entries.',
                          [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Open Kosh', onPress: () => router.push('/(tabs)/vault') },
                          ],
                        );
                        return;
                      }

                      await addEntry(link.id);
                      await refreshData();
                    }}
                    style={styles.koshButton}
                  >
                    <Text style={styles.koshButtonText}>Move to Kosh</Text>
                  </Pressable>
                )}
              </View>
            </GlassCard>
          ))
        )}

        {loading ? <Text style={styles.infoText}>Updating category...</Text> : null}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  header: {
    gap: 4,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
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
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  linkTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  linkMeta: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  row: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  removeButton: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,71,87,0.4)',
    backgroundColor: 'rgba(255,71,87,0.16)',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  removeButtonText: {
    color: '#FF9EA6',
    fontSize: 12,
    fontWeight: '700',
  },
  koshButton: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(0,229,204,0.35)',
    backgroundColor: 'rgba(0,229,204,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  koshButtonText: {
    color: colors.tealGlow,
    fontSize: 12,
    fontWeight: '700',
  },
  infoText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
  },
});
