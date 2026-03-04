import { getDatabase } from '../database/db';
import type { GhostLink, ExplorerFileItem } from '../types';
import * as Crypto from 'expo-crypto';

export const GhostLinkService = {
  
  async addBookmark(fileItem: ExplorerFileItem, categoryId: string): Promise<GhostLink> {
    const db = await getDatabase();
    
    const id = `gl-${Crypto.randomUUID()}`;
    const now = new Date().toISOString();
    
    await db.runAsync(
      `INSERT INTO ghost_links 
       (id, category_id, file_uri, file_name, file_size, mime_type, storage_source, is_available, is_kosh, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, 0, ?)`,
      [
        id, 
        categoryId, 
        fileItem.uri, 
        fileItem.name, 
        fileItem.size, 
        fileItem.mimeType, 
        fileItem.storageSource, 
        now
      ]
    );

    return {
      id,
      categoryId,
      fileUri: fileItem.uri,
      fileName: fileItem.name,
      fileSize: fileItem.size,
      mimeType: fileItem.mimeType,
      storageSource: fileItem.storageSource,
      isAvailable: true,
      isKosh: false,
      createdAt: now
    };
  },

  async getAllBookmarks(): Promise<GhostLink[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<GhostLink>('SELECT * FROM ghost_links WHERE is_kosh = 0 ORDER BY created_at DESC');
    return rows;
  },

  async removeBookmark(id: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM ghost_links WHERE id = ?', [id]);
  },
  
  async getCategoryLinkCounts(): Promise<Record<string, number>> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<{category_id: string, count: number}>(
       'SELECT category_id, COUNT(*) as count FROM ghost_links GROUP BY category_id'
    );
    
    const counts: Record<string, number> = {};
    for (const row of rows) {
      counts[row.category_id] = row.count;
    }
    return counts;
  }
};
