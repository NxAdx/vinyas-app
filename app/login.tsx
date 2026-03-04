import { useEffect, useState, useMemo } from 'react';
import { StyleSheet, Text, View, Pressable, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { MaterialIcons } from '@expo/vector-icons';

import { AppScreen } from '@/src/components/AppScreen';
import { useAuthStore } from '@/src/stores/useAuthStore';
import { useAppStore } from '@/src/stores/useAppStore';
import { THEME_DARK, THEME_LIGHT } from '../src/theme/tokens';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
    const router = useRouter();
    const theme = useAppStore((state) => state.theme);
    const colors = theme === 'dark' ? THEME_DARK : THEME_LIGHT;

    const initialize = useAuthStore((state) => state.initialize);
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const hasPin = useAuthStore((state) => state.hasPin);
    const verifyPin = useAuthStore((state) => state.verifyPin);
    const setPin = useAuthStore((state) => state.setPin);

    const [pin, setPinState] = useState('');
    const [setupPin, setSetupPin] = useState('');
    const [error, setError] = useState(false);

    useEffect(() => {
        void initialize();
    }, [initialize]);

    useEffect(() => {
        if (hasPin === null) return;
        if (isAuthenticated) {
            router.replace('/(tabs)');
        }
    }, [isAuthenticated, hasPin, router]);

    const handleKeyPress = async (key: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        if (error) {
            setError(false);
            setPinState('');
        }

        if (key === 'back') {
            setPinState((p) => p.slice(0, -1));
            return;
        }

        if (pin.length < 6) {
            const newPin = pin + key;
            setPinState(newPin);

            if (newPin.length === 6) {
                if (!hasPin) {
                    if (!setupPin) {
                        // First entry of setup
                        setTimeout(() => {
                            setSetupPin(newPin);
                            setPinState('');
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        }, 250);
                    } else {
                        // Confirmation of setup
                        if (setupPin === newPin) {
                            const success = await setPin(newPin);
                            if (success) {
                                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                                // Redirect is handled by useEffect
                            } else {
                                setError(true);
                                setPinState('');
                                setSetupPin('');
                            }
                        } else {
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                            setError(true);
                            setPinState('');
                            setSetupPin('');
                        }
                    }
                } else {
                    // Standard Verification
                    const isValid = await verifyPin(newPin);
                    if (isValid) {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    } else {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                        setError(true);
                        setTimeout(() => setPinState(''), 400);
                    }
                }
            }
        }
    };

    if (hasPin === null) {
        return <View style={{ flex: 1, backgroundColor: colors.void }} />;
    }

    if (isAuthenticated) {
        return null; // Let the layout router handle the redirect, don't render two screens
    }

    const isConfirming = !hasPin && setupPin.length === 6;
    const title = !hasPin ? (isConfirming ? 'Confirm your PIN' : 'Create Master PIN') : 'Enter Security PIN';
    const subtitle = !hasPin
        ? 'Protect your files with a secure 6-digit access code.'
        : 'Welcome back. Authenticate to unlock Vinyas.';

    return (
        <AppScreen padded={false}>
            <View className="flex-1" style={{ backgroundColor: colors.void }}>
                {/* Background Accent */}
                <View
                    style={{
                        position: 'absolute',
                        top: -100,
                        right: -100,
                        width: 300,
                        height: 300,
                        borderRadius: 150,
                        backgroundColor: theme === 'dark' ? 'rgba(0, 229, 204, 0.05)' : 'rgba(0, 229, 204, 0.1)',
                        filter: 'blur(80px)' as any
                    }}
                />

                <View className="flex-1 justify-center items-center px-lg">
                    {/* Header Header */}
                    <View className="items-center mb-xl">
                        <View
                            className="w-16 h-16 rounded-3xl items-center justify-center mb-4 border"
                            style={{
                                backgroundColor: colors.glass07,
                                borderColor: error ? colors.danger : colors.rim
                            }}
                        >
                            <MaterialIcons
                                name={hasPin ? "lock" : "shield"}
                                size={32}
                                color={error ? colors.danger : colors.tealGlow}
                            />
                        </View>
                        <Text className="text-3xl font-extrabold text-center tracking-tight" style={{ color: colors.textPrimary }}>
                            {title}
                        </Text>
                        <Text className="text-center mt-2 px-4 leading-5" style={{ color: colors.textSecondary }}>
                            {subtitle}
                        </Text>
                    </View>

                    {/* PIN Indicators */}
                    <View className="flex-row gap-4 mb-12 h-6 items-center">
                        {[0, 1, 2, 3, 4, 5].map((i) => (
                            <View
                                key={i}
                                className={`w-[12px] h-[12px] rounded-full border ${pin.length > i ? '' : 'border-transparent'}`}
                                style={{
                                    backgroundColor: pin.length > i
                                        ? (error ? colors.danger : colors.tealGlow)
                                        : colors.glass15,
                                    borderColor: pin.length > i ? 'rgba(255,255,255,0.2)' : 'transparent'
                                }}
                            />
                        ))}
                    </View>

                    {/* Numeric Keypad */}
                    <View className="w-full flex-row flex-wrap justify-between gap-y-5 px-4 mb-8">
                        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                            <Pressable
                                key={num}
                                onPress={() => handleKeyPress(num)}
                                className="w-[28%] aspect-square rounded-full items-center justify-center border"
                                style={{
                                    backgroundColor: colors.glass04,
                                    borderColor: colors.rim
                                }}
                            >
                                <Text className="text-2xl font-bold" style={{ color: colors.textPrimary }}>{num}</Text>
                            </Pressable>
                        ))}
                        <View className="w-[28%] aspect-square" />
                        <Pressable
                            onPress={() => handleKeyPress('0')}
                            className="w-[28%] aspect-square rounded-full items-center justify-center border"
                            style={{
                                backgroundColor: colors.glass04,
                                borderColor: colors.rim
                            }}
                        >
                            <Text className="text-2xl font-bold" style={{ color: colors.textPrimary }}>0</Text>
                        </Pressable>
                        <Pressable
                            onPress={() => handleKeyPress('back')}
                            className="w-[28%] aspect-square rounded-full items-center justify-center active:bg-glass10"
                        >
                            <MaterialIcons name="backspace" size={28} color={error ? colors.danger : colors.textSecondary} />
                        </Pressable>
                    </View>

                    {error && (
                        <Text className="font-bold text-xs uppercase tracking-widest mb-4" style={{ color: colors.danger }}>
                            Invalid PIN • Try Again
                        </Text>
                    )}
                </View>
            </View>
        </AppScreen>
    );
}
