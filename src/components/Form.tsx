import { useEffect } from 'react';
import {
  Pressable,
  type StyleProp,
  StyleSheet,
  TextInput,
  type TextInputProps,
  View,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  FadeInRight,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { tap } from '@/lib/haptics';
import { color, font, radius, space } from '@/theme/tokens';

import { Icon } from './Icon';
import { Txt } from './Txt';

export function FlowHeader({
  step,
  total,
  title,
  onClose,
  onBack,
}: {
  step: number;
  total: number;
  title: string;
  onClose: () => void;
  onBack?: () => void;
}) {
  return (
    <View style={{ gap: space.md }}>
      <View style={styles.headerRow}>
        {onBack ? (
          <Pressable
            onPress={onBack}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Previous step"
            style={styles.iconBtn}>
            <Icon name="chevron.left" size={16} color={color.ink} weight="bold" />
          </Pressable>
        ) : (
          <View style={[styles.iconBtn, { backgroundColor: 'transparent' }]} />
        )}
        <View style={styles.steps}>
          {Array.from({ length: total }).map((_, i) => (
            <Segment key={i} on={i <= step} />
          ))}
        </View>
        <Pressable
          onPress={onClose}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Close"
          style={styles.iconBtn}>
          <Icon name="xmark" size={15} color={color.ink} weight="bold" />
        </Pressable>
      </View>
      <Animated.View key={title} entering={FadeInRight.duration(280)} style={{ gap: 2 }}>
        <Txt variant="micro">
          Step {step + 1} of {total}
        </Txt>
        <Txt variant="title">{title}</Txt>
      </Animated.View>
    </View>
  );
}

/** A progress segment that fills from the left when its step is reached. */
function Segment({ on }: { on: boolean }) {
  const v = useSharedValue(on ? 1 : 0);
  useEffect(() => {
    v.set(withTiming(on ? 1 : 0, { duration: 420, easing: Easing.out(Easing.cubic) }));
  }, [on, v]);
  const fill = useAnimatedStyle(() => ({ width: `${v.value * 100}%` }));
  return (
    <View style={styles.step}>
      <Animated.View style={[styles.stepFill, fill]} />
    </View>
  );
}

/** Each step's content slides in a little from the right. */
export function StepIn({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <Animated.View entering={FadeInRight.duration(300)} style={style}>
      {children}
    </Animated.View>
  );
}

export function Field({ label, hint, style, ...props }: TextInputProps & { label: string; hint?: string }) {
  return (
    <View style={{ gap: 6 }}>
      <Txt variant="caption" color={color.ink} style={{ fontWeight: '600' }}>
        {label}
      </Txt>
      <TextInput
        placeholderTextColor={color.ink3}
        // Multiline fields here are short notes: Return closes the keyboard instead of adding a line.
        returnKeyType={props.multiline ? 'done' : props.returnKeyType}
        submitBehavior={props.multiline ? 'blurAndSubmit' : props.submitBehavior}
        {...props}
        style={[styles.input, props.multiline && styles.multiline, style]}
      />
      {hint ? (
        <Txt variant="caption" color={color.ink3}>
          {hint}
        </Txt>
      ) : null}
    </View>
  );
}

export function Check({
  checked,
  onToggle,
  label,
  detail,
}: {
  checked: boolean;
  onToggle: () => void;
  label: string;
  detail?: string;
}) {
  return (
    <Pressable
      onPress={() => {
        tap();
        onToggle();
      }}
      style={styles.check}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}>
      <View style={[styles.box, checked && styles.boxOn]}>
        {checked ? <Icon name="checkmark" size={13} color={color.white} weight="heavy" /> : null}
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Txt variant="bodyStrong">{label}</Txt>
        {detail ? (
          <Txt variant="caption" style={{ fontSize: 12, lineHeight: 16 }}>
            {detail}
          </Txt>
        ) : null}
      </View>
    </Pressable>
  );
}

