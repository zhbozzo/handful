import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { CoverThumb } from '@/components/CoverArt';
import { Icon } from '@/components/Icon';
import { Pill } from '@/components/Pill';
import { Txt } from '@/components/Txt';
import { orgById, STUDIO_ACCOUNT } from '@/data/seed';
import { ago, money, plural } from '@/lib/format';
import { success, tap } from '@/lib/haptics';
import { useCause, useStore } from '@/store/useStore';
import { color, radius, space } from '@/theme/tokens';

const cents = (n: number) => `$${n.toFixed(2)}`;

/**
 * A funded cause's money goes to the nonprofit's verified account — never to an individual —
 * and the receipt has to follow within 7 days. Simulated in the demo.
 */
export default function WithdrawSheet() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const cause = useCause(id);
  const withdraw = useStore((s) => s.withdraw);
  const insets = useSafeAreaInsets();
  const [busy, setBusy] = useState(false);

  if (!cause) return null;
  const org = orgById(cause.orgId);
  const paid = cause.payout;

  function transfer() {
    if (!cause) return;
    tap();
    setBusy(true);
    // A short beat so the transfer reads as something that happened, not a toggle.
    setTimeout(() => {
      withdraw(cause.id);
      setBusy(false);
      success();
    }, 900);
  }

  if (paid) {
    return (
      <View style={[styles.sheet, styles.center, { paddingBottom: insets.bottom + space.md }]}>
        <Animated.View entering={ZoomIn.springify().damping(12)} style={styles.badge}>
          <Icon name="arrow.down.to.line" size={30} color={color.white} weight="bold" />
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(150)} style={{ alignItems: 'center', gap: space.sm }}>
          <Txt variant="title" align="center">
            {money(paid.amount)}{' '}
            <Txt variant="title" accent>
              on its way.
            </Txt>
          </Txt>
          <Txt variant="callout" align="center" style={{ maxWidth: 300 }}>
            Sent to {org.name} · account ····{paid.account} · {ago(paid.at)}. Buy the items, then post the receipt and a
            thank-you photo.
          </Txt>
        </Animated.View>
        <View style={{ flex: 1 }} />
        <Animated.View entering={FadeIn.delay(300)} style={{ alignSelf: 'stretch', gap: 10 }}>
          <Button
            label="Post receipt & thank-you photo"
            kind="sun"
            symbol="camera.fill"
            onPress={() => {
              router.back();
              router.push(`/nonprofit/proof/${cause.id}`);
            }}
          />
          <Button label="Later" kind="secondary" onPress={() => router.back()} />
          <DemoNote />
        </Animated.View>
      </View>
    );
  }

  const ready = cause.status === 'funded';

  return (
    <View style={[styles.sheet, { paddingBottom: insets.bottom + space.md }]}>
      <View style={{ gap: 4 }}>
        <Txt variant="micro">Withdraw funds</Txt>
        <View style={styles.causeRow}>
          <CoverThumb cause={cause} size={44} />
          <Txt variant="bodyStrong" numberOfLines={2} style={{ flex: 1 }}>
            {cause.title}
          </Txt>
        </View>
      </View>

      <View style={styles.card}>
        <Row label={`Raised from ${plural(cause.donors, 'donor')}`} value={cents(cause.raised)} />
        <Row label="Handful fee" value={cents(0)} hint="Paid for by Supporters" />
        <View style={styles.rule} />
        <Row label="You receive" value={cents(cause.raised)} strong />
      </View>

      <View style={[styles.card, styles.bank]}>
        <View style={styles.bankIcon}>
          <Icon name="building.columns.fill" size={17} color={color.ink} />
        </View>
        <View style={{ flex: 1, gap: 1 }}>
          <Txt variant="bodyStrong">{org.name}</Txt>
          <Txt variant="caption">Checking ····{STUDIO_ACCOUNT}</Txt>
        </View>
        <Pill label="Verified" tone="leaf" symbol="checkmark.seal.fill" small />
      </View>

      <View style={styles.rule7}>
        <Icon name="clock.fill" size={14} color={color.sunDeep} />
        <Txt variant="caption" color={color.ink} style={{ flex: 1 }}>
          Post the receipt within 7 days of withdrawing. Everyone who gave is notified when you do.
        </Txt>
      </View>

      <View style={{ flex: 1 }} />

      <Button
        label={ready ? `Transfer ${money(cause.raised)}` : 'Available once fully funded'}
        kind="sun"
        symbol={ready ? 'arrow.down.to.line' : undefined}
        loading={busy}
        disabled={!ready}
        onPress={transfer}
      />
      <DemoNote />
    </View>
  );
}

function Row({ label, value, hint, strong }: { label: string; value: string; hint?: string; strong?: boolean }) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Txt variant={strong ? 'bodyStrong' : 'body'}>{label}</Txt>
        {hint ? (
          <Txt variant="caption" color={color.ink3} style={{ fontSize: 12 }}>
            {hint}
          </Txt>
        ) : null}
      </View>
      <Txt variant="number" style={strong ? { fontSize: 22, lineHeight: 28 } : null}>
        {value}
      </Txt>
    </View>
  );
}

function DemoNote() {
  return (
    <View style={styles.demo}>
      <Icon name="lock.fill" size={10} color={color.ink3} />
      <Txt variant="caption" color={color.ink3} align="center" style={{ fontSize: 12, flexShrink: 1 }}>
        Demo payout · no real money moves. In production: Stripe Connect to the nonprofit’s verified account.
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1, padding: space.lg, paddingTop: space.xl, gap: space.md, backgroundColor: color.paper },
  center: { alignItems: 'center', paddingTop: space.xxl },
  causeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 6 },
  card: { backgroundColor: color.card, borderRadius: radius.lg, padding: space.md, gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rule: { height: StyleSheet.hairlineWidth, backgroundColor: color.lineStrong },
  bank: { flexDirection: 'row', alignItems: 'center' },
  bankIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: color.paperDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rule7: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: space.sm,
    borderRadius: radius.md,
    backgroundColor: color.sunSoft,
  },
  badge: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: color.leaf,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.md,
  },
  demo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingHorizontal: space.md },
});
