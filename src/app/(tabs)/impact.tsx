import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Button } from '@/components/Button';
import { CoverThumb } from '@/components/CoverArt';
import { Icon } from '@/components/Icon';
import { Pill } from '@/components/Pill';
import { Txt } from '@/components/Txt';
import { Mark } from '@/components/Wordmark';
import { categoryById } from '@/data/categories';
import type { CauseItem } from '@/data/types';
import { ago, money, when } from '@/lib/format';
import { getRevenueCatUserId } from '@/lib/purchases';
import { devScroll } from '@/lib/devScroll';
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
    const items = new Map<string, CauseItem & { tint: string; ink: string }>();
    helped.forEach((c) => {
      const cat = categoryById(c.category);
      c.items.forEach((i) => items.set(i.label, { ...i, tint: cat.tint, ink: cat.ink }));
    });
    return {
      total: contributions.reduce((s, c) => s + c.amount, 0),
      helped: helped.length,
      completed: contributions.filter((c) => c.completedCause).length,
      delivered: helped.filter((c) => c.status === 'delivered').length,
      items: [...items.values()],
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
          <Animated.View entering={FadeInDown.duration(450)} style={styles.grid}>
            <Stat value={money(stats.total)} label="given" />
            <Stat value={String(stats.helped)} label={stats.helped === 1 ? 'cause helped' : 'causes helped'} />
            <Stat
              value={String(stats.completed)}
              label={stats.completed === 1 ? 'cause you completed' : 'causes you completed'}
              accent
            />
            <Stat value={String(stats.delivered)} label="delivered with proof" leaf />
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
            <Txt variant="micro">Causes you gave to paid for</Txt>
            <View style={styles.items}>
              {stats.items.map((i) => (
                <View key={i.label} style={[styles.itemChip, { backgroundColor: i.tint }]}>
                  <Icon name={i.symbol} size={13} color={i.ink} />
                  <Txt variant="caption" color={i.ink} style={{ fontWeight: '600' }}>
                    {i.label}
                  </Txt>
                </View>
              ))}
            </View>
          </View>

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

function Stat({ value, label, accent, leaf }: { value: string; label: string; accent?: boolean; leaf?: boolean }) {
  return (
    <View
      style={[styles.stat, accent && { backgroundColor: color.sunSoft }, leaf && { backgroundColor: color.leafSoft }]}>
      <Txt variant="bigNumber" color={leaf ? color.leaf : color.ink}>
        {value}
      </Txt>
      <Txt variant="caption" color={leaf ? color.leaf : color.ink2}>
        {label}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: color.card, borderRadius: radius.lg, padding: space.md, ...shadow.card },
  empty: { alignItems: 'center', gap: space.sm, paddingVertical: space.xxl },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  stat: {
    width: '48.5%',
    flexGrow: 1,
    backgroundColor: color.card,
    borderRadius: radius.lg,
    padding: space.md,
    gap: 2,
    minHeight: 104,
    justifyContent: 'flex-end',
  },
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
  items: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  itemChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: radius.pill,
  },
  gift: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  giftBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: color.line },
  supporter: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});
