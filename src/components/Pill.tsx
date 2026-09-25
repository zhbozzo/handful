import { StyleSheet, View, type ViewStyle } from 'react-native';

import { color, radius } from '@/theme/tokens';

import { Icon } from './Icon';
import { Txt } from './Txt';

type Tone = 'neutral' | 'sun' | 'leaf' | 'shield' | 'ink' | 'demo';

const tones: Record<Tone, { bg: string; fg: string; border?: string }> = {
  neutral: { bg: color.paperDeep, fg: color.ink2 },
  sun: { bg: color.sunSoft, fg: color.sunDeep },
  leaf: { bg: color.leafSoft, fg: color.leaf },
  shield: { bg: color.shieldSoft, fg: color.shield },
  ink: { bg: color.ink, fg: color.white },
  demo: { bg: 'transparent', fg: color.ink2, border: color.lineStrong },
};

type Props = { label: string; tone?: Tone; symbol?: string; style?: ViewStyle; small?: boolean };

export function Pill({ label, tone = 'neutral', symbol, style, small }: Props) {
  const t = tones[tone];
  return (
    <View
      style={[
        styles.pill,
        small && styles.small,
        { backgroundColor: t.bg },
        t.border ? { borderWidth: StyleSheet.hairlineWidth * 2, borderColor: t.border } : null,
        style,
      ]}>
      {symbol ? <Icon name={symbol} size={small ? 10 : 12} color={t.fg} weight="bold" /> : null}
      <Txt variant="micro" color={t.fg} style={small ? { fontSize: 10, letterSpacing: 0.6 } : null}>
        {label}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  small: { paddingHorizontal: 8, paddingVertical: 3, gap: 4 },
});
