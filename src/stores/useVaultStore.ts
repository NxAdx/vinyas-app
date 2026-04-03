import { create } from 'zustand';
import { VaultService } from '../services/vault.service';

interface VaultState {
  hydrate: () => Promise<void>;
  setup: (passcode: string) => Promise<void>;
  unlock: (passcode: string) => Promise<boolean>;
  unlockWithBiometrics: () => void;
  lock: () => void;
  refreshEntries: () => Promise<void>;
  addEntry: (id: string) => Promise<void>;
  removeEntry: (id: string) => Promise<void>;

  configured: boolean;
  unlocked: boolean;
  loading: boolean;
  error: string | null;
  vaultLinkIds: string[];
}

export const useVaultStore = create<VaultState>((set, get) => ({
  configured: false,
  unlocked: false,
  loading: false,
  error: null,
  vaultLinkIds: [],

  hydrate: async () => {
    set({ loading: true });
    try {
      const isConfigured = await VaultService.isVaultConfigured();
      set({ configured: isConfigured, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  setup: async (passcode: string) => {
    set({ loading: true });
    try {
      await VaultService.setupPasscode(passcode);
      set({ configured: true, unlocked: true, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
      throw e;
    }
  },

  unlock: async (passcode: string) => {
    set({ loading: true, error: null });
    try {
      // We don't automatically trigger Biometrics here because `unlock` is called
      // synchronously by the UI on PIN entry. Forcing a biometric modal over a PIN keyboard 
      // crashes the Android window manager in some OEM skins.
      // Biometrics should be triggered explicitly by the UI component via a separate function.

      const isValid = await VaultService.verifyPasscode(passcode);
      if (isValid) {
        set({ unlocked: true, loading: false });
        return true;
      }

      set({ loading: false });
      return false;
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
      return false;
    }
  },

  unlockWithBiometrics: () => {
    set({ unlocked: true, error: null });
  },

  lock: () => {
    set({ unlocked: false });
  },

  refreshEntries: async () => {
    set({ loading: true });
    try {
      const entries = await VaultService.getEncryptedEntries();
      set({ vaultLinkIds: entries.map(e => e.id), loading: false });
    } catch (e) {
      set({ loading: false, error: (e as Error).message });
    }
  },

  addEntry: async (id: string) => {
    set({ loading: true });
    // In actual implementation, we'd encrypt the file here using AES
    await new Promise(res => setTimeout(res, 200));
    set(state => ({ vaultLinkIds: [...state.vaultLinkIds, id], loading: false }));
  },

  removeEntry: async (id: string) => {
    set({ loading: true });
    // In actual implementation, we'd remove and decrypt here
    await new Promise(res => setTimeout(res, 200));
    set(state => ({
      vaultLinkIds: state.vaultLinkIds.filter(vId => vId !== id),
      loading: false
    }));
  }
}));
