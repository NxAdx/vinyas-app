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
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Analytics</Text>
          <Text style={styles.subtitle}>Local-only usage summary from your ghost bookmarks.</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.metricsRow}
        >
          <GlassCard style={styles.metricCard}>
            <Text style={styles.metricLabel}>Bookmarks</Text>
            <Text style={styles.metricValue}>{summary?.totalBookmarks ?? ghostLinks.length}</Text>
          </GlassCard>
          <GlassCard style={styles.metricCard}>
            <Text style={styles.metricLabel}>Kosh</Text>
            <Text style={styles.metricValue}>{summary?.vaultBookmarks ?? 0}</Text>
          </GlassCard>
        </ScrollView>

        <GlassCard>
          <Text style={styles.sectionTitle}>Total bookmarked size</Text>
          <Text style={styles.sectionValue}>{formatBytes(summary?.totalSizeBytes ?? 0)}</Text>
        </GlassCard>

        <GlassCard>
          <Text style={styles.sectionTitle}>Category distribution</Text>
          <View style={styles.breakdownWrap}>
            {categoryBreakdown.map((item) => (
              <View key={item.id} style={styles.breakdownItem}>
                <View style={styles.breakdownHeader}>
                  <Text style={styles.breakdownLabel}>{item.name}</Text>
                  <Text style={styles.breakdownValue}>{item.count}</Text>
                </View>
                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${Math.max(4, item.ratio * 100)}%` }]} />
                </View>
              </View>
            ))}
          </View>
        </GlassCard>

        <GlassCard>
          <Text style={styles.sectionTitle}>Storage sources</Text>
          {storageSources.map((source) => (
            <View key={source.type} style={styles.sourceRow}>
              <Text style={styles.sourceName}>{source.type}</Text>
              <Text style={styles.sourceValue}>{source.isConnected ? 'Connected' : 'Disconnected'}</Text>
            </View>
          ))}
        </GlassCard>

        <GlassCard>
          <Text style={styles.sectionTitle}>Recent events</Text>
          {summary?.recentEvents?.length ? (
            summary.recentEvents.slice(0, 10).map((event) => (
              <View key={event.id} style={styles.eventRow}>
                <Text style={styles.eventType}>{event.eventType}</Text>
                <Text style={styles.eventMeta}>{new Date(event.timestamp).toLocaleString()}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>
              {loadingSummary ? 'Loading activity...' : 'No analytics events yet.'}
            </Text>
          )}
        </GlassCard>
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
    fontSize: 26,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  metricsRow: {
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  metricCard: {
    minWidth: 120,
    padding: spacing.md,
  },
  metricLabel: {
    color: colors.textTertiary,
    fontSize: 12,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  metricValue: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  sectionValue: {
    color: colors.warm300,
    fontSize: 22,
    fontWeight: '800',
  },
  breakdownWrap: {
    gap: spacing.sm,
  },
  breakdownItem: {
    gap: 6,
  },
  breakdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  breakdownLabel: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  breakdownValue: {
    color: colors.warm300,
    fontSize: 12,
    fontWeight: '700',
  },
  track: {
    width: '100%',
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.glass04,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.pill,
    backgroundColor: colors.warm500,
  },
  sourceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 7,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.rim,
  },
  sourceName: {
    color: colors.textSecondary,
    fontSize: 12,
    textTransform: 'uppercase',
  },
  sourceValue: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  eventRow: {
    paddingVertical: 7,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.rim,
  },
  eventType: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  eventMeta: {
    color: colors.textTertiary,
    fontSize: 11,
    marginTop: 2,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
});
