import { PropsWithChildren } from 'react';
import { SafeAreaView, StyleSheet, View, type ViewStyle } from 'react-native';

import { colors, spacing } from '@/src/theme/tokens';

interface AppScreenProps extends PropsWithChildren {
  padded?: boolean;
  style?: ViewStyle;
}

export function AppScreen({ children, padded = true, style }: AppScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.container, padded ? styles.padded : undefined, style]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.void,
  },
  container: {
    flex: 1,
    backgroundColor: colors.void,
  },
  padded: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
});