/**
 * One confirmation for several commitments: a single tap confirms them all,
 * and each line checks off in turn so it's clear what was agreed to.
 */
export function ConfirmAll({
  checked,
  onToggle,
  title,
  lines,
}: {
  checked: boolean;
  onToggle: () => void;
  title: string;
  lines: string[];
}) {
  return (
    <Pressable
      onPress={() => {
        tap();
        onToggle();
      }}
      style={[styles.confirm, checked && styles.confirmOn]}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={`${title} ${lines.join('. ')}`}>
      <View style={styles.confirmHead}>
        <Txt variant="bodyStrong" style={{ flex: 1 }}>
          {title}
        </Txt>
        <View style={[styles.box, checked && styles.boxOn, { marginTop: 0 }]}>
          {checked ? <Icon name="checkmark" size={13} color={color.white} weight="heavy" /> : null}
        </View>
      </View>
      {lines.map((line, i) => (
        <ConfirmLine key={line} text={line} on={checked} delay={i * 90} />
      ))}
    </Pressable>
  );
}

function ConfirmLine({ text, on, delay }: { text: string; on: boolean; delay: number }) {
  const v = useSharedValue(on ? 1 : 0);
  useEffect(() => {
    v.set(withDelay(on ? delay : 0, withTiming(on ? 1 : 0, { duration: 220 })));
  }, [on, delay, v]);
  const dot = useAnimatedStyle(() => ({ opacity: v.value, transform: [{ scale: 0.6 + 0.4 * v.value }] }));
  return (
    <View style={styles.confirmLine}>
      <View style={styles.confirmDot}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.confirmDotOn, dot]}>
          <Icon name="checkmark" size={9} color={color.white} weight="heavy" />
        </Animated.View>
      </View>
      <Txt variant="caption" color={color.ink2} style={{ flex: 1, fontSize: 12, lineHeight: 16 }}>
        {text}
      </Txt>
    </View>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string; symbol?: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.segment}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => {
              tap();
              onChange(o.value);
            }}
            style={[styles.segmentItem, on && styles.segmentOn]}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}>
            {o.symbol ? <Icon name={o.symbol} size={14} color={on ? color.white : color.ink2} /> : null}
            <Txt variant="caption" color={on ? color.white : color.ink} style={{ fontWeight: '600' }}>
              {o.label}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.card,
  },
  steps: { flex: 1, flexDirection: 'row', gap: 4 },
  step: { flex: 1, height: 4, borderRadius: 2, backgroundColor: color.line, overflow: 'hidden' },
  stepFill: { height: '100%', borderRadius: 2, backgroundColor: color.ink },
  input: {
    minHeight: 50,
    borderRadius: radius.md,
    backgroundColor: color.card,
    borderWidth: 1,
    borderColor: color.line,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: font.medium,
    color: color.ink,
  },
  multiline: { minHeight: 120, textAlignVertical: 'top' },
  check: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', paddingVertical: 4 },
  box: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: color.lineStrong,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  boxOn: { backgroundColor: color.leaf, borderColor: color.leaf },
  confirm: {
    paddingHorizontal: space.md,
    paddingVertical: 12,
    gap: 7,
    borderRadius: radius.lg,
    backgroundColor: color.card,
    borderWidth: 1.5,
    borderColor: color.line,
  },
  confirmOn: { borderColor: color.leaf, backgroundColor: '#F4FAF6' },
  confirmHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  confirmLine: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  confirmDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: color.lineStrong,
    overflow: 'hidden',
  },
  confirmDotOn: { backgroundColor: color.leaf, alignItems: 'center', justifyContent: 'center' },
  segment: { flexDirection: 'row', gap: 8 },
  segmentItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: color.card,
    borderWidth: 1,
    borderColor: color.line,
  },
  segmentOn: { backgroundColor: color.ink, borderColor: color.ink },
});
