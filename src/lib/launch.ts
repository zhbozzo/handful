/**
 * The launch handoff. While the launch animation is on screen the real header wordmark stays
 * hidden and reports where it sits, so the animated one can land exactly on its spot and
 * take its place. Screens behind rise into place with `useLaunchRise`.
 */
import { useSyncExternalStore } from 'react';
import { interpolate, makeMutable, useAnimatedStyle } from 'react-native-reanimated';

let launching = true;
const listeners = new Set<() => void>();

export function setLaunching(value: boolean) {
  if (launching === value) return;
  launching = value;
  listeners.forEach((l) => l());
}

export const useLaunching = () =>
  useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => launching,
  );

/** 0 → 1 while the logo flies into the header. */
export const launchProgress = makeMutable(0);

export type LaunchTarget = { x: number; y: number; width: number; height: number };

/** On-screen frame of each header wordmark, keyed by its size (home 30, onboarding 26). */
export const launchTargets = makeMutable<Record<number, LaunchTarget>>({});

const reported: Record<number, LaunchTarget> = {};

export function reportLaunchTarget(size: number, target: LaunchTarget) {
  if (!launching || target.width <= 0) return;
  // Kept on this side: reading the shared value back here can lag behind a write made a moment ago.
  reported[size] = target;
  launchTargets.set({ ...reported });
}

/**
 * Content that settles into place as the launch animation hands over. Transforms stay inside
 * the screen: moving the navigator itself would throw off its safe-area insets.
 */
export function useLaunchRise(rise: number, { fadeFrom }: { fadeFrom?: number } = {}) {
  return useAnimatedStyle(() => {
    const p = launchProgress.get();
    return {
      // Content the logo flies across can wait to fade in until it has passed.
      opacity: fadeFrom === undefined ? 1 : interpolate(p, [fadeFrom, 1], [0, 1], 'clamp'),
      transform: [{ translateY: interpolate(p, [0.25, 1], [rise, 0], 'clamp') }],
    };
  });
}
