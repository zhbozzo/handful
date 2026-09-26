import { StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';

import { color, font, fontFor } from '@/theme/tokens';

export type TxtVariant =
  | 'display'
  | 'title'
  | 'headline'
  | 'heading'
  | 'body'
  | 'bodyStrong'
  | 'callout'
  | 'caption'
  | 'micro'
  | 'number'
  | 'bigNumber';

type Props = TextProps & {
  variant?: TxtVariant;
  color?: string;
  align?: TextStyle['textAlign'];
  /** The one warm word in a headline ("Give to something real."). */
  accent?: boolean;
};

export function Txt({ variant = 'body', color: c, align, accent, style, ...rest }: Props) {
  // A fontWeight passed in style picks the matching font file.
  const weight = StyleSheet.flatten(style)?.fontWeight;
  return (
    <Text
      maxFontSizeMultiplier={variant === 'display' || variant === 'title' || variant === 'bigNumber' ? 1.2 : 1.35}
      {...rest}
      style={[
        styles[variant],
        accent ? { color: color.sunDeep } : null,
        c ? { color: c } : null,
        align ? { textAlign: align } : null,
        style,
        weight ? { fontFamily: fontFor(weight), fontWeight: undefined } : null,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  display: { fontFamily: font.extrabold, fontSize: 36, lineHeight: 41, letterSpacing: -0.9, color: color.ink },
  title: { fontFamily: font.extrabold, fontSize: 30, lineHeight: 35, letterSpacing: -0.6, color: color.ink },
  headline: { fontFamily: font.bold, fontSize: 21, lineHeight: 26, letterSpacing: -0.3, color: color.ink },
  heading: { fontFamily: font.bold, fontSize: 17, lineHeight: 22, letterSpacing: 0, color: color.ink },
  body: { fontFamily: font.regular, fontSize: 16, lineHeight: 24, letterSpacing: 0, color: color.ink },
  bodyStrong: { fontFamily: font.semibold, fontSize: 16, lineHeight: 22, letterSpacing: 0, color: color.ink },
  callout: { fontFamily: font.regular, fontSize: 15, lineHeight: 22, letterSpacing: 0, color: color.ink2 },
  caption: { fontFamily: font.medium, fontSize: 13, lineHeight: 18, letterSpacing: 0, color: color.ink2 },
  micro: {
    fontFamily: font.bold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    color: color.ink3,
  },
  number: {
    fontFamily: font.bold,
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.2,
    fontVariant: ['tabular-nums'],
    color: color.ink,
  },
  bigNumber: {
    fontFamily: font.extrabold,
    fontSize: 38,
    lineHeight: 44,
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
    color: color.ink,
  },
});
