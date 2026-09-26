import type { PurchasesPackage } from 'react-native-purchases';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Line } from 'react-native-svg';

import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { Txt } from '@/components/Txt';
import { Mark } from '@/components/Wordmark';
import { success, tap, warn } from '@/lib/haptics';
import {
  getSupporterPackage,
  isTestStoreKey,
  purchaseSupporter,
  restoreSupporter,
  revenueCatEnabled,
} from '@/lib/purchases';
import { useStore } from '@/store/useStore';
import { color, radius, shadow, space } from '@/theme/tokens';

const POINTS = [
  {
    symbol: 'building.2.fill',
    title: 'Nonprofits never pay',
    detail: 'Posting causes, receipts and proof stays free for them.',
  },
  {
    symbol: 'percent',
    title: 'No platform fee on gifts',
    detail: 'Handful takes no cut. Only the card processor’s fee applies.',
  },
  {
    symbol: 'checkmark.shield.fill',
    title: 'Verification and Privacy Shield',
    detail: 'Checking every nonprofit and protecting every photo.',
  },
];

/** The mark as a small sun: rays turn slowly, a warm halo breathes. */
function SunHero({ size = 62 }: { size?: number }) {
  const reduced = useReducedMotion();
  const spin = useSharedValue(0);
  const breathe = useSharedValue(0);
  useEffect(() => {
    if (reduced) return;
    spin.set(withRepeat(withTiming(1, { duration: 24000, easing: Easing.linear }), -1));
    breathe.set(
      withRepeat(
        withSequence(
          withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
      ),
    );
  }, [reduced, spin, breathe]);

  const rays = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.value * 360}deg` }] }));
  const halo = useAnimatedStyle(() => ({
    opacity: 0.55 + breathe.value * 0.35,
    transform: [{ scale: 1 + breathe.value * 0.08 }],
  }));

  const box = size * 2.3;
  const c = box / 2;
  return (
    <View style={{ width: box, height: box, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={[styles.halo, { width: size * 1.7, height: size * 1.7, borderRadius: size }, halo]} />
      <Animated.View style={[StyleSheet.absoluteFill, rays]}>
        <Svg width={box} height={box}>
          {Array.from({ length: 12 }, (_, i) => {
            const a = (i / 12) * Math.PI * 2;
            const r1 = size * 0.98;
            const r2 = size * (i % 2 ? 1.08 : 1.16);
            return (
              <Line
                key={i}
                x1={c + Math.cos(a) * r1}
                y1={c + Math.sin(a) * r1}
                x2={c + Math.cos(a) * r2}
                y2={c + Math.sin(a) * r2}
                stroke={color.sun}
                strokeOpacity={i % 2 ? 0.45 : 0.8}
                strokeWidth={4}
                strokeLinecap="round"
              />
            );
          })}
        </Svg>
      </Animated.View>
      <View style={[styles.disc, { width: size * 1.45, height: size * 1.45, borderRadius: size }]}>
        <Mark size={size} />
      </View>
    </View>
  );
}

/**
 * The part of Handful that RevenueCat would keep powering in production:
 * an optional auto-renewing membership that pays for the platform itself
 * (App Store Guideline 3.1.1 allows in-app purchase for supporting the developer).
 */
export default function SupporterSheet() {
  const insets = useSafeAreaInsets();
  const { supporter, setSupporter } = useStore();
  const [pkg, setPkg] = useState<PurchasesPackage | null>(null);
  const [loading, setLoading] = useState(revenueCatEnabled());
  const [busy, setBusy] = useState<'buy' | 'restore' | null>(null);
  const [note, setNote] = useState<{ text: string; tone: 'error' | 'info' } | null>(null);

  useEffect(() => {
    if (!revenueCatEnabled()) return;
    getSupporterPackage().then((p) => {
      setPkg(p);
      setLoading(false);
    });
  }, []);

  async function join() {
    if (!pkg) return;
    setBusy('buy');
    setNote(null);
    const r = await purchaseSupporter(pkg);
    setBusy(null);
    if (r.ok) {
      setSupporter(r.active);
      if (r.active) success();
      return;
    }
    if (!r.cancelled) {
      warn();
      setNote({ text: r.message, tone: 'error' });
    }
  }

  async function restore() {
    tap();
    setBusy('restore');
    setNote(null);
    const r = await restoreSupporter();
    setBusy(null);
    if (!r.ok) {
      warn();
      setNote({ text: r.message, tone: 'error' });
    } else if (r.active) {
      setSupporter(true);
      success();
    } else {
      setNote({ text: 'No active membership found for this account.', tone: 'info' });
    }
  }

  const price = pkg?.product.priceString;

  return (
    <View style={styles.sheet}>
      <LinearGradient pointerEvents="none" colors={['#FCE6B9', 'rgba(246,243,236,0)']} style={styles.wash} />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: space.lg,
          paddingTop: space.sm,
          paddingBottom: space.md,
          gap: space.lg,
        }}
        showsVerticalScrollIndicator={false}>
        <View style={{ alignItems: 'center' }}>
          <SunHero />
          <View style={{ alignItems: 'center', gap: space.sm }}>
            {supporter ? (
              <Animated.View entering={ZoomIn.springify().damping(14)} style={styles.activePill}>
                <Icon name="checkmark.seal.fill" size={14} color={color.leaf} />
                <Txt variant="micro" color={color.leaf}>
                  Supporter · active
                </Txt>
              </Animated.View>
            ) : null}
            <Txt variant="display" align="center" style={{ fontSize: 38, lineHeight: 40 }}>
              {supporter ? (
                <>
                  Thank you for{'\n'}
                  <Txt variant="display" accent style={{ fontSize: 38, lineHeight: 40 }}>
                    keeping it free.
                  </Txt>
                </>
              ) : (
                <>
                  Keep Handful{' '}
                  <Txt variant="display" accent style={{ fontSize: 38, lineHeight: 40 }}>
                    free.
                  </Txt>
                </>
              )}
            </Txt>
            <Txt variant="callout" align="center" style={{ maxWidth: 320 }}>
              {supporter
                ? 'Your membership covers the platform, so every gift goes to the cause.'
                : 'An optional membership pays for the platform itself, so gifts go to causes, not to us.'}
            </Txt>
          </View>
        </View>

        <View style={styles.points}>
          {POINTS.map((p, i) => (
            <Animated.View key={p.title} entering={FadeInDown.delay(120 + i * 90).duration(450)} style={styles.point}>
              <View style={styles.pointIcon}>
                <Icon name={p.symbol} size={17} color={color.sunDeep} />
              </View>
              <View style={{ flex: 1, gap: 1 }}>
                <Txt variant="bodyStrong">{p.title}</Txt>
                <Txt variant="caption">{p.detail}</Txt>
              </View>
            </Animated.View>
          ))}
        </View>

        {!supporter && revenueCatEnabled() ? (
          <Animated.View entering={FadeInDown.delay(420).duration(450)} style={styles.plan}>
            <View style={styles.radio}>
              <View style={styles.radioDot} />
            </View>
            <View style={{ flex: 1, gap: 1 }}>
              <Txt variant="bodyStrong">Monthly</Txt>
              <Txt variant="caption">Auto-renews · cancel anytime</Txt>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Txt variant="number" style={{ fontSize: 20, lineHeight: 24 }}>
                {price ?? '—'}
              </Txt>
              <Txt variant="caption">per month</Txt>
            </View>
          </Animated.View>
        ) : null}

        {note ? (
          <Txt variant="caption" color={note.tone === 'error' ? color.error : color.ink2} align="center">
            {note.text}
          </Txt>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + space.sm }]}>
        {supporter ? (
          <Button label="Done" onPress={() => router.back()} />
        ) : !revenueCatEnabled() ? (
          <Txt variant="caption" align="center">
            Add a RevenueCat API key in .env to try the Supporter membership (see README).
          </Txt>
        ) : (
          <Button
            label={pkg ? `Become a supporter · ${price}/month` : loading ? 'Loading…' : 'Unavailable right now'}
            kind="sun"
            symbol={pkg ? 'sun.max.fill' : undefined}
            loading={busy === 'buy' || loading}
            disabled={!pkg || busy !== null}
            onPress={join}
          />
        )}
        {revenueCatEnabled() ? (
          <View style={styles.legal}>
            {!supporter ? (
              <Pressable onPress={restore} disabled={busy !== null} hitSlop={10} accessibilityRole="button">
                <Txt variant="caption" color={color.ink} style={styles.link}>
                  {busy === 'restore' ? 'Restoring…' : 'Restore purchases'}
                </Txt>
              </Pressable>
            ) : null}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Icon name="lock.fill" size={10} color={color.ink3} />
              <Txt variant="caption" color={color.ink3} style={{ fontSize: 12 }}>
                {isTestStoreKey() ? 'RevenueCat Test Store · no charge' : 'Billed by the App Store'}
              </Txt>
            </View>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1, backgroundColor: color.paper },
  wash: { position: 'absolute', top: 0, left: 0, right: 0, height: 360 },
  halo: { position: 'absolute', backgroundColor: '#FBDFA6' },
  disc: {
    backgroundColor: color.card,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
    ...shadow.lift,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: color.leafSoft,
  },
  points: { backgroundColor: color.card, borderRadius: radius.lg, padding: space.md, gap: space.md, ...shadow.card },
  point: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pointIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: color.sunSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plan: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: space.md,
    borderRadius: radius.lg,
    backgroundColor: '#FFFBF2',
    borderWidth: 2,
    borderColor: color.sun,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: color.sun,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: color.white },
  footer: {
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    gap: 14,
    backgroundColor: color.paper,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: color.line,
  },
  legal: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14 },
  link: { fontWeight: '700', textDecorationLine: 'underline' },
});
