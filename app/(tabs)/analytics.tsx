import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppScreen } from '@/src/components/AppScreen';
import { GlassCard } from '@/src/components/GlassCard';
import { getAnalyticsSummary, type AnalyticsSummary } from '@/src/services/analytics.service';
import { useFileStore } from '@/src/stores/useFileStore';
import { useAppStore } from '@/src/stores/useAppStore';
import { THEME_DARK, THEME_LIGHT } from '../../src/theme/tokens';

function formatBytes(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  if (mb < 1024) {
    return `${mb.toFixed(1)} MB`;
  }
  return `${(mb / 1024).toFixed(2)} GB`;
}

export default function AnalyticsScreen() {
  const theme = useAppStore((state) => state.theme);
  const colors = theme === 'dark' ? THEME_DARK : THEME_LIGHT;

  const initialized = useFileStore((state) => state.initialized);
  const initialize = useFileStore((state) => state.initialize);
  const categories = useFileStore((state) => state.categories);
  const ghostLinks = useFileStore((state) => state.ghostLinks);
  const storageSources = useFileStore((state) => state.storageSources);
  const refreshData = useFileStore((state) => state.refreshData);

  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  useEffect(() => {
    void (async () => {
      if (!initialized) {
        await initialize();
      } else {
        await refreshData();
      }
    })();
  }, [initialize, initialized, refreshData]);

  useEffect(() => {
    void (async () => {
      setLoadingSummary(true);
      const nextSummary = await getAnalyticsSummary();
      setSummary(nextSummary);
      setLoadingSummary(false);
    })();
  }, [ghostLinks.length]);

  const categoryBreakdown = useMemo(() => {
    const total = ghostLinks.length || 1;
    return categories.map((category) => {
      const count = ghostLinks.filter((link) => link.categoryId === category.id).length;
      return {
        id: category.id,
        name: category.name,
        count,
        ratio: count / total,
      };
    });
  }, [categories, ghostLinks]);

  return (
    <AppScreen style={{ backgroundColor: colors.void }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingBottom: 44 }}>
        <View className="gap-1">
          <Text style={{ color: colors.textPrimary, fontSize: 26, fontWeight: '800' }}>Analytics</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 19 }}>Local-only usage summary from your ghost bookmarks.</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 12, paddingVertical: 12 }}
        >
          <GlassCard style={{ minWidth: 120 }}>
            <Text style={{ color: colors.textTertiary, fontSize: 12, marginBottom: 4, textTransform: 'uppercase' }}>Bookmarks</Text>
            <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: '800' }}>{summary?.totalBookmarks ?? ghostLinks.length}</Text>
          </GlassCard>
          <GlassCard style={{ minWidth: 120 }}>
            <Text style={{ color: colors.textTertiary, fontSize: 12, marginBottom: 4, textTransform: 'uppercase' }}>Kosh</Text>
            <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: '800' }}>{summary?.vaultBookmarks ?? 0}</Text>
          </GlassCard>
        </ScrollView>

        <GlassCard>
          <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: '700', marginBottom: 8 }}>Total bookmarked size</Text>
          <Text style={{ color: colors.warm300, fontSize: 22, fontWeight: '800' }}>{formatBytes(summary?.totalSizeBytes ?? 0)}</Text>
        </GlassCard>

        <GlassCard>
          <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: '700', marginBottom: 12 }}>Category distribution</Text>
          <View className="gap-3">
            {categoryBreakdown.map((item) => (
              <View key={item.id} className="gap-[6px]">
                <View className="flex-row justify-between">
                  <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{item.name}</Text>
                  <Text style={{ color: colors.warm300, fontSize: 12, fontWeight: '700' }}>{item.count}</Text>
                </View>
                <View style={{ width: '100%', height: 8, borderRadius: 4, backgroundColor: colors.glass04, overflow: 'hidden' }}>
                  <View style={{ height: '100%', borderRadius: 4, backgroundColor: colors.warm500, width: `${Math.max(4, item.ratio * 100)}%` }} />
                </View>
              </View>
            ))}
          </View>
        </GlassCard>

        <GlassCard>
          <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: '700', marginBottom: 12 }}>Storage sources</Text>
          {storageSources.map((source) => (
            <View key={source.type} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: colors.rim }}>
              <Text style={{ color: colors.textSecondary, fontSize: 12, textTransform: 'uppercase' }}>{source.type}</Text>
              <Text style={{ color: colors.textPrimary, fontSize: 12, fontWeight: '700' }}>{source.isConnected ? 'Connected' : 'Disconnected'}</Text>
            </View>
          ))}
        </GlassCard>

        <GlassCard>
          <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: '700', marginBottom: 12 }}>Recent events</Text>
          {summary?.recentEvents?.length ? (
            summary.recentEvents.slice(0, 10).map((event) => (
              <View key={event.id} style={{ paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: colors.rim }}>
                <Text style={{ color: colors.textPrimary, fontSize: 12, fontWeight: '700', textTransform: 'capitalize' }}>{event.eventType}</Text>
                <Text style={{ color: colors.textTertiary, fontSize: 11, marginTop: 2 }}>{new Date(event.timestamp).toLocaleString()}</Text>
              </View>
            ))
          ) : (
            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
              {loadingSummary ? 'Loading activity...' : 'No analytics events yet.'}
            </Text>
          )}
        </GlassCard>
      </ScrollView>
    </AppScreen>
  );
}
