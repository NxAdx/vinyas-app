import { PropsWithChildren } from 'react';
import { View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface AppScreenProps extends PropsWithChildren {
  padded?: boolean;
  style?: ViewStyle;
  className?: string;
}

export function AppScreen({ children, padded = true, style, className = '' }: AppScreenProps) {
  return (
    <SafeAreaView className="flex-1 bg-void" edges={['top']}>
      <View 
        className={`flex-1 bg-void ${padded ? 'px-lg pt-sm' : ''} ${className}`}
        style={style}
      >
        {children}
      </View>
    </SafeAreaView>
  );
}
