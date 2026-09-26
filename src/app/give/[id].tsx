import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, Pressable, Settings, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withSequence, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { GiftMeter } from '@/components/GiftMeter';
import { Icon } from '@/components/Icon';
import { PressableScale } from '@/components/PressableScale';
import { Txt } from '@/components/Txt';
import { money } from '@/lib/format';
import { success, tap, warn } from '@/lib/haptics';
import { isTestStoreKey, MAX_GIFT, purchaseGift, revenueCatEnabled } from '@/lib/purchases';
import { useCause, useStore } from '@/store/useStore';
import { color, radius, space } from '@/theme/tokens';

const PRESETS = [2, 5, 10];

export default function GiveSheet() {
  const { id, amount: preset } = useLocalSearchParams<{ id: string; amount?: string }>();
  const cause = useCause(id);
  const contribute = useStore((s) => s.contribute);
  const insets = useSafeAreaInsets();

  const left = cause ? cause.goal - cause.raised : 0;
  const canComplete = left > 0 && left <= MAX_GIFT;
  const options = PRESETS.filter((p) => p < left);
  const initial = preset ? Number(preset) : canComplete && left <= 5 ? left : (options[1] ?? options[0] ?? left);
  const [amount, setAmount] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // A new amount is a fresh attempt: the last error no longer applies.
  const choose = (n: number) => {
    setAmount(n);
    setError(null);
  };

  // Dev/QA only: `-handfulAutoGive 1` presses the main button once the sheet is up.
  useEffect(() => {
    if (!__DEV__ || Platform.OS !== 'ios' || Settings.get('handfulAutoGive') !== '1') return;
    const t = setTimeout(() => give(), 1500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!cause || cause.status !== 'open') return null;

  const completes = amount >= left;
  const covers = cause.items.find((i) => i.amount === amount);

  async function give() {
    if (!cause) return;
    setBusy(true);
    setError(null);
    const result = await purchaseGift(amount);
    setBusy(false);
    if (!result.ok) {
      if (!result.cancelled) {
        warn();
        setError(result.message);
      }
      return;
    }
    const { completed, contribution } = contribute({
      causeId: cause.id,
      amount,
      productId: result.productId,
      transactionId: result.transactionId,
      rail: result.rail,
    });
    success();
    router.dismiss();
    router.push({
      pathname: '/success/[id]',
      params: { id: cause.id, gift: contribution.id, completed: completed ? '1' : '0' },
    });
  }

  return (
    <View style={[styles.sheet, { paddingBottom: insets.bottom + space.md }]}>
      <View style={{ gap: 4 }}>
        <Txt variant="micro">Give to</Txt>
        <Txt variant="headline" numberOfLines={2}>
          {cause.title}
        </Txt>
      </View>

      {options.length > 1 ? (
        <View style={styles.options}>
          {options.map((p) => (
            <Amount key={p} value={p} active={amount === p} onPress={() => choose(p)} />
          ))}
        </View>
      ) : null}

      {canComplete ? (
        <PressableScale
          scaleTo={0.98}
          onPress={() => {
            tap();
            choose(left);
          }}
          accessibilityRole="button"
          accessibilityState={{ selected: completes }}
          style={[styles.complete, completes && styles.completeActive]}>
          <View style={[styles.radio, completes && styles.radioOn]}>
            {completes ? <Icon name="checkmark" size={12} color={color.ink} weight="heavy" /> : null}
          </View>
          <View style={{ flex: 1 }}>
            <Txt variant="bodyStrong">Complete this cause</Txt>
            <Txt variant="caption">Cover the last {money(left)} and it’s fully funded today.</Txt>
          </View>
          <Txt variant="number" style={{ fontSize: 20 }}>
            {money(left)}
          </Txt>
        </PressableScale>
      ) : null}

      {options.length === 1 ? (
        <Pressable
          onPress={() => {
            tap();
            choose(amount === options[0] ? left : options[0]);
          }}
          accessibilityRole="button"
          style={styles.altLink}>
          <Txt variant="caption" color={color.ink} style={{ fontWeight: '600', textDecorationLine: 'underline' }}>
            {amount === options[0] ? `Complete it with ${money(left)} instead` : `Or give ${money(options[0])} instead`}
          </Txt>
        </Pressable>
      ) : null}

      <View style={styles.meterCard}>
        <GiftMeter raised={cause.raised} goal={cause.goal} gift={amount} />
        <Txt variant="caption" color={color.ink2}>
          {completes
            ? 'Your gift closes the goal. The nonprofit buys the items and posts proof.'
            : covers
              ? `${money(amount)} covers the ${covers.label.toLowerCase()}.`
              : 'Every dollar goes to the items on the list.'}
        </Txt>
      </View>

      {error ? (
        <Animated.View entering={FadeIn} style={styles.error}>
          <Icon name="exclamationmark.circle.fill" size={16} color={color.error} />
          <Txt variant="caption" color={color.error} style={{ flex: 1 }}>
            {error}
          </Txt>
        </Animated.View>
      ) : null}

      <View style={{ flex: 1 }} />

      <Button
        label={
          error
            ? `Try again · ${money(amount)}`
            : completes
              ? `Complete it · ${money(amount)}`
              : `Give ${money(amount)}`
        }
        kind={completes ? 'sun' : 'primary'}
        loading={busy}
        onPress={give}
        accessibilityHint="Opens the RevenueCat test purchase sheet"
      />
      <View style={styles.rail}>
        <Icon name="lock.fill" size={11} color={color.ink3} />
        <Txt variant="caption" color={color.ink3} align="center">
          {revenueCatEnabled()
            ? `RevenueCat ${isTestStoreKey() ? 'Test Store' : 'sandbox'} · no real money moves`
            : 'Offline demo · RevenueCat key not configured · no money moves'}
        </Txt>
      </View>
    </View>
  );
}

function Amount({ value, active, onPress }: { value: number; active: boolean; onPress: () => void }) {
  // A small pop when an amount becomes the chosen one.
  const pop = useSharedValue(1);
  useEffect(() => {
    if (active) pop.set(withSequence(withSpring(1.05, { damping: 12, stiffness: 420 }), withSpring(1)));
  }, [active, pop]);
  const popStyle = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));

  return (
    <Animated.View style={[styles.amountSlot, popStyle]}>
      <PressableScale
        scaleTo={0.94}
        onPress={() => {
          tap();
          onPress();
        }}
        accessibilityRole="button"
        accessibilityLabel={`Give ${money(value)}`}
        accessibilityState={{ selected: active }}
        style={[styles.amount, active && styles.amountActive]}>
        <Txt variant="bigNumber" color={active ? color.white : color.ink} style={{ fontSize: 34, lineHeight: 38 }}>
          {money(value)}
        </Txt>
      </PressableScale>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1, padding: space.lg, paddingTop: space.xl, gap: space.md, backgroundColor: color.paper },
  options: { flexDirection: 'row', gap: 10 },
  amountSlot: { flex: 1 },
  amount: {
    height: 84,
    borderRadius: radius.lg,
    backgroundColor: color.card,
    borderWidth: 1,
    borderColor: color.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountActive: { backgroundColor: color.ink, borderColor: color.ink },
  complete: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: space.md,
    borderRadius: radius.lg,
    backgroundColor: color.card,
    borderWidth: 1.5,
    borderColor: color.line,
  },
  completeActive: { borderColor: color.sun, backgroundColor: color.sunSoft },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: color.lineStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: { backgroundColor: color.sun, borderColor: color.sun },
  altLink: { alignSelf: 'center', paddingVertical: 2 },
  meterCard: { gap: 12, padding: space.md, borderRadius: radius.lg, backgroundColor: color.card },
  error: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    padding: space.sm,
    borderRadius: radius.md,
    backgroundColor: color.errorSoft,
  },
  rail: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
});
