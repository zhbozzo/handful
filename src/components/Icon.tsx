import { SymbolView, type SymbolWeight } from 'expo-symbols';
import { View } from 'react-native';
import type { SFSymbol } from 'sf-symbols-typescript';

import { color as palette } from '@/theme/tokens';

type Props = {
  name: string;
  size?: number;
  color?: string;
  weight?: SymbolWeight;
  hierarchical?: boolean;
};

/** SF Symbols on Apple platforms; a quiet dot elsewhere (web preview only). */
export function Icon({ name, size = 20, color = palette.ink, weight = 'semibold', hierarchical }: Props) {
  return (
    <SymbolView
      name={name as SFSymbol}
      size={size}
      tintColor={color}
      weight={weight}
      type={hierarchical ? 'hierarchical' : 'monochrome'}
      resizeMode="scaleAspectFit"
      style={{ width: size, height: size }}
      fallback={
        <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
          <View
            style={{
              width: size * 0.42,
              height: size * 0.42,
              borderRadius: size,
              backgroundColor: color,
              opacity: 0.55,
            }}
          />
        </View>
      }
    />
  );
}
