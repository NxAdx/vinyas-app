export type StorageSourceType = 'internal' | 'sd_card' | 'cloud' | 'usb_otg';

export interface StorageSource {
  id: StorageSourceType;
  name: string;
  totalSize: number;
  usedSize: number;
  isConnected: boolean;
}

export interface FileCategory {
  id: string;
  name: string;
  nameHi?: string;
  count: number;
  size: number; // in bytes
  color: string;
  gradient: [string, string];
  isKosh: boolean;
}

export interface GhostLink {
  id: string;
  categoryId: string;
  fileUri: string;
  fileName: string;
  fileSize: number;
  storageSource: StorageSourceType;
  isKosh: boolean;
  createdAt: string;
}

export interface ActivityItem {
  id: string;
  fileName: string;
  timestamp: string;
  categoryName: string;
}
