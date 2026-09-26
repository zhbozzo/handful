import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { CountUp } from '@/components/CountUp';
import { CoverArt } from '@/components/CoverArt';
import { Icon } from '@/components/Icon';
import { Pill } from '@/components/Pill';
import { ProgressBar } from '@/components/Progress';
import { ScrollHeader } from '@/components/ScrollHeader';
import { Stages } from '@/components/Stages';
import { RecentGifts } from '@/components/Supporters';
import { Txt } from '@/components/Txt';
import { recentGifts } from '@/lib/activity';
import { devScroll } from '@/lib/devScroll';
import { ago, money, plural } from '@/lib/format';
import { STAGE_PILL, type Stage, stageOf, TRACK, TRACK_DONE } from '@/lib/funds';
import { shareCause } from '@/lib/share';
import { useCause, useStore } from '@/store/useStore';
import { color, radius, shadow, space } from '@/theme/tokens';

/** The nonprofit's view of one cause: the money, where it is, and the one thing to do next. */
export default function ManageCause() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const cause = useCause(id);
  const contributions = useStore((s) => s.contributions);
  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(devScroll()?.y ?? 0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });

  if (!cause) return null;
  const stage = stageOf(cause);
  const left = cause.goal - cause.raised;
  const gifts = recentGifts(cause, contributions, undefined, 5);
  const pill = STAGE_PILL[stage];

  return (
    <View style={{ flex: 1, backgroundColor: color.paper }}>
      <Animated.ScrollView
        contentOffset={devScroll()}
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{
          paddingTop: insets.top + 60,
          paddingHorizontal: space.lg,
          paddingBottom: insets.bottom + space.xxl,
          gap: space.lg,
        }}
        showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(400)} style={{ gap: space.sm }}>
          <View style={styles.cover}>
            <CoverArt cause={cause} height={150} rounded={radius.lg} alive={false} />
          </View>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <Pill label={pill.label} tone={pill.tone} small />
            <Pill label="Your cause" tone="demo" small />
          </View>
          <Txt variant="title" style={{ fontSize: 26, lineHeight: 31 }}>
            {cause.title}
          </Txt>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(60).duration(400)} style={[styles.card, { gap: 12 }]}>
          <View style={styles.amountRow}>
            <CountUp variant="bigNumber" value={cause.raised} from={0} duration={900} format={money} />
            <Txt variant="callout" style={{ marginBottom: 6 }}>
              of {money(cause.goal)}
            </Txt>
            <View style={{ flex: 1 }} />
            <Txt
              variant="bodyStrong"
              color={stage === 'collecting' ? color.sunDeep : color.leaf}
              style={{ marginBottom: 6 }}>
              {stage === 'collecting' ? `${money(left)} to go` : 'Fully funded'}
            </Txt>
          </View>
          <ProgressBar
            value={cause.raised / cause.goal}
            height={8}
            fill={stage === 'collecting' ? color.sun : color.leaf}
          />
          <Txt variant="caption">
            {plural(cause.donors, 'donor')} · Handful fee $0 · you receive every dollar raised
          </Txt>
          <View style={styles.rule} />
          <Stages labels={TRACK} done={TRACK_DONE[stage]} />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(120).duration(400)}>
          <NextStep stage={stage} causeId={cause.id} left={left} onShare={() => shareCause(cause)} />
        </Animated.View>

        {cause.payout ? (
          <View style={[styles.card, styles.payout]}>
            <View style={styles.payoutIcon}>
              <Icon name="building.columns.fill" size={16} color={color.leaf} />
            </View>
            <View style={{ flex: 1, gap: 1 }}>
              <Txt variant="bodyStrong">Paid out to ····{cause.payout.account}</Txt>
              <Txt variant="caption">{ago(cause.payout.at)} · demo transfer</Txt>
            </View>
            <Txt variant="number">{money(cause.payout.amount)}</Txt>
          </View>
        ) : null}

        {gifts.length > 0 ? (
          <View style={{ gap: space.sm }}>
            <View style={styles.sectionHead}>
              <Txt variant="micro">Donations received</Txt>
              <Txt variant="caption">{plural(cause.donors, 'gift')}</Txt>
            </View>
            <View style={[styles.card, { paddingVertical: 4 }]}>
              <RecentGifts gifts={gifts} donors={cause.donors} nonprofit />
              {cause.donors > gifts.length ? (
                <Txt variant="caption" color={color.ink3} style={{ paddingVertical: 10 }}>
                  + {plural(cause.donors - gifts.length, 'earlier gift')} · donors stay anonymous to you
                </Txt>
              ) : null}
            </View>
          </View>
        ) : null}

        <Txt variant="caption" color={color.ink3}>
          Money is released only once a cause is fully funded, to the nonprofit’s verified account. The receipt is due
          within 7 days; anything left over moves to your next open cause.
        </Txt>
      </Animated.ScrollView>
      <ScrollHeader scrollY={scrollY} title={cause.title} showAt={120} />
    </View>
  );
}

