export type StorageSourceType = 'internal' | 'sd_card' | 'usb_otg';

export interface Category {
  id: string;
  name: string;
  nameHi?: string;
  icon: string;
  gradient: [string, string];
  sortOrder: number;
  isSystem: boolean;
  isKosh: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GhostLink {
  id: string;
  categoryId: string;
  fileUri: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  storageSource: StorageSourceType;
  thumbnailUri?: string;
  isAvailable: boolean;
  isKosh: boolean;
  lastAccessed?: string;
  createdAt: string;
}

export interface ExplorerFileItem {
  id: string;
  name: string;
  uri: string;
  size: number;
  mimeType: string;
  modifiedAt: string;
  storageSource: StorageSourceType;
}

export interface AnalyticsEvent {
  id: string;
  eventType: 'bookmark' | 'remove' | 'search' | 'vault_access' | 'vault_add' | 'vault_remove';
  categoryId?: string;
  timestamp: string;
  metadata?: string;
}

export interface KoshEntry {
  id: string;
  ghostLinkId: string;
  encryptedData: string;
  createdAt: string;
}

export interface VaultState {
  passcodeHash: string | null;
  lastUnlockedAt?: string;
}

export interface VinyasDatabase {
  version: number;
  categories: Category[];
  ghostLinks: GhostLink[];
  koshEntries: KoshEntry[];
  analyticsEvents: AnalyticsEvent[];
  vault: VaultState;
  updatedAt: string;
}
