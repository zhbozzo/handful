import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { Ring } from '@/components/Progress';
import { Txt } from '@/components/Txt';
import { devScroll } from '@/lib/devScroll';
import { categoryById } from '@/data/categories';
import { orgById } from '@/data/seed';
import { money, pct } from '@/lib/format';
import { success, tap } from '@/lib/haptics';
import { askForDeliveryUpdates, notificationsGranted } from '@/lib/notifications';
import { shareCause } from '@/lib/share';
import { useCause, useStore } from '@/store/useStore';
import { color, radius, space } from '@/theme/tokens';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const RING_MS = 1300;

/** Soft warm bloom behind the ring when a cause closes. */
function Glow({ delay }: { delay: number }) {
  const v = useSharedValue(0);
  useEffect(() => {
    v.set(withDelay(delay, withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) })));
  }, [delay, v]);
  const style = useAnimatedStyle(() => ({
    opacity: v.value * 0.45,
    transform: [{ scale: 0.72 + v.value * 0.22 }],
  }));
  return <Animated.View pointerEvents="none" style={[styles.glow, style]} />;
}

const SPARK_COLORS = [color.sun, '#F7C565', color.sunDeep, '#FFE3A8', color.leaf];

/** One warm spark flung out of the ring: it arcs, turns and fades. */
function Spark({ index, count, delay, reach }: { index: number; count: number; delay: number; reach: number }) {
  const v = useSharedValue(0);
  useEffect(() => {
    v.set(withDelay(delay + (index % 3) * 40, withTiming(1, { duration: 1100, easing: Easing.out(Easing.quad) })));
  }, [delay, index, v]);

  const angle = (index / count) * Math.PI * 2 + (index % 2 ? 0.18 : -0.12);
  const dist = reach * (0.72 + ((index * 37) % 11) / 30);
  const size = 6 + ((index * 5) % 4) * 2;
  const square = index % 3 === 0;
  const tint = SPARK_COLORS[index % SPARK_COLORS.length];

  const style = useAnimatedStyle(() => {
    const t = v.value;
    const out = 1 - Math.pow(1 - t, 2);
    return {
      opacity: t === 0 ? 0 : t < 0.12 ? t / 0.12 : 1 - Math.pow((t - 0.12) / 0.88, 1.6),
      transform: [
        { translateX: Math.cos(angle) * (62 + (dist - 62) * out) },
        { translateY: Math.sin(angle) * (62 + (dist - 62) * out) + 26 * t * t },
        { rotate: `${(index % 2 ? 1 : -1) * 220 * t}deg` },
        { scale: 0.5 + 0.7 * Math.sin(Math.min(1, t * 1.4) * Math.PI * 0.85) },
      ],
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.spark,
        {
          width: size,
          height: square ? size : size * 1.9,
          marginLeft: -size / 2,
          marginTop: -size / 2,
          borderRadius: square ? 2 : size / 2,
          backgroundColor: tint,
        },
        style,
      ]}
    />
  );
}

/** Confetti-free celebration: a small ring of warm sparks when the ring fills. */
function Burst({ delay, count, reach }: { delay: number; count: number; reach: number }) {
  const reduced = useReducedMotion();
  if (reduced) return null;
  return (
    <View pointerEvents="none" style={styles.burst}>
      {Array.from({ length: count }, (_, i) => (
        <Spark key={i} index={i} count={count} delay={delay} reach={reach} />
      ))}
    </View>
  );
}

function Check({ delay }: { delay: number }) {
  const len = 60;
  const v = useSharedValue(len);
  useEffect(() => {
    v.set(withDelay(delay, withTiming(0, { duration: 420, easing: Easing.out(Easing.cubic) })));
  }, [delay, v]);
  const props = useAnimatedProps(() => ({ strokeDashoffset: v.value }));
  return (
    <Svg width={72} height={72} viewBox="0 0 72 72">
      <AnimatedPath
        d="M20 37 L31 48 L53 25"
        stroke={color.ink}
        strokeWidth={7}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        strokeDasharray={`${len} ${len}`}
        animatedProps={props}
      />
    </Svg>
  );
}