function NextStep({
  stage,
  causeId,
  left,
  onShare,
}: {
  stage: Stage;
  causeId: string;
  left: number;
  onShare: () => void;
}) {
  const content: Record<Stage, { icon: string; title: string; body: string; action: React.ReactNode }> = {
    collecting: {
      icon: 'megaphone.fill',
      title: `${money(left)} to go`,
      body: 'Causes that get shared fund fastest. Funds unlock when the goal is reached.',
      action: <Button label="Share cause" kind="secondary" symbol="square.and.arrow.up" compact onPress={onShare} />,
    },
    available: {
      icon: 'arrow.down.to.line',
      title: 'Ready to withdraw',
      body: 'Transfer the money, buy what’s on the list, then post the receipt.',
      action: (
        <Button
          label="Withdraw funds"
          kind="sun"
          symbol="arrow.down.to.line"
          compact
          onPress={() => router.push(`/nonprofit/withdraw/${causeId}`)}
        />
      ),
    },
    paidOut: {
      icon: 'camera.fill',
      title: 'Post the receipt and a thank-you photo',
      body: 'Donors see the receipt and the moment of delivery. Faces are blurred for you.',
      action: (
        <Button
          label="Post receipt & thank-you photo"
          kind="sun"
          symbol="camera.fill"
          compact
          onPress={() => router.push(`/nonprofit/proof/${causeId}`)}
        />
      ),
    },
    bought: {
      icon: 'camera.fill',
      title: 'Share the delivery',
      body: 'The receipt is up. A thank-you photo closes the loop for everyone who gave.',
      action: (
        <Button
          label="Post thank-you photo"
          kind="sun"
          symbol="camera.fill"
          compact
          onPress={() => router.push(`/nonprofit/proof/${causeId}`)}
        />
      ),
    },
    delivered: {
      icon: 'checkmark.seal.fill',
      title: 'Delivered — donors were notified',
      body: 'Everyone who gave got the receipt, your note and the protected photo.',
      action: (
        <Button label="See what donors see" kind="secondary" compact onPress={() => router.push(`/proof/${causeId}`)} />
      ),
    },
  };
  const c = content[stage];
  const done = stage === 'delivered';
  return (
    <View style={[styles.card, styles.next, done ? styles.nextDone : stage !== 'collecting' && styles.nextActive]}>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <View style={[styles.nextIcon, done && { backgroundColor: color.leafSoft }]}>
          <Icon name={c.icon} size={16} color={done ? color.leaf : color.sunDeep} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Txt variant="bodyStrong">{c.title}</Txt>
          <Txt variant="caption">{c.body}</Txt>
        </View>
      </View>
      {c.action}
    </View>
  );
}

const styles = StyleSheet.create({
  cover: { borderRadius: radius.lg, overflow: 'hidden', ...shadow.card },
  card: { backgroundColor: color.card, borderRadius: radius.lg, padding: space.md, ...shadow.card },
  amountRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  rule: { height: StyleSheet.hairlineWidth, backgroundColor: color.line },
  next: { gap: 14 },
  nextActive: { borderWidth: 1.5, borderColor: color.sun, backgroundColor: '#FFFBF2' },
  nextDone: { backgroundColor: '#F4FAF6' },
  nextIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: color.sunSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payout: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  payoutIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: color.leafSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
});
