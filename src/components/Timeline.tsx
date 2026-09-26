import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import type { Cause, CauseStatus } from '@/data/types';
import { when } from '@/lib/format';
import { color } from '@/theme/tokens';

import { Icon } from './Icon';
import { Txt } from './Txt';

const STEPS: { status: CauseStatus; title: string; pending: string; symbol: string }[] = [
  {
    status: 'open',
    title: 'Verified & published',
    pending: 'The nonprofit checks the need first',
    symbol: 'checkmark.seal.fill',
  },
  { status: 'funded', title: 'Fully funded', pending: 'Closes when the goal is reached', symbol: 'circle.circle.fill' },
  {
    status: 'purchased',
    title: 'Items purchased',
    pending: 'Receipt posted within 24h of funding',
    symbol: 'receipt.fill',
  },
  {
    status: 'delivered',
    title: 'Delivered with proof',
    pending: 'Privacy-safe photo + note from the team',
    symbol: 'shippingbox.fill',
  },
];

/** The transparency spine of every cause. */
export function Timeline({ cause }: { cause: Cause }) {
  const reached = new Map(cause.timeline.map((t) => [t.status, t]));
  const currentIndex = STEPS.findIndex((s) => !reached.has(s.status));

  return (
    <View>
      {STEPS.map((step, i) => {
        const event = reached.get(step.status);
        const isNext = i === currentIndex;
        const last = i === STEPS.length - 1;
        const nextDone = !!reached.get(STEPS[i + 1]?.status);
        return (
          <View
            key={step.status}
            style={styles.row}
            accessible
            accessibilityLabel={`${step.title}: ${event ? when(event.at) : 'pending'}`}>
            <View style={styles.rail}>
              {isNext ? <Pulse /> : null}
              <View style={[styles.dot, event ? styles.dotDone : isNext ? styles.dotNext : styles.dotTodo]}>
                {event ? <Icon name="checkmark" size={11} color={color.white} weight="heavy" /> : null}
              </View>
              {!last ? <View style={[styles.line, nextDone ? styles.lineDone : null]} /> : null}
            </View>
            <View style={styles.content}>
              <View style={styles.titleRow}>
                <Txt variant="bodyStrong" color={event ? color.ink : color.ink3}>
                  {step.title}
                </Txt>
                {event ? (
                  <Txt variant="caption" color={color.ink3}>
                    {when(event.at)}
                  </Txt>
                ) : null}
              </View>
              <Txt variant="caption" color={event ? color.ink2 : color.ink3}>
                {event?.note ?? step.pending}
              </Txt>
            </View>
          </View>
        );
      })}
    </View>
  );
}

/** A soft ring spreading from the step that's happening now. */
function Pulse() {
  const reduced = useReducedMotion();
  const t = useSharedValue(0);
  useEffect(() => {
    if (reduced) return;
    t.set(withRepeat(withTiming(1, { duration: 1800, easing: Easing.out(Easing.quad) }), -1));
  }, [reduced, t]);
  const style = useAnimatedStyle(() => ({
    opacity: 0.55 * (1 - t.value),
    transform: [{ scale: 1 + t.value * 0.9 }],
  }));
  return <Animated.View pointerEvents="none" style={[styles.pulse, style]} />;
}

const styles = StyleSheet.create({
  pulse: { position: 'absolute', top: 0, width: 22, height: 22, borderRadius: 11, backgroundColor: color.sun },
  row: { flexDirection: 'row', gap: 14 },
  rail: { width: 22, alignItems: 'center' },
  dot: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  dotDone: { backgroundColor: color.leaf },
  dotNext: { borderWidth: 2, borderColor: color.sun, backgroundColor: color.sunSoft },
  dotTodo: { borderWidth: 2, borderColor: color.line, backgroundColor: color.card },
  line: { flex: 1, width: 2, backgroundColor: color.line, marginVertical: 3, minHeight: 18 },
  lineDone: { backgroundColor: color.leaf },
  content: { flex: 1, paddingBottom: 18, gap: 2 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 },
});
