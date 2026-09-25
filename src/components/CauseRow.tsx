import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { orgById } from '@/data/seed';
import type { Cause } from '@/data/types';
import { ago, money } from '@/lib/format';
import { color, radius, space } from '@/theme/tokens';

import { CoverThumb } from './CoverArt';
import { Icon } from './Icon';
import { Txt } from './Txt';

const lines: Record<Cause['status'], (c: Cause) => string> = {
  open: (c) => `${money(c.goal - c.raised)} to go`,
  funded: () => 'Funded · buying the items',
  purchased: () => 'Purchased · delivery next',
  delivered: (c) => `Delivered ${ago(c.timeline[c.timeline.length - 1]?.at ?? c.createdAt)}`,
};

export function CauseRow({ cause, onPress }: { cause: Cause; onPress?: () => void }) {
  const org = orgById(cause.orgId);
  const delivered = cause.status === 'delivered';
  return (
    <Pressable
      onPress={onPress ?? (() => router.push(delivered ? `/proof/${cause.id}` : `/cause/${cause.id}`))}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
      accessibilityRole="button"
      accessibilityLabel={`${cause.title}. ${lines[cause.status](cause)}`}>
      <CoverThumb cause={cause} size={54} />
      <View style={{ flex: 1, gap: 2 }}>
        <Txt variant="bodyStrong" numberOfLines={1}>
          {cause.title}
        </Txt>
        <Txt variant="caption" numberOfLines={1}>
          {org.name} · {cause.area}
        </Txt>
        <View style={styles.status}>
          {delivered ? <Icon name="checkmark.seal.fill" size={12} color={color.leaf} /> : null}
          <Txt variant="caption" color={delivered ? color.leaf : color.sunDeep} style={{ fontWeight: '600' }}>
            {lines[cause.status](cause)}
          </Txt>
        </View>
      </View>
      <Icon name="chevron.right" size={13} color={color.ink3} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    padding: space.sm,
    backgroundColor: color.card,
    borderRadius: radius.md,
  },
  status: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 },
});
