import * as FileSystem from 'expo-file-system';
import type { ExplorerFileItem } from '../types';

const {
  documentDirectory,
  StorageAccessFramework,
  getInfoAsync,
  readAsStringAsync,
  writeAsStringAsync,
  deleteAsync
} = FileSystem as any;

const SAF_URI_FILE = documentDirectory + 'saf_uri.txt';

export const FileService = {
  
  async getSavedUri(): Promise<string | null> {
    try {
      const info = await getInfoAsync(SAF_URI_FILE);
      if (info.exists) {
        return await readAsStringAsync(SAF_URI_FILE);
      }
    } catch {}
    return null;
  },

  async requestPermissions(force = false): Promise<boolean> {
    try {
      if (!force) {
        const existingUri = await this.getSavedUri();
        if (existingUri) return true;
      }

      const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync();
      
      if (permissions.granted) {
        await writeAsStringAsync(SAF_URI_FILE, permissions.directoryUri);
        return true;
      }
      return false;
    } catch (e) {
      console.error('SAF Permission Error:', e);
      return false;
    }
  },

  async scanDeviceStorage(query?: string): Promise<ExplorerFileItem[]> {
    let hasPermission = await this.requestPermissions(false);
    if (!hasPermission) {
      throw new Error('Storage permission denied. Please grant access to a folder.');
    }

    try {
      let directoryUri = await this.getSavedUri();
      if (!directoryUri) {
        hasPermission = await this.requestPermissions(true);
        if (!hasPermission) throw new Error('No directory URI found.');
        directoryUri = await this.getSavedUri();
      }

      if (!directoryUri) throw new Error('Failed to obtain storage URI.');

      const filesRefs = await StorageAccessFramework.readDirectoryAsync(directoryUri);
      
      const itemsToFetch = filesRefs.slice(0, 150);
      
      const resolvedInfos = await Promise.all(
        itemsToFetch.map((uri: string) => getInfoAsync(uri))
      );

      let results: ExplorerFileItem[] = [];

      itemsToFetch.forEach((uri: string, idx: number) => {
        const info = resolvedInfos[idx];
        if (!info.exists || info.isDirectory) return;

        const namePart = decodeURIComponent(uri.split('/').pop() || '');
        const actualName = namePart.split(':').pop() || namePart;
        
        let mimeType = 'application/octet-stream';
        const lowerName = actualName.toLowerCase();
        if (lowerName.endsWith('.pdf')) mimeType = 'application/pdf';
        else if (lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg') || lowerName.endsWith('.png')) mimeType = 'image/jpeg';
        else if (lowerName.endsWith('.mp4') || lowerName.endsWith('.mkv')) mimeType = 'video/mp4';
        else if (lowerName.endsWith('.mp3') || lowerName.endsWith('.wav')) mimeType = 'audio/mpeg';
        else if (lowerName.endsWith('.apk')) mimeType = 'application/vnd.android.package-archive';
        else if (lowerName.endsWith('.zip')) mimeType = 'application/zip';

        results.push({
           id: uri,
           name: actualName,
           uri: uri,
           size: info.size || 0,
           mimeType,
           modifiedAt: info.modificationTime ? new Date(info.modificationTime * 1000).toISOString() : new Date().toISOString(),
           storageSource: actualName.includes('emulated') ? 'internal' : 'sd_card'
        });
      });

      if (query) {
        const q = query.toLowerCase();
        results = results.filter(r => r.name.toLowerCase().includes(q));
      }

      return results;
    } catch (e) {
      console.error('Error scanning SAF:', e);
      try { await deleteAsync(SAF_URI_FILE, { idempotent: true }); } catch {}
      throw new Error('Failed to load storage files. Please try granting folder access again.');
    }
  }
};
