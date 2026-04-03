import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import type { ExplorerFileItem } from '../types';

const SAF_URI_FILE = ((FileSystem as any).documentDirectory || '') + 'saf_uri.txt';

export const FileService = {
  async getSavedUri(): Promise<string | null> {
    try {
      const info = await FileSystem.getInfoAsync(SAF_URI_FILE);
      if (info.exists) {
        return await FileSystem.readAsStringAsync(SAF_URI_FILE);
      }
    } catch { }
    return null;
  },

  async requestPermissions(force = false): Promise<boolean> {
    try {
      // 1. Request MediaLibrary permissions for fast media scanning
      const mediaStatus = await MediaLibrary.requestPermissionsAsync();
      if (mediaStatus.status !== 'granted') {
        console.warn('MediaLibrary permission denied');
      }

      // 2. Request SAF permissions for documents/downloads
      if (!force) {
        const existingUri = await this.getSavedUri();
        if (existingUri) return true;
      }

      // We use 'any' to bypass TS errors since this is available at runtime in older Expo/SDKs 
      const saf = (FileSystem as any).StorageAccessFramework;
      if (!saf) {
        console.warn('SAF missing in this environment');
        return false;
      }
      
      const permissions = await saf.requestDirectoryPermissionsAsync();
      if (permissions.granted) {
        await FileSystem.writeAsStringAsync(SAF_URI_FILE, permissions.directoryUri);
        return true;
      }
      return false;
    } catch (e) {
      console.error('SAF Permission Error:', e);
      return false;
    }
  },

  async scanDeviceStorage(query?: string): Promise<ExplorerFileItem[]> {
    let results: ExplorerFileItem[] = [];

    // 1. Fetch Media natively instantly
    try {
      const mediaStatus = await MediaLibrary.getPermissionsAsync();
      if (mediaStatus.granted) {
        const fetchMedia = async (mediaType: MediaLibrary.MediaTypeValue) => {
          const assets = await MediaLibrary.getAssetsAsync({ mediaType, first: 200, sortBy: [[MediaLibrary.SortBy.modificationTime, false]] });
          return assets.assets.map(asset => {
            let mimeType = 'application/octet-stream';
            if (mediaType === MediaLibrary.MediaType.photo) mimeType = 'image/jpeg';
            else if (mediaType === MediaLibrary.MediaType.video) mimeType = 'video/mp4';
            else if (mediaType === MediaLibrary.MediaType.audio) mimeType = 'audio/mpeg';

            return {
              id: asset.id,
              name: asset.filename,
              uri: asset.uri,
              size: 0, 
              mimeType,
              modifiedAt: new Date(asset.modificationTime).toISOString(),
              storageSource: 'internal' as const
            };
          });
        };

        const [photos, videos, audio] = await Promise.all([
          fetchMedia(MediaLibrary.MediaType.photo),
          fetchMedia(MediaLibrary.MediaType.video),
          fetchMedia(MediaLibrary.MediaType.audio)
        ]);

        results = [...results, ...photos, ...videos, ...audio];
      }
    } catch (e) {
      console.error('MediaLibrary scanning failed:', e);
    }

    // 2. Fetch SAF
    let hasPermission = await this.requestPermissions(false);
    if (hasPermission) {
      try {
        let directoryUri = await this.getSavedUri();
        if (directoryUri) {
          const saf = (FileSystem as any).StorageAccessFramework;
          if (!saf) throw new Error('SAF not supported');
          const filesRefs = await saf.readDirectoryAsync(directoryUri);
          const itemsToFetch = filesRefs.slice(0, 150);

          const resolvedInfos = await Promise.all(
            itemsToFetch.map((uri: string) => FileSystem.getInfoAsync(uri))
          );

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

            // Deduplicate if already picked by MediaLibrary
            if (!results.some(r => r.name === actualName)) {
              results.push({
                id: uri,
                name: actualName,
                uri: uri,
                size: info.size || 0,
                mimeType,
                modifiedAt: info.modificationTime ? new Date(info.modificationTime * 1000).toISOString() : new Date().toISOString(),
                storageSource: actualName.includes('emulated') ? 'internal' : 'sd_card'
              });
            }
          });
        }
      } catch (e) {
        console.error('SAF Scan Error:', e);
        try { await FileSystem.deleteAsync(SAF_URI_FILE, { idempotent: true }); } catch { }
      }
    } else {
        // We do not strictly throw here because MediaLibrary might be granted. We fallback gracefully.
        console.warn('SAF access denied/missing. Only returning MediaLibrary results.');
    }

    // Apply strict sorting or query filtering
    if (query) {
      const q = query.toLowerCase();
      results = results.filter(r => r.name.toLowerCase().includes(q));
    } else {
      results.sort((a, b) => new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime());
    }

    return results;
  },

  async checkVolumeConnectivity(): Promise<boolean> {
    try {
      const uri = await this.getSavedUri();
      if (!uri) return false;
      const info = await FileSystem.getInfoAsync(uri);
      return info.exists;
    } catch {
      return false;
    }
  }
};
