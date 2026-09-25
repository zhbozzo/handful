import { StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';

import { color, font } from '@/theme/tokens';

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
  italic?: boolean;
};

export function Txt({ variant = 'body', color: c, align, italic, style, ...rest }: Props) {
  return (
    <Text
      maxFontSizeMultiplier={variant === 'display' || variant === 'title' || variant === 'bigNumber' ? 1.2 : 1.35}
      {...rest}
      style={[
        styles[variant],
        italic && (variant === 'display' || variant === 'title' || variant === 'headline')
          ? { fontFamily: font.displayItalic }
          : null,
        c ? { color: c } : null,
        align ? { textAlign: align } : null,
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  display: { fontFamily: font.display, fontSize: 46, lineHeight: 48, letterSpacing: -0.6, color: color.ink },
  title: { fontFamily: font.display, fontSize: 34, lineHeight: 37, letterSpacing: -0.3, color: color.ink },
  headline: { fontFamily: font.display, fontSize: 26, lineHeight: 30, letterSpacing: -0.2, color: color.ink },
  heading: { fontFamily: font.text, fontSize: 17, lineHeight: 22, fontWeight: '600', color: color.ink },
  body: { fontFamily: font.text, fontSize: 16, lineHeight: 23, color: color.ink },
  bodyStrong: { fontFamily: font.text, fontSize: 16, lineHeight: 22, fontWeight: '600', color: color.ink },
  callout: { fontFamily: font.text, fontSize: 15, lineHeight: 21, color: color.ink2 },
  caption: { fontFamily: font.text, fontSize: 13, lineHeight: 18, color: color.ink2 },
  micro: {
    fontFamily: font.text,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: color.ink3,
  },
  number: {
    fontFamily: font.rounded,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    color: color.ink,
  },
  bigNumber: {
    fontFamily: font.display,
    fontSize: 40,
    lineHeight: 44,
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
    color: color.ink,
  },
});
