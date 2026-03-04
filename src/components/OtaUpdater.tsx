import { useEffect, useState } from 'react';
import * as Updates from 'expo-updates';
import { AppState, AppStateStatus, Platform } from 'react-native';

export function OtaUpdater() {
    const [appState, setAppState] = useState(AppState.currentState);

    useEffect(() => {
        // Only run in production/OTA environments
        if (__DEV__ || Platform.OS === 'web') return;

        let isChecking = false;

        const checkForUpdates = async () => {
            if (isChecking) return;
            isChecking = true;

            try {
                const update = await Updates.checkForUpdateAsync();
                if (update.isAvailable) {
                    // Fetch the update in the background silently
                    await Updates.fetchUpdateAsync();
                    // The next time the app cold boots, the new version will load natively
                    // We avoid forcing a reload mid-session to not disturb the user.
                }
            } catch (e) {
                // Silently swallow network/OTA errors in background
            } finally {
                isChecking = false;
            }
        };

        // Check on initial mount
        void checkForUpdates();

        // Check when app resumes from background
        const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
            if (appState.match(/inactive|background/) && nextAppState === 'active') {
                void checkForUpdates();
            }
            setAppState(nextAppState);
        });

        return () => {
            subscription.remove();
        };
    }, [appState]);

    return null; // Invisible component
}
