import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import type { RecentGift } from '@/lib/activity';
import { ago, money, plural } from '@/lib/format';
import { color } from '@/theme/tokens';

import { Icon } from './Icon';
import { Txt } from './Txt';

const TINTS = ['#FBE6C6', '#F7DDD0', '#EEE2D4', '#F4E9C4'];

function Face({ gift, index, size }: { gift?: RecentGift; index: number; size: number }) {
  if (gift?.you) {
    return (
      <View style={[styles.face, { width: size, height: size, borderRadius: size / 2, backgroundColor: color.ink }]}>
        <Txt variant="micro" color={color.white} style={{ fontSize: size * 0.3, letterSpacing: 0.2 }}>
          You
        </Txt>
      </View>
    );
  }
  return (
    <View
      style={[
        styles.face,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: TINTS[index % TINTS.length] },
      ]}>
      <Icon name="heart.fill" size={size * 0.42} color={color.sunDeep} />
    </View>
  );
}

/** Overlapping circles, one per recent donor, anonymous unless it's you. */
export function DonorStack({ gifts, donors, size = 26 }: { gifts: RecentGift[]; donors: number; size?: number }) {
  const shown = gifts.slice(0, 3);
  const rest = donors - shown.length;
  return (
    <View style={styles.stack}>
      {shown.map((g, i) => (
        <View key={g.key} style={[styles.ring, { marginLeft: i === 0 ? 0 : -size * 0.32, zIndex: 3 - i }]}>
          <Face gift={g} index={i} size={size} />
        </View>
      ))}
      {rest > 0 ? (
        <View style={[styles.ring, { marginLeft: -size * 0.32 }]}>
          <View style={[styles.face, styles.more, { width: size, height: size, borderRadius: size / 2 }]}>
            <Txt variant="micro" color={color.ink2} style={{ fontSize: size * 0.36, letterSpacing: 0 }}>
              +{rest}
            </Txt>
          </View>
        </View>
      ) : null}
    </View>
  );
}

/** The last few gifts, newest first. Other donors stay anonymous; your own gifts say "You". */
export function RecentGifts({ gifts, donors }: { gifts: RecentGift[]; donors: number }) {
  if (gifts.length === 0) return null;
  return (
    <View
      style={styles.list}
      accessible
      accessibilityLabel={`${plural(donors, 'person')} gave. Most recent ${ago(gifts[0].at)}.`}>
      {gifts.map((g, i) => (
        <Animated.View
          key={g.key}
          entering={FadeInDown.delay(120 + i * 80).duration(360)}
          style={[styles.row, i > 0 && styles.rowBorder]}>
          <Face gift={g} index={i} size={30} />
          <View style={{ flex: 1 }}>
            <Txt variant="bodyStrong" style={{ fontSize: 15 }}>
              {g.you ? `You gave ${money(g.amount)}` : `Someone gave ${money(g.amount)}`}
            </Txt>
            {g.completed ? (
              <Txt variant="caption" color={color.sunDeep} style={{ fontWeight: '600' }}>
                Completed the cause
              </Txt>
            ) : null}
          </View>
          <Txt variant="caption" color={color.ink3}>
            {ago(g.at)}
          </Txt>
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { flexDirection: 'row', alignItems: 'center' },
  ring: { borderRadius: 999, borderWidth: 2, borderColor: color.card },
  face: { alignItems: 'center', justifyContent: 'center' },
  more: { backgroundColor: color.paperDeep },
  list: {},
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  rowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: color.line },
});
