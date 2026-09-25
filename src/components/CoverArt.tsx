import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { categoryById } from '@/data/categories';
import type { Cause } from '@/data/types';
import { color, radius } from '@/theme/tokens';

import { Icon } from './Icon';

/**
 * Covers show the help, never the person: a still life of the items the cause pays for.
 */
const LAYOUTS: { x: number; y: number; s: number; r: number }[][] = [
  [{ x: 0.5, y: 0.5, s: 0.5, r: -6 }],
  [
    { x: 0.39, y: 0.54, s: 0.44, r: -8 },
    { x: 0.63, y: 0.44, s: 0.38, r: 7 },
  ],
  [
    { x: 0.3, y: 0.56, s: 0.36, r: -9 },
    { x: 0.51, y: 0.4, s: 0.4, r: 4 },
    { x: 0.72, y: 0.6, s: 0.32, r: 10 },
  ],
  [
    { x: 0.23, y: 0.58, s: 0.32, r: -10 },
    { x: 0.42, y: 0.38, s: 0.36, r: -3 },
    { x: 0.61, y: 0.62, s: 0.33, r: 6 },
    { x: 0.79, y: 0.4, s: 0.3, r: 12 },
  ],
];

type Props = {
  cause: Pick<Cause, 'category' | 'items' | 'coverUri'>;
  height: number;
  rounded?: number;
  style?: ViewStyle;
};

export function CoverArt({ cause, height, rounded = radius.lg, style }: Props) {
  const cat = categoryById(cause.category);

  if (cause.coverUri) {
    return (
      <View style={[{ height, borderRadius: rounded, overflow: 'hidden', backgroundColor: cat.tint }, style]}>
        <Image source={{ uri: cause.coverUri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={250} />
      </View>
    );
  }

  const items = cause.items.slice(0, 4);
  const layout = LAYOUTS[Math.max(0, items.length - 1)] ?? LAYOUTS[0];

  return (
    <View
      style={[{ height, borderRadius: rounded, overflow: 'hidden', backgroundColor: cat.tint }, style]}
      accessible
      accessibilityLabel={`Illustration of ${items.map((i) => i.label).join(', ')}`}>
      <LinearGradient
        colors={['rgba(255,255,255,0.55)', 'rgba(255,255,255,0)']}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.7, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View
        style={[styles.sun, { width: height * 1.1, height: height * 1.1, right: -height * 0.35, top: -height * 0.45 }]}
      />
      {items.map((item, i) => {
        const p = layout[i];
        const size = Math.min(height * p.s, 128);
        return (
          <View
            key={item.id}
            style={[
              styles.tile,
              {
                width: size,
                height: size,
                borderRadius: size * 0.28,
                left: `${p.x * 100}%`,
                top: `${p.y * 100}%`,
                marginLeft: -size / 2,
                marginTop: -size / 2,
                transform: [{ rotate: `${p.r}deg` }],
              },
            ]}>
            <Icon name={item.symbol} size={size * 0.46} color={cat.ink} weight="medium" hierarchical />
          </View>
        );
      })}
    </View>
  );
}

export function CoverThumb({
  cause,
  size = 56,
}: {
  cause: Pick<Cause, 'category' | 'items' | 'coverUri'>;
  size?: number;
}) {
  const cat = categoryById(cause.category);
  if (cause.coverUri) {
    return (
      <Image
        source={{ uri: cause.coverUri }}
        style={{ width: size, height: size, borderRadius: size * 0.3, backgroundColor: cat.tint }}
        contentFit="cover"
      />
    );
  }
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.3,
        backgroundColor: cat.tint,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Icon name={cause.items[0]?.symbol ?? cat.symbol} size={size * 0.44} color={cat.ink} hierarchical />
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    position: 'absolute',
    backgroundColor: color.card,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3B2F1A',
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  sun: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
});
