import { PropsWithChildren } from 'react';
import { View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '@/src/stores/useAppStore';
import { darkColors, lightColors } from '@/src/theme/tokens';

interface AppScreenProps extends PropsWithChildren {
  padded?: boolean;
  style?: ViewStyle;
  className?: string;
}

export function AppScreen({ children, padded = true, style, className = '' }: AppScreenProps) {
  const theme = useAppStore((state) => state.theme);
  const colors = theme === 'dark' ? darkColors : lightColors;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.void }} edges={['top']}>
      <View 
        style={[{ flex: 1, backgroundColor: colors.void, paddingHorizontal: padded ? 16 : 0, paddingTop: padded ? 8 : 0 }, style]}
        className={className}
      >
        {children}
      </View>
    </SafeAreaView>
  );
}
