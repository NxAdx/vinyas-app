import { create } from 'zustand';
import type { Category, GhostLink, ExplorerFileItem, StorageSourceType } from '../types';
import { getDatabase, initDatabase } from '../database/db';

interface FileState {
  initialized: boolean;
  loading: boolean;
  error: string | null;
  categories: Category[];
  ghostLinks: GhostLink[];
  explorerFiles: ExplorerFileItem[];
  storageSources: { type: StorageSourceType; isConnected: boolean }[];
  selectedCategoryId: string | null;
  hasStoragePermission: boolean;
  
  checkPermissions: () => Promise<void>;
  initialize: () => Promise<void>;
  refreshData: () => Promise<void>;
  refreshExplorer: (query?: string) => Promise<void>;
  grantAccess: () => Promise<void>;
  createNewCategory: (name: string) => Promise<void>;
  setSelectedCategoryId: (id: string | null) => void;
  bookmarkFile: (item: ExplorerFileItem, categoryId: string) => Promise<void>;
  removeGhostLinkByUri: (uri: string, categoryId: string) => Promise<void>;
  removeGhostLink: (id: string) => Promise<void>;
  resetAllData: () => Promise<void>;
  syncDeviceFiles: () => Promise<void>;
  checkStorageConnectivity: () => Promise<void>;
}

