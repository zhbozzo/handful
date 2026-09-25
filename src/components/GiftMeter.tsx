import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { money } from '@/lib/format';
import { color } from '@/theme/tokens';

import { CountUp } from './CountUp';
import { Icon } from './Icon';
import { Txt } from './Txt';

type Props = { raised: number; goal: number; gift: number };

/**
 * What the cause looks like after your gift, before you commit:
 * what others already gave, your share highlighted, and what would still be left.
 */
export function GiftMeter({ raised, goal, gift }: Props) {
  const raisedPct = Math.min(1, raised / goal);
  const giftPct = Math.min(1 - raisedPct, gift / goal);
  const after = Math.min(goal, raised + gift);
  const left = goal - after;
  const completes = left <= 0;

  const share = useSharedValue(0);
  const glow = useSharedValue(0.85);
  useEffect(() => {
    share.set(withSpring(giftPct, { damping: 16, stiffness: 140 }));
  }, [giftPct, share]);
  useEffect(() => {
    glow.set(
      withRepeat(
        withSequence(
          withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }),
          withTiming(0.8, { duration: 900 }),
        ),
        -1,
      ),
    );
  }, [glow]);

  const shareStyle = useAnimatedStyle(() => ({ width: `${share.value * 100}%`, opacity: glow.value }));

  return (
    <View style={{ gap: 10 }} accessible accessibilityLabel={`After your gift: ${completes ? 'fully funded' : `${money(left)} to go`}`}>
      <View style={styles.track}>
        <View style={[styles.raised, { width: `${raisedPct * 100}%` }]} />
        <Animated.View style={[styles.share, shareStyle]} />
        {completes ? (
          <View style={styles.doneDot}>
            <Icon name="checkmark" size={10} color={color.white} weight="heavy" />
          </View>
        ) : null}
      </View>
      <View style={styles.legend}>
        <View style={styles.key}>
          <View style={[styles.swatch, { backgroundColor: color.sunSoft, borderColor: '#EFD6A3' }]} />
          <Txt variant="caption">{money(raised)} from others</Txt>
        </View>
        <View style={styles.key}>
          <View style={[styles.swatch, { backgroundColor: color.sun, borderColor: color.sun }]} />
          <Txt variant="caption" color={color.ink} style={{ fontWeight: '700' }}>
            +{money(gift)} you
          </Txt>
        </View>
        <View style={{ flex: 1 }} />
        {completes ? (
          <Txt variant="caption" color={color.leaf} style={{ fontWeight: '700' }}>
            Fully funded
          </Txt>
        ) : (
          <CountUp
            value={left}
            format={(n) => `${money(n)} to go`}
            variant="caption"
            color={color.sunDeep}
            style={{ fontWeight: '700' }}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 16,
    borderRadius: 8,
    backgroundColor: color.paperDeep,
    flexDirection: 'row',
    overflow: 'hidden',
    alignItems: 'center',
  },
  raised: { height: '100%', backgroundColor: '#F2D9A8' },
  share: { height: '100%', backgroundColor: color.sun, borderTopRightRadius: 8, borderBottomRightRadius: 8 },
  doneDot: {
    position: 'absolute',
    right: 3,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: color.leaf,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  key: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  swatch: { width: 10, height: 10, borderRadius: 3, borderWidth: 1 },
});
