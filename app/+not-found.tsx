import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { AppScreen } from '@/src/components/AppScreen';
import { colors } from '@/src/theme/tokens';

export default function NotFoundScreen() {
  return (
    <AppScreen>
      <View style={styles.container}>
        <Text style={styles.title}>Screen not found.</Text>
        <Link href="/(tabs)" style={styles.link}>
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
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  link: {
    color: colors.warm500,
    fontSize: 14,
  },
});
