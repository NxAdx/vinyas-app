import { PropsWithChildren } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { colors, radius } from '@/src/theme/tokens';

interface GlassCardProps extends PropsWithChildren {
  style?: ViewStyle;
  highlighted?: boolean;
}

export function GlassCard({ children, style, highlighted = false }: GlassCardProps) {
  return <View style={[styles.base, highlighted ? styles.highlighted : undefined, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.rim,
    backgroundColor: colors.glass07,
    padding: 16,
  },
  highlighted: {
    borderColor: 'rgba(217,123,60,0.45)',
    backgroundColor: 'rgba(217,123,60,0.12)',
  },
});