export default function SuccessScreen() {
  const { id, gift, completed } = useLocalSearchParams<{ id: string; gift: string; completed: string }>();
  const cause = useCause(id);
  const contribution = useStore((s) => s.contributions.find((c) => c.id === gift));
  const insets = useSafeAreaInsets();
  const done = completed === '1';
  const [notify, setNotify] = useState<'unknown' | 'ask' | 'on'>('unknown');

  useEffect(() => {
    notificationsGranted().then((g) => setNotify(g ? 'on' : 'ask'));
  }, []);

  useEffect(() => {
    const t = setTimeout(success, done ? RING_MS + 250 : RING_MS);
    return () => clearTimeout(t);
  }, [done]);

  if (!cause || !contribution) return null;

  const org = orgById(cause.orgId);
  const cat = categoryById(cause.category);
  const before = (cause.raised - contribution.amount) / cause.goal;
  const now = cause.raised / cause.goal;
  const left = cause.goal - cause.raised;

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom + space.md }]}>
      <ScrollView
        contentOffset={devScroll()}
        // The glow and sparks spill past the top edge instead of being cut flat.
        style={{ overflow: 'visible' }}
        contentContainerStyle={{
          alignItems: 'center',
          gap: space.md,
          paddingHorizontal: space.lg,
          paddingTop: 28,
          paddingBottom: space.lg,
        }}
        showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeIn.duration(400)} style={styles.ringWrap}>
          {done ? <Glow delay={RING_MS + 100} /> : null}
          <Burst delay={RING_MS + 150} count={done ? 18 : 10} reach={done ? 150 : 115} />
          <Ring
            value={now}
            from={before}
            size={148}
            stroke={13}
            fill={done ? color.sun : color.sun}
            duration={RING_MS}
            delay={250}>
            {done ? (
              <Check delay={RING_MS + 250} />
            ) : (
              <Txt variant="bigNumber" style={{ fontSize: 44, lineHeight: 50 }}>
                +{money(contribution.amount)}
              </Txt>
            )}
          </Ring>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(done ? RING_MS : 700).duration(500)}
          style={{ gap: space.sm, alignItems: 'center' }}>
          <Txt variant="display" align="center" style={{ fontSize: 42, lineHeight: 44 }}>
            {done ? (
              <>
                You completed{'\n'}
                <Txt variant="display" accent>
                  this cause.
                </Txt>
              </>
            ) : (
              <>
                Your {money(contribution.amount)}{' '}
                <Txt variant="display" accent>
                  is in.
                </Txt>
              </>
            )}
          </Txt>
          <Txt variant="callout" align="center" style={{ maxWidth: 320 }}>
            {done
              ? `${org.name} buys the items next, then posts the receipt and a privacy-safe photo.`
              : `${cause.title} is now ${pct(cause.raised, cause.goal)}% funded — ${money(left)} to go.`}
          </Txt>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(done ? RING_MS + 250 : 900).duration(500)} style={styles.card}>
          <Txt variant="micro">{done ? 'Now on its way' : 'Your gift is going toward'}</Txt>
          {cause.items.map((item, i) => (
            <Animated.View
              key={item.id}
              entering={FadeInDown.delay((done ? RING_MS + 400 : 1000) + i * 110).duration(380)}
              style={styles.item}>
              <View style={[styles.itemIcon, { backgroundColor: cat.tint }]}>
                <Icon name={item.symbol} size={15} color={cat.ink} hierarchical />
              </View>
              <Txt variant="body" style={{ flex: 1 }}>
                {item.label}
              </Txt>
              {done ? <Icon name="checkmark.circle.fill" size={18} color={color.leaf} /> : null}
            </Animated.View>
          ))}
        </Animated.View>

        {notify !== 'unknown' ? (
          <Animated.View entering={FadeIn.delay(done ? RING_MS + 700 : 1100)}>
            <Pressable
              disabled={notify === 'on'}
              onPress={async () => {
                tap();
                setNotify((await askForDeliveryUpdates()) ? 'on' : 'ask');
              }}
              style={[styles.notify, notify === 'on' && styles.notifyOn]}
              accessibilityRole="button">
              <Icon
                name={notify === 'on' ? 'bell.badge.fill' : 'bell.fill'}
                size={15}
                color={notify === 'on' ? color.leaf : color.ink}
              />
              <Txt variant="caption" color={notify === 'on' ? color.leaf : color.ink} style={{ fontWeight: '700' }}>
                {notify === 'on' ? 'We’ll notify you when it’s delivered' : 'Notify me when it’s delivered'}
              </Txt>
            </Pressable>
          </Animated.View>
        ) : null}

        {/* One share is worth more than any other follow-up a donor can do. */}
        <Animated.View entering={FadeIn.delay(done ? RING_MS + 850 : 1250)}>
          <Pressable
            onPress={() => {
              tap();
              shareCause(cause, { justGave: true });
            }}
            style={styles.notify}
            accessibilityRole="button">
            <Icon name="square.and.arrow.up" size={15} color={color.ink} />
            <Txt variant="caption" color={color.ink} style={{ fontWeight: '700' }}>
              {done ? 'Share the good news' : `Ask a friend to help finish it · ${money(left)} to go`}
            </Txt>
          </Pressable>
        </Animated.View>
      </ScrollView>

      <View style={styles.actions}>
        <Button
          label="View cause"
          kind="secondary"
          style={{ flex: 1 }}
          onPress={() => {
            router.dismissAll();
            router.push(`/cause/${cause.id}`);
          }}
        />
        <Button label="Done" style={{ flex: 1 }} onPress={() => router.dismissAll()} />
      </View>
      <Animated.View entering={FadeIn.delay(done ? RING_MS + 900 : 1300)} style={styles.receipt}>
        <Icon name="lock.fill" size={11} color={color.ink3} />
        <Txt variant="caption" color={color.ink3} align="center" style={{ flexShrink: 1 }}>
          {contribution.rail === 'revenuecat-test-store'
            ? 'RevenueCat Test Store · no real money was charged'
            : 'Offline demo checkout · no money moved'}
        </Txt>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.paper },
  ringWrap: { alignItems: 'center', justifyContent: 'center' },
  burst: { position: 'absolute', width: 0, height: 0 },
  spark: { position: 'absolute' },
  glow: { position: 'absolute', width: 204, height: 204, borderRadius: 102, backgroundColor: color.sunSoft },
  card: {
    alignSelf: 'stretch',
    backgroundColor: color.card,
    borderRadius: radius.lg,
    padding: space.md,
    gap: 4,
  },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 3 },
  itemIcon: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  receipt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: space.md,
    paddingTop: 10,
  },
  notify: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: radius.pill,
    backgroundColor: color.card,
    borderWidth: 1,
    borderColor: color.line,
  },
  notifyOn: { backgroundColor: color.leafSoft, borderColor: color.leafSoft },
  actions: { flexDirection: 'row', gap: 10, paddingHorizontal: space.lg, paddingTop: space.sm },
});
