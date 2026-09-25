import { router, useLocalSearchParams } from 'expo-router';
import { Asset } from 'expo-asset';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { CoverThumb } from '@/components/CoverArt';
import { Check, Field, FlowHeader } from '@/components/Form';
import { Icon } from '@/components/Icon';
import { ShieldReview } from '@/components/ShieldReview';
import { Txt } from '@/components/Txt';
import { orgById } from '@/data/seed';
import { money } from '@/lib/format';
import { success } from '@/lib/haptics';
import { notifyDelivered } from '@/lib/notifications';
import { cameraAvailable, pickFromLibrary, type PickedPhoto, takePhoto } from '@/lib/photos';
import type { PhotoReport } from '@/lib/privacy';
import { useCause, useStore } from '@/store/useStore';
import { color, font, radius, space } from '@/theme/tokens';

const TITLES = ['Receipt', 'Delivery photo', 'Note & post'];

export default function PostProof() {
  const { id, devPhoto, auto, step: devStep } = useLocalSearchParams<{
    id: string;
    devPhoto?: string;
    auto?: string;
    step?: string;
  }>();
  const cause = useCause(id);
  const postProof = useStore((s) => s.postProof);
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState(__DEV__ && devStep ? Number(devStep) : 0);
  // A new step starts at the top, with no leftover scroll momentum that would swallow the next tap.
  const scrollRef = useRef<ScrollView>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [step]);
  const [store, setStore] = useState('Neighborhood supermarket');
  const [lines, setLines] = useState(() =>
    (cause?.items ?? []).map((i) => ({
      id: i.id,
      label: i.label,
      amount: (i.amount - (i.amount >= 5 ? 0.3 : 0.1)).toFixed(2),
    })),
  );
  const [photo, setPhoto] = useState<PickedPhoto | null>(null);

  // Dev/QA only: ?devPhoto=1 (or =tent) opens the photo step with a bundled demo photo (no picker taps).
  useEffect(() => {
    if (!__DEV__ || !devPhoto) return;
    const source =
      devPhoto === 'tent'
        ? require('@/assets/demo/tent-ai-generated.jpg')
        : require('@/assets/demo/delivery-with-gps.jpg');
    Asset.fromModule(source)
      .downloadAsync()
      .then((a) => {
        setStep(1);
        setPhoto({ uri: a.localUri ?? a.uri, width: a.width ?? 2000, height: a.height ?? 1333, hasGPS: true });
      });
  }, [devPhoto]);
  const [safe, setSafe] = useState<{ uri: string; report: PhotoReport } | null>(null);
  const [note, setNote] = useState('Delivered today — everything on the list. Thank you to everyone who chipped in.');
  const [confirmed, setConfirmed] = useState(false);
  const [posted, setPosted] = useState(false);

  if (!cause) return null;

  const org = orgById(cause.orgId);
  const spent = lines.reduce((s, l) => s + (Number(l.amount) || 0), 0);
  const leftover = cause.raised - spent;
  const canNext = [
    spent > 0 && spent <= cause.raised + 0.001 && store.trim().length > 1,
    !!safe,
    note.trim().length > 5 && confirmed,
  ][step];

  async function choose(fromCamera: boolean) {
    const p = fromCamera ? await takePhoto() : await pickFromLibrary();
    if (p) {
      setSafe(null);
      setPhoto(p);
    }
  }

  function post() {
    if (!cause) return;
    postProof(cause.id, {
      photoUri: safe?.uri,
      privacy: safe?.report ?? { facesBlurred: 0, textBlurred: 0, locationRemoved: true },
      store: store.trim(),
      receipt: lines.map((l) => ({ label: l.label, amount: Math.round((Number(l.amount) || 0) * 100) / 100 })),
      note: note.trim(),
    });
    success();
    const gave = useStore.getState().contributions.some((c) => c.causeId === cause.id);
    if (gave) notifyDelivered(cause.id, cause.title);
    setPosted(true);
  }

  if (posted) {
    return (
      <View
        style={[
          styles.screen,
          styles.done,
          { paddingTop: insets.top + space.xxl, paddingBottom: insets.bottom + space.lg },
        ]}>
        <Animated.View entering={ZoomIn.springify().damping(12)} style={styles.doneBadge}>
          <Icon name="checkmark.seal.fill" size={44} color={color.white} />
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(200)} style={{ gap: space.sm, alignItems: 'center' }}>
          <Txt variant="display" align="center">
            Proof posted.
          </Txt>
          <Txt variant="callout" align="center" style={{ maxWidth: 310 }}>
            Every donor to “{cause.title}” now sees the receipt, your note and the protected photo.
          </Txt>
        </Animated.View>
        <View style={{ flex: 1 }} />
        <View style={{ alignSelf: 'stretch', gap: 10 }}>
          <Button
            label="See what donors see"
            kind="leaf"
            onPress={() => {
              router.back();
              router.push(`/proof/${cause.id}`);
            }}
          />
          <Button label="Back to studio" kind="secondary" onPress={() => router.back()} />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior="padding" style={styles.screen}>
      <ScrollView
        ref={scrollRef}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        contentContainerStyle={{
          paddingTop: insets.top + space.sm,
          paddingHorizontal: space.lg,
          paddingBottom: space.xl,
          gap: space.xl,
        }}>
        <FlowHeader
          step={step}
          total={TITLES.length}
          title={TITLES[step]}
          onClose={() => router.back()}
          onBack={step > 0 ? () => setStep(step - 1) : undefined}
        />

        <View style={styles.causeRow}>
          <CoverThumb cause={cause} size={44} />
          <View style={{ flex: 1 }}>
            <Txt variant="bodyStrong" numberOfLines={1}>
              {cause.title}
            </Txt>
            <Txt variant="caption">
              {org.name} · {money(cause.raised)} raised
            </Txt>
          </View>
        </View>

        {step === 0 ? (
          <View style={{ gap: space.md }}>
            <Field label="Where did you buy it?" value={store} onChangeText={setStore} maxLength={40} />
            <View style={styles.card}>
              {lines.map((l, i) => (
                <View key={l.id} style={[styles.line, i > 0 && styles.lineBorder]}>
                  <Txt variant="body" style={{ flex: 1 }}>
                    {l.label}
                  </Txt>
                  <Txt variant="number" color={color.ink3}>
                    $
                  </Txt>
                  <TextInput
                    value={l.amount}
                    onChangeText={(t) =>
                      setLines(lines.map((x) => (x.id === l.id ? { ...x, amount: t.replace(/[^0-9.]/g, '') } : x)))
                    }
                    keyboardType="decimal-pad"
                    style={styles.amount}
                  />
                </View>
              ))}
            </View>
            <View style={styles.sum}>
              <Txt variant="callout" style={{ flex: 1 }}>
                Spent {money(Math.round(spent * 100) / 100)} of {money(cause.raised)}
              </Txt>
              {leftover > 0.009 ? (
                <Txt variant="caption" color={color.leaf} style={{ fontWeight: '700' }}>
                  {money(Math.round(leftover * 100) / 100)} → next cause
                </Txt>
              ) : null}
            </View>
            <Txt variant="caption" color={color.ink3}>
              In production the receipt photo is attached and checked. This demo records the line items.
            </Txt>
          </View>
        ) : null}

        {step === 1 ? (
          <View style={{ gap: space.lg }}>
            {photo ? (
              <ShieldReview
                key={photo.uri}
                uri={photo.uri}
                width={photo.width}
                height={photo.height}
                pickerHasGPS={photo.hasGPS}
                onRetake={() => setPhoto(null)}
                autoProtectMs={__DEV__ && auto ? Number(auto) : undefined}
                onDone={(out) => {
                  setSafe(out);
                  setPhoto(null);
                  setStep(2);
                }}
              />
            ) : (
              <>
                <Txt variant="callout">
                  A photo of the delivery: the items, hands, a bag handed over. Privacy Shield blurs faces and removes
                  location before anyone else sees it.
                </Txt>
                {safe ? (
                  <View style={styles.safeRow}>
                    <Icon name="checkmark.shield.fill" size={20} color={color.leaf} />
                    <Txt variant="bodyStrong" style={{ flex: 1 }}>
                      Protected photo ready
                    </Txt>
                  </View>
                ) : null}
                <Button
                  label="Choose delivery photo"
                  kind="shield"
                  symbol="photo.on.rectangle"
                  onPress={() => choose(false)}
                />
                {cameraAvailable() ? (
                  <Button label="Take a photo" kind="secondary" symbol="camera.fill" onPress={() => choose(true)} />
                ) : null}
              </>
            )}
          </View>
        ) : null}

        {step === 2 ? (
          <View style={{ gap: space.lg }}>
            <Field
              label="Note to donors"
              value={note}
              onChangeText={setNote}
              multiline
              maxLength={200}
              hint="Short and factual. Donors read this with the receipt."
            />
            <Check
              checked={confirmed}
              onToggle={() => setConfirmed(!confirmed)}
              label="Delivered as described"
              detail="The items on the receipt reached the person or family this cause was for."
            />
          </View>
        ) : null}
      </ScrollView>

      {/* Keeps scrolled content from running under the status bar / Dynamic Island. */}
      <View pointerEvents="none" style={[styles.statusFade, { height: insets.top }]} />

      {step !== 1 || !photo ? (
        <View style={[styles.footer, { paddingBottom: insets.bottom + space.sm }]}>
          {step === 2 ? (
            <Button
              label="Post proof to donors"
              kind="leaf"
              symbol="paperplane.fill"
              disabled={!canNext}
              onPress={post}
            />
          ) : (
            <Button label="Continue" disabled={!canNext} onPress={() => setStep(step + 1)} />
          )}
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.paper },
  done: { alignItems: 'center', paddingHorizontal: space.lg, gap: space.lg },
  doneBadge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: color.leaf,
    alignItems: 'center',
    justifyContent: 'center',
  },
  causeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: space.sm,
    borderRadius: radius.lg,
    backgroundColor: color.card,
  },
  card: { backgroundColor: color.card, borderRadius: radius.lg, paddingHorizontal: space.md },
  line: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10 },
  lineBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: color.line },
  amount: {
    width: 72,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: color.paper,
    paddingHorizontal: 10,
    textAlign: 'right',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: font.text,
    color: color.ink,
  },
  sum: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4 },
  safeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: space.md,
    borderRadius: radius.lg,
    backgroundColor: color.leafSoft,
  },
  footer: { paddingHorizontal: space.lg, paddingTop: space.sm, backgroundColor: color.paper },
  statusFade: { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: color.paper },
});
