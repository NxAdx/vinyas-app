import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { AppScreen } from '@/src/components/AppScreen';
import { useAppStore } from '@/src/stores/useAppStore';
import { THEME_DARK, THEME_LIGHT } from '../src/theme/tokens';

export default function NotFoundScreen() {
  const theme = useAppStore(state => state.theme);
  const colors = theme === 'dark' ? THEME_DARK : THEME_LIGHT;

  return (
    <AppScreen style={{ backgroundColor: colors.void }}>
      <View style={styles.container}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Screen not found.</Text>
        <Link href="/(tabs)" style={[styles.link, { color: colors.warm500 }]}>
          Go back home
        </Link>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  link: {
    fontSize: 14,
  },
});
