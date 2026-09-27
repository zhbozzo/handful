import { useEffect, useState } from 'react';
import { Platform, Pressable, Settings, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  type SharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { scheduleOnRN } from 'react-native-worklets';

import { thud } from '@/lib/haptics';
import { launchProgress as fly, launchTargets } from '@/lib/launch';
import { color, font } from '@/theme/tokens';

const AnimatedPath = Animated.createAnimatedComponent(Path);

/**
 * The launch animation, over a plain paper native splash:
 * the open hands draw themselves, the sun falls in from the top and lands with a warm
 * shockwave and sparks, "handful" rises letter by letter, and the lockup flies into the
 * header of the first screen.
 */
const BOX = 132; // mark size while centered (100-unit viewBox)
const U = BOX / 100;
const S = 58; // lockup type size before it shrinks into the header
const WORD = 'handful';
const ARC = Math.PI * 33; // length of the hands' arc

// Timeline (ms), from the moment the first screen has mounted.
// Demo-video recording aid: `-handfulLaunchSlow 3` plays the whole animation 3× slower so the Simulator
// renders every frame; the edit speeds it back up. Off unless the Simulator passes that launch argument.
const SLOW = (Platform.OS === 'ios' && Number(Settings.get('handfulLaunchSlow'))) || 1;
const T = (ms: number) => ms * SLOW;
const DRAW = T(60);
const DROP = T(260);
const LAND = DROP + T(520);
const MORPH = LAND + T(420);
const LETTERS = MORPH + T(180);
const FLY = LETTERS + T(780);
const FLY_MS = T(680);
// Durations used inside UI-thread callbacks are precomputed: worklets can't call T().
const DRAW_MS = T(560);
const BOUNCE_UP_MS = T(130);
const BOUNCE_DOWN_MS = T(150);
const SQUASH_MS = T(70);
const WAVE_MS = T(900);
const BURST_MS = T(820);
const MORPH_MS = T(460);
const LETTERS_MS = T(520);
// A spring slowed by SLOW keeps its shape: stiffness / SLOW², damping / SLOW.
const SQUASH_SPRING = { damping: 13 / SLOW, stiffness: 260 / (SLOW * SLOW) };
const SPARKS = 16;

export function LaunchSplash({
  onReady,
  onDone,
  headerSize,
}: {
  onReady: () => void;
  onDone: () => void;
  /** Size of the header wordmark the lockup lands on (home 30, onboarding 26). */
  headerSize: number;
}) {
  const { width: W, height: H } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const [textW, setTextW] = useState(S * 3.25);

  const draw = useSharedValue(0);
  const drop = useSharedValue(0);
  const squash = useSharedValue(0);
  const landed = useSharedValue(0);
  const wave = useSharedValue(0);
  const burst = useSharedValue(0);
  const morph = useSharedValue(0);
  const letters = useSharedValue(0);
  const skip = useSharedValue(0);

  // Start only once this view has actually been laid out and a couple of frames painted —
  // the first mount of the app behind it can hold the UI thread for a moment.
  const [painted, setPainted] = useState(false);
  const onFirstLayout = () => {
    onReady();
    requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(() => setPainted(true), 300)));
  };

  useEffect(() => {
    if (!painted) return;
    if (reduced) {
      skip.set(withTiming(1, { duration: 300 }));
      fly.set(1);
      const t = setTimeout(onDone, 320);
      return () => clearTimeout(t);
    }
    const timers: ReturnType<typeof setTimeout>[] = [];
    {
      draw.set(withDelay(DRAW, withTiming(1, { duration: DRAW_MS, easing: Easing.out(Easing.cubic) })));
      // Everything after the landing is chained to the sun actually touching the hands,
      // so a dropped frame can never make the shockwave fire before the sun arrives.
      drop.set(
        withDelay(
          DROP,
          withTiming(1, { duration: LAND - DROP, easing: Easing.in(Easing.quad) }, (didLand) => {
            if (!didLand) return;
            landed.set(1);
            drop.set(
              withSequence(
                withTiming(0.93, { duration: BOUNCE_UP_MS, easing: Easing.out(Easing.quad) }),
                withTiming(1, { duration: BOUNCE_DOWN_MS, easing: Easing.in(Easing.quad) }),
              ),
            );
            squash.set(withSequence(withTiming(1, { duration: SQUASH_MS }), withSpring(0, SQUASH_SPRING)));
            wave.set(withTiming(1, { duration: WAVE_MS, easing: Easing.out(Easing.cubic) }));
            burst.set(withTiming(1, { duration: BURST_MS, easing: Easing.out(Easing.quad) }));
            morph.set(
              withDelay(MORPH - LAND, withTiming(1, { duration: MORPH_MS, easing: Easing.inOut(Easing.cubic) })),
            );
            letters.set(withDelay(LETTERS - LAND, withTiming(1, { duration: LETTERS_MS })));
            fly.set(
              withDelay(
                FLY - LAND,
                withTiming(1, { duration: FLY_MS, easing: Easing.bezier(0.65, 0, 0.25, 1) }, (finished) => {
                  if (finished) scheduleOnRN(onDone);
                }),
              ),
            );
            scheduleOnRN(thud);
          }),
        ),
      );
      timers.push(setTimeout(onDone, FLY + FLY_MS + 2500)); // safety net
    }
    return () => timers.forEach(clearTimeout);
  }, [painted, reduced, draw, drop, squash, landed, wave, burst, morph, letters, skip, onDone]);

  const cx = W / 2;
  const cy = H / 2;
  const boxLeft = cx - BOX / 2;
  const boxTop = cy - BOX / 2 - 0.0725 * BOX; // centers the drawn mark (its visual center is y≈57)
  const sunCY = boxTop + 40 * U; // sun center on screen when landed

  // Lockup laid out like <Wordmark size={S}>: mark 0.95·S, gap 0.2·S, then the word.
  const lockW = 1.15 * S + textW;
  const markScale = (0.95 * S) / BOX;
  const markDX = cx - lockW / 2 + 0.475 * S - cx;
  const markDY = cy - (boxTop + BOX / 2);
  const textLeft = cx - lockW / 2 + 1.15 * S;

  // Where the header wordmark sits if it hasn't reported its measured frame.
  const guessTop = insets.top + (headerSize === 30 ? 8 : 12);
  const fallFrom = -(sunCY + 40); // the sun starts just above the top edge

  const bg = useAnimatedStyle(() => ({
    opacity: Math.min(interpolate(fly.value, [0.3, 0.92], [1, 0], 'clamp'), 1 - skip.value),
  }));
  const lockup = useAnimatedStyle(() => {
    // Land exactly on the real header wordmark (measured by the wordmark itself).
    const t = launchTargets.get()[headerSize];
    const g = t ? t.height / (S * 1.1) : headerSize / S;
    // Anchored on the left edge: the wordmark's box can be wider than its content.
    const toX = (t ? t.x : 20) + (lockW * g) / 2;
    const toY = t ? t.y + t.height / 2 : guessTop + (headerSize * 1.1) / 2;
    const p = fly.get();
    return {
      // With nothing to land on (a deep link into another screen), it fades out on the way.
      opacity: (1 - skip.get()) * (t ? 1 : interpolate(p, [0.4, 0.9], [1, 0], 'clamp')),
      transform: [{ translateX: p * (toX - cx) }, { translateY: p * (toY - cy) }, { scale: 1 + p * (g - 1) }],
    };
  });
  const mark = useAnimatedStyle(() => ({
    transform: [
      { translateX: morph.value * markDX },
      { translateY: morph.value * markDY },
      { scale: 1 + morph.value * (markScale - 1) },
    ],
  }));
  const arcProps = useAnimatedProps(() => ({ strokeDashoffset: ARC * (1 - draw.value) }));
  const cupStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: squash.value * 3 },
      { scaleX: 1 + squash.value * 0.08 },
      { scaleY: 1 - squash.value * 0.1 },
    ],
  }));
  const sunStyle = useAnimatedStyle(() => ({
    opacity: interpolate(drop.value, [0, 0.05], [0, 1], 'clamp'),
    transform: [
      { translateY: (1 - drop.value) * fallFrom },
      // Stretched while falling, squashed on impact.
      {
        scaleY:
          1 +
          (1 - landed.value) * interpolate(drop.value, [0.55, 0.9, 1], [0, 0.16, 0.08], 'clamp') -
          Math.max(0, squash.value) * 0.3,
      },
      {
        scaleX:
          1 -
          (1 - landed.value) * interpolate(drop.value, [0.55, 0.9, 1], [0, 0.09, 0.05], 'clamp') +
          Math.max(0, squash.value) * 0.25,
      },
    ],
  }));
  const waveStyle = useAnimatedStyle(() => ({
    opacity: interpolate(wave.value, [0, 0.08, 1], [0, 0.55, 0]),
    transform: [{ scale: 0.4 + wave.value * 7 }],
  }));
  const bloom = useAnimatedStyle(() => ({
    opacity: interpolate(wave.value, [0, 0.15, 1], [0, 0.55, 0.18]) * (1 - morph.value),
    transform: [{ scale: 0.6 + wave.value * 1.1 }],
  }));

  return (
    <Pressable
      style={StyleSheet.absoluteFill}
      accessibilityLabel="Handful"
      accessibilityHint="Tap to skip"
      onPress={() => {
        skip.set(withTiming(1, { duration: 180 }));
        fly.set(withTiming(1, { duration: 180 }));
        setTimeout(onDone, 200);
      }}>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.bg, bg]}>
        <Animated.View
          style={[styles.wave, { left: cx - 40, top: sunCY - 40, width: 80, height: 80, borderRadius: 40 }, waveStyle]}
        />
      </Animated.View>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, lockup]} onLayout={onFirstLayout}>
        <Animated.View style={[{ position: 'absolute', left: boxLeft, top: boxTop, width: BOX, height: BOX }, mark]}>
          <Animated.View
            style={[
              styles.bloom,
              { left: 50 * U - 34 * U, top: 40 * U - 34 * U, width: 68 * U, height: 68 * U, borderRadius: 34 * U },
              bloom,
            ]}
          />
          {Array.from({ length: SPARKS }, (_, i) => (
            <Spark key={i} i={i} progress={burst} x={50 * U} y={40 * U} />
          ))}
          <Animated.View style={[StyleSheet.absoluteFill, cupStyle]}>
            <Svg width={BOX} height={BOX} viewBox="0 0 100 100">
              <AnimatedPath
                d="M17 47 A33 33 0 0 0 83 47"
                stroke={color.ink}
                strokeWidth={11}
                strokeLinecap="round"
                fill="none"
                strokeDasharray={`${ARC} ${ARC}`}
                strokeDashoffset={ARC}
                animatedProps={arcProps}
              />
            </Svg>
          </Animated.View>
          <Animated.View style={[StyleSheet.absoluteFill, sunStyle]}>
            <Svg width={BOX} height={BOX} viewBox="0 0 100 100">
              <Defs>
                <LinearGradient id="sun" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor="#FFC45C" />
                  <Stop offset="1" stopColor="#F0961C" />
                </LinearGradient>
              </Defs>
              <Circle cx={50} cy={40} r={13} fill="url(#sun)" />
            </Svg>
          </Animated.View>
        </Animated.View>

        <View
          style={[styles.word, { left: textLeft, top: cy - (S * 1.1) / 2 }]}
          onLayout={(e) => setTextW(e.nativeEvent.layout.width)}>
          {WORD.split('').map((ch, i) => (
            <Letter key={i} ch={ch} index={i} progress={letters} />
          ))}
        </View>
      </Animated.View>
    </Pressable>
  );
}

