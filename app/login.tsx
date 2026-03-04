import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { AppScreen } from '@/src/components/AppScreen';
import { useAuthStore } from '@/src/stores/useAuthStore';
import { colors } from '@/src/theme/tokens';
import { MaterialIcons } from '@expo/vector-icons';

export default function LoginScreen() {
    const router = useRouter();
    const segments = useSegments();

    const initialize = useAuthStore((state) => state.initialize);
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const hasPin = useAuthStore((state) => state.hasPin);
    const verifyPin = useAuthStore((state) => state.verifyPin);
    const setPin = useAuthStore((state) => state.setPin);

    const [pin, setPinState] = useState('');
    const [setupPin, setSetupPin] = useState('');
    const [error, setError] = useState(false);

    // 1. Wait for Auth Store Initialization
    useEffect(() => {
        void initialize();
    }, [initialize]);

    // 2. Navigation Interceptor (Redirect if already authenticated)
    useEffect(() => {
        if (hasPin === null) return; // Still loading

        if (isAuthenticated) {
            // Small delay prevents flickering
            setTimeout(() => {
                router.replace('/(tabs)');
            }, 50);
        }
    }, [isAuthenticated, hasPin, router]);

    const handleKeyPress = async (key: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        if (error) {
            setError(false);
            setPinState('');
            setSetupPin('');
        }

        if (key === 'back') {
            setPinState((p) => p.slice(0, -1));
            return;
        }

        if (pin.length < 4) {
            const newPin = pin + key;
            setPinState(newPin);

            if (newPin.length === 4) {
                if (!hasPin) {
                    // SETUP MODE
                    if (!setupPin) {
                        // Step 1: Entered first time
                        setTimeout(() => {
                            setSetupPin(newPin);
                            setPinState('');
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        }, 300);
                    } else {
                        // Step 2: Confirm
                        if (setupPin === newPin) {
                            const success = await setPin(newPin);
                            if (success) {
                                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            } else {
                                setError(true);
                            }
                        } else {
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                            setError(true);
                            setSetupPin('');
                        }
                    }
                } else {
                    // VERIFY MODE
                    const isValid = await verifyPin(newPin);
                    if (isValid) {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    } else {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                        setError(true);
                        setTimeout(() => setPinState(''), 500);
                    }
                }
            }
        }
    };

    if (hasPin === null || isAuthenticated) {
        return <AppScreen><View className="flex-1 bg-void" /></AppScreen>; // Blank while routing
    }

    const isSetupConfirm = !hasPin && setupPin.length === 4;

    let title = 'Enter PIN';
    if (!hasPin) {
        title = isSetupConfirm ? 'Confirm PIN' : 'Create PIN';
    }

    return (
        <AppScreen>
            <View className="flex-1 justify-center items-center">

                <View className="mb-xl items-center">
                    <MaterialIcons name="lock-outline" size={48} color={error ? colors.danger : colors.warm300} />
                    <Text className="text-textPrimary text-2xl font-extrabold mt-4">{title}</Text>
                    <Text className="text-textSecondary text-sm mt-2 text-center">
                        {!hasPin ? 'Secure the Vinyas app with a master PIN.' : 'Authenticate to continue.'}
                    </Text>
                </View>

                {/* Pin Dots */}
                <View className="flex-row gap-4 mb-xxl h-[20px]">
                    {[0, 1, 2, 3].map((i) => (
                        <View
                            key={i}
                            className={`w-4 h-4 rounded-full ${pin.length > i ? 'bg-textPrimary' : 'bg-glass10'} ${error ? 'bg-danger' : ''}`}
                        />
                    ))}
                </View>

                {/* Number Pad */}
                <View className="w-[80%] max-w-[320px] flex-row flex-wrap justify-between gap-y-6">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                        <Pressable
                            key={num}
                            onPress={() => handleKeyPress(num)}
                            className="w-[30%] aspect-square rounded-full bg-glass04 items-center justify-center active:bg-glass10 border border-transparent active:border-rim"
                        >
                            <Text className="text-textPrimary text-2xl font-bold">{num}</Text>
                        </Pressable>
                    ))}
                    <View className="w-[30%] aspect-square" />
                    <Pressable
                        onPress={() => handleKeyPress('0')}
                        className="w-[30%] aspect-square rounded-full bg-glass04 items-center justify-center active:bg-glass10 border border-transparent active:border-rim"
                    >
                        <Text className="text-textPrimary text-2xl font-bold">0</Text>
                    </Pressable>
                    <Pressable
                        onPress={() => handleKeyPress('back')}
                        className="w-[30%] aspect-square rounded-full items-center justify-center active:bg-glass04"
                    >
                        <MaterialIcons name="backspace" size={28} color={colors.textSecondary} />
                    </Pressable>
                </View>

            </View>
        </AppScreen>
    );
}
