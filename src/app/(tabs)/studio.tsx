import { router } from 'expo-router';
import { Fragment } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { CoverThumb } from '@/components/CoverArt';
import { Icon } from '@/components/Icon';
import { OrgLine } from '@/components/OrgLine';
import { Pill } from '@/components/Pill';
import { PressableScale } from '@/components/PressableScale';
import { ProgressBar } from '@/components/Progress';
import { StatusScrim } from '@/components/StatusScrim';
import { Txt } from '@/components/Txt';
import { orgById, STUDIO_ORG_ID } from '@/data/seed';
import type { Cause } from '@/data/types';
import { money } from '@/lib/format';
import { devScroll } from '@/lib/devScroll';
import { useStore } from '@/store/useStore';
import { color, radius, shadow, space } from '@/theme/tokens';

export default function StudioScreen() {
  const causes = useStore((s) => s.causes);
  const resetDemo = useStore((s) => s.resetDemo);
  const org = orgById(STUDIO_ORG_ID);

  const needsProof = causes.filter((c) => c.status === 'funded' || c.status === 'purchased');
  const mine = causes.filter((c) => c.orgId === STUDIO_ORG_ID && c.status === 'open');

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
          <Txt variant="callout">
            How a verified nonprofit posts a need and, later, the proof. In the real product this lives behind a
            verified account; here you can try it as a demo nonprofit.
          </Txt>
          <View style={styles.orgCard}>
            <OrgLine org={org} sub="Demo nonprofit · verification simulated" />
          </View>
        </View>

        <PressableScale onPress={() => router.push('/nonprofit/new')} style={styles.hero} accessibilityRole="button">
          <View style={styles.heroGlow} />
          <View style={styles.heroIcon}>
            <Icon name="plus" size={22} color={color.ink} weight="bold" />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Txt variant="headline" color={color.white}>
              Post a new cause
            </Txt>
            <Txt variant="caption" color="rgba(255,255,255,0.7)">
              Need → budget → story → photo → Privacy Shield → publish
            </Txt>
          </View>
          <Icon name="chevron.right" size={15} color="rgba(255,255,255,0.7)" />
        </PressableScale>

        <View style={{ gap: space.sm }}>
          <Txt variant="micro">Funded · waiting for proof</Txt>
          {needsProof.length === 0 ? (
            <Txt variant="caption">Nothing waiting. When a cause is fully funded it shows up here.</Txt>
          ) : (
            needsProof.map((c) => (
              <View key={c.id} style={styles.proofCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <CoverThumb cause={c} size={48} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Txt variant="bodyStrong" numberOfLines={2}>
                      {c.title}
                    </Txt>
                    <Txt variant="caption" numberOfLines={1}>
                      {money(c.raised)} raised · {c.donors} donors waiting on proof
                    </Txt>
                  </View>
                </View>
                <Steps status={c.status} />
                <Button
                  label="Post receipt & delivery photo"
                  compact
                  symbol="checkmark.shield.fill"
                  onPress={() => router.push(`/nonprofit/proof/${c.id}`)}
                />
              </View>
            ))
          )}
        </View>

        {mine.length > 0 ? (
          <View style={{ gap: space.sm }}>
            <Txt variant="micro">Your open causes</Txt>
            {mine.map((c) => (
              <PressableScale
                key={c.id}
                onPress={() => router.push(`/cause/${c.id}`)}
                style={styles.row}
                accessibilityRole="button">
                <CoverThumb cause={c} size={48} />
                <View style={{ flex: 1, gap: 6 }}>
                  <Txt variant="bodyStrong" numberOfLines={1}>
                    {c.title}
                  </Txt>
                  <ProgressBar value={c.raised / c.goal} height={5} />
                  <Txt variant="caption">
                    {money(c.raised)} of {money(c.goal)} · {c.donors} donors
                  </Txt>
                </View>
                <Icon name="chevron.right" size={13} color={color.ink3} />
              </PressableScale>
            ))}
          </View>
        ) : null}

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

const STEPS = ['Funded', 'Bought', 'Delivered'] as const;

/** Where a funded cause is between the money arriving and the proof going out. */
function Steps({ status }: { status: Cause['status'] }) {
  const done = status === 'purchased' ? 2 : 1;
  return (
    <View
      style={styles.steps}
      accessible
      accessibilityLabel={`${STEPS.slice(0, done).join(', ')} done. Next: ${STEPS[done]}`}>
      {STEPS.map((label, i) => {
        const isDone = i < done;
        const isNext = i === done;
        return (
          <Fragment key={label}>
            {i > 0 ? <View style={[styles.stepLine, isDone && { backgroundColor: color.leaf }]} /> : null}
            <View style={styles.step}>
              <View style={[styles.stepDot, isDone && styles.stepDone, isNext && styles.stepNext]}>
                {isDone ? <Icon name="checkmark" size={9} color={color.white} weight="heavy" /> : null}
              </View>
              <Txt
                variant="caption"
                color={isDone ? color.leaf : isNext ? color.ink : color.ink3}
                style={{ fontSize: 12, fontWeight: isNext ? '700' : '500' }}>
                {label}
              </Txt>
            </View>
          </Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  proofCard: {
    gap: space.md,
    padding: space.md,
    backgroundColor: color.card,
    borderRadius: radius.lg,
    ...shadow.card,
  },
  steps: { flexDirection: 'row', alignItems: 'center' },
  step: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stepLine: { flex: 1, height: 2, borderRadius: 1, backgroundColor: color.line, marginHorizontal: 10 },
  stepDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: color.paperDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDone: { backgroundColor: color.leaf },
  stepNext: { backgroundColor: color.card, borderWidth: 2, borderColor: color.sun },
  heroGlow: {
    position: 'absolute',
    right: -90,
    top: -120,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(244,166,42,0.08)',
  },
  orgCard: { backgroundColor: color.card, borderRadius: radius.lg, padding: space.md, marginTop: 4 },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: space.lg,
    borderRadius: radius.xl,
    backgroundColor: color.ink,
    overflow: 'hidden',
  },
  heroIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: color.sun,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: space.sm,
    backgroundColor: color.card,
    borderRadius: radius.lg,
  },
});
