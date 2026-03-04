import * as MediaLibrary from 'expo-media-library';
import type { ExplorerFileItem } from '../types';

export const FileService = {
  
  async requestPermissions(): Promise<boolean> {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    return status === 'granted';
  },

  async scanDeviceStorage(query?: string): Promise<ExplorerFileItem[]> {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      throw new Error('Storage permission denied. Vinyas cannot explore local files.');
    }

    // Attempt to fetch media files (images, videos, audio)
    // For wider file access (docs, pdfs) on Android 11+, SAF (react-native-document-picker) is needed
    // Assuming media library for MVP Explorer mapping
    
    const media = await MediaLibrary.getAssetsAsync({
      first: 50,
      mediaType: [MediaLibrary.MediaType.photo, MediaLibrary.MediaType.video, MediaLibrary.MediaType.audio],
      sortBy: [MediaLibrary.SortBy.creationTime]
    });

    let results = media.assets.map(asset => ({
      id: asset.id,
      name: asset.filename,
      uri: asset.uri,
      size: asset.width * asset.height, // fallback approximation if size unavailable
      mimeType: asset.mediaType === 'photo' ? 'image/jpeg' : asset.mediaType === 'video' ? 'video/mp4' : 'audio/mpeg',
      modifiedAt: new Date(asset.creationTime).toISOString(),
      storageSource: 'internal' as const
    }));

    if (query) {
      const q = query.toLowerCase();
      results = results.filter(r => r.name.toLowerCase().includes(q));
    }

    return results;
  }
};
