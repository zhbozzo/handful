import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AlmostCard, CauseCard } from '@/components/CauseCard';
import { CauseRow } from '@/components/CauseRow';
import { Icon } from '@/components/Icon';
import { Pill } from '@/components/Pill';
import { Txt } from '@/components/Txt';
import { Wordmark } from '@/components/Wordmark';
import { CATEGORIES } from '@/data/categories';
import type { CategoryId } from '@/data/types';
import { tap } from '@/lib/haptics';
import { useStore } from '@/store/useStore';
import { color, radius, space } from '@/theme/tokens';

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

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: color.paper }}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Wordmark />
        <Pressable onPress={() => router.push('/about')} accessibilityRole="button" accessibilityLabel="About this demo">
          <Pill label="Demo" tone="demo" symbol="info.circle" />
        </Pressable>
      </View>

      <Animated.View entering={FadeInDown.duration(500)} style={styles.hero}>
        <Txt variant="display">
          Give to something <Txt variant="display" italic>real.</Txt>
        </Txt>
        <Txt variant="callout" style={{ maxWidth: 330 }}>
          Small, specific needs, verified by local nonprofits. See what it pays for, and see it delivered.
        </Txt>
      </Animated.View>

      {almost.length > 0 ? (
        <Animated.View entering={FadeInDown.delay(80).duration(500)}>
          <View style={styles.sectionHead}>
            <Txt variant="micro">Almost there</Txt>
            <Txt variant="caption">One small gift finishes these</Txt>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: space.lg, gap: space.sm, paddingBottom: 24, paddingTop: 4 }}
            decelerationRate="fast"
            snapToInterval={286 + space.sm}>
            {almost.map((c) => (
              <AlmostCard key={c.id} cause={c} />
            ))}
          </ScrollView>
        </Animated.View>
      ) : null}

      <Animated.View entering={FadeInDown.delay(160).duration(500)}>
        <View style={styles.sectionHead}>
          <Txt variant="micro">Open causes</Txt>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: space.lg, gap: 8, paddingBottom: space.md }}>
          <Chip label="All" active={filter === 'all'} onPress={() => setFilter('all')} />
          {cats.map((c) => (
            <Chip key={c.id} label={c.label} symbol={c.symbol} active={filter === c.id} onPress={() => setFilter(c.id)} />
          ))}
        </ScrollView>
        <View style={styles.list}>
          {open.map((c) => (
            <CauseCard key={c.id} cause={c} />
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
    </ScrollView>
  );
}

function Chip({ label, symbol, active, onPress }: { label: string; symbol?: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
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
    </Pressable>
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
    borderWidth: 1,
    borderColor: color.line,
    borderStyle: 'dashed',
  },
});
