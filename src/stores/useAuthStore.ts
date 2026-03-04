import AsyncStorage from '@react-native-async-storage/async-storage';
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
            const storedPin = await AsyncStorage.getItem(PIN_STORAGE_KEY);
            set({ hasPin: !!storedPin, isAuthenticated: !storedPin });
            // If no PIN is configured, they are "authenticated" by default until they set one
        } catch (e) {
            set({ hasPin: false, isAuthenticated: true });
        }
    },

    setPin: async (pin: string) => {
        try {
            await AsyncStorage.setItem(PIN_STORAGE_KEY, pin);
            set({ hasPin: true, isAuthenticated: true });
            return true;
        } catch (e) {
            return false;
        }
    },

    verifyPin: async (pin: string) => {
        try {
            const storedPin = await AsyncStorage.getItem(PIN_STORAGE_KEY);
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
            await AsyncStorage.removeItem(PIN_STORAGE_KEY);
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
