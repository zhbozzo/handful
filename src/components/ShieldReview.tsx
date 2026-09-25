import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Switch, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';

import { success, tap, warn } from '@/lib/haptics';
import { analyzePhoto, type Finding, type PhotoReport, protectPhoto, reportFor, shieldAvailable } from '@/lib/privacy';
import { color, radius, space } from '@/theme/tokens';

import { Button } from './Button';
import { Icon } from './Icon';
import { Txt } from './Txt';

export type ShieldOutput = { uri: string; report: PhotoReport };

type Props = {
  uri: string;
  width: number;
  height: number;
  pickerHasGPS?: boolean;
  onDone: (out: ShieldOutput) => void;
  onRetake: () => void;
};

const KIND_SYMBOL: Record<Finding['kind'], string> = {
  face: 'face.dashed',
  plate: 'car.fill',
  id: 'person.text.rectangle.fill',
  address: 'house.fill',
  phone: 'phone.fill',
  email: 'envelope.fill',
  document: 'doc.text.fill',
  location: 'location.slash.fill',
};

type Phase = 'scanning' | 'review' | 'protecting' | 'done' | 'error';

export function ShieldReview({ uri, width, height, pickerHasGPS, onDone, onRetake }: Props) {
  const { width: screenW } = useWindowDimensions();
  const [phase, setPhase] = useState<Phase>('scanning');
  const [findings, setFindings] = useState<Finding[]>([]);
  const [safeText, setSafeText] = useState(0);
  const [ms, setMs] = useState(0);
  const [safeUri, setSafeUri] = useState<string | null>(null);
  const [peek, setPeek] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const maxW = screenW - space.lg * 2;
  const maxH = 400;
  const ratio = width > 0 && height > 0 ? width / height : 1;
  const dispW = Math.min(maxW, maxH * ratio);
  const dispH = dispW / ratio;

  const beam = useSharedValue(0);
  useEffect(() => {
    beam.value = withRepeat(withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.quad) }), -1, true);
  }, [beam]);
  const beamStyle = useAnimatedStyle(() => ({ transform: [{ translateY: beam.value * (dispH - 60) }] }));

  useEffect(() => {
    let alive = true;
    if (!shieldAvailable()) {
      setPhase('error');
      setError('Privacy Shield runs on-device with Apple Vision, so it needs the iOS app build.');
      return;
    }
    const started = Date.now();
    analyzePhoto(uri, pickerHasGPS)
      .then(async (r) => {
        // Let the scan read as a scan, even when Vision is instant.
        const wait = Math.max(0, 1500 - (Date.now() - started));
        await new Promise((res) => setTimeout(res, wait));
        if (!alive) return;
        setFindings(r.findings);
        setSafeText(r.safeText);
        setMs(r.result.durationMs);
        setPhase('review');
        if (r.findings.some((f) => f.kind === 'face' || f.kind === 'document')) warn();
        else tap();
      })
      .catch((e) => {
        if (!alive) return;
        setPhase('error');
        setError(e?.message ?? 'Could not analyze this photo.');
      });
    return () => {
      alive = false;
    };
  }, [uri, pickerHasGPS]);

  async function protect() {
    setPhase('protecting');
    try {
      const out = await protectPhoto(uri, findings);
      setSafeUri(out.uri);
      setPhase('done');
      success();
    } catch (e) {
      setPhase('error');
      setError((e as Error)?.message ?? 'Could not protect this photo.');
    }
  }

  const toggle = (id: string) => {
    tap();
    setFindings((fs) => fs.map((f) => (f.id === id && !f.locked ? { ...f, protect: !f.protect } : f)));
  };

  const report = reportFor(findings);
  const visible = findings.filter((f) => f.box);
  const shown = phase === 'done' && safeUri && !peek ? safeUri : uri;

  return (
    <View style={{ gap: space.lg }}>
      <Pressable
        onPressIn={() => phase === 'done' && setPeek(true)}
        onPressOut={() => setPeek(false)}
        style={[styles.frame, { width: dispW, height: dispH }]}
        accessibilityLabel={phase === 'done' ? 'Protected photo. Press and hold to compare with the original.' : 'Photo being checked'}>
        <Image source={{ uri: shown }} style={StyleSheet.absoluteFill} contentFit="cover" transition={phase === 'done' ? 450 : 0} />

        {phase === 'scanning' ? (
          <>
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(75,63,209,0.12)' }]} />
            <Animated.View style={[styles.beam, beamStyle]} />
          </>
        ) : null}

        {phase === 'review' || phase === 'protecting'
          ? visible.map((f, i) => (
              <Animated.View
                key={f.id}
                entering={ZoomIn.delay(i * 90).springify().damping(14)}
                style={[
                  styles.box,
                  f.kind === 'face' ? styles.faceBox : styles.textBox,
                  !f.protect && styles.boxOff,
                  {
                    left: f.box!.x * dispW - (f.kind === 'face' ? f.box!.w * dispW * 0.15 : 3),
                    top: f.box!.y * dispH - (f.kind === 'face' ? f.box!.h * dispH * 0.15 : 3),
                    width: f.box!.w * dispW * (f.kind === 'face' ? 1.3 : 1) + (f.kind === 'face' ? 0 : 6),
                    height: f.box!.h * dispH * (f.kind === 'face' ? 1.3 : 1) + (f.kind === 'face' ? 0 : 6),
                  },
                ]}>
                <View style={[styles.boxTag, { backgroundColor: f.kind === 'face' ? color.shield : color.sunDeep }]}>
                  <Txt variant="micro" color={color.white} style={{ fontSize: 9 }}>
                    {f.label}
                  </Txt>
                </View>
              </Animated.View>
            ))
          : null}

        {phase === 'protecting' ? (
          <Animated.View entering={FadeIn} style={[StyleSheet.absoluteFill, styles.center, { backgroundColor: 'rgba(23,20,15,0.35)' }]}>
            <Txt variant="bodyStrong" color={color.white}>
              Blurring on device…
            </Txt>
          </Animated.View>
        ) : null}

        {phase === 'done' ? (
          <Animated.View entering={FadeInDown.delay(300)} style={styles.peekTag}>
            <Icon name={peek ? 'eye.fill' : 'hand.tap.fill'} size={12} color={color.ink} />
            <Txt variant="caption" style={{ fontWeight: '600' }}>
              {peek ? 'Original (only you see this)' : 'Hold to compare'}
            </Txt>
          </Animated.View>
        ) : null}
      </Pressable>

      {phase === 'scanning' ? (
        <View style={styles.statusRow}>
          <Icon name="shield.lefthalf.filled" size={18} color={color.shield} />
          <Txt variant="bodyStrong" color={color.shield}>
            Privacy Shield is checking this photo…
          </Txt>
        </View>
      ) : null}

      {phase === 'review' || phase === 'protecting' ? (
        <Animated.View entering={FadeInDown.duration(400)} style={{ gap: space.md }}>
          <View style={{ gap: 4 }}>
            <Txt variant="headline">
              {findings.length === 0
                ? 'Nothing identifying found.'
                : `${findings.length} thing${findings.length > 1 ? 's' : ''} to protect`}
            </Txt>
            <Txt variant="caption">
              Checked on this device in {ms} ms · {safeText} other text area{safeText === 1 ? '' : 's'} look safe · nothing uploaded
            </Txt>
          </View>
          {findings.length > 0 ? (
            <View style={styles.card}>
              {findings.map((f, i) => (
                <View key={f.id} style={[styles.finding, i > 0 && styles.findingBorder]}>
                  <View style={[styles.findingIcon, { backgroundColor: f.kind === 'face' || f.kind === 'location' ? color.shieldSoft : color.sunSoft }]}>
                    <Icon name={KIND_SYMBOL[f.kind]} size={16} color={f.kind === 'face' || f.kind === 'location' ? color.shield : color.sunDeep} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Txt variant="bodyStrong">{f.label}</Txt>
                    <Txt variant="caption">{f.detail}</Txt>
                  </View>
                  {f.locked ? (
                    <Icon name="lock.fill" size={14} color={color.ink3} />
                  ) : (
                    <Switch
                      value={f.protect}
                      onValueChange={() => toggle(f.id)}
                      trackColor={{ true: color.shield, false: color.line }}
                      accessibilityLabel={`Blur ${f.label}`}
                    />
                  )}
                </View>
              ))}
            </View>
          ) : null}
          <Button
            label={findings.some((f) => f.box && f.protect) ? 'Protect identity' : 'Remove metadata & continue'}
            kind="shield"
            symbol="checkmark.shield.fill"
            loading={phase === 'protecting'}
            onPress={protect}
          />
        </Animated.View>
      ) : null}

      {phase === 'done' ? (
        <Animated.View entering={FadeInDown.duration(400)} style={{ gap: space.md }}>
          <View style={styles.safeRow}>
            <Icon name="checkmark.shield.fill" size={22} color={color.leaf} />
            <View style={{ flex: 1 }}>
              <Txt variant="bodyStrong">Safe version ready</Txt>
              <Txt variant="caption">
                {[
                  report.facesBlurred ? `${report.facesBlurred} face${report.facesBlurred > 1 ? 's' : ''} blurred` : null,
                  report.textBlurred ? `${report.textBlurred} text area${report.textBlurred > 1 ? 's' : ''} hidden` : null,
                  'all metadata removed',
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </Txt>
            </View>
          </View>
          <Button label="Use protected photo" onPress={() => safeUri && onDone({ uri: safeUri, report })} />
        </Animated.View>
      ) : null}

      {phase === 'error' ? (
        <View style={{ gap: space.md }}>
          <Txt variant="callout" color={color.error}>
            {error}
          </Txt>
          <Button label="Choose another photo" kind="secondary" onPress={onRetake} />
        </View>
      ) : phase !== 'done' ? (
        <Button label="Choose another photo" kind="ghost" compact onPress={onRetake} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { alignSelf: 'center', borderRadius: radius.lg, overflow: 'hidden', backgroundColor: color.paperDeep },
  beam: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: 'rgba(75,63,209,0.18)',
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(120,110,255,0.9)',
  },
  box: { position: 'absolute', borderWidth: 2.5 },
  faceBox: { borderColor: color.shield, borderRadius: 999, backgroundColor: 'rgba(75,63,209,0.12)' },
  textBox: { borderColor: color.sunDeep, borderRadius: 6, backgroundColor: 'rgba(244,166,42,0.15)' },
  boxOff: { opacity: 0.35, borderStyle: 'dashed' },
  boxTag: { position: 'absolute', top: -20, left: -2, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 },
  center: { alignItems: 'center', justifyContent: 'center' },
  peekTag: {
    position: 'absolute',
    bottom: 10,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center' },
  card: { backgroundColor: color.card, borderRadius: radius.lg, paddingHorizontal: space.md },
  finding: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  findingBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: color.line },
  findingIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  safeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: space.md,
    borderRadius: radius.lg,
    backgroundColor: color.leafSoft,
  },
});
