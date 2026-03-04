import { create } from 'zustand';
import type { Category, GhostLink, ExplorerFileItem, StorageSourceType } from '../types';

interface FileState {
  initialized: boolean;
  loading: boolean;
  error: string | null;
  categories: Category[];
  ghostLinks: GhostLink[];
  explorerFiles: ExplorerFileItem[];
  storageSources: { type: StorageSourceType; isConnected: boolean }[];
  selectedCategoryId: string | null;
  
  initialize: () => Promise<void>;
  refreshData: () => Promise<void>;
  refreshExplorer: (query?: string) => Promise<void>;
  createNewCategory: (name: string) => Promise<void>;
  setSelectedCategoryId: (id: string | null) => void;
  bookmarkFile: (item: ExplorerFileItem, categoryId: string) => Promise<void>;
  removeGhostLinkByUri: (uri: string, categoryId: string) => Promise<void>;
  removeGhostLink: (id: string) => Promise<void>;
  resetAllData: () => Promise<void>;
}

export const useFileStore = create<FileState>((set, get) => ({
  initialized: false,
  loading: false,
  error: null,
  selectedCategoryId: null,
  storageSources: [
    { type: 'internal', isConnected: true },
    { type: 'sd_card', isConnected: false },
    { type: 'usb_otg', isConnected: false }
  ],
  categories: [
    {
      id: 'cat-doc',
      name: 'Documents',
      icon: 'description',
      gradient: ['#E07A5F', '#D16043'],
      sortOrder: 1,
      isSystem: true,
      isKosh: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'cat-download',
      name: 'Downloads',
      icon: 'download',
      gradient: ['#457B9D', '#1D3557'],
      sortOrder: 2,
      isSystem: true,
      isKosh: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'cat-audio',
      name: 'Audio',
      icon: 'audiotrack',
      gradient: ['#9C6644', '#7F5539'],
      sortOrder: 3,
      isSystem: true,
      isKosh: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'cat-apps',
      name: 'Apps',
      icon: 'apps',
      gradient: ['#3D5A80', '#293241'],
      sortOrder: 4,
      isSystem: true,
      isKosh: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'cat-img',
      name: 'Images',
      icon: 'image',
      gradient: ['#81B29A', '#6B9D84'],
      sortOrder: 5,
      isSystem: true,
      isKosh: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'cat-vid',
      name: 'Videos',
      icon: 'movie',
      gradient: ['#F2CC8F', '#DDB577'],
      sortOrder: 6,
      isSystem: true,
      isKosh: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'cat-other',
      name: 'Other',
      icon: 'more-horiz',
      gradient: ['#A8DADC', '#457B9D'],
      sortOrder: 7,
      isSystem: true,
      isKosh: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'cat-kosh',
      name: 'Kosh Vault',
      icon: 'lock',
      gradient: ['#1C2A33', '#0F1A20'],
      sortOrder: 8,
      isSystem: true,
      isKosh: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  ghostLinks: [
    {
      id: 'g-1',
      categoryId: 'cat-doc',
      fileUri: 'file://internal/docs/spec.pdf',
      fileName: 'Project Specification.pdf',
      fileSize: 2500000,
      mimeType: 'application/pdf',
      storageSource: 'internal',
      isAvailable: true,
      isKosh: false,
      createdAt: new Date().toISOString()
    }
  ],
  explorerFiles: [
    {
      id: 'e-1',
      name: 'Android Studio Setup.mp4',
      uri: 'file://internal/Movies/Android Studio Setup.mp4',
      size: 154000000,
      mimeType: 'video/mp4',
      modifiedAt: new Date().toISOString(),
      storageSource: 'internal'
    },
    {
      id: 'e-2',
      name: 'Invoice_April_26.pdf',
      uri: 'file://internal/Documents/Invoice_April_26.pdf',
      size: 450000,
      mimeType: 'application/pdf',
      modifiedAt: new Date().toISOString(),
      storageSource: 'internal'
    },
    {
      id: 'e-3',
      name: 'IMG_20260301.jpg',
      uri: 'file://sd_card/DCIM/Camera/IMG_20260301.jpg',
      size: 4200000,
      mimeType: 'image/jpeg',
      modifiedAt: new Date().toISOString(),
      storageSource: 'sd_card'
    }
  ],

  initialize: async () => {
    set({ loading: true, error: null });
    await new Promise(res => setTimeout(res, 500));
    set({ initialized: true, loading: false });
  },

  refreshData: async () => {
    set({ loading: true, error: null });
    await new Promise(res => setTimeout(res, 300));
    set({ loading: false });
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

  setSelectedCategoryId: (id) => set({ selectedCategoryId: id }),

  createNewCategory: async (name: string) => {
    if (!name) throw new Error('Name cannot be empty');
    
    const newCat: Category = {
      id: `cat-${Date.now()}`,
      name,
      icon: 'folder',
      gradient: ['#E07A5F', '#D16043'],
      sortOrder: Date.now(),
      isSystem: false,
      isKosh: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    set(state => ({ categories: [...state.categories, newCat] }));
  },

  bookmarkFile: async (item: ExplorerFileItem, categoryId: string) => {
    set({ loading: true });
    await new Promise(res => setTimeout(res, 300));
    
    const newLink: GhostLink = {
      id: `gl-${Date.now()}`,
      categoryId,
      fileUri: item.uri,
      fileName: item.name,
      fileSize: item.size,
      mimeType: item.mimeType,
      storageSource: item.storageSource,
      isAvailable: true,
      isKosh: false,
      createdAt: new Date().toISOString()
    };
    
    set(state => ({ ghostLinks: [...state.ghostLinks, newLink], loading: false }));
  },

  removeGhostLinkByUri: async (uri: string, categoryId: string) => {
    set({ loading: true });
    await new Promise(res => setTimeout(res, 300));
    set(state => ({
      ghostLinks: state.ghostLinks.filter(l => !(l.fileUri === uri && l.categoryId === categoryId)),
      loading: false
    }));
  },

  removeGhostLink: async (id: string) => {
    set({ loading: true });
    await new Promise(res => setTimeout(res, 300));
    set(state => ({
      ghostLinks: state.ghostLinks.filter(l => l.id !== id),
      loading: false
    }));
  },

  resetAllData: async () => {
    set({ loading: true });
    await new Promise(res => setTimeout(res, 500));
    set({
      ghostLinks: [],
      explorerFiles: [],
      selectedCategoryId: null,
      loading: false,
    });
  }
}));
