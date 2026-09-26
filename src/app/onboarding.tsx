import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  interpolate,
  interpolateColor,
  type SharedValue,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { CoverThumb } from '@/components/CoverArt';
import { Icon } from '@/components/Icon';
import { ProgressBar } from '@/components/Progress';
import { Txt } from '@/components/Txt';
import { Wordmark } from '@/components/Wordmark';
import { seedCauses } from '@/data/seed';
import { money } from '@/lib/format';
import { useStore } from '@/store/useStore';
import { color, radius, shadow, space } from '@/theme/tokens';

const sample = seedCauses();

const PAGES = [
  {
    title: ['Real needs,', 'not general funds.'],
    body: 'Local nonprofits break real needs into small causes: a hot meal, a bus fare, a pair of warm socks.',
    Visual: NeedsVisual,
  },
  {
    title: ['Follow it', 'to the finish.'],
    body: 'Every cause shows what it costs, who verified it, and what happened next — receipt and delivery included.',
    Visual: TimelineVisual,
  },
  {
    title: ['Dignity,', 'by design.'],
    body: 'Privacy Shield blurs faces and strips location on the phone, before any photo is posted. We show the help, not the suffering.',
    Visual: ShieldVisual,
  },
];

/** Soft color field behind each page: warm for needs, green for follow-through, violet for privacy. */
const ORB = ['#FBE3B4', '#D3EADD', '#DEDAFA'];

export default function Onboarding() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { page: devPage } = useLocalSearchParams<{ page?: string }>();
  const startPage = __DEV__ && devPage ? Number(devPage) : 0;
  const [page, setPage] = useState(startPage);
  const ref = useAnimatedRef<Animated.ScrollView>();
  const finish = useStore((s) => s.finishOnboarding);
  const last = page === PAGES.length - 1;

  const x = useSharedValue(startPage * width);
  const onScroll = useAnimatedScrollHandler((e) => {
    x.value = e.contentOffset.x;
  });

  const next = () => {
    if (last) {
      finish();
      router.replace('/');
      return;
    }
    ref.current?.scrollTo({ x: width * (page + 1), animated: true });
    setPage(page + 1);
  };

  const stops = PAGES.map((_, i) => i * width);
  const orbStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(x.value, stops, ORB),
    transform: [
      { translateX: -x.value * 0.08 },
      { scale: interpolate(x.value % width, [0, width / 2, width], [1, 1.08, 1]) },
    ],
  }));
  const orb2Style = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(x.value, stops, [ORB[1], ORB[2], ORB[0]]),
    transform: [{ translateX: x.value * 0.05 }],
  }));

  return (
    <View style={[styles.screen, { paddingTop: insets.top + space.sm, paddingBottom: insets.bottom + space.md }]}>
      <Animated.View pointerEvents="none" style={[styles.orb, { top: insets.top - 120 }, orbStyle]} />
      <Animated.View pointerEvents="none" style={[styles.orb2, orb2Style]} />
      <View style={{ paddingHorizontal: space.lg }}>
        <Wordmark size={26} />
      </View>
      <Animated.ScrollView
        ref={ref}
        horizontal
        pagingEnabled
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentOffset={{ x: startPage * width, y: 0 }}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / width))}
        style={{ flex: 1 }}>
        {PAGES.map(({ title, body, Visual }, i) => (
          <Page key={i} index={i} x={x} width={width}>
            {(p) => (
              <>
                <View style={{ height: 300, justifyContent: 'center' }}>
                  <Visual p={p} width={width} />
                </View>
                <View style={{ gap: space.sm }}>
                  <Layer p={p} width={width} depth={0.1}>
                    <Txt variant="display">
                      {title[0]}
                      {'\n'}
                      <Txt variant="display" accent>
                        {title[1]}
                      </Txt>
                    </Txt>
                  </Layer>
                  <Layer p={p} width={width} depth={0.22}>
                    <Txt variant="callout" style={{ fontSize: 17, lineHeight: 24 }}>
                      {body}
                    </Txt>
                  </Layer>
                </View>
              </>
            )}
          </Page>
        ))}
      </Animated.ScrollView>
      <View style={{ paddingHorizontal: space.lg, gap: space.md }}>
        <View style={styles.dots}>
          {PAGES.map((_, i) => (
            <Dot key={i} index={i} x={x} width={width} />
          ))}
        </View>
        <Button label={last ? 'Start giving' : 'Continue'} kind={last ? 'sun' : 'primary'} onPress={next} />
        <Txt variant="caption" color={color.ink3} align="center">
          Demo build · every nonprofit and cause is fictional · payments run in RevenueCat’s Test Store
        </Txt>
      </View>
    </View>
  );
}

/** One onboarding page; hands its children a -1…1 progress value (0 = centered). */
function Page({
  index,
  x,
  width,
  children,
}: {
  index: number;
  x: SharedValue<number>;
  width: number;
  children: (p: SharedValue<number>) => React.ReactNode;
}) {
  const p = useDerivedValue(() => (x.value - index * width) / width);
  return (
    <View style={{ width, paddingHorizontal: space.lg, justifyContent: 'center', gap: space.xxl }}>{children(p)}</View>
  );
}

/**
 * Parallax depth: deeper layers travel further than the page, so a page's pieces
 * arrive one after another and leave in the same order.
 */
