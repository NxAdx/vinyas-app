import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppScreen } from '@/src/components/AppScreen';
import { GlassCard } from '@/src/components/GlassCard';
import { getAnalyticsSummary, type AnalyticsSummary } from '@/src/services/analytics.service';
import { useFileStore } from '@/src/stores/useFileStore';
import { colors, radius, spacing } from '@/src/theme/tokens';

function formatBytes(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  if (mb < 1024) {
    return `${mb.toFixed(1)} MB`;
  }
  return `${(mb / 1024).toFixed(2)} GB`;
}

export default function AnalyticsScreen() {
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
    <AppScreen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="gap-md pb-xxl">
        <View className="gap-1">
          <Text className="text-textPrimary text-[26px] font-extrabold">Analytics</Text>
          <Text className="text-textSecondary text-[13px] leading-[19px]">Local-only usage summary from your ghost bookmarks.</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-sm py-sm"
        >
          <GlassCard className="min-w-[120px]">
            <Text className="text-textTertiary text-xs mb-1 uppercase">Bookmarks</Text>
            <Text className="text-textPrimary text-[20px] font-extrabold">{summary?.totalBookmarks ?? ghostLinks.length}</Text>
          </GlassCard>
          <GlassCard className="min-w-[120px]">
            <Text className="text-textTertiary text-xs mb-1 uppercase">Kosh</Text>
            <Text className="text-textPrimary text-[20px] font-extrabold">{summary?.vaultBookmarks ?? 0}</Text>
          </GlassCard>
        </ScrollView>

        <GlassCard>
          <Text className="text-textPrimary text-[15px] font-bold mb-sm">Total bookmarked size</Text>
          <Text className="text-warm300 text-[22px] font-extrabold">{formatBytes(summary?.totalSizeBytes ?? 0)}</Text>
        </GlassCard>

        <GlassCard>
          <Text className="text-textPrimary text-[15px] font-bold mb-sm">Category distribution</Text>
          <View className="gap-sm">
            {categoryBreakdown.map((item) => (
              <View key={item.id} className="gap-[6px]">
                <View className="flex-row justify-between">
                  <Text className="text-textSecondary text-xs">{item.name}</Text>
                  <Text className="text-warm300 text-xs font-bold">{item.count}</Text>
                </View>
                <View className="w-full h-2 rounded-pill bg-glass04 overflow-hidden">
                  <View className="h-full rounded-pill bg-warm500" style={{ width: `${Math.max(4, item.ratio * 100)}%` }} />
                </View>
              </View>
            ))}
          </View>
        </GlassCard>

        <GlassCard>
          <Text className="text-textPrimary text-[15px] font-bold mb-sm">Storage sources</Text>
          {storageSources.map((source) => (
            <View key={source.type} className="flex-row justify-between py-[7px] border-b border-rim">
              <Text className="text-textSecondary text-xs uppercase">{source.type}</Text>
              <Text className="text-textPrimary text-xs font-bold">{source.isConnected ? 'Connected' : 'Disconnected'}</Text>
            </View>
          ))}
        </GlassCard>

        <GlassCard>
          <Text className="text-textPrimary text-[15px] font-bold mb-sm">Recent events</Text>
          {summary?.recentEvents?.length ? (
            summary.recentEvents.slice(0, 10).map((event) => (
              <View key={event.id} className="py-[7px] border-b border-rim">
                <Text className="text-textPrimary text-xs font-bold capitalize">{event.eventType}</Text>
                <Text className="text-textTertiary text-[11px] mt-[2px]">{new Date(event.timestamp).toLocaleString()}</Text>
              </View>
            ))
          ) : (
            <Text className="text-textSecondary text-xs">
              {loadingSummary ? 'Loading activity...' : 'No analytics events yet.'}
            </Text>
          )}
        </GlassCard>
      </ScrollView>
    </AppScreen>
  );
}