export const useFileStore = create<FileState>((set, get) => ({
  initialized: false,
  loading: false,
  error: null,
  selectedCategoryId: null,
  hasStoragePermission: false,
  storageSources: [
    { type: 'internal', isConnected: true },
    { type: 'sd_card', isConnected: false },
    { type: 'usb_otg', isConnected: false }
  ],
  categories: [],
  ghostLinks: [],
  explorerFiles: [],

  initialize: async () => {
    set({ loading: true, error: null });
    try {
      await initDatabase();
      const db = getDatabase();
      
      const cats = await db.getAllAsync<Category>('SELECT * FROM categories ORDER BY sort_order ASC');
      const links = await db.getAllAsync<GhostLink>('SELECT * FROM ghost_links ORDER BY created_at DESC');

      const mappedCats = cats.map((c: any) => ({
        ...c,
        id: c.id,
        name: c.name,
        icon: c.icon,
        gradient: JSON.parse(c.gradient || '[]'),
        sortOrder: c.sort_order,
        isSystem: Boolean(c.is_system),
        isKosh: Boolean(c.is_kosh)
      }));

      const mappedLinks = links.map((l: any) => ({
        ...l,
        categoryId: l.category_id,
        fileUri: l.file_uri,
        fileName: l.file_name,
        fileSize: l.file_size,
        mimeType: l.mime_type,
        storageSource: l.storage_source,
        isAvailable: Boolean(l.is_available),
        isKosh: Boolean(l.is_kosh),
        createdAt: l.created_at
      }));

      set({ categories: mappedCats, ghostLinks: mappedLinks, initialized: true, loading: false });
      
      // Auto check permissions on init
      await get().checkPermissions();
      await get().checkStorageConnectivity();
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  checkPermissions: async () => {
    try {
      const { FileService } = await import('../services/file.service');
      const safGranted = await FileService.requestPermissions(false); 
      // check if we got true without forcing prompt
      set({ hasStoragePermission: safGranted });
      if (safGranted && get().ghostLinks.length === 0) {
        // Auto sync if we have permission but 0 ghost links
        await get().syncDeviceFiles();
      }
    } catch { }
  },

  refreshData: async () => {
    set({ loading: true, error: null });
    try {
      const db = getDatabase();
      const links = await db.getAllAsync<GhostLink>('SELECT * FROM ghost_links ORDER BY created_at DESC');
      
      const mappedLinks = links.map((l: any) => ({
        ...l,
        categoryId: l.category_id,
        fileUri: l.file_uri,
        fileName: l.file_name,
        fileSize: l.file_size,
        mimeType: l.mime_type,
        storageSource: l.storage_source,
        isAvailable: Boolean(l.is_available),
        isKosh: Boolean(l.is_kosh),
        createdAt: l.created_at
      }));

      set({ ghostLinks: mappedLinks, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  refreshExplorer: async (query?: string) => {
    set({ loading: true, error: null });
    try {
      const { FileService } = await import('../services/file.service');
      const files = await FileService.scanDeviceStorage(query);
      set({ explorerFiles: files, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  grantAccess: async () => {
    set({ loading: true, error: null });
    try {
      const { FileService } = await import('../services/file.service');
      const granted = await FileService.requestPermissions(true);
      if (granted) {
        set({ hasStoragePermission: true });
        await get().syncDeviceFiles();
      } else {
        set({ error: 'Storage access was not granted.', loading: false });
      }
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  syncDeviceFiles: async () => {
    set({ loading: true, error: null });
    try {
      const { FileService } = await import('../services/file.service');
      const files = await FileService.scanDeviceStorage();
      const db = getDatabase();

      const existingLinks = get().ghostLinks;
      const existingUris = new Set(existingLinks.map(l => l.fileUri));

      for (const item of files) {
        if (!existingUris.has(item.uri)) {
          let categoryId = 'cat-other';
          if (item.mimeType.startsWith('image')) categoryId = 'cat-img';
          else if (item.mimeType.startsWith('video')) categoryId = 'cat-vid';
          else if (item.mimeType.startsWith('audio')) categoryId = 'cat-aud';
          else if (item.mimeType === 'application/pdf') categoryId = 'cat-doc';
          else if (item.mimeType === 'application/vnd.android.package-archive') categoryId = 'cat-apk';

          const newId = `gl-auto-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
          await db.runAsync(
            `INSERT INTO ghost_links (id, category_id, file_uri, file_name, file_size, mime_type, storage_source, is_available, is_kosh, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [newId, categoryId, item.uri, item.name, item.size, item.mimeType, item.storageSource, 1, 0, item.modifiedAt]
          );
        }
      }

      await get().refreshData();
      set({ explorerFiles: files, loading: false });
    } catch (e) {
       console.error('syncDeviceFiles Error:', e);
       set({ error: (e as Error).message, loading: false });
    }
  },

  setSelectedCategoryId: (id) => set({ selectedCategoryId: id }),

  createNewCategory: async (name: string) => {
    if (!name) throw new Error('Name cannot be empty');
    const newId = `cat-${Date.now()}`;
    const now = new Date().toISOString();
    
    // We mock system gradient generation for custom tags for now
    const gradient = JSON.stringify(['#E07A5F', '#D16043']);
    
    try {
      const db = getDatabase();
      await db.runAsync(
        `INSERT INTO categories (id, name, icon, gradient, sort_order, is_system, is_kosh, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [newId, name, 'folder', gradient, Date.now(), 0, 0, now, now]
      );
      
      const newCat: Category = {
        id: newId,
        name,
        icon: 'folder',
        gradient: ['#E07A5F', '#D16043'],
        sortOrder: Date.now(),
        isSystem: false,
        isKosh: false,
        createdAt: now,
        updatedAt: now
      };

      set(state => ({ categories: [...state.categories, newCat] }));
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },

  bookmarkFile: async (item: ExplorerFileItem, categoryId: string) => {
    set({ loading: true });
    const newId = `gl-${Date.now()}`;
    const now = new Date().toISOString();
    
    try {
      const db = getDatabase();
      await db.runAsync(
        `INSERT INTO ghost_links (id, category_id, file_uri, file_name, file_size, mime_type, storage_source, is_available, is_kosh, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [newId, categoryId, item.uri, item.name, item.size, item.mimeType, item.storageSource, 1, 0, now]
      );

      const newLink: GhostLink = {
        id: newId,
        categoryId,
        fileUri: item.uri,
        fileName: item.name,
        fileSize: item.size,
        mimeType: item.mimeType,
        storageSource: item.storageSource,
        isAvailable: true,
        isKosh: false,
        createdAt: now
      };
      
      set(state => ({ ghostLinks: [newLink, ...state.ghostLinks], loading: false }));
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  removeGhostLinkByUri: async (uri: string, categoryId: string) => {
    set({ loading: true });
    try {
      const db = getDatabase();
      await db.runAsync('DELETE FROM ghost_links WHERE file_uri = ? AND category_id = ?', [uri, categoryId]);
      set(state => ({
        ghostLinks: state.ghostLinks.filter(l => !(l.fileUri === uri && l.categoryId === categoryId)),
        loading: false
      }));
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  removeGhostLink: async (id: string) => {
    set({ loading: true });
    try {
      const db = getDatabase();
      await db.runAsync('DELETE FROM ghost_links WHERE id = ?', [id]);
      set(state => ({
        ghostLinks: state.ghostLinks.filter(l => l.id !== id),
        loading: false
      }));
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  resetAllData: async () => {
    set({ loading: true });
    try {
      const db = getDatabase();
      await db.runAsync('DELETE FROM ghost_links');
      await db.runAsync('DELETE FROM categories WHERE is_system = 0');
      
      set({
        ghostLinks: [],
        selectedCategoryId: null,
        loading: false,
      });
      get().initialize(); // Reload the base categories from the reset DB
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  checkStorageConnectivity: async () => {
    try {
      const { FileService } = await import('../services/file.service');
      const isConnected = await FileService.checkVolumeConnectivity();
      
      set(state => ({
        storageSources: state.storageSources.map(s => 
          s.type === 'sd_card' ? { ...s, isConnected } : s
        ),
        ghostLinks: state.ghostLinks.map(l => 
          l.storageSource === 'sd_card' ? { ...l, isAvailable: isConnected } : l
        )
      }));
    } catch { }
  },
}));
