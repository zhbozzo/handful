import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, LinearTransition, ZoomIn } from 'react-native-reanimated';

import { Button } from '@/components/Button';
import { CountUp } from '@/components/CountUp';
import { CoverThumb } from '@/components/CoverArt';
import { Icon } from '@/components/Icon';
import { OrgLine } from '@/components/OrgLine';
import { Pill } from '@/components/Pill';
import { PressableScale } from '@/components/PressableScale';
import { ProgressBar } from '@/components/Progress';
import { Stages } from '@/components/Stages';
import { StatusScrim } from '@/components/StatusScrim';
import { Txt } from '@/components/Txt';
import { categoryById } from '@/data/categories';
import { proofPhoto } from '@/data/photos';
import { orgById } from '@/data/seed';
import type { Cause, CauseItem, CauseStatus, InboxItem } from '@/data/types';
import { ago, money, when } from '@/lib/format';
import { getRevenueCatUserId } from '@/lib/purchases';
import { devScroll } from '@/lib/devScroll';
import { DONOR_TRACK, type MoneySplit, sortForTracking, trackCause, whereYourMoneyIs } from '@/lib/funds';
import { shareCause } from '@/lib/share';
import { tap } from '@/lib/haptics';
import { useStore } from '@/store/useStore';
import { color, radius, shadow, space } from '@/theme/tokens';

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

  const split = whereYourMoneyIs(contributions, causes);
  // Delivered causes you gave to, newest delivery first: the nonprofit's thank-you photo and note.
  const thanks = causes
    .filter((c) => c.status === 'delivered' && c.evidence && contributions.some((g) => g.causeId === c.id))
    .sort((a, b) => (b.timeline.at(-1)?.at ?? 0) - (a.timeline.at(-1)?.at ?? 0));
  const givenTo = (id: string) => contributions.filter((g) => g.causeId === id).reduce((sum, g) => sum + g.amount, 0);
  // Every cause you gave to, like tracking an order: the ones still moving first.
  // New thank-yous: proof posted since you last looked — shown first, like a notification.
  const fresh = inbox
    .filter((i) => i.kind === 'delivered' && !i.read)
    .map((i) => ({ item: i, cause: causes.find((c) => c.id === i.causeId) }))
    .filter((x): x is { item: InboxItem; cause: Cause } => !!x.cause);
  const freshIds = new Set(fresh.map((x) => x.cause.id));
  const tracked = sortForTracking(
    causes.filter((c) => contributions.some((g) => g.causeId === c.id)),
    (id) => freshIds.has(id),
  );

  const empty = contributions.length === 0;

  return (
    <View style={{ flex: 1, backgroundColor: color.paper }}>
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

        {fresh.map(({ item, cause }, i) => (
          <Animated.View
            key={item.id}
            entering={FadeInDown.delay(120 + i * 90)
              .springify()
              .damping(15)}>
            <FreshThanks
              cause={cause}
              at={item.at}
              gave={givenTo(cause.id)}
              onOpen={() => {
                markInboxRead(item.id);
                router.push(`/proof/${cause.id}`);
              }}
            />
          </Animated.View>
        ))}

        {empty ? (
          <Animated.View entering={FadeInDown.duration(450)} style={[styles.card, styles.empty]}>
            <View style={styles.ghostShelf} accessible={false}>
              {GHOST.map((symbol, i) => (
                <Animated.View
                  key={symbol}
                  entering={ZoomIn.delay(200 + i * 90)
                    .springify()
                    .damping(14)}>
                  <View style={[styles.ghostTile, { transform: [{ rotate: `${TILT[i]}deg` }] }]}>
                    <Icon name={symbol} size={22} color={color.lineStrong} />
                  </View>
                </Animated.View>
              ))}
            </View>
            <Txt variant="headline" align="center">
              Nothing here yet — on purpose.
            </Txt>
            <Txt variant="callout" align="center" style={{ maxWidth: 290 }}>
              Give to a cause and follow it here like an order — funded, bought, delivered — with the receipt and a
              thank-you photo at the end.
            </Txt>
            <Button label="Find a cause" compact onPress={() => router.navigate('/')} style={{ marginTop: 6 }} />
          </Animated.View>
        ) : (
          <>
            <Animated.View entering={FadeInDown.duration(500)}>
              <CollectionHero total={stats.total} items={stats.items} split={split} />
            </Animated.View>

            <Animated.View
              entering={FadeInDown.delay(80).duration(500)}
              layout={LinearTransition.springify().damping(20)}
              style={styles.grid}>
              <Stat value={stats.helped} label="Helped" />
              <Stat value={stats.completed} label="Completed" accent />
              <Stat value={stats.delivered} label="Delivered" leaf />
            </Animated.View>

            {tracked.length > 0 ? (
              <View style={{ gap: space.sm }}>
                <View style={styles.sectionHead}>
                  <Txt variant="micro">Your causes</Txt>
                  <Txt variant="caption">Where each one is now</Txt>
                </View>
                {tracked.map((c, i) => (
                  <Animated.View key={c.id} entering={FadeInDown.delay(120 + i * 70).duration(420)}>
                    <TrackedCause cause={c} gave={givenTo(c.id)} isNew={freshIds.has(c.id)} />
                  </Animated.View>
                ))}
              </View>
            ) : null}

            {thanks.length > 0 ? (
              <View style={{ gap: space.sm }}>
                <View style={styles.sectionHead}>
                  <Txt variant="micro">Thank-yous</Txt>
                  <Txt variant="caption">From the causes you helped</Txt>
                </View>
                {thanks.map((c, i) => (
                  <Animated.View key={c.id} entering={FadeInDown.delay(140 + i * 80).duration(450)}>
                    <ThankYou cause={c} gave={givenTo(c.id)} />
                  </Animated.View>
                ))}
              </View>
            ) : null}

            <View style={{ gap: space.sm }}>
              <Txt variant="micro">Gift history</Txt>
              <View style={styles.card}>
                {contributions.map((g, i) => {
                  const cause = causes.find((c) => c.id === g.causeId);
                  return (
                    <Pressable
                      key={g.id}
                      onPress={() =>
                        cause && router.push(cause.status === 'delivered' ? `/proof/${cause.id}` : `/cause/${cause.id}`)
                      }
                      style={({ pressed }) => [styles.gift, i > 0 && styles.giftBorder, pressed && { opacity: 0.6 }]}
                      accessibilityRole="button">
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
                          style={{ fontSize: 11, lineHeight: 15, fontVariant: ['tabular-nums'] }}
                          numberOfLines={1}>
                          {g.rail === 'revenuecat-test-store'
                            ? `RC Test Store · ${g.transactionId}`
                            : `offline demo · ${g.transactionId}`}
                        </Txt>
                      </View>
                      <Txt variant="number">{money(g.amount)}</Txt>
                    </Pressable>
                  );
                })}
              </View>
              <View style={{ paddingHorizontal: 4, gap: 2 }}>
                <Txt variant="caption" color={color.ink3}>
                  Test transactions — no real money moved.
                </Txt>
                {rcUser ? (
                  <Txt
                    variant="caption"
                    color={color.ink3}
                    numberOfLines={1}
                    ellipsizeMode="middle"
                    style={{ fontSize: 11, lineHeight: 15, fontVariant: ['tabular-nums'] }}>
                    RevenueCat customer · {rcUser}
                  </Txt>
                ) : null}
              </View>
            </View>
          </>
        )}

        <PressableScale
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
        </PressableScale>
      </ScrollView>
      <StatusScrim />
    </View>
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
const GHOST = ['fork.knife', 'drop.fill', 'bus.fill', 'pawprint.fill'];

/**
 * The things your gifts paid for, collected like a shelf of small objects.
 * Each one says where it is now: still funding, on its way, or delivered with proof.
 */
const SHELF = 8;

function CollectionHero({ total, items, split }: { total: number; items: Collected[]; split: MoneySplit }) {
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
      <MoneyBar split={split} />
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
    </View>
  );
}

