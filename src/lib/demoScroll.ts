/**
 * Recording aid for the demo video (off unless the Simulator launches the app with `-handfulDemoScroll 1`).
 *
 * The Simulator delivers synthetic drags in bursts, so a scripted swipe scrolls in visible jumps.
 * With this flag, a few screens scroll themselves on a fixed script each time they come into focus,
 * animated on the UI thread — the same scroll a finger would make, at a steady 60 fps.
 */
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';
import { Platform, Settings } from 'react-native';
import Animated, {
  type AnimatedRef,
  cancelAnimation,
  Easing,
  scrollTo,
  useAnimatedReaction,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { ALMOST_CARD_WIDTH } from '@/components/CauseCard';
import { space } from '@/theme/tokens';

// `1` for the main recording; `result` for the donor-sees-the-result scene (Your impact stays put).
// Only reachable through a Simulator launch argument, so it also works in a production-mode JS bundle,
// which is what the video is recorded with (dev-mode React renders too slowly for smooth transitions).
const SCENE: string | undefined = Platform.OS === 'ios' ? Settings.get('handfulDemoScroll') : undefined;
const ENABLED = SCENE === '1' || SCENE === 'result';

/** One move: `at` seconds after the screen gains focus, glide to `to` over `ms`. */
type Move = { at: number; to: number; ms: number };

/**
 * Heavy screens are recorded slower than real time and sped back up in the edit
 * (scripts/video/plan.json), so every frame is rendered even when the Simulator is busy.
 */
const SLOW: Record<string, number> = { home: 3, 'home-carousel': 3, impact: 3, proof: 3 };

const CARD = ALMOST_CARD_WIDTH + space.sm;

/** One list of moves per visit (the first focus of a tab screen happens at launch). */
const MAIN: Record<string, Move[][]> = {
  'home-carousel': [
    [],
    [
      { at: 1.2, to: CARD, ms: 800 },
      { at: 2.9, to: 0, ms: 800 },
    ],
  ],
  home: [
    [],
    [
      { at: 4.5, to: 430, ms: 1200 },
      { at: 6.9, to: 0, ms: 1000 },
    ],
  ],
  cause: [
    [
      { at: 1.8, to: 640, ms: 1300 },
      { at: 5.0, to: 1260, ms: 1200 },
    ],
  ],
  impact: [[{ at: 1.5, to: 320, ms: 1200 }]],
  proof: [[{ at: 2.2, to: 690, ms: 1300 }]],
};

const RESULT: Record<string, Move[][]> = { impact: [[]], proof: MAIN.proof };
const SCRIPTS = SCENE === 'result' ? RESULT : MAIN;

export function useDemoScroll(ref: AnimatedRef<Animated.ScrollView>, key: string, horizontal = false) {
  const pos = useSharedValue(0);
  const active = useSharedValue(0);
  const visits = useRef(0);

  useAnimatedReaction(
    () => pos.get(),
    (v) => {
      if (active.get()) scrollTo(ref, horizontal ? v : 0, horizontal ? 0 : v, false);
    },
  );

  useFocusEffect(
    useCallback(() => {
      if (!ENABLED) return;
      const moves = SCRIPTS[key]?.[visits.current++];
      if (!moves?.length) return;
      const slow = SLOW[key] ?? 1;
      let t = 0;
      const steps = moves.map((m) => {
        const step = withDelay(
          Math.max(0, m.at - t) * 1000 * slow,
          withTiming(m.to, { duration: m.ms * slow, easing: Easing.inOut(Easing.cubic) }),
        );
        t = m.at + m.ms / 1000;
        return step;
      });
      active.set(1);
      pos.set(withSequence(...steps));
      return () => {
        cancelAnimation(pos);
        active.set(0);
      };
    }, [key, pos, active]),
  );
}
