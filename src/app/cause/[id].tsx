import { BlurView } from 'expo-blur';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { statusLabel } from '@/components/CauseCard';
import { CountUp } from '@/components/CountUp';
import { CoverArt } from '@/components/CoverArt';
import { Icon } from '@/components/Icon';
import { OrgLine } from '@/components/OrgLine';
import { Pill } from '@/components/Pill';
import { ProgressBar } from '@/components/Progress';
import { ScrollHeader } from '@/components/ScrollHeader';
import { DonorStack, RecentGifts } from '@/components/Supporters';
import { Timeline } from '@/components/Timeline';
import { Txt } from '@/components/Txt';
import { recentGifts } from '@/lib/activity';
import { shareCause } from '@/lib/share';
import { devScroll } from '@/lib/devScroll';
import { categoryById } from '@/data/categories';
import { orgById } from '@/data/seed';
import { ago, money, pct, plural } from '@/lib/format';
import { MAX_GIFT } from '@/lib/purchases';
import { useCause, useStore } from '@/store/useStore';
import { color, radius, shadow, space } from '@/theme/tokens';

export default function CauseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const cause = useCause(id);
  const contributions = useStore((s) => s.contributions);
  const gave = contributions.filter((c) => c.causeId === id).reduce((sum, c) => sum + c.amount, 0);
  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(devScroll()?.y ?? 0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });
  const coverH = 300 + insets.top;
  // Pull down: the cover stretches from the top. Scroll up: it drifts slower than the page.
  const coverStyle = useAnimatedStyle(() => {
    const y = scrollY.value;
    return y < 0
      ? { transform: [{ translateY: y / 2 }, { scale: 1 + -y / coverH }] }
      : { transform: [{ translateY: y * 0.45 }], opacity: interpolate(y, [0, coverH], [1, 0.4], 'clamp') };
  });

  if (!cause) return null;

  const org = orgById(cause.orgId);
  const cat = categoryById(cause.category);
  const recent = recentGifts(cause, contributions);
  const left = cause.goal - cause.raised;
  const open = cause.status === 'open';
  const delivered = cause.status === 'delivered';

  return (
    <View style={{ flex: 1, backgroundColor: color.paper }}>
      <Animated.ScrollView
        contentOffset={devScroll()}
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: 140 + insets.bottom }}
        showsVerticalScrollIndicator={false}>
        <Animated.View style={coverStyle}>
          <Link.AppleZoomTarget>
            <CoverArt
              cause={cause}
              height={coverH}
              rounded={0}
              padTop={insets.top + 24}
              photoTag
              bottomInset={space.xl}
            />
          </Link.AppleZoomTarget>
        </Animated.View>

        <View style={styles.body}>
          <Animated.View entering={FadeInDown.duration(450)} style={{ gap: space.sm }}>
            <View style={styles.pills}>
              <Pill label={cat.label} symbol={cat.symbol} />
              {!open ? (
                <Pill
                  label={statusLabel[cause.status]}
                  tone={delivered ? 'leaf' : 'sun'}
                  symbol={delivered ? 'checkmark' : undefined}
                />
              ) : null}
              <Pill label="Demo cause" tone="demo" />
            </View>
            <Txt variant="title">{cause.title}</Txt>
            <View style={styles.meta}>
              <Icon name="mappin.and.ellipse" size={13} color={color.ink3} />
              <Txt variant="caption" color={color.ink3}>
                {cause.area} · general area
              </Txt>
              <Txt variant="caption" color={color.ink3}>
                ·
              </Txt>
              <Txt variant="caption" color={color.ink3}>
                Posted {ago(cause.createdAt)}
              </Txt>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(60).duration(450)} style={[styles.card, { gap: 12 }]}>
            <View style={styles.amountRow}>
              <CountUp variant="bigNumber" value={cause.raised} from={0} duration={1000} format={money} />
              <Txt variant="callout" style={{ marginBottom: 6 }}>
                of {money(cause.goal)}
              </Txt>
              <View style={{ flex: 1 }} />
              {open ? (
                <Txt variant="bodyStrong" color={color.sunDeep} style={{ marginBottom: 6 }}>
                  {money(left)} to go
                </Txt>
              ) : (
                <Txt variant="bodyStrong" color={color.leaf} style={{ marginBottom: 6 }}>
                  Fully funded
                </Txt>
              )}
            </View>
            <ProgressBar value={cause.raised / cause.goal} height={10} fill={open ? color.sun : color.leaf} />
            {cause.raised === 0 ? (
              <View style={styles.firstRow}>
                <Icon name="sparkles" size={13} color={color.sunDeep} />
                <Txt variant="caption" color={color.ink}>
                  Just posted — be the first to give.
                </Txt>
              </View>
            ) : (
              <>
                <View style={styles.donorRow}>
                  <DonorStack gifts={recent} donors={cause.donors} />
                  <Txt variant="caption" style={{ flex: 1 }}>
                    {pct(cause.raised, cause.goal)}% funded · {plural(cause.donors, 'donor')}
                    {gave > 0 ? ` · you gave ${money(gave)}` : ''}
                  </Txt>
                </View>
                <View style={styles.cardRule} />
                <RecentGifts gifts={recent} donors={cause.donors} />
              </>
            )}
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(120).duration(450)} style={{ gap: space.sm }}>
            <OrgLine org={org} sub={org.focus} />
            <Txt variant="body" style={{ color: color.ink }}>
              {cause.summary}
            </Txt>
          </Animated.View>

          <Section title="What it pays for">
            <View style={styles.card}>
              {cause.items.map((item, i) => (
                <View key={item.id} style={[styles.item, i > 0 && styles.itemBorder]}>
                  <View style={[styles.itemIcon, { backgroundColor: cat.tint }]}>
                    <Icon name={item.symbol} size={17} color={cat.ink} hierarchical />
                  </View>
                  <Txt variant="body" style={{ flex: 1 }}>
                    {item.label}
                  </Txt>
                  <Txt variant="number">{money(item.amount)}</Txt>
                </View>
              ))}
              <View style={[styles.item, styles.totalRow]}>
                <Txt variant="bodyStrong" style={{ flex: 1 }}>
                  Goal
                </Txt>
                <Txt variant="number">{money(cause.goal)}</Txt>
              </View>
            </View>
            <Txt variant="caption" style={{ paddingHorizontal: 4 }}>
              Estimated prices. The receipt shows what was actually spent — anything left over moves to the nonprofit’s
              next open cause.
            </Txt>
          </Section>

          <Section title="Follow the money">
            <View style={[styles.card, { paddingBottom: 0 }]}>
              <Timeline cause={cause} />
            </View>
          </Section>

          <Section title="Trust & privacy">
            <View style={[styles.card, { gap: 14 }]}>
              <Row symbol="checkmark.seal.fill" tint={color.leaf} title={`${org.name} is verified`}>
                {org.checks.join(' · ')} — simulated for this demo.
              </Row>
              <Row symbol="eye.slash.fill" tint={color.shield} title="Dignity first">
                No full name, no exact location. Consent recorded by the nonprofit. Photos pass through Privacy Shield
                before anyone sees them.
              </Row>
            </View>
          </Section>
        </View>
      </Animated.ScrollView>

      <ScrollHeader scrollY={scrollY} title={cause.title} showAt={300} onShare={() => shareCause(cause)} />

      <Animated.View entering={FadeIn.delay(250)} style={[styles.bar, { paddingBottom: insets.bottom + 10 }]}>
        <BlurView intensity={60} tint="light" style={StyleSheet.absoluteFill} />
        <View style={styles.barInner}>
          {open ? (
            left <= MAX_GIFT ? (
              <>
                <Button
                  label="Give"
                  kind="secondary"
                  style={{ flex: 0.8 }}
                  onPress={() => router.push({ pathname: '/give/[id]', params: { id: cause.id } })}
                />
                <Button
                  label={`Complete it · ${money(left)}`}
                  kind="sun"
                  style={{ flex: 1.4 }}
                  onPress={() =>
                    router.push({ pathname: '/give/[id]', params: { id: cause.id, amount: String(left) } })
                  }
                />
              </>
            ) : (
              <Button
                label="Give to this cause"
                style={{ flex: 1 }}
                onPress={() => router.push({ pathname: '/give/[id]', params: { id: cause.id } })}
              />
            )
          ) : delivered ? (
            <Button
              label="See the proof"
              symbol="checkmark.seal.fill"
              style={{ flex: 1 }}
              onPress={() => router.push(`/proof/${cause.id}`)}
            />
          ) : (
            <View style={styles.fundedNote}>
              <Icon name="clock.fill" size={16} color={color.leaf} />
              <Txt variant="callout" color={color.ink} style={{ flex: 1 }}>
                {cause.status === 'purchased'
                  ? 'Items bought and receipt posted. The delivery photo comes next.'
                  : `Fully funded. ${org.name} buys the items and posts the receipt next.`}
              </Txt>
            </View>
          )}
        </View>
      </Animated.View>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: space.sm }}>
      <Txt variant="micro" style={{ paddingHorizontal: 4 }}>
        {title}
      </Txt>
      {children}
    </View>
  );
}

function Row({
  symbol,
  tint,
  title,
  children,
}: {
  symbol: string;
  tint: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={{ flexDirection: 'row', gap: 12 }}>
      <Icon name={symbol} size={20} color={tint} />
      <View style={{ flex: 1, gap: 2 }}>
        <Txt variant="bodyStrong">{title}</Txt>
        <Txt variant="caption">{children}</Txt>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  donorRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardRule: { height: StyleSheet.hairlineWidth, backgroundColor: color.line, marginTop: 2 },
  firstRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  body: {
    padding: space.lg,
    gap: space.xl,
    marginTop: -space.xl,
    backgroundColor: color.paper,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  pills: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap' },
  card: { backgroundColor: color.card, borderRadius: radius.lg, padding: space.md, ...shadow.card },
  amountRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  itemBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: color.line },
  itemIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  totalRow: { borderTopWidth: 1, borderTopColor: color.lineStrong, marginTop: 2 },
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: color.line,
    backgroundColor: 'rgba(246,243,236,0.75)',
  },
  barInner: { flexDirection: 'row', gap: 10, paddingHorizontal: space.lg, paddingTop: 12 },
  fundedNote: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 56 },
});
