import type { AnalyticsEvent, GhostLink, StorageSourceType } from '@/src/types';
import { getDatabase, updateDatabase } from '@/src/services/database.service';
import { createId, nowIso } from '@/src/utils/id';

export interface AnalyticsSummary {
  totalBookmarks: number;
  vaultBookmarks: number;
  totalSizeBytes: number;
  bySource: Record<StorageSourceType, number>;
  recentEvents: AnalyticsEvent[];
}

export async function recordEvent(
  eventType: AnalyticsEvent['eventType'],
  options?: {
    categoryId?: string;
    metadata?: string;
  },
): Promise<void> {
  await updateDatabase((db) => ({
    ...db,
    analyticsEvents: [
      ...db.analyticsEvents,
      {
        id: createId('evt'),
        eventType,
        categoryId: options?.categoryId,
        metadata: options?.metadata,
        timestamp: nowIso(),
      },
    ],
  }));
}

function summarizeSources(links: GhostLink[]): Record<StorageSourceType, number> {
  return links.reduce<Record<StorageSourceType, number>>(
    (acc, link) => {
      acc[link.storageSource] += 1;
      return acc;
    },
    {
      internal: 0,
      sd_card: 0,
      usb_otg: 0,
    },
  );
}

export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  const db = await getDatabase();
  const recentEvents = [...db.analyticsEvents]
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, 25);

  return {
    totalBookmarks: db.ghostLinks.length,
    vaultBookmarks: db.ghostLinks.filter((link) => link.isKosh).length,
    totalSizeBytes: db.ghostLinks.reduce((total, link) => total + link.fileSize, 0),
    bySource: summarizeSources(db.ghostLinks),
    recentEvents,
  };
}
