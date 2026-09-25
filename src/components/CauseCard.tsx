import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { categoryById } from '@/data/categories';
import { orgById } from '@/data/seed';
import type { Cause } from '@/data/types';
import { money, pct } from '@/lib/format';
import { MAX_GIFT } from '@/lib/purchases';
import { color, radius, shadow, space } from '@/theme/tokens';

import { Button } from './Button';
import { CoverArt } from './CoverArt';
import { OrgLine } from './OrgLine';
import { Pill } from './Pill';
import { ProgressBar, Ring } from './Progress';
import { Txt } from './Txt';

function usePressScale() {
  const s = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return {
    style,
    onPressIn: () => (s.value = withSpring(0.98, { damping: 20, stiffness: 400 })),
    onPressOut: () => (s.value = withSpring(1, { damping: 14, stiffness: 260 })),
  };
}

export const statusLabel: Record<Cause['status'], string> = {
  open: 'Open',
  funded: 'Funded',
  purchased: 'Purchased',
  delivered: 'Delivered',
};

export function CauseCard({ cause }: { cause: Cause }) {
  const org = orgById(cause.orgId);
  const cat = categoryById(cause.category);
  const left = cause.goal - cause.raised;
  const done = cause.status !== 'open';
  const p = usePressScale();

  return (
    <Animated.View style={[styles.card, p.style]}>
      <Pressable
        onPress={() => router.push(`/cause/${cause.id}`)}
        onPressIn={p.onPressIn}
        onPressOut={p.onPressOut}
        accessibilityRole="button"
        accessibilityLabel={`${cause.title}. ${done ? statusLabel[cause.status] : `${money(left)} to go`}`}>
        <CoverArt cause={cause} height={148} rounded={0} />
        <View style={styles.body}>
          <View style={styles.pills}>
            <Pill label={cat.label} small />
            {done ? (
              <Pill
                label={statusLabel[cause.status]}
                tone={cause.status === 'delivered' ? 'leaf' : 'sun'}
                symbol={cause.status === 'delivered' ? 'checkmark' : undefined}
                small
              />
            ) : null}
          </View>
          <Txt variant="headline" numberOfLines={2}>
            {cause.title}
          </Txt>
          <OrgLine org={org} size="sm" />
          <View style={{ gap: 8, marginTop: 2 }}>
            <ProgressBar value={cause.raised / cause.goal} fill={done ? color.leaf : color.sun} />
            <View style={styles.row}>
              <Txt variant="caption">
                <Txt variant="caption" color={color.ink} style={{ fontWeight: '700' }}>
                  {money(cause.raised)}
                </Txt>{' '}
                of {money(cause.goal)} · {cause.area}
              </Txt>
              {done ? (
                <Txt variant="caption" color={color.leaf} style={{ fontWeight: '700' }}>
                  Fully funded
                </Txt>
              ) : (
                <Txt variant="caption" color={color.sunDeep} style={{ fontWeight: '700' }}>
                  {money(left)} to go
                </Txt>
              )}
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

/** Home carousel: causes a single small gift can finish. */
export function AlmostCard({ cause }: { cause: Cause }) {
  const left = cause.goal - cause.raised;
  const org = orgById(cause.orgId);
  const p = usePressScale();
  return (
    <Animated.View style={[styles.almost, p.style]}>
      <Pressable
        onPress={() => router.push(`/cause/${cause.id}`)}
        onPressIn={p.onPressIn}
        onPressOut={p.onPressOut}
        accessibilityRole="button"
        accessibilityLabel={`${cause.title}. Only ${money(left)} left.`}
        style={{ gap: space.md }}>
        <View style={styles.almostTop}>
          <Ring value={cause.raised / cause.goal} size={58} stroke={6}>
            <Txt variant="number" style={{ fontSize: 14 }}>
              {pct(cause.raised, cause.goal)}%
            </Txt>
          </Ring>
          <View style={{ flex: 1, gap: 2 }}>
            <Txt variant="headline" style={{ fontSize: 24 }}>
              Only {money(left)} left
            </Txt>
            <Txt variant="caption" numberOfLines={2}>
              {cause.title}
            </Txt>
          </View>
        </View>
        <OrgLine org={org} size="sm" />
      </Pressable>
      {left <= MAX_GIFT ? (
        <Button
          label={`Complete it · ${money(left)}`}
          kind="sun"
          compact
          onPress={() => router.push({ pathname: '/give/[id]', params: { id: cause.id, amount: String(left) } })}
        />
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: color.card,
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadow.card,
  },
  body: { padding: space.md, gap: 10 },
  pills: { flexDirection: 'row', gap: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  almost: {
    width: 286,
    backgroundColor: color.card,
    borderRadius: radius.lg,
    padding: space.md,
    gap: space.md,
    ...shadow.card,
  },
  almostTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
});
