import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CoverArt } from '@/components/CoverArt';
import { Icon } from '@/components/Icon';
import { OrgLine } from '@/components/OrgLine';
import { Pill } from '@/components/Pill';
import { ScrollHeader } from '@/components/ScrollHeader';
import { Timeline } from '@/components/Timeline';
import { Txt } from '@/components/Txt';
import { devScroll } from '@/lib/devScroll';
import { categoryById } from '@/data/categories';
import { orgById } from '@/data/seed';
import { money, when } from '@/lib/format';
import { useCause, useStore } from '@/store/useStore';
import { color, radius, shadow, space } from '@/theme/tokens';

const DEMO_PHOTOS: Record<string, number> = {
  groceries: require('@/assets/images/proof-groceries.jpg'),
};

export default function ProofScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const cause = useCause(id);
  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(devScroll()?.y ?? 0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });
  const gave = useStore((s) => s.contributions.filter((c) => c.causeId === id).reduce((sum, c) => sum + c.amount, 0));
  const inbox = useStore((s) => s.inbox);
  const markInboxRead = useStore((s) => s.markInboxRead);

  useEffect(() => {
    inbox.filter((i) => i.causeId === id && !i.read).forEach((i) => markInboxRead(i.id));
  }, [id, inbox, markInboxRead]);

  if (!cause || !cause.evidence) return null;

  const ev = cause.evidence;
  const org = orgById(cause.orgId);
  const cat = categoryById(cause.category);
  const spent = ev.receipt.reduce((s, r) => s + r.amount, 0);
  const leftover = Math.max(0, cause.raised - spent);
  const deliveredAt = cause.timeline.find((t) => t.status === 'delivered')?.at ?? cause.createdAt;
  const photo = ev.photoUri ? { uri: ev.photoUri } : ev.photoAsset ? DEMO_PHOTOS[ev.photoAsset] : undefined;
  const privacyBits = [
    ev.privacy.facesBlurred > 0
      ? `${ev.privacy.facesBlurred} face${ev.privacy.facesBlurred > 1 ? 's' : ''} blurred`
      : null,
    ev.privacy.textBlurred > 0
      ? `${ev.privacy.textBlurred} text area${ev.privacy.textBlurred > 1 ? 's' : ''} hidden`
      : null,
    ev.privacy.locationRemoved ? 'GPS removed' : null,
  ].filter(Boolean);

  return (
    <View style={{ flex: 1, backgroundColor: color.paper }}>
      <Animated.ScrollView
        contentOffset={devScroll()}
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{
          paddingTop: insets.top + 56,
          paddingBottom: insets.bottom + 48,
          paddingHorizontal: space.lg,
          gap: space.xl,
        }}
        showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(450)} style={{ gap: space.sm }}>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <Pill label="Delivered" tone="leaf" symbol="checkmark.seal.fill" />
            <Pill label={when(deliveredAt)} />
          </View>
          <Txt variant="display">
            It got{' '}
            <Txt variant="display" italic>
              there.
            </Txt>
          </Txt>
          <Txt variant="callout">{cause.title}</Txt>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(80).duration(450)}>
          <View style={styles.photoWrap}>
            {photo ? (
              <Image source={photo} style={styles.photo} contentFit="cover" transition={300} />
            ) : (
              <CoverArt cause={cause} height={300} rounded={radius.xl} />
            )}
            <View style={styles.shieldTag}>
              <Icon name="checkmark.shield.fill" size={14} color={color.shield} />
              <Txt variant="caption" color={color.shield} style={{ fontWeight: '700', flexShrink: 1 }} numberOfLines={1}>
                {privacyBits.join(' · ') || 'Reviewed by Privacy Shield'}
              </Txt>
            </View>
          </View>
          {!photo ? (
            <Txt variant="caption" color={color.ink3} style={{ marginTop: 8, paddingHorizontal: 4 }}>
              Demo evidence: illustration in place of a delivery photo.
            </Txt>
          ) : null}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(140).duration(450)} style={styles.card}>
          <Txt variant="micro" style={{ marginBottom: 6 }}>
            {gave > 0 ? `Your ${money(gave)} helped provide` : 'What was delivered'}
          </Txt>
          {cause.items.map((item) => (
            <View key={item.id} style={styles.item}>
              <View style={[styles.itemIcon, { backgroundColor: cat.tint }]}>
                <Icon name={item.symbol} size={15} color={cat.ink} hierarchical />
              </View>
              <Txt variant="body" style={{ flex: 1 }}>
                {item.label}
              </Txt>
              <Icon name="checkmark.circle.fill" size={18} color={color.leaf} />
            </View>
          ))}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(450)} style={[styles.card, styles.receipt]}>
          <View style={styles.receiptHead}>
            <Icon name="receipt" size={18} color={color.ink} />
            <View style={{ flex: 1 }}>
              <Txt variant="bodyStrong">Receipt</Txt>
              <Txt variant="caption">{ev.store}</Txt>
            </View>
          </View>
          {ev.receipt.map((r) => (
            <View key={r.label} style={styles.line}>
              <Txt variant="callout" style={{ flex: 1 }}>
                {r.label}
              </Txt>
              <Txt variant="number" style={{ fontSize: 15 }}>
                {money(r.amount)}
              </Txt>
            </View>
          ))}
          <View style={[styles.line, styles.total]}>
            <Txt variant="bodyStrong" style={{ flex: 1 }}>
              Spent
            </Txt>
            <Txt variant="number">{money(spent)}</Txt>
          </View>
          <Txt variant="caption">
            Funded {money(cause.raised)} · spent {money(spent)}
            {leftover > 0.009 ? ` · ${money(Math.round(leftover * 100) / 100)} moved to the next open cause` : ''}
          </Txt>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(260).duration(450)} style={{ gap: space.sm }}>
          <OrgLine org={org} sub="Note from the team" />
          <Txt variant="headline" italic style={{ fontSize: 23, lineHeight: 30 }}>
            “{ev.note}”
          </Txt>
        </Animated.View>

        <View style={{ gap: space.sm }}>
          <Txt variant="micro">Full timeline</Txt>
          <View style={[styles.card, { paddingBottom: 0 }]}>
            <Timeline cause={cause} />
          </View>
        </View>

        <Txt variant="caption" color={color.ink3} align="center">
          {cause.createdHere || ev.photoUri
            ? 'Posted from the nonprofit studio in this demo.'
            : 'Demo evidence from a fictional nonprofit.'}
        </Txt>
      </Animated.ScrollView>

      <ScrollHeader scrollY={scrollY} title="Delivered" showAt={90} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: color.card, borderRadius: radius.lg, padding: space.md, ...shadow.card },
  photoWrap: { borderRadius: radius.xl, overflow: 'hidden', ...shadow.lift },
  photo: { width: '100%', aspectRatio: 1, borderRadius: radius.xl, backgroundColor: color.paperDeep },
  shieldTag: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    maxWidth: '92%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 7 },
  itemIcon: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  receipt: { gap: 8 },
  receiptHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  line: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  total: { borderTopWidth: 1, borderTopColor: color.lineStrong, paddingTop: 8, marginTop: 2 },
});
