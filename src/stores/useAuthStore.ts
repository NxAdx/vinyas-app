import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

interface AuthState {
    hasPin: boolean | null;
    isAuthenticated: boolean;

    initialize: () => Promise<void>;
    setPin: (pin: string) => Promise<boolean>;
    verifyPin: (pin: string) => Promise<boolean>;
    clearPin: () => Promise<void>;
    logout: () => void;
}

const PIN_STORAGE_KEY = 'vinyas_auth_pin';

export const useAuthStore = create<AuthState>((set, get) => ({
    hasPin: null,
    isAuthenticated: false,

    initialize: async () => {
        try {
            const storedPin = await SecureStore.getItemAsync(PIN_STORAGE_KEY);
            const exists = (storedPin || '').length === 6; // Standardize on 6
            set({ 
                hasPin: exists, 
                isAuthenticated: !exists // If no 6-digit PIN, you are "unlocked"
            });
            
            if (storedPin && storedPin.length !== 6) {
              // Clear legacy or invalid PINs
              await SecureStore.deleteItemAsync(PIN_STORAGE_KEY);
              set({ hasPin: false, isAuthenticated: true });
            }
        } catch (e) {
            set({ hasPin: false, isAuthenticated: true });
        }
    },

    setPin: async (pin: string) => {
        if (pin.length !== 6) return false;
        try {
            await SecureStore.setItemAsync(PIN_STORAGE_KEY, pin);
            set({ hasPin: true, isAuthenticated: true });
            return true;
        } catch (e) {
            return false;
        }
    },

    verifyPin: async (pin: string) => {
        try {
            const storedPin = await SecureStore.getItemAsync(PIN_STORAGE_KEY);
            if (storedPin === pin) {
                set({ isAuthenticated: true });
                return true;
            }
            return false;
        } catch (e) {
            return false;
        }
    },

    clearPin: async () => {
        try {
            await SecureStore.deleteItemAsync(PIN_STORAGE_KEY);
            set({ hasPin: false, isAuthenticated: true });
        } catch (e) {
            console.error('Failed to clear PIN', e);
        }
    },

    logout: () => {
        const { hasPin } = get();
        // Only lock them out if a PIN actually exists
        if (hasPin) {
            set({ isAuthenticated: false });
        }
    },
}));
