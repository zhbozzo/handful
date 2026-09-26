import { router } from 'expo-router';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

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
import { orgById, STUDIO_ORG_ID } from '@/data/seed';
import type { Cause } from '@/data/types';
import { money } from '@/lib/format';
import { devScroll } from '@/lib/devScroll';
import { orgFunds, STAGE_PILL, type Stage, stageOf, TRACK, TRACK_DONE } from '@/lib/funds';
import { useStore } from '@/store/useStore';
import { color, radius, shadow, space } from '@/theme/tokens';

/** Causes that need the nonprofit first, then the rest. */
const PRIORITY: Record<Stage, number> = { available: 0, paidOut: 1, bought: 2, collecting: 3, delivered: 4 };

export default function StudioScreen() {
  const causes = useStore((s) => s.causes);
  const resetDemo = useStore((s) => s.resetDemo);
  const org = orgById(STUDIO_ORG_ID);

  const funds = orgFunds(causes, STUDIO_ORG_ID);
  const mine = causes
    .filter((c) => c.orgId === STUDIO_ORG_ID)
    .sort((a, b) => PRIORITY[stageOf(a)] - PRIORITY[stageOf(b)] || b.createdAt - a.createdAt);
  const firstAvailable = mine.find((c) => stageOf(c) === 'available');

  return (
    <View style={{ flex: 1, backgroundColor: color.paper }}>
      <ScrollView
        contentOffset={devScroll()}
        style={{ flex: 1, backgroundColor: color.paper }}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingTop: space.sm, paddingBottom: 48, paddingHorizontal: space.lg, gap: space.xl }}
        showsVerticalScrollIndicator={false}>
        <View style={{ gap: space.sm }}>
          <Pill label="Nonprofit view · demo" tone="demo" symbol="building.2.fill" />
          <Txt variant="title">Nonprofit studio</Txt>
          <View style={styles.orgCard}>
            <OrgLine org={org} sub="Demo nonprofit · verification simulated" />
          </View>
        </View>

        <Animated.View entering={FadeInDown.duration(450)} style={styles.funds}>
          <View style={styles.fundsGlow} />
          <Txt variant="micro" color="rgba(255,255,255,0.65)">
            Available to withdraw
          </Txt>
          <View style={styles.fundsTop}>
            <CountUp
              variant="bigNumber"
              value={funds.available}
              from={0}
              duration={900}
              format={money}
              color={color.white}
              style={{ fontSize: 46, lineHeight: 52 }}
            />
            {firstAvailable ? (
              <Button
                label="Withdraw"
                kind="sun"
                compact
                symbol="arrow.down.to.line"
                onPress={() => router.push(`/nonprofit/withdraw/${firstAvailable.id}`)}
              />
            ) : null}
          </View>
          <View style={styles.fundsRow}>
            <FundStat label="Received" value={funds.received} />
            <View style={styles.fundsDivider} />
            <FundStat label="Still collecting" value={funds.collecting} />
            <View style={styles.fundsDivider} />
            <FundStat label="Paid out" value={funds.paidOut} />
          </View>
          <Txt variant="caption" color="rgba(255,255,255,0.6)" style={{ fontSize: 12 }}>
            {funds.available > 0
              ? 'Released because a cause reached its goal. Handful fee: $0.'
              : 'Money unlocks when a cause reaches its goal. Handful fee: $0.'}
          </Txt>
        </Animated.View>

        <PressableScale
          onPress={() => router.push('/nonprofit/new')}
          style={styles.newCause}
          accessibilityRole="button">
          <View style={styles.newIcon}>
            <Icon name="plus" size={20} color={color.ink} weight="bold" />
          </View>
          <View style={{ flex: 1, gap: 1 }}>
            <Txt variant="bodyStrong">Post a new cause</Txt>
            <Txt variant="caption">Three quick steps · about two minutes</Txt>
          </View>
          <Icon name="chevron.right" size={14} color={color.ink3} />
        </PressableScale>

        <View style={{ gap: space.sm }}>
          <View style={styles.sectionHead}>
            <Txt variant="micro">Your causes</Txt>
            <Txt variant="caption">{mine.length} total</Txt>
          </View>
          {mine.map((c, i) => (
            <Animated.View key={c.id} entering={FadeInDown.delay(80 + i * 60).duration(400)}>
              <CauseManageCard cause={c} />
            </Animated.View>
          ))}
        </View>

        <Button
          label="Reset demo data"
          kind="ghost"
          compact
          symbol="arrow.counterclockwise"
          onPress={() =>
            Alert.alert('Reset demo data?', 'Causes, your gifts and updates go back to the starting demo state.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Reset', style: 'destructive', onPress: resetDemo },
            ])
          }
        />
      </ScrollView>
      <StatusScrim />
    </View>
  );
}

