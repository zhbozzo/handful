import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { categoryById } from '@/data/categories';
import { causePhoto } from '@/data/photos';
import type { Cause } from '@/data/types';
import { color, radius } from '@/theme/tokens';

import { Icon } from './Icon';
import { Txt } from './Txt';

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

type CoverCause = Pick<Cause, 'category' | 'items' | 'coverUri'> & { id?: string };

type Props = {
  cause: CoverCause;
  height: number;
  rounded?: number;
  style?: ViewStyle;
  /** Gentle idle float of the items. Off for small or repeated covers. */
  alive?: boolean;
  /** Space at the top the items should stay clear of (status bar, back button). */
  padTop?: number;
  /** Label demo photos as illustrative (on the cause page). */
  photoTag?: boolean;
  /** How much of the bottom edge is covered by content, so the label stays visible. */
  bottomInset?: number;
};

/** Bigger covers hold fewer, larger items; four items share the space. */
const MAX_TILE = [132, 124, 108, 96];

function Tile({
  symbol,
  size,
  x,
  top,
  r,
  ink,
  index,
  alive,
}: {
  symbol: string;
  size: number;
  x: number;
  top: number;
  r: number;
  ink: string;
  index: number;
  alive: boolean;
}) {
  const reduced = useReducedMotion();
  const t = useSharedValue(0);
  useEffect(() => {
    if (!alive || reduced) return;
    const d = 2600 + index * 420;
    t.set(
      withDelay(
        index * 350,
        withRepeat(
          withSequence(
            withTiming(1, { duration: d, easing: Easing.inOut(Easing.sin) }),
            withTiming(0, { duration: d, easing: Easing.inOut(Easing.sin) }),
          ),
          -1,
        ),
      ),
    );
  }, [alive, reduced, index, t]);

  const float = useAnimatedStyle(() => ({
    transform: [{ translateY: -5 * t.value }, { rotate: `${r + (index % 2 ? 1.6 : -1.6) * t.value}deg` }],
  }));

  return (
    <Animated.View
      style={[
        styles.tile,
        {
          width: size,
          height: size,
          borderRadius: size * 0.28,
          left: `${x * 100}%`,
          top,
          marginLeft: -size / 2,
          marginTop: -size / 2,
        },
        float,
      ]}>
      <View style={[styles.tileFace, { borderRadius: size * 0.28 }]}>
        <LinearGradient colors={['#FFFFFF', '#FBF7EF']} style={StyleSheet.absoluteFill} />
        <Icon name={symbol} size={size * 0.46} color={ink} weight="medium" hierarchical />
      </View>
    </Animated.View>
  );
}

export function CoverArt({
  cause,
  height,
  rounded = radius.lg,
  style,
  alive = true,
  padTop = 0,
  photoTag = false,
  bottomInset = 0,
}: Props) {
  const cat = categoryById(cause.category);
  const demoPhoto = cause.coverUri ? undefined : causePhoto(cause.id);

  if (cause.coverUri || demoPhoto) {
    return (
      <View style={[{ height, borderRadius: rounded, overflow: 'hidden', backgroundColor: cat.tint }, style]}>
        <Image
          source={cause.coverUri ? { uri: cause.coverUri } : demoPhoto}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={250}
          accessibilityLabel={`Photo of ${cause.items.map((i) => i.label).join(', ')}`}
        />
        {demoPhoto && photoTag ? (
          <View style={[styles.photoTag, { bottom: 10 + bottomInset }]}>
            <Txt variant="caption" color={color.ink2} style={{ fontSize: 10, lineHeight: 13 }}>
              Illustrative photo
            </Txt>
          </View>
        ) : null}
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
      {/* Soft light from the top left, a warm pool of the category color bottom right. */}
      <LinearGradient
        colors={['rgba(255,255,255,0.6)', 'rgba(255,255,255,0)']}
        start={{ x: 0.05, y: 0 }}
        end={{ x: 0.65, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View
        style={[styles.orb, { width: height * 1.1, height: height * 1.1, right: -height * 0.35, top: -height * 0.45 }]}
      />
      <View
        style={[
          styles.orb,
          {
            width: height * 0.9,
            height: height * 0.9,
            left: -height * 0.3,
            bottom: -height * 0.55,
            backgroundColor: `${cat.ink}14`,
          },
        ]}
      />
      {items.map((item, i) => {
        const p = layout[i];
        return (
          <Tile
            key={item.id}
            symbol={item.symbol}
            size={Math.min((height - padTop) * p.s, MAX_TILE[items.length - 1] ?? 96)}
            x={p.x}
            top={padTop + p.y * (height - padTop)}
            r={p.r}
            ink={cat.ink}
            index={i}
            alive={alive}
          />
        );
      })}
    </View>
  );
}

export function CoverThumb({ cause, size = 56 }: { cause: CoverCause; size?: number }) {
  const cat = categoryById(cause.category);
  const demoPhoto = cause.coverUri ? undefined : causePhoto(cause.id);
  if (cause.coverUri || demoPhoto) {
    return (
      <Image
        source={cause.coverUri ? { uri: cause.coverUri } : demoPhoto}
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
    shadowColor: '#3B2F1A',
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  tileFace: {
    flex: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  photoTag: {
    position: 'absolute',
    right: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
});