/** Where each dollar you gave is right now. */
function MoneyBar({ split }: { split: MoneySplit }) {
  const parts = [
    { key: 'delivered', amount: split.delivered, color: color.leaf, label: 'delivered' },
    { key: 'onTheWay', amount: split.onTheWay, color: color.sun, label: 'on the way' },
    { key: 'funding', amount: split.funding, color: '#E3D7C2', label: 'still funding' },
  ].filter((p) => p.amount > 0);
  return (
    <View
      style={{ gap: 8 }}
      accessible
      accessibilityLabel={`Where your money is: ${parts.map((p) => `${money(p.amount)} ${p.label}`).join(', ')}`}>
      <View style={styles.moneyBar}>
        {parts.map((p) => (
          <View key={p.key} style={{ flex: p.amount, backgroundColor: p.color }} />
        ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 14, rowGap: 4 }}>
        {parts.map((p) => (
          <View key={p.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: p.color }} />
            <Txt variant="caption" color={color.ink} style={{ fontSize: 12 }}>
              <Txt variant="caption" color={color.ink} style={{ fontSize: 12, fontWeight: '700' }}>
                {money(p.amount)}
              </Txt>{' '}
              {p.label}
            </Txt>
          </View>
        ))}
      </View>
    </View>
  );
}

/** A thank-you that just arrived: it reads like the push notification, and opens the result. */
function FreshThanks({ cause, at, gave, onOpen }: { cause: Cause; at: number; gave: number; onOpen: () => void }) {
  const photo = proofPhoto(cause.evidence);
  const org = orgById(cause.orgId);
  return (
    <PressableScale
      onPress={() => {
        tap();
        onOpen();
      }}
      scaleTo={0.98}
      style={styles.fresh}
      accessibilityRole="button"
      accessibilityLabel={`New: ${cause.title} was delivered. ${org.name} posted a thank-you photo. Open.`}>
      <View style={styles.freshTop}>
        <View style={styles.freshDot} />
        <Txt variant="micro" color={color.leaf}>
          Delivered
        </Txt>
        <Txt variant="caption" color={color.ink3} style={{ fontSize: 12 }}>
          · {ago(at)}
        </Txt>
        <View style={{ flex: 1 }} />
        <Txt variant="caption" color={color.ink3} style={{ fontSize: 12 }}>
          You gave {money(gave)}
        </Txt>
      </View>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        {photo ? (
          <Image source={photo} style={styles.freshPhoto} contentFit="cover" transition={200} />
        ) : (
          <CoverThumb cause={cause} size={64} />
        )}
        <View style={{ flex: 1, gap: 3 }}>
          <Txt variant="bodyStrong" numberOfLines={2}>
            {cause.title}
          </Txt>
          <Txt variant="caption" numberOfLines={2}>
            {org.name} posted the receipt and a thank-you photo.
          </Txt>
        </View>
      </View>
      <View style={styles.freshCta}>
        <Txt variant="caption" color={color.white} style={{ fontWeight: '700' }}>
          See the result
        </Txt>
        <Icon name="arrow.right" size={12} color={color.white} weight="bold" />
      </View>
    </PressableScale>
  );
}