function FundStat({ label, value }: { label: string; value: number }) {
  return (
    <View style={{ flex: 1, gap: 1 }}>
      <Txt variant="number" color={color.white}>
        {money(value)}
      </Txt>
      <Txt variant="caption" color="rgba(255,255,255,0.6)" style={{ fontSize: 12 }}>
        {label}
      </Txt>
    </View>
  );
}

/** One of the nonprofit's causes: the money, where it is, and the next thing to do. */
function CauseManageCard({ cause }: { cause: Cause }) {
  const stage = stageOf(cause);
  const pill = STAGE_PILL[stage];
  const open = () => router.push(`/nonprofit/cause/${cause.id}`);
  const action =
    stage === 'available'
      ? {
          label: `Withdraw ${money(cause.raised)}`,
          kind: 'sun' as const,
          icon: 'arrow.down.to.line',
          to: `/nonprofit/withdraw/${cause.id}`,
        }
      : stage === 'paidOut' || stage === 'bought'
        ? {
            label: stage === 'bought' ? 'Post thank-you photo' : 'Post receipt & thank-you photo',
            kind: 'primary' as const,
            icon: 'camera.fill',
            to: `/nonprofit/proof/${cause.id}`,
          }
        : null;
  return (
    <PressableScale onPress={open} scaleTo={0.98} style={styles.causeCard} accessibilityRole="button">
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <CoverThumb cause={cause} size={58} />
        <View style={{ flex: 1, gap: 4 }}>
          <Pill label={pill.label} tone={pill.tone} small style={{ alignSelf: 'flex-start' }} />
          <Txt variant="bodyStrong" numberOfLines={2}>
            {cause.title}
          </Txt>
          <Txt variant="caption">
            <Txt variant="caption" color={color.ink} style={{ fontWeight: '700' }}>
              {money(cause.raised)}
            </Txt>{' '}
            of {money(cause.goal)} · {cause.donors} donors
          </Txt>
        </View>
      </View>
      {stage === 'collecting' ? (
        <ProgressBar value={cause.raised / cause.goal} height={5} />
      ) : (
        <Stages labels={TRACK} done={TRACK_DONE[stage]} compact />
      )}
      {action ? (
        <Button
          label={action.label}
          kind={action.kind}
          compact
          symbol={action.icon}
          onPress={() => router.push(action.to as never)}
        />
      ) : null}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  orgCard: { backgroundColor: color.card, borderRadius: radius.lg, padding: space.md, marginTop: 4 },
  funds: {
    padding: space.lg,
    gap: space.md,
    borderRadius: radius.xl,
    backgroundColor: color.ink,
    overflow: 'hidden',
  },
  fundsGlow: {
    position: 'absolute',
    right: -90,
    top: -120,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(244,166,42,0.12)',
  },
  fundsTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: -6 },
  fundsRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  fundsDivider: { width: StyleSheet.hairlineWidth, alignSelf: 'stretch', backgroundColor: 'rgba(255,255,255,0.18)' },
  newCause: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: space.md,
    borderRadius: radius.lg,
    backgroundColor: color.card,
    ...shadow.card,
  },
  newIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: color.sun,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  causeCard: {
    gap: 12,
    padding: space.md,
    backgroundColor: color.card,
    borderRadius: radius.lg,
    ...shadow.card,
  },
});
