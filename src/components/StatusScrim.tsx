import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { color } from '@/theme/tokens';

/** Paper fading down from the status bar, so scrolled content never runs under the clock. */
export function StatusScrim() {
  const insets = useSafeAreaInsets();
  return (
    <LinearGradient
      pointerEvents="none"
      colors={[color.paper, 'rgba(246,243,236,0.92)', 'rgba(246,243,236,0)']}
      locations={[0, 0.6, 1]}
      style={[styles.scrim, { height: insets.top + 18 }]}
    />
  );
}

const styles = StyleSheet.create({
  scrim: { position: 'absolute', top: 0, left: 0, right: 0 },
});
