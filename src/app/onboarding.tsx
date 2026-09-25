import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
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

export default function Onboarding() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { page: devPage } = useLocalSearchParams<{ page?: string }>();
  const startPage = __DEV__ && devPage ? Number(devPage) : 0;
  const [page, setPage] = useState(startPage);
  const ref = useRef<ScrollView>(null);
  const finish = useStore((s) => s.finishOnboarding);
  const last = page === PAGES.length - 1;

  const next = () => {
    if (last) {
      finish();
      router.replace('/');
      return;
    }
    ref.current?.scrollTo({ x: width * (page + 1), animated: true });
    setPage(page + 1);
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + space.sm, paddingBottom: insets.bottom + space.md }]}>
      <View style={{ paddingHorizontal: space.lg }}>
        <Wordmark size={26} />
      </View>
      <ScrollView
        ref={ref}
        horizontal
        pagingEnabled
        contentOffset={{ x: startPage * width, y: 0 }}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / width))}
        style={{ flex: 1 }}>
        {PAGES.map(({ title, body, Visual }, i) => (
          <View key={i} style={{ width, paddingHorizontal: space.lg, justifyContent: 'center', gap: space.xxl }}>
            <View style={{ height: 300, justifyContent: 'center' }}>{page === i ? <Visual /> : null}</View>
            <View style={{ gap: space.sm }}>
              <Txt variant="display">
                {title[0]}
                {'\n'}
                <Txt variant="display" italic>
                  {title[1]}
                </Txt>
              </Txt>
              <Txt variant="callout" style={{ fontSize: 17, lineHeight: 24 }}>
                {body}
              </Txt>
            </View>
          </View>
        ))}
      </ScrollView>
      <View style={{ paddingHorizontal: space.lg, gap: space.md }}>
        <View style={styles.dots}>
          {PAGES.map((_, i) => (
            <View key={i} style={[styles.dot, i === page && styles.dotOn]} />
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

function NeedsVisual() {
  const picks = [sample[0], sample[1], sample[2]];
  return (
    <View style={{ alignItems: 'center' }}>
      {picks.map((c, i) => (
        <Animated.View
          key={c.id}
          entering={FadeInDown.delay(i * 120).duration(500)}
          style={{ width: '94%', marginTop: i === 0 ? 0 : -14, zIndex: 3 - i }}>
          <View style={[styles.mini, { transform: [{ rotate: `${[-3, 2, -1][i]}deg` }] }]}>
            <CoverThumb cause={c} size={46} />
            <View style={{ flex: 1, gap: 6 }}>
              <Txt variant="bodyStrong" numberOfLines={1}>
                {c.title}
              </Txt>
              <ProgressBar value={c.raised / c.goal} height={6} delay={300 + i * 120} />
            </View>
            <Txt variant="caption" color={color.sunDeep} style={{ fontWeight: '700' }}>
              {money(c.goal - c.raised)} left
            </Txt>
          </View>
        </Animated.View>
      ))}
    </View>
  );
}

function TimelineVisual() {
  const steps = ['Verified & published', 'Fully funded', 'Receipt posted', 'Delivered with proof'];
  return (
    <View style={[styles.panel, { gap: 0 }]}>
      {steps.map((s, i) => (
        <Animated.View
          key={s}
          entering={FadeInDown.delay(i * 180).duration(420)}
          style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ alignItems: 'center', width: 26 }}>
            <View style={[styles.tlDot, i === 3 && { backgroundColor: color.leaf }]}>
              <Icon name="checkmark" size={12} color={color.white} weight="heavy" />
            </View>
            {i < steps.length - 1 ? <View style={styles.tlLine} /> : null}
          </View>
          <View style={{ paddingBottom: 18, paddingTop: 3 }}>
            <Txt variant="bodyStrong">{s}</Txt>
          </View>
        </Animated.View>
      ))}
    </View>
  );
}

function ShieldVisual() {
  return (
    <View style={{ alignItems: 'center' }}>
      <Animated.View entering={FadeIn.duration(500)} style={styles.photo}>
        <Image
          source={require('@/assets/images/onboarding-shield.jpg')}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
        />
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(450).duration(500)} style={styles.shieldTag}>
        <Icon name="checkmark.shield.fill" size={16} color={color.shield} />
        <Txt variant="caption" color={color.shield} style={{ fontWeight: '700' }}>
          2 faces blurred · GPS removed · on-device
        </Txt>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.paper },
  dots: { flexDirection: 'row', gap: 6, justifyContent: 'center' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: color.lineStrong },
  dotOn: { width: 20, backgroundColor: color.ink },
  mini: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: radius.lg,
    backgroundColor: color.card,
    ...shadow.lift,
  },
  panel: { backgroundColor: color.card, borderRadius: radius.xl, padding: space.xl, ...shadow.card },
  tlDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: color.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tlLine: { width: 2, flex: 1, backgroundColor: color.ink, minHeight: 16 },
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
