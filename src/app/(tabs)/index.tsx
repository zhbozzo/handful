import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, {
  FadeInDown,
  interpolate,
  LinearTransition,
  type SharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ALMOST_CARD_WIDTH, AlmostCard, CauseCard } from '@/components/CauseCard';
import { CauseRow } from '@/components/CauseRow';
import { Icon } from '@/components/Icon';
import { Pill } from '@/components/Pill';
import { PressableScale } from '@/components/PressableScale';
import { Txt } from '@/components/Txt';
import { Wordmark } from '@/components/Wordmark';
import { CATEGORIES } from '@/data/categories';
import type { CategoryId } from '@/data/types';
import { devScroll } from '@/lib/devScroll';
import { tap } from '@/lib/haptics';
import { useStore } from '@/store/useStore';
import { color, radius, space } from '@/theme/tokens';

const CAROUSEL_STEP = ALMOST_CARD_WIDTH + space.sm;

export default function CausesScreen() {
  const insets = useSafeAreaInsets();
  const causes = useStore((s) => s.causes);
  const [filter, setFilter] = useState<CategoryId | 'all'>('all');

  const { almost, open, onTheWay, delivered, cats } = useMemo(() => {
    const openAll = causes.filter((c) => c.status === 'open');
    return {
      almost: openAll.filter((c) => c.goal - c.raised <= 10).sort((a, b) => a.goal - a.raised - (b.goal - b.raised)),
      open: openAll.filter((c) => filter === 'all' || c.category === filter),
      onTheWay: causes.filter((c) => c.status === 'funded' || c.status === 'purchased'),
      delivered: causes.filter((c) => c.status === 'delivered'),
      cats: CATEGORIES.filter((cat) => openAll.some((c) => c.category === cat.id)),
    };
  }, [causes, filter]);

  const scrollY = useSharedValue(devScroll()?.y ?? 0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });
  const scrollX = useSharedValue(0);
  const onCarousel = useAnimatedScrollHandler((e) => {
    scrollX.value = e.contentOffset.x;
  });

  // The big serif hero drifts and fades; a compact blurred bar takes over.
  const heroStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 160], [1, 0], 'clamp'),
    transform: [
      { translateY: interpolate(scrollY.value, [-100, 0, 200], [-30, 0, 60], 'clamp') },
      { scale: interpolate(scrollY.value, [-120, 0], [1.06, 1], 'clamp') },
    ],
  }));
  const barStyle = useAnimatedStyle(() => ({ opacity: interpolate(scrollY.value, [110, 170], [0, 1], 'clamp') }));

  return (
    <View style={{ flex: 1, backgroundColor: color.paper }}>
      <Animated.ScrollView
        contentOffset={devScroll()}
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 110 }}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Wordmark />
          <DemoPill />
        </View>

        <Animated.View entering={FadeInDown.duration(600)}>
          <Animated.View style={[styles.hero, heroStyle]}>
            <Txt variant="display">
              Give to something{' '}
              <Txt variant="display" italic>
                real.
              </Txt>
            </Txt>
            <Txt variant="callout" style={{ maxWidth: 330 }}>
              Small, specific needs, verified by local nonprofits. See what it pays for, and see it delivered.
            </Txt>
          </Animated.View>
        </Animated.View>

        {almost.length > 0 ? (
          <Animated.View entering={FadeInDown.delay(90).duration(600)}>
            <View style={styles.sectionHead}>
              <Txt variant="micro">Almost there</Txt>
              <Txt variant="caption">One small gift finishes these</Txt>
            </View>
            <Animated.ScrollView
              horizontal
              onScroll={onCarousel}
              scrollEventThrottle={16}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: space.lg, gap: space.sm, paddingBottom: 26, paddingTop: 4 }}
              decelerationRate="fast"
              snapToInterval={CAROUSEL_STEP}>
              {almost.map((c, i) => (
                <CarouselItem key={c.id} index={i} scrollX={scrollX}>
                  <AlmostCard cause={c} />
                </CarouselItem>
              ))}
            </Animated.ScrollView>
          </Animated.View>
        ) : null}

        <Animated.View entering={FadeInDown.delay(160).duration(600)}>
          <View style={styles.sectionHead}>
            <Txt variant="micro">Open causes</Txt>
            <Txt variant="caption">{open.length} near you</Txt>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: space.lg, gap: 8, paddingBottom: space.md }}>
            <Chip label="All" active={filter === 'all'} onPress={() => setFilter('all')} />
            {cats.map((c) => (
              <Chip
                key={c.id}
                label={c.label}
                symbol={c.symbol}
                active={filter === c.id}
                onPress={() => setFilter(c.id)}
              />
            ))}
          </ScrollView>
          <View style={styles.list}>
            {open.map((c, i) => (
              <Animated.View
                key={c.id}
                entering={FadeInDown.delay(200 + Math.min(i, 5) * 70)
                  .springify()
                  .damping(18)}
                layout={LinearTransition.springify().damping(20)}>
                <CauseCard cause={c} />
              </Animated.View>
            ))}
            {open.length === 0 ? (
              <Txt variant="callout" align="center" style={{ paddingVertical: 32 }}>
                Nothing open here right now.
              </Txt>
            ) : null}
          </View>
        </Animated.View>

        {onTheWay.length > 0 ? (
          <View style={{ marginTop: space.xxl }}>
            <View style={styles.sectionHead}>
              <Txt variant="micro">Funded · on the way</Txt>
            </View>
            <View style={[styles.list, { gap: 8 }]}>
              {onTheWay.map((c) => (
                <CauseRow key={c.id} cause={c} />
              ))}
            </View>
          </View>
        ) : null}

        {delivered.length > 0 ? (
          <View style={{ marginTop: space.xxl }}>
            <View style={styles.sectionHead}>
              <Txt variant="micro">Delivered · with proof</Txt>
            </View>
            <View style={[styles.list, { gap: 8 }]}>
              {delivered.map((c) => (
                <CauseRow key={c.id} cause={c} />
              ))}
            </View>
          </View>
        ) : null}

        <Pressable onPress={() => router.push('/about')} style={styles.footer} accessibilityRole="button">
          <Icon name="info.circle" size={15} color={color.ink3} />
          <Txt variant="caption" color={color.ink3} style={{ flex: 1 }}>
            Every nonprofit and cause here is fictional demo data. Gifts run through RevenueCat’s Test Store — no real
            money moves. How Handful works →
          </Txt>
        </Pressable>
      </Animated.ScrollView>

      <Animated.View
        pointerEvents="box-none"
        style={[styles.bar, { height: insets.top + 52, paddingTop: insets.top }, barStyle]}>
        <BlurView intensity={80} tint="systemChromeMaterialLight" style={StyleSheet.absoluteFill} />
        <View style={styles.barHairline} />
        <View style={styles.barRow} pointerEvents="box-none">
          <Wordmark size={22} />
          <DemoPill />
        </View>
      </Animated.View>
    </View>
  );
}

