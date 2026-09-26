import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, LinearTransition, ZoomIn } from 'react-native-reanimated';

import { Button } from '@/components/Button';
import { CountUp } from '@/components/CountUp';
import { CoverThumb } from '@/components/CoverArt';
import { Icon } from '@/components/Icon';
import { Pill } from '@/components/Pill';
import { Txt } from '@/components/Txt';
import { Mark } from '@/components/Wordmark';
import { categoryById } from '@/data/categories';
import type { CauseItem, CauseStatus } from '@/data/types';
import { ago, money, when } from '@/lib/format';
import { getRevenueCatUserId } from '@/lib/purchases';
import { devScroll } from '@/lib/devScroll';
import { tap } from '@/lib/haptics';
import { useStore } from '@/store/useStore';
import { color, font, radius, shadow, space } from '@/theme/tokens';

export default function ImpactScreen() {
  const { contributions, causes, inbox, supporter, markInboxRead } = useStore();
  const [rcUser, setRcUser] = useState<string | null>(null);

  useEffect(() => {
    getRevenueCatUserId().then(setRcUser);
  }, []);

  const stats = useMemo(() => {
    const ids = [...new Set(contributions.map((c) => c.causeId))];
    const helped = ids.map((id) => causes.find((c) => c.id === id)).filter((c) => !!c);
    const items = new Map<string, Collected>();
    helped.forEach((c) => {
      const cat = categoryById(c.category);
      const state = stateOf(c.status);
      c.items.forEach((i) => {
        const seen = items.get(i.label);
        if (!seen || RANK[state] > RANK[seen.state]) items.set(i.label, { ...i, tint: cat.tint, ink: cat.ink, state });
      });
    });
    return {
      total: contributions.reduce((s, c) => s + c.amount, 0),
      helped: helped.length,
      completed: contributions.filter((c) => c.completedCause).length,
      delivered: helped.filter((c) => c.status === 'delivered').length,
      // Delivered first: the collection leads with what has already reached people.
      items: [...items.values()].sort((a, b) => RANK[b.state] - RANK[a.state]),
    };
  }, [contributions, causes]);

  const empty = contributions.length === 0;

  return (
    <ScrollView
      contentOffset={devScroll()}
      style={{ flex: 1, backgroundColor: color.paper }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ paddingTop: space.sm, paddingBottom: 48, paddingHorizontal: space.lg, gap: space.xl }}
      showsVerticalScrollIndicator={false}>
      <View style={{ gap: 6 }}>
        <Txt variant="title">Your impact</Txt>
        <Txt variant="callout">Only what you actually did. No estimates, no made-up numbers.</Txt>
      </View>

      {empty ? (
        <Animated.View entering={FadeInDown.duration(450)} style={[styles.card, styles.empty]}>
          <Mark size={56} />
          <Txt variant="headline" align="center">
            Nothing here yet — on purpose.
          </Txt>
          <Txt variant="callout" align="center" style={{ maxWidth: 290 }}>
            Your first gift shows up here, and so does the proof when it’s delivered.
          </Txt>
          <Button label="Find a cause" compact onPress={() => router.navigate('/')} style={{ marginTop: 6 }} />
        </Animated.View>
      ) : (
        <>
          <Animated.View entering={FadeInDown.duration(500)}>
            <CollectionHero total={stats.total} items={stats.items} />
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(80).duration(500)}
            layout={LinearTransition.springify().damping(20)}
            style={styles.grid}>
            <Stat value={stats.helped} label={stats.helped === 1 ? 'cause helped' : 'causes helped'} />
            <Stat value={stats.completed} label="you completed" accent />
            <Stat value={stats.delivered} label="delivered" leaf />
          </Animated.View>

          {inbox.length > 0 ? (
            <View style={{ gap: space.sm }}>
              <Txt variant="micro">Updates</Txt>
              {inbox.map((u) => {
                const cause = causes.find((c) => c.id === u.causeId);
                if (!cause) return null;
                const delivered = u.kind === 'delivered';
                return (
                  <Pressable
                    key={u.id}
                    onPress={() => {
                      markInboxRead(u.id);
                      router.push(delivered ? `/proof/${cause.id}` : `/cause/${cause.id}`);
                    }}
                    style={({ pressed }) => [
                      styles.update,
                      delivered && styles.updateDelivered,
                      pressed && { opacity: 0.75 },
                    ]}
                    accessibilityRole="button">
                    <CoverThumb cause={cause} size={48} />
                    <View style={{ flex: 1, gap: 2 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        {delivered ? <Icon name="checkmark.seal.fill" size={13} color={color.leaf} /> : null}
                        <Txt variant="micro" color={delivered ? color.leaf : color.sunDeep}>
                          {delivered ? 'Delivered' : 'You completed it'}
                        </Txt>
                        <Txt variant="caption" color={color.ink3}>
                          · {ago(u.at)}
                        </Txt>
                      </View>
                      <Txt variant="bodyStrong" numberOfLines={1}>
                        {cause.title}
                      </Txt>
                      <Txt variant="caption">
                        {delivered ? 'See the receipt and delivery photo' : 'Proof arrives once it’s delivered'}
                      </Txt>
                    </View>
                    {!u.read ? (
                      <View style={styles.unread} />
                    ) : (
                      <Icon name="chevron.right" size={13} color={color.ink3} />
                    )}
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          <View style={{ gap: space.sm }}>
            <Txt variant="micro">Gift history</Txt>
            <View style={styles.card}>
              {contributions.map((g, i) => {
                const cause = causes.find((c) => c.id === g.causeId);
                return (
                  <View key={g.id} style={[styles.gift, i > 0 && styles.giftBorder]}>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Txt variant="bodyStrong" numberOfLines={1}>
                        {cause?.title ?? 'Cause'}
                      </Txt>
                      <Txt variant="caption">
                        {when(g.at)}
                        {g.completedCause ? ' · completed it' : ''}
                      </Txt>
                      <Txt
                        variant="caption"
                        color={color.ink3}
                        style={{ fontFamily: font.mono, fontSize: 11 }}
                        numberOfLines={1}>
                        {g.rail === 'revenuecat-test-store'
                          ? `RC Test Store · ${g.transactionId}`
                          : `offline demo · ${g.transactionId}`}
                      </Txt>
                    </View>
                    <Txt variant="number">{money(g.amount)}</Txt>
                  </View>
                );
              })}
            </View>
            <Txt variant="caption" color={color.ink3} style={{ paddingHorizontal: 4 }}>
              Test transactions — no real money moved.{rcUser ? ` RevenueCat customer ${rcUser}.` : ''}
            </Txt>
          </View>
        </>
      )}

      <Pressable
        onPress={() => router.push('/supporter')}
        style={[styles.card, styles.supporter]}
        accessibilityRole="button">
        <View style={{ flex: 1, gap: 4 }}>
          {supporter ? <Pill label="Supporter" tone="sun" symbol="sun.max.fill" small /> : null}
          <Txt variant="bodyStrong">
            {supporter ? 'You keep Handful free for nonprofits' : 'Keep Handful free for nonprofits'}
          </Txt>
          <Txt variant="caption">
            {supporter
              ? 'Thank you. Nonprofits pay nothing, and gifts carry no platform fee.'
              : 'An optional membership pays for the platform, so gifts reach causes without a platform fee.'}
          </Txt>
        </View>
        <Icon name="chevron.right" size={14} color={color.ink3} />
      </Pressable>
    </ScrollView>
  );
}

type ItemState = 'funding' | 'onTheWay' | 'delivered';
type Collected = CauseItem & { tint: string; ink: string; state: ItemState };
const RANK: Record<ItemState, number> = { funding: 0, onTheWay: 1, delivered: 2 };

function stateOf(status: CauseStatus): ItemState {
  if (status === 'delivered') return 'delivered';
  if (status === 'funded' || status === 'purchased') return 'onTheWay';
  return 'funding';
}

const TILT = [-4, 3, -2, 5, -3, 2, -5, 4];

/**
 * The things your gifts paid for, collected like a shelf of small objects.
 * Each one says where it is now: still funding, on its way, or delivered with proof.
 */
const SHELF = 8;

function CollectionHero({ total, items }: { total: number; items: Collected[] }) {
  const delivered = items.filter((i) => i.state === 'delivered').length;
  const [open, setOpen] = useState(false);
  const hidden = items.length - SHELF;
  const shown = open || hidden <= 1 ? items : items.slice(0, SHELF - 1);
  return (
    <View style={styles.hero}>
      <LinearGradient
        colors={['#FFF8EA', '#FCE9C4']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.heroOrb} />
      <View style={{ gap: 2 }}>
        <Txt variant="micro" color={color.sunDeep}>
          Given so far
        </Txt>
        <CountUp
          variant="bigNumber"
          value={total}
          from={0}
          duration={1000}
          format={money}
          style={{ fontSize: 64, lineHeight: 68, letterSpacing: -1.2 }}
        />
        <Txt variant="callout">
          Toward {items.length} {items.length === 1 ? 'thing' : 'things'} people needed
          {delivered > 0 ? ` — ${delivered} already delivered.` : '.'}
        </Txt>
      </View>
      <View style={styles.shelf}>
        {shown.map((item, i) => (
          <Animated.View
            key={item.label}
            entering={ZoomIn.delay(open ? (i - SHELF + 1) * 50 : 300 + i * 80)
              .springify()
              .damping(13)}
            style={styles.slot}
            accessible
            accessibilityLabel={`${item.label}, ${item.state === 'delivered' ? 'delivered' : item.state === 'onTheWay' ? 'on the way' : 'still funding'}`}>
            <View style={[styles.tile, { transform: [{ rotate: `${TILT[i % TILT.length]}deg` }] }]}>
              <Icon name={item.symbol} size={26} color={item.ink} weight="medium" hierarchical />
              {item.state !== 'funding' ? (
                <View style={[styles.badge, item.state === 'delivered' ? styles.badgeLeaf : styles.badgeSun]}>
                  <Icon
                    name={item.state === 'delivered' ? 'checkmark' : 'shippingbox.fill'}
                    size={item.state === 'delivered' ? 9 : 8}
                    color={color.white}
                    weight="heavy"
                  />
                </View>
              ) : null}
            </View>
            <Txt variant="caption" align="center" numberOfLines={2} style={styles.slotLabel}>
              {item.label}
            </Txt>
          </Animated.View>
        ))}
        {shown.length < items.length ? (
          <Animated.View
            entering={ZoomIn.delay(300 + shown.length * 80)
              .springify()
              .damping(13)}
            style={styles.slot}>
            <Pressable
              onPress={() => {
                tap();
                setOpen(true);
              }}
              accessibilityRole="button"
              accessibilityLabel={`Show ${items.length - shown.length} more`}
              style={({ pressed }) => [styles.tile, styles.more, pressed && { transform: [{ scale: 0.94 }] }]}>
              <Txt variant="number" color={color.sunDeep}>
                +{items.length - shown.length}
              </Txt>
            </Pressable>
            <Txt variant="caption" align="center" style={styles.slotLabel}>
              more
            </Txt>
          </Animated.View>
        ) : null}
      </View>
      <View style={styles.legend}>
        <Legend dot={color.leaf} label="Delivered" />
        <Legend dot={color.sun} label="On the way" />
        <Legend dot={color.lineStrong} label="Funding" />
      </View>
    </View>
  );
}

function Legend({ dot, label }: { dot: string; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: dot }} />
      <Txt variant="caption" color={color.ink2} style={{ fontSize: 12 }}>
        {label}
      </Txt>
    </View>
  );
}

function Stat({
  value,
  label,
  accent,
  leaf,
  money: isMoney,
}: {
  value: number;
  label: string;
  accent?: boolean;
  leaf?: boolean;
  money?: boolean;
}) {
  return (
    <View
      style={[styles.stat, accent && { backgroundColor: color.sunSoft }, leaf && { backgroundColor: color.leafSoft }]}>
      <CountUp
        variant="bigNumber"
        value={value}
        from={0}
        duration={900}
        format={isMoney ? money : String}
        color={leaf ? color.leaf : color.ink}
      />
      <Txt variant="caption" color={leaf ? color.leaf : color.ink2}>
        {label}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: color.card, borderRadius: radius.lg, padding: space.md, ...shadow.card },
  empty: { alignItems: 'center', gap: space.sm, paddingVertical: space.xxl },
  grid: { flexDirection: 'row', gap: 10 },
  stat: {
    flex: 1,
    backgroundColor: color.card,
    borderRadius: radius.lg,
    padding: 14,
    gap: 0,
    minHeight: 104,
    justifyContent: 'space-between',
  },
  hero: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    padding: space.lg,
    paddingTop: space.lg,
    gap: space.lg,
    backgroundColor: color.sunSoft,
  },
  heroOrb: {
    position: 'absolute',
    right: -90,
    top: -110,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  shelf: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 14, marginHorizontal: -4 },
  slot: { width: '25%', alignItems: 'center', gap: 7, paddingHorizontal: 4 },
  tile: {
    width: 58,
    height: 58,
    borderRadius: 17,
    backgroundColor: color.card,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3B2F1A',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFF4DE',
  },
  more: { backgroundColor: 'rgba(255,255,255,0.55)', shadowOpacity: 0 },
  badgeLeaf: { backgroundColor: color.leaf },
  badgeSun: { backgroundColor: color.sunDeep },
  slotLabel: { fontSize: 12, lineHeight: 15, color: color.ink2 },
  legend: { flexDirection: 'row', gap: 14 },
  update: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: space.sm,
    borderRadius: radius.lg,
    backgroundColor: color.card,
  },
  updateDelivered: { borderWidth: 1.5, borderColor: color.leafSoft },
  unread: { width: 10, height: 10, borderRadius: 5, backgroundColor: color.sun },
  gift: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  giftBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: color.line },
  supporter: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});
