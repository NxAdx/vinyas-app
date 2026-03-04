import { PropsWithChildren } from 'react';
import { View, type ViewStyle } from 'react-native';

interface GlassCardProps extends PropsWithChildren {
  style?: ViewStyle;
  className?: string;
  highlighted?: boolean;
}

export function GlassCard({ children, style, className = '', highlighted = false }: GlassCardProps) {
  return (
    <View 
      className={`rounded-card border bg-glass07 p-4 ${
        highlighted 
          ? 'border-[#D97B3C]/45 bg-[#D97B3C]/12' 
          : 'border-rim'
      } ${className}`}
      style={style}
    >
      {children}
    </View>
  );
}
