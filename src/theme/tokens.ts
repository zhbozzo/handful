import { Platform } from 'react-native';

/**
 * Handful design tokens.
 *
 * Paper + ink with one warm accent. Sun is progress and action,
 * leaf is trust (verified, delivered), shield is privacy.
 * Red is reserved for errors — never for urgency or guilt.
 */
export const color = {
  paper: '#F6F3EC',
  paperDeep: '#EFEAE0',
  card: '#FFFFFF',
  ink: '#17140F',
  ink2: '#5C564B',
  ink3: '#8F887B',
  line: '#E6E0D3',
  lineStrong: '#D6CEBE',

  sun: '#F4A62A',
  sunSoft: '#FCEBC8',
  sunDeep: '#A8620A',

  leaf: '#1D6B4E',
  leafSoft: '#DCEEE4',

  shield: '#4B3FD1',
  shieldSoft: '#E8E5FB',

  error: '#B4412C',
  errorSoft: '#F7E1DC',

  white: '#FFFFFF',
  overlay: 'rgba(23,20,15,0.55)',
} as const;

export const space = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

/**
 * One family for everything — words and numbers — so the app reads as one voice.
 * Figtree is loaded per weight, so a weight is a family name, not a fontWeight.
 */
export const font = {
  regular: 'Figtree_400Regular',
  medium: 'Figtree_500Medium',
  semibold: 'Figtree_600SemiBold',
  bold: 'Figtree_700Bold',
  extrabold: 'Figtree_800ExtraBold',
  mono: Platform.select({ ios: 'Menlo', default: 'monospace' }),
} as const;

const NAMED: Record<string, number> = {
  thin: 100,
  ultralight: 200,
  light: 300,
  normal: 400,
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  heavy: 800,
  black: 900,
};

/** The file to use for a given weight (custom fonts don't synthesize fontWeight reliably). */
export function fontFor(weight: string | number | undefined): string {
  const w = typeof weight === 'number' ? weight : (NAMED[weight ?? 'normal'] ?? (Number(weight) || 400));
  if (w >= 800) return font.extrabold;
  if (w >= 700) return font.bold;
  if (w >= 600) return font.semibold;
  if (w >= 500) return font.medium;
  return font.regular;
}

export const shadow = {
  card: {
    shadowColor: '#3B2F1A',
    shadowOpacity: 0.07,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  lift: {
    shadowColor: '#3B2F1A',
    shadowOpacity: 0.14,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
} as const;

export const motion = {
  quick: 180,
  base: 320,
  slow: 900,
  spring: { damping: 18, stiffness: 220, mass: 0.9 },
} as const;
