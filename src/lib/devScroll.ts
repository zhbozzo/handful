import { Platform, Settings } from 'react-native';

/** Dev-only: `-handfulScroll 800` launch argument opens scroll views pre-scrolled (for screenshots). */
export const devScroll = (): { x: number; y: number } | undefined => {
  if (!__DEV__ || Platform.OS !== 'ios') return undefined;
  const y = Number(Settings.get('handfulScroll'));
  return Number.isFinite(y) && y > 0 ? { x: 0, y } : undefined;
};
