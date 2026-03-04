import { create } from 'zustand';

interface AppState {
  globalMode: 'warm' | 'kosh';
  activeTab: string;
  isSearchActive: boolean;
  hasLoadedApp: boolean;

  setGlobalMode: (mode: 'warm' | 'kosh') => void;
  setActiveTab: (tab: string) => void;
  setSearchActive: (isActive: boolean) => void;
  setHasLoadedApp: (loaded: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  globalMode: 'warm',
  activeTab: 'home',
  isSearchActive: false,
  hasLoadedApp: false,
  
  setGlobalMode: (mode) => set({ globalMode: mode }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setSearchActive: (isActive) => set({ isSearchActive: isActive }),
  setHasLoadedApp: (loaded) => set({ hasLoadedApp: loaded }),
}));
