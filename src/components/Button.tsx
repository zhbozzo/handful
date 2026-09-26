import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { press } from '@/lib/haptics';
import { color, radius } from '@/theme/tokens';

import { Icon } from './Icon';
import { Txt } from './Txt';

type Kind = 'primary' | 'sun' | 'secondary' | 'ghost' | 'shield' | 'leaf';

const kinds: Record<Kind, { bg: string; fg: string; border?: string }> = {
  primary: { bg: color.ink, fg: color.white },
  sun: { bg: color.sun, fg: color.ink },
  secondary: { bg: color.card, fg: color.ink, border: color.lineStrong },
  ghost: { bg: 'transparent', fg: color.ink },
  shield: { bg: color.shield, fg: color.white },
  leaf: { bg: color.leaf, fg: color.white },
};

type Props = {
  label: string;
  onPress?: () => void;
  kind?: Kind;
  symbol?: string;
  trailing?: ReactNode;
  disabled?: boolean;
  loading?: boolean;
  compact?: boolean;
  style?: ViewStyle;
  accessibilityHint?: string;
};

export function Button({
  label,
  onPress,
  kind = 'primary',
  symbol,
  trailing,
  disabled,
  loading,
  compact,
  style,
  accessibilityHint,
}: Props) {
  const k = kinds[kind];
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const inactive = disabled || loading;

  return (
    <Animated.View style={[animated, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled: !!inactive, busy: !!loading }}
        disabled={inactive}
        onPressIn={() => {
          scale.set(withSpring(0.97, { damping: 20, stiffness: 400 }));
        }}
        onPressOut={() => {
          scale.set(withSpring(1, { damping: 14, stiffness: 300 }));
        }}
        onPress={() => {
          press();
          onPress?.();
        }}
        style={[
          styles.base,
          compact && styles.compact,
          { backgroundColor: k.bg, opacity: disabled ? 0.4 : 1 },
          k.border ? { borderWidth: 1, borderColor: k.border } : null,
        ]}>
        {loading ? (
          <ActivityIndicator color={k.fg} />
        ) : (
          <View style={styles.row}>
            {symbol ? <Icon name={symbol} size={compact ? 14 : 17} color={k.fg} weight="bold" /> : null}
            <Txt variant="bodyStrong" color={k.fg} style={[{ fontWeight: '700' }, compact ? { fontSize: 15 } : null]}>
              {label}
            </Txt>
            {trailing}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 56,
    borderRadius: radius.pill,
    paddingHorizontal: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compact: { minHeight: 42, paddingHorizontal: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