/** One cause you gave to: where it is on Funded → Bought → Delivered, and what happens next. */
function TrackedCause({ cause, gave, isNew = false }: { cause: Cause; gave: number; isNew?: boolean }) {
  const t = trackCause(cause);
  const delivered = cause.status === 'delivered';
  return (
    <PressableScale
      onPress={() => router.push(delivered ? `/proof/${cause.id}` : `/cause/${cause.id}`)}
      scaleTo={0.98}
      style={[styles.tracked, isNew && styles.trackedNew]}
      accessibilityRole="button"
      accessibilityLabel={`${cause.title}. You gave ${money(gave)}. ${t.label}. ${t.next}`}>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <CoverThumb cause={cause} size={50} />
        <View style={{ flex: 1, gap: 2 }}>
          <Txt variant="bodyStrong" numberOfLines={1}>
            {cause.title}
          </Txt>
          <Txt variant="caption">
            You gave{' '}
            <Txt variant="caption" color={color.ink} style={{ fontWeight: '700' }}>
              {money(gave)}
            </Txt>
            {' · '}
            {money(cause.raised)} of {money(cause.goal)}
          </Txt>
        </View>
        <Pill
          label={isNew ? 'New' : t.label}
          tone={isNew ? 'sun' : delivered ? 'leaf' : cause.status === 'open' ? 'neutral' : 'sun'}
          symbol={isNew ? 'sparkles' : undefined}
          small
        />
      </View>
      {cause.status === 'open' ? (
        <ProgressBar value={cause.raised / cause.goal} height={5} />
      ) : (
        <Stages labels={DONOR_TRACK} done={t.done} />
      )}
      <View style={styles.trackedNext}>
        <Icon
          name={delivered ? 'checkmark.seal.fill' : cause.status === 'open' ? 'hourglass' : 'shippingbox.fill'}
          size={13}
          color={delivered ? color.leaf : color.sunDeep}
        />
        <Txt variant="caption" color={color.ink} style={{ flex: 1 }}>
          {t.next}
        </Txt>
        {cause.status === 'open' ? (
          <Pressable
            onPress={() => shareCause(cause, { justGave: true })}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Share">
            <Icon name="square.and.arrow.up" size={15} color={color.ink} />
          </Pressable>
        ) : (
          <Icon name="chevron.right" size={12} color={color.ink3} />
        )}
      </View>
    </PressableScale>
  );
}

