import { View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { color } from '@/theme/tokens';

import { Txt } from './Txt';

/** The Handful mark: open hands holding something small and warm. */
export function Mark({ size = 28, cup = color.ink, sun = color.sun }: { size?: number; cup?: string; sun?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Path d="M17 47 A33 33 0 0 0 83 47" stroke={cup} strokeWidth={11} strokeLinecap="round" fill="none" />
      <Circle cx={50} cy={40} r={13} fill={sun} />
    </Svg>
  );
}

export function Wordmark({ size = 30 }: { size?: number }) {
  return (
    <View
      style={{ flexDirection: 'row', alignItems: 'center', gap: size * 0.2 }}
      accessibilityRole="header"
      accessibilityLabel="Handful">
      <Mark size={size * 0.95} />
      <Txt variant="title" style={{ fontSize: size, lineHeight: size * 1.1, letterSpacing: -0.4 }}>
        handful
      </Txt>
    </View>
  );
}