const SPARK_COLORS = [color.sun, '#FFD27A', '#F0961C', '#FFE3A8'];

/** A warm spark thrown out of the landing point. */
function Spark({ i, progress, x, y }: { i: number; progress: SharedValue<number>; x: number; y: number }) {
  const angle = -Math.PI / 2 + ((i / SPARKS) * 2 - 1) * (Math.PI * 0.72) + (i % 2 ? 0.08 : -0.05);
  const dist = 70 + ((i * 37) % 5) * 12;
  const size = 6 + (i % 3) * 2.5;
  const style = useAnimatedStyle(() => {
    const t = progress.value;
    return {
      opacity: t === 0 ? 0 : interpolate(t, [0, 0.1, 1], [0, 1, 0]),
      transform: [
        { translateX: Math.cos(angle) * dist * t },
        { translateY: Math.sin(angle) * dist * t + 40 * t * t },
        { scale: 1 - t * 0.5 },
      ],
    };
  });
  return (
    <Animated.View
      style={[
        styles.spark,
        {
          left: x - size / 2,
          top: y - size / 2,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: SPARK_COLORS[i % SPARK_COLORS.length],
        },
        style,
      ]}
    />
  );
}

function Letter({ ch, index, progress }: { ch: string; index: number; progress: SharedValue<number> }) {
  const style = useAnimatedStyle(() => {
    const start = index * 0.09;
    const t = interpolate(progress.value, [start, start + 0.4], [0, 1], 'clamp');
    // A small overshoot as each letter settles.
    const lift = t < 1 ? (1 - t) * 18 - Math.sin(t * Math.PI) * 3 : 0;
    return { opacity: t, transform: [{ translateY: lift }] };
  });
  return <Animated.Text style={[styles.letter, style]}>{ch}</Animated.Text>;
}

const styles = StyleSheet.create({
  bg: { backgroundColor: color.paper, overflow: 'hidden' },
  wave: { position: 'absolute', borderWidth: 3, borderColor: color.sun },
  bloom: { position: 'absolute', backgroundColor: 'rgba(244,166,42,0.35)' },
  spark: { position: 'absolute' },
  word: { position: 'absolute', flexDirection: 'row', height: S * 1.1, alignItems: 'center' },
  letter: {
    fontFamily: font.extrabold,
    fontSize: S,
    lineHeight: S * 1.1,
    letterSpacing: -S * 0.04,
    color: color.ink,
  },
});