/** The nonprofit's thank-you: the protected delivery photo, its note, and what you gave. */
function ThankYou({ cause, gave }: { cause: Cause; gave: number }) {
  const ev = cause.evidence;
  const org = orgById(cause.orgId);
  const photo = proofPhoto(ev);
  if (!ev) return null;
  return (
    <PressableScale onPress={() => router.push(`/proof/${cause.id}`)} scaleTo={0.98} style={styles.thanks}>
      {photo ? (
        <View>
          <Image source={photo} style={styles.thanksPhoto} contentFit="cover" transition={200} />
          <View style={styles.thanksChip}>
            <Icon name="checkmark.shield.fill" size={11} color={color.shield} />
            <Txt variant="caption" color={color.shield} style={{ fontSize: 11, fontWeight: '700' }}>
              {ev.privacy.facesBlurred > 0 ? 'Faces blurred · ' : ''}GPS removed
            </Txt>
          </View>
          <View style={styles.thanksGave}>
            <Txt variant="caption" color={color.white} style={{ fontSize: 12, fontWeight: '700' }}>
              You gave {money(gave)}
            </Txt>
          </View>
        </View>
      ) : null}
      <View style={{ padding: space.md, gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Icon name="checkmark.seal.fill" size={13} color={color.leaf} />
          <Txt variant="micro" color={color.leaf}>
            Delivered
          </Txt>
          <Txt variant="caption" color={color.ink3} numberOfLines={1} style={{ flex: 1 }}>
            · {cause.title}
          </Txt>
        </View>
        <Txt variant="bodyStrong" style={{ fontSize: 17, lineHeight: 24 }} numberOfLines={3}>
          “{ev.note}”
        </Txt>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <OrgLine org={org} size="sm" />
          <Txt variant="caption" color={color.ink} style={{ fontWeight: '700' }}>
            Receipt →
          </Txt>
        </View>
      </View>
    </PressableScale>
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
        color={leaf ? color.leaf : accent ? color.sunDeep : color.ink}
        style={{ fontSize: 32, lineHeight: 38 }}
      />
      <Txt
        variant="caption"
        color={leaf ? color.leaf : accent ? color.sunDeep : color.ink2}
        style={{ fontWeight: '600' }}>
        {label}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: color.card, borderRadius: radius.lg, padding: space.md, ...shadow.card },
  empty: { alignItems: 'center', gap: space.sm, paddingVertical: space.xl },
  ghostShelf: { flexDirection: 'row', gap: 12, marginBottom: space.sm },
  ghostTile: {
    width: 52,
    height: 52,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.paper,
    borderWidth: 1.5,
    borderColor: color.line,
  },
  grid: { flexDirection: 'row', gap: 10 },
  stat: {
    flex: 1,
    backgroundColor: color.card,
    borderRadius: radius.lg,
    padding: 14,
    gap: 0,
    minHeight: 88,
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
  trackedNew: { borderWidth: 1.5, borderColor: color.sun },
  fresh: {
    gap: 12,
    padding: space.md,
    borderRadius: radius.lg,
    backgroundColor: color.card,
    borderWidth: 1.5,
    borderColor: color.leafSoft,
    ...shadow.lift,
  },
  freshTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  freshDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: color.sun },
  freshPhoto: { width: 64, height: 64, borderRadius: 14, backgroundColor: color.paperDeep },
  freshCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: color.leaf,
  },
  tracked: { gap: 12, padding: space.md, backgroundColor: color.card, borderRadius: radius.lg, ...shadow.card },
  trackedNext: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: color.line,
  },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  moneyBar: { flexDirection: 'row', height: 10, borderRadius: 5, overflow: 'hidden', gap: 2 },
  thanks: { backgroundColor: color.card, borderRadius: radius.lg, overflow: 'hidden', ...shadow.card },
  thanksPhoto: { height: 190, backgroundColor: color.paperDeep },
  thanksChip: {
    position: 'absolute',
    left: 10,
    bottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  thanksGave: {
    position: 'absolute',
    right: 10,
    top: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(23,20,15,0.72)',
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
