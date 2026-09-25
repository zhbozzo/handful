import type { PurchasesPackage } from 'react-native-purchases';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { Txt } from '@/components/Txt';
import { Mark } from '@/components/Wordmark';
import { success, warn } from '@/lib/haptics';
import { getSupporterPackage, purchaseSupporter, revenueCatEnabled } from '@/lib/purchases';
import { useStore } from '@/store/useStore';
import { color, radius, space } from '@/theme/tokens';

const POINTS = [
  { symbol: 'building.2.fill', text: 'Nonprofits never pay to post causes' },
  { symbol: 'percent', text: 'Gifts carry no platform fee' },
  { symbol: 'checkmark.shield.fill', text: 'Funds verification and Privacy Shield' },
];

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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!revenueCatEnabled()) return;
    getSupporterPackage().then((p) => {
      setPkg(p);
      setLoading(false);
    });
  }, []);

  async function join() {
    if (!pkg) return;
    setBusy(true);
    setError(null);
    const r = await purchaseSupporter(pkg);
    setBusy(false);
    if (r.ok) {
      setSupporter(r.active);
      if (r.active) success();
      return;
    }
    if (!r.cancelled) {
      warn();
      setError(r.message);
    }
  }

  return (
    <View style={[styles.sheet, { paddingBottom: insets.bottom + space.md }]}>
      <View style={{ alignItems: 'center', gap: space.sm }}>
        <Mark size={52} />
        <Txt variant="title" align="center">
          {supporter ? (
            <>
              You’re a{' '}
              <Txt variant="title" italic>
                supporter.
              </Txt>
            </>
          ) : (
            <>
              Keep Handful{' '}
              <Txt variant="title" italic>
                free.
              </Txt>
            </>
          )}
        </Txt>
        <Txt variant="callout" align="center" style={{ maxWidth: 320 }}>
          {supporter
            ? 'Thank you. Your membership covers the platform, so every gift goes to the cause.'
            : 'An optional membership covers servers, verification and payment tooling — so gifts go to causes without a platform fee.'}
        </Txt>
      </View>

      <View style={styles.card}>
        {POINTS.map((p) => (
          <View key={p.text} style={styles.point}>
            <Icon name={p.symbol} size={17} color={color.sunDeep} />
            <Txt variant="body" style={{ flex: 1 }}>
              {p.text}
            </Txt>
          </View>
        ))}
      </View>

      {error ? (
        <Txt variant="caption" color={color.error} align="center">
          {error}
        </Txt>
      ) : null}

      <View style={{ flex: 1 }} />

      {supporter ? (
        <Button label="Done" onPress={() => router.back()} />
      ) : !revenueCatEnabled() ? (
        <Txt variant="caption" align="center">
          Add a RevenueCat API key in .env to try the Supporter membership (see README).
        </Txt>
      ) : (
        <Button
          label={pkg ? `Become a supporter · ${pkg.product.priceString}/month` : loading ? 'Loading…' : 'Unavailable right now'}
          kind="sun"
          loading={busy || loading}
          disabled={!pkg}
          onPress={join}
        />
      )}
      <Txt variant="caption" color={color.ink3} align="center">
        {revenueCatEnabled()
          ? 'Auto-renewing subscription via RevenueCat · Test Store in this demo · cancel anytime'
          : 'Demo build'}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1, padding: space.lg, paddingTop: space.xxl, gap: space.lg, backgroundColor: color.paper },
  card: { backgroundColor: color.card, borderRadius: radius.lg, padding: space.md, gap: 14 },
  point: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});
