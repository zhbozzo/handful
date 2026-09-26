import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { interpolate, type SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { color, shadow } from '@/theme/tokens';

import { Icon } from './Icon';
import { Txt } from './Txt';

type Props = {
  scrollY: SharedValue<number>;
  title: string;
  /** Scroll offset where the bar is fully visible. */
  showAt: number;
  /** Optional share action on the right. */
  onShare?: () => void;
};

/** Floating back button that grows into a blurred title bar as content scrolls under it. */
export function ScrollHeader({ scrollY, title, showAt, onShare }: Props) {
  const insets = useSafeAreaInsets();
  const bar = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [showAt - 80, showAt], [0, 1], 'clamp'),
  }));
  const titleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [showAt - 20, showAt + 20], [0, 1], 'clamp'),
    transform: [{ translateY: interpolate(scrollY.value, [showAt - 20, showAt + 20], [6, 0], 'clamp') }],
  }));
  const chip = useAnimatedStyle(() => ({
    backgroundColor: `rgba(255,255,255,${interpolate(scrollY.value, [showAt - 80, showAt], [0.85, 0], 'clamp')})`,
  }));

  return (
    <View style={[styles.wrap, { height: insets.top + 52 }]} pointerEvents="box-none">
      <Animated.View style={[StyleSheet.absoluteFill, bar]} pointerEvents="none">
        <BlurView intensity={80} tint="systemChromeMaterialLight" style={StyleSheet.absoluteFill} />
        <View style={styles.hairline} />
      </Animated.View>
      <View style={[styles.row, { marginTop: insets.top }]} pointerEvents="box-none">
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Back" hitSlop={10}>
          <Animated.View style={[styles.back, chip]}>
            <Icon name="chevron.left" size={17} color={color.ink} weight="bold" />
          </Animated.View>
        </Pressable>
        <Animated.View style={[styles.titleWrap, titleStyle]} pointerEvents="none">
          <Txt variant="heading" numberOfLines={1}>
            {title}
          </Txt>
        </Animated.View>
        {onShare ? (
          <Pressable onPress={onShare} accessibilityRole="button" accessibilityLabel="Share" hitSlop={10}>
            <Animated.View style={[styles.back, chip]}>
              <Icon name="square.and.arrow.up" size={16} color={color.ink} weight="bold" />
            </Animated.View>
          </Pressable>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', top: 0, left: 0, right: 0 },
  hairline: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: color.lineStrong,
  },
  row: { height: 52, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 8 },
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
  },
  titleWrap: { flex: 1, alignItems: 'center' },
});