function DemoPill() {
  return (
    <Pressable
      onPress={() => router.push('/about')}
      accessibilityRole="button"
      accessibilityLabel="About this demo"
      hitSlop={8}>
      <Pill label="Demo" tone="demo" symbol="info.circle" />
    </Pressable>
  );
}

/** Carousel cards settle into focus: the centered one is full size, its neighbors recede. */
function CarouselItem({
  index,
  scrollX,
  children,
}: {
  index: number;
  scrollX: SharedValue<number>;
  children: React.ReactNode;
}) {
  const style = useAnimatedStyle(() => {
    const input = [(index - 1) * CAROUSEL_STEP, index * CAROUSEL_STEP, (index + 1) * CAROUSEL_STEP];
    return {
      opacity: interpolate(scrollX.value, input, [0.7, 1, 0.7], 'clamp'),
      transform: [{ scale: interpolate(scrollX.value, input, [0.94, 1, 0.94], 'clamp') }],
    };
  });
  return <Animated.View style={style}>{children}</Animated.View>;
}

function Chip({
  label,
  symbol,
  active,
  onPress,
}: {
  label: string;
  symbol?: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <PressableScale
      scaleTo={0.94}
      onPress={() => {
        tap();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={[styles.chip, active && styles.chipActive]}>
      {symbol ? <Icon name={symbol} size={13} color={active ? color.white : color.ink2} /> : null}
      <Txt variant="caption" color={active ? color.white : color.ink} style={{ fontWeight: '600' }}>
        {label}
      </Txt>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    marginBottom: space.lg,
  },
  hero: { paddingHorizontal: space.lg, gap: space.sm, marginBottom: space.xxl },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    marginBottom: space.sm,
  },
  list: { paddingHorizontal: space.lg, gap: space.md },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: color.card,
    borderWidth: 1,
    borderColor: color.line,
  },
  chipActive: { backgroundColor: color.ink, borderColor: color.ink },
  footer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: space.xxl,
    marginHorizontal: space.lg,
    padding: space.md,
    borderRadius: radius.md,
    backgroundColor: color.paperDeep,
  },
  bar: { position: 'absolute', top: 0, left: 0, right: 0, overflow: 'hidden' },
  barHairline: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: color.lineStrong,
  },
  barRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
  },
});
