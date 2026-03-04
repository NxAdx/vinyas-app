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
import { useAppStore } from '@/src/stores/useAppStore';
import { THEME_DARK, THEME_LIGHT } from '../../src/theme/tokens';

export default function CategoryDetailScreen() {
  const router = useRouter();
  const theme = useAppStore((state) => state.theme);
  const colors = theme === 'dark' ? THEME_DARK : THEME_LIGHT;

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
    <AppScreen style={{ backgroundColor: colors.void }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingBottom: 44 }}>
        <View className="gap-1">
          <Text style={{ color: colors.textPrimary, fontSize: 24, fontWeight: '800' }}>{category?.name ?? 'Other category'}</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 18 }}>
            {categoryId === 'cat-other'
              ? 'Uncategorized items and recently accessed files.'
              : 'Ghost links pinned under this category.'}
          </Text>
        </View>

        <GlassCard>
          <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: '700', marginBottom: 8 }}>Filter links</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search file name/type"
            placeholderTextColor={colors.textTertiary}
            style={{
              borderWidth: 1,
              borderColor: colors.rim,
              borderRadius: 24,
              color: colors.textPrimary,
              backgroundColor: colors.glass04,
              paddingHorizontal: 16,
              paddingVertical: 12
            }}
          />
        </GlassCard>

        {filteredLinks.length === 0 ? (
          <GlassCard>
            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>No bookmarks in this category yet.</Text>
          </GlassCard>
        ) : (
          filteredLinks.map((link) => (
            <GlassCard key={link.id}>
              <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '700' }} numberOfLines={1}>
                {link.fileName}
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }}>
                {link.mimeType} • {link.storageSource} • {link.isKosh ? 'Kosh' : 'Standard'}
              </Text>
              <View className="flex-row gap-2 mt-4">
                <Pressable
                  onPress={async () => {
                    await removeGhostLink(link.id);
                  }}
                  className="rounded-pill border px-4 py-2"
                  style={{ backgroundColor: `${colors.warm500}11`, borderColor: `${colors.warm500}33` }}
                >
                  <Text style={{ color: colors.warm300, fontSize: 12, fontWeight: '700' }}>Remove</Text>
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
                    className="rounded-pill border px-4 py-2"
                    style={{ backgroundColor: `${colors.tealGlow}11`, borderColor: `${colors.tealGlow}33` }}
                  >
                    <Text style={{ color: colors.tealGlow, fontSize: 12, fontWeight: '700' }}>Remove Kosh</Text>
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
                    className="rounded-pill border px-4 py-2"
                    style={{ backgroundColor: `${colors.tealGlow}11`, borderColor: `${colors.tealGlow}33` }}
                  >
                    <Text style={{ color: colors.tealGlow, fontSize: 12, fontWeight: '700' }}>Move to Kosh</Text>
                  </Pressable>
                )}
              </View>
            </GlassCard>
          ))
        )}

        {loading ? <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Updating category...</Text> : null}
        {error ? <Text style={{ color: colors.danger, fontSize: 12 }}>{error}</Text> : null}
      </ScrollView>
    </AppScreen>
  );
}

