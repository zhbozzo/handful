import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { color } from '@/theme/tokens';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const ease = Easing.bezier(0.22, 1, 0.36, 1);

type BarProps = { value: number; height?: number; track?: string; fill?: string; delay?: number };

/** value: 0…1 */
export function ProgressBar({ value, height = 8, track = color.paperDeep, fill = color.sun, delay = 120 }: BarProps) {
  const v = useSharedValue(0);
  useEffect(() => {
    v.set(withDelay(delay, withTiming(Math.max(0, Math.min(1, value)), { duration: 900, easing: ease })));
  }, [value, delay, v]);
  const style = useAnimatedStyle(() => ({ width: `${v.value * 100}%` }));
  return (
    <View
      style={[styles.track, { height, borderRadius: height, backgroundColor: track }]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(value * 100) }}>
      <Animated.View style={[{ height, borderRadius: height, backgroundColor: fill }, style]} />
    </View>
  );
}

type RingProps = {
  value: number;
  from?: number;
  size?: number;
  stroke?: number;
  track?: string;
  fill?: string;
  duration?: number;
  delay?: number;
  children?: React.ReactNode;
};

/** Progress ring. Animates from `from` to `value` (0…1). */
export function Ring({
  value,
  from = 0,
  size = 64,
  stroke = 7,
  track = color.paperDeep,
  fill = color.sun,
  duration = 1000,
  delay = 150,
  children,
}: RingProps) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = useSharedValue(from);
  useEffect(() => {
    v.set(withDelay(delay, withTiming(Math.max(0, Math.min(1, value)), { duration, easing: ease })));
  }, [value, delay, duration, v]);
  const props = useAnimatedProps(() => ({ strokeDashoffset: c * (1 - v.value) }));

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={fill}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${c} ${c}`}
          animatedProps={props}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { width: '100%', overflow: 'hidden' },
});
