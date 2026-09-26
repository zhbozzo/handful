import { useEffect, useState } from 'react';
import { InteractionManager, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { thud } from '@/lib/haptics';
import { color, font } from '@/theme/tokens';

/**
 * The launch animation. Its first frame is pixel-identical to the native splash
 * (scripts/make-icons.py: mark 62% of a 1024 px image shown at 96 pt), so the hand-off is invisible.
 * Then the sun hops and lands in the open hands, "handful" writes itself beside it,
 * and the whole lockup flies into the header of the first screen.
 */
const U = (96 / 1024) * ((1024 * 0.62) / 79); // points per mark unit (100-unit viewBox)
const BOX = 100 * U;
const S = 56; // lockup type size before it shrinks into the header
const WORD = 'handful';

// Timeline (ms), counted from the moment the first screen has finished mounting.
const START = 60;
const LAND = START + 520;
const MORPH = 820;
const LETTERS = MORPH + 260;
const FLY = 1500;
const FLY_MS = 480;
const END = FLY + FLY_MS + 60;

export function LaunchSplash({
  onReady,
  onDone,
  headerSize,
}: {
  onReady: () => void;
  onDone: () => void;
  headerSize: number;
}) {
  const { width: W, height: H } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const [textW, setTextW] = useState(S * 3.25);

  const sunY = useSharedValue(0);
  const squash = useSharedValue(1);
  const glow = useSharedValue(0);
  const morph = useSharedValue(0);
  const letters = useSharedValue(0);
  const fly = useSharedValue(0);
  const skip = useSharedValue(0);

  useEffect(() => {
    if (reduced) {
      skip.set(withTiming(1, { duration: 300 }));
      const t = setTimeout(onDone, 320);
      return () => clearTimeout(t);
    }
    const timers: ReturnType<typeof setTimeout>[] = [];
    // Hold the logo still (it looks exactly like the native splash) until the first screen has mounted,
    // so the animation isn't competing with it for frames.
    const task = InteractionManager.runAfterInteractions(() => {
      timers.push(
        setTimeout(() => {
          sunY.set(
            withDelay(
              START,
              withSequence(
                withTiming(-26, { duration: 260, easing: Easing.out(Easing.quad) }),
                withSpring(0, { damping: 8, stiffness: 220, mass: 0.6 }),
              ),
            ),
          );
          squash.set(
            withDelay(LAND - 40, withSequence(withTiming(0.88, { duration: 90 }), withSpring(1, { damping: 9 }))),
          );
          glow.set(
            withDelay(LAND - 40, withSequence(withTiming(1, { duration: 240 }), withTiming(0.5, { duration: 420 }))),
          );
          morph.set(withDelay(MORPH, withTiming(1, { duration: 420, easing: Easing.inOut(Easing.cubic) })));
          letters.set(withDelay(LETTERS, withTiming(1, { duration: 420 })));
          // Unmount only when the flight has actually finished on the UI thread (a JS timer could cut it short).
          fly.set(
            withDelay(
              FLY,
              withTiming(1, { duration: FLY_MS, easing: Easing.inOut(Easing.cubic) }, (finished) => {
                if (finished) scheduleOnRN(onDone);
              }),
            ),
          );
          timers.push(setTimeout(thud, LAND));
          // Safety net if the UI thread never reports back.
          timers.push(setTimeout(onDone, END + 2500));
        }, 150),
      );
    });
    return () => {
      task.cancel();
      timers.forEach(clearTimeout);
    };
  }, [reduced, sunY, squash, glow, morph, letters, fly, skip, onDone]);

  // Geometry. The native splash centers the image on the screen; mark unit (50, 57.25) sits at the center.
  const cx = W / 2;
  const cy = H / 2;
  const boxLeft = cx - 50 * U;
  const boxTop = cy - 57.25 * U;

  // Lockup laid out like <Wordmark size={S}>: mark box 0.95S, gap 0.2S, then the word.
  const lockW = 1.15 * S + textW;
  const markTargetX = cx - lockW / 2 + 0.475 * S;
  const markScale = (0.95 * S) / BOX;
  const markDX = markTargetX - cx;
  const markDY = cy - (boxTop + BOX / 2);
  const textLeft = cx - lockW / 2 + 1.15 * S;

  // Header target: the wordmark at the top-left of the first screen.
  const g = headerSize / S;
  const headerCX = 20 + (lockW * g) / 2;
  const headerCY = insets.top + (headerSize === 30 ? 8 : 12) + (headerSize * 1.1) / 2;

  const bg = useAnimatedStyle(() => ({
    opacity: Math.min(interpolate(fly.value, [0.96, 1], [1, 0], 'clamp'), 1 - skip.value),
  }));
  const lockup = useAnimatedStyle(() => ({
    opacity: Math.min(interpolate(fly.value, [0.985, 1], [1, 0], 'clamp'), 1 - skip.value),
    transform: [
      { translateX: fly.value * (headerCX - cx) },
      { translateY: fly.value * (headerCY - cy) },
      { scale: 1 + fly.value * (g - 1) },
    ],
  }));
  const mark = useAnimatedStyle(() => ({
    transform: [
      { translateX: morph.value * markDX },
      { translateY: morph.value * markDY },
      { scale: 1 + morph.value * (markScale - 1) },
    ],
  }));
  const cup = useAnimatedStyle(() => ({ transform: [{ scaleY: squash.value }, { scaleX: 2 - squash.value }] }));
  const sun = useAnimatedStyle(() => ({ transform: [{ translateY: sunY.value * U }] }));
  const halo = useAnimatedStyle(() => ({
    opacity: glow.value * (1 - morph.value * 0.6),
    transform: [{ scale: 0.6 + glow.value * 0.5 }],
  }));

  return (
    <Pressable
      style={StyleSheet.absoluteFill}
      accessibilityLabel="Handful"
      accessibilityHint="Tap to skip"
      onPress={() => {
        skip.set(withTiming(1, { duration: 180 }));
        setTimeout(onDone, 200);
      }}>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: color.paper }, bg]} />
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, lockup]} onLayout={onReady}>
        <Animated.View style={[{ position: 'absolute', left: boxLeft, top: boxTop, width: BOX, height: BOX }, mark]}>
          <Animated.View
            style={[
              styles.halo,
              { left: 50 * U - 28 * U, top: 40 * U - 28 * U, width: 56 * U, height: 56 * U, borderRadius: 28 * U },
              halo,
            ]}
          />
          <Animated.View style={[StyleSheet.absoluteFill, cup]}>
            <Svg width={BOX} height={BOX} viewBox="0 0 100 100">
              <Path
                d="M17 47 A33 33 0 0 0 83 47"
                stroke={color.ink}
                strokeWidth={11}
                strokeLinecap="round"
                fill="none"
              />
            </Svg>
          </Animated.View>
          <Animated.View style={[StyleSheet.absoluteFill, sun]}>
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

function Letter({ ch, index, progress }: { ch: string; index: number; progress: { value: number } }) {
  const style = useAnimatedStyle(() => {
    const start = index * 0.1;
    const t = interpolate(progress.value, [start, start + 0.35], [0, 1], 'clamp');
    return { opacity: t, transform: [{ translateY: (1 - t) * 10 }] };
  });
  return <Animated.Text style={[styles.letter, style]}>{ch}</Animated.Text>;
}

const styles = StyleSheet.create({
  halo: { position: 'absolute', backgroundColor: 'rgba(244,166,42,0.30)' },
  word: { position: 'absolute', flexDirection: 'row', height: S * 1.1, alignItems: 'center' },
  letter: {
    fontFamily: font.extrabold,
    fontSize: S,
    lineHeight: S * 1.1,
    letterSpacing: -S * 0.04,
    color: color.ink,
  },
});