function Layer({
  p,
  width,
  depth,
  tilt = 0,
  style,
  children,
}: {
  p: SharedValue<number>;
  width: number;
  depth: number;
  tilt?: number;
  style?: React.ComponentProps<typeof View>['style'];
  children: React.ReactNode;
}) {
  const a = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [-0.6, 0, 0.6], [0, 1, 0], 'clamp'),
    transform: [{ translateX: -p.value * width * depth }, { rotate: `${p.value * tilt}deg` }],
  }));
  return <Animated.View style={[style, a]}>{children}</Animated.View>;
}

function Dot({ index, x, width }: { index: number; x: SharedValue<number>; width: number }) {
  const a = useAnimatedStyle(() => {
    const range = [(index - 1) * width, index * width, (index + 1) * width];
    return {
      width: interpolate(x.value, range, [6, 22, 6], 'clamp'),
      backgroundColor: interpolateColor(x.value, range, [color.lineStrong, color.ink, color.lineStrong]),
    };
  });
  return <Animated.View style={[styles.dot, a]} />;
}

type VisualProps = { p: SharedValue<number>; width: number };

function NeedsVisual({ p, width }: VisualProps) {
  const picks = [sample[0], sample[1], sample[2]];
  // Short names so nothing truncates on the first screen anyone sees.
  const names = ['Hot meal + warm socks', 'Food for Toby', 'Bus fare to a clinic'];
  return (
    <View style={{ alignItems: 'center' }}>
      {picks.map((c, i) => (
        <Animated.View
          key={c.id}
          entering={FadeInDown.delay(i * 120).duration(500)}
          style={{ width: '94%', marginTop: i === 0 ? 0 : -14, zIndex: 3 - i }}>
          <Layer p={p} width={width} depth={0.1 + i * 0.22} tilt={[-8, 6, -4][i]}>
            <View style={[styles.mini, { transform: [{ rotate: `${[-3, 2, -1][i]}deg` }] }]}>
              <CoverThumb cause={c} size={46} />
              <View style={{ flex: 1, gap: 6 }}>
                <Txt variant="bodyStrong" numberOfLines={1}>
                  {names[i]}
                </Txt>
                <ProgressBar value={c.raised / c.goal} height={6} delay={300 + i * 120} />
              </View>
              <Txt variant="caption" color={color.sunDeep} style={{ fontWeight: '700' }}>
                {money(c.goal - c.raised)} left
              </Txt>
            </View>
          </Layer>
        </Animated.View>
      ))}
    </View>
  );
}

function TimelineVisual({ p, width }: VisualProps) {
  const steps = ['Verified & published', 'Fully funded', 'Receipt posted', 'Delivered with proof'];
  return (
    <Layer p={p} width={width} depth={0.05} style={styles.panel}>
      {/* Rows slide in one after another, inside the card. */}
      <View style={styles.panelInner}>
        {steps.map((s, i) => (
          <Layer key={s} p={p} width={width} depth={0.08 + i * 0.1} style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ alignItems: 'center', width: 26 }}>
              <View style={styles.tlDot}>
                <Icon name="checkmark" size={12} color={color.white} weight="heavy" />
              </View>
              {i < steps.length - 1 ? <View style={styles.tlLine} /> : null}
            </View>
            <View style={{ paddingBottom: i < steps.length - 1 ? 18 : 0, paddingTop: 3 }}>
              <Txt variant="bodyStrong">{s}</Txt>
            </View>
          </Layer>
        ))}
      </View>
    </Layer>
  );
}

function ShieldVisual({ p, width }: VisualProps) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Animated.View entering={FadeIn.duration(500)}>
        <Layer p={p} width={width} depth={0.08} tilt={-3} style={styles.photo}>
          <Image
            source={require('@/assets/images/onboarding-shield.jpg')}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
        </Layer>
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(450).duration(500)}>
        <Layer p={p} width={width} depth={0.42} style={styles.shieldTag}>
          <Icon name="checkmark.shield.fill" size={16} color={color.shield} />
          <Txt variant="caption" color={color.shield} style={{ fontWeight: '700' }}>
            2 faces blurred · GPS removed · on-device
          </Txt>
        </Layer>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.paper, overflow: 'hidden' },
  orb: { position: 'absolute', right: -170, width: 520, height: 520, borderRadius: 260, opacity: 0.55 },
  orb2: { position: 'absolute', left: -200, bottom: 60, width: 380, height: 380, borderRadius: 190, opacity: 0.35 },
  dots: { flexDirection: 'row', gap: 6, justifyContent: 'center' },
  dot: { height: 6, borderRadius: 3 },
  mini: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: radius.lg,
    backgroundColor: color.card,
    ...shadow.lift,
  },
  panel: { backgroundColor: color.card, borderRadius: radius.xl, ...shadow.card },
  panelInner: { borderRadius: radius.xl, padding: space.xl, overflow: 'hidden' },
  tlDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: color.leaf,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tlLine: { width: 2, flex: 1, backgroundColor: color.leaf, minHeight: 16 },
  photo: {
    width: 312,
    height: 234,
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: color.paperDeep,
    ...shadow.lift,
  },
  shieldTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: -18,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.pill,
    backgroundColor: color.card,
    ...shadow.card,
  },
});
