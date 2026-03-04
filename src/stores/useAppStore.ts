import { create } from 'zustand';

interface AppState {
  globalMode: 'warm' | 'kosh';
  theme: 'dark' | 'light';
  activeTab: string;
  isSearchActive: boolean;
  hasLoadedApp: boolean;

  setGlobalMode: (mode: 'warm' | 'kosh') => void;
  setTheme: (theme: 'dark' | 'light') => void;
  toggleGlobalMode: () => void;
  setActiveTab: (tab: string) => void;
  setSearchActive: (isActive: boolean) => void;
  setHasLoadedApp: (loaded: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  globalMode: 'warm',
  theme: 'dark',
  activeTab: 'home',
  isSearchActive: false,
  hasLoadedApp: false,
  
  setGlobalMode: (mode) => set({ globalMode: mode }),
  setTheme: (theme) => set({ theme }),
  toggleGlobalMode: () => set((state) => ({ globalMode: state.globalMode === 'warm' ? 'kosh' : 'warm' })),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setSearchActive: (isActive) => set({ isSearchActive: isActive }),
  setHasLoadedApp: (loaded) => set({ hasLoadedApp: loaded }),
}));
