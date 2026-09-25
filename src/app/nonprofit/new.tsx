import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { CoverArt } from '@/components/CoverArt';
import { Check, Field, FlowHeader, Segmented } from '@/components/Form';
import { Icon } from '@/components/Icon';
import { OrgLine } from '@/components/OrgLine';
import { ShieldReview } from '@/components/ShieldReview';
import { Txt } from '@/components/Txt';
import { CATEGORIES, categoryById } from '@/data/categories';
import { orgById, STUDIO_ORG_ID } from '@/data/seed';
import type { Beneficiary, Cause, CategoryId, CauseItem } from '@/data/types';
import { money } from '@/lib/format';
import { success, tap } from '@/lib/haptics';
import { cameraAvailable, pickFromLibrary, type PickedPhoto, takePhoto } from '@/lib/photos';
import { checkStory } from '@/lib/privacy';
import { useStore } from '@/store/useStore';
import { color, font, radius, space } from '@/theme/tokens';

const TITLES = ['The need', 'Budget', 'Story', 'Photo', 'Consent & publish'];

type Row = { id: string; label: string; amount: string };

const EXAMPLE = {
  title: 'Winter coat + gloves',
  category: 'clothing' as CategoryId,
  beneficiary: 'individual' as Beneficiary,
  area: 'Santiago Centro',
  rows: [
    { id: 'a', label: 'Warm winter coat (second-hand)', amount: '15' },
    { id: 'b', label: 'Gloves + beanie', amount: '6' },
    { id: 'c', label: 'Thermal socks ×2', amount: '5' },
  ],
  summary:
    'A man our team has known for two years asked for a warm coat before winter gets worse. We buy it second-hand and hand it over on Friday’s round.',
};

const ROW_SYMBOLS: Partial<Record<CategoryId, string[]>> = {
  clothing: ['tshirt.fill', 'hand.raised.fill', 'snowflake'],
  food: ['fork.knife', 'cup.and.saucer.fill', 'carrot.fill'],
};

export default function NewCause() {
  const insets = useSafeAreaInsets();
  const createCause = useStore((s) => s.createCause);
  const org = orgById(STUDIO_ORG_ID);

  const [step, setStep] = useState(0);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<CategoryId>('food');
  const [beneficiary, setBeneficiary] = useState<Beneficiary>('individual');
  const [area, setArea] = useState('');
  const [rows, setRows] = useState<Row[]>([
    { id: 'r1', label: '', amount: '' },
    { id: 'r2', label: '', amount: '' },
  ]);
  const [summary, setSummary] = useState('');
  const [photo, setPhoto] = useState<PickedPhoto | null>(null);
  const [cover, setCover] = useState<string | undefined>();
  const [consent, setConsent] = useState({ consentObtained: false, noExactLocation: false, imagesReviewed: false });
  const [published, setPublished] = useState<Cause | null>(null);

  const cat = categoryById(category);
  const items: CauseItem[] = rows
    .filter((r) => r.label.trim() && Number(r.amount) > 0)
    .map((r, i) => ({
      id: r.id,
      label: r.label.trim(),
      amount: Math.round(Number(r.amount)),
      symbol: ROW_SYMBOLS[category]?.[i] ?? cat.symbol,
    }));
  const goal = items.reduce((s, i) => s + i.amount, 0);
  const issues = checkStory(`${title}. ${summary}`);

  const canNext = [
    title.trim().length >= 4,
    items.length > 0 && goal >= 3 && goal <= 100,
    summary.trim().length >= 20 && area.trim().length >= 2 && issues.length === 0,
    true,
    consent.consentObtained && consent.noExactLocation && consent.imagesReviewed,
  ][step];

  const fillExample = () => {
    tap();
    setTitle(EXAMPLE.title);
    setCategory(EXAMPLE.category);
    setBeneficiary(EXAMPLE.beneficiary);
    setArea(EXAMPLE.area);
    setRows(EXAMPLE.rows);
    setSummary(EXAMPLE.summary);
  };

  const close = () => router.back();

  function publish() {
    const cause = createCause({
      title: title.trim(),
      summary: summary.trim(),
      category,
      beneficiary,
      area: area.trim(),
      items,
      consent,
      coverUri: cover,
    });
    success();
    setPublished(cause);
  }

  async function choose(fromCamera: boolean) {
    const p = fromCamera ? await takePhoto() : await pickFromLibrary();
    if (p) {
      setCover(undefined);
      setPhoto(p);
    }
  }

  if (published) {
    return (
      <View style={[styles.screen, styles.done, { paddingTop: insets.top + space.xxl, paddingBottom: insets.bottom + space.lg }]}>
        <Animated.View entering={ZoomIn.springify().damping(12)} style={styles.doneBadge}>
          <Icon name="checkmark" size={40} color={color.white} weight="heavy" />
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(200)} style={{ gap: space.sm, alignItems: 'center' }}>
          <Txt variant="display" align="center">
            Published.
          </Txt>
          <Txt variant="callout" align="center" style={{ maxWidth: 300 }}>
            “{published.title}” is live with a {money(published.goal)} goal. Donors see the items, the budget and your
            verification.
          </Txt>
        </Animated.View>
        <View style={{ flex: 1 }} />
        <View style={{ alignSelf: 'stretch', gap: 10 }}>
          <Button
            label="View cause"
            onPress={() => {
              router.back();
              router.push(`/cause/${published.id}`);
            }}
          />
          <Button label="Back to studio" kind="secondary" onPress={close} />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior="padding" style={styles.screen}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingTop: insets.top + space.sm, paddingHorizontal: space.lg, paddingBottom: space.xl, gap: space.xl }}>
        <FlowHeader step={step} total={TITLES.length} title={TITLES[step]} onClose={close} onBack={step > 0 ? () => setStep(step - 1) : undefined} />

        {step === 0 ? (
          <Animated.View entering={FadeIn} style={{ gap: space.lg }}>
            <View style={{ gap: 8 }}>
              <Txt variant="caption" color={color.ink} style={{ fontWeight: '600' }}>
                Who is this helping?
              </Txt>
              <Segmented
                value={beneficiary}
                onChange={setBeneficiary}
                options={[
                  { value: 'individual', label: 'A person', symbol: 'person.fill' },
                  { value: 'family', label: 'A family', symbol: 'person.2.fill' },
                  { value: 'community', label: 'A group', symbol: 'person.3.fill' },
                ]}
              />
            </View>
            <View style={{ gap: 8 }}>
              <Txt variant="caption" color={color.ink} style={{ fontWeight: '600' }}>
                Category
              </Txt>
              <View style={styles.cats}>
                {CATEGORIES.map((c) => {
                  const on = c.id === category;
                  return (
                    <Pressable
                      key={c.id}
                      onPress={() => {
                        tap();
                        setCategory(c.id);
                      }}
                      style={[styles.cat, on && { backgroundColor: c.tint, borderColor: c.ink }]}
                      accessibilityRole="button"
                      accessibilityState={{ selected: on }}>
                      <Icon name={c.symbol} size={14} color={on ? c.ink : color.ink2} />
                      <Txt variant="caption" color={on ? c.ink : color.ink} style={{ fontWeight: '600' }}>
                        {c.label}
                      </Txt>
                    </Pressable>
                  );
                })}
              </View>
            </View>
            <Field label="What’s needed?" placeholder="e.g. Winter coat + gloves" value={title} onChangeText={setTitle} maxLength={48} hint="Name the help, not the person." />
            <Button label="Fill with an example" kind="ghost" compact symbol="wand.and.stars" onPress={fillExample} />
          </Animated.View>
        ) : null}

        {step === 1 ? (
          <Animated.View entering={FadeIn} style={{ gap: space.md }}>
            <Txt variant="callout">List what you’ll buy and what it costs. Donors see exactly this.</Txt>
            {rows.map((r, i) => (
              <View key={r.id} style={styles.budgetRow}>
                <TextInput
                  value={r.label}
                  onChangeText={(t) => setRows(rows.map((x) => (x.id === r.id ? { ...x, label: t } : x)))}
                  placeholder={i === 0 ? 'Item' : 'Another item'}
                  placeholderTextColor={color.ink3}
                  style={[styles.budgetInput, { flex: 1 }]}
                />
                <View style={styles.amountBox}>
                  <Txt variant="number" color={color.ink3}>
                    $
                  </Txt>
                  <TextInput
                    value={r.amount}
                    onChangeText={(t) => setRows(rows.map((x) => (x.id === r.id ? { ...x, amount: t.replace(/[^0-9]/g, '') } : x)))}
                    keyboardType="number-pad"
                    placeholder="0"
                    placeholderTextColor={color.ink3}
                    style={[styles.budgetInput, styles.amountInput]}
                    maxLength={3}
                  />
                </View>
              </View>
            ))}
            {rows.length < 5 ? (
              <Button
                label="Add item"
                kind="ghost"
                compact
                symbol="plus"
                onPress={() => setRows([...rows, { id: `r${Date.now()}`, label: '', amount: '' }])}
              />
            ) : null}
            <View style={styles.goalRow}>
              <Txt variant="bodyStrong" style={{ flex: 1 }}>
                Goal
              </Txt>
              <Txt variant="bigNumber" style={{ fontSize: 32, lineHeight: 36 }}>
                {money(goal)}
              </Txt>
            </View>
            <Txt variant="caption" color={goal > 100 ? color.error : color.ink3}>
              Keep it small: causes up to $100 get funded fastest — most are under $60.
            </Txt>
          </Animated.View>
        ) : null}

        {step === 2 ? (
          <Animated.View entering={FadeIn} style={{ gap: space.lg }}>
            <Field
              label="Short story"
              placeholder="What’s the need, and what will you do with the money?"
              value={summary}
              onChangeText={setSummary}
              multiline
              maxLength={280}
              hint={`${summary.length}/280 · describe the need, not the person`}
            />
            <Field label="General area" placeholder="Neighborhood or city" value={area} onChangeText={setArea} maxLength={40} hint="Never a street, a shelter name or where someone sleeps." />
            <View style={[styles.checkCard, issues.length ? styles.checkWarn : styles.checkOk]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Icon name={issues.length ? 'exclamationmark.shield.fill' : 'checkmark.shield.fill'} size={18} color={issues.length ? color.sunDeep : color.leaf} />
                <Txt variant="bodyStrong">{issues.length ? 'Privacy check: fix before publishing' : 'Privacy check: looks good'}</Txt>
              </View>
              {issues.length ? (
                issues.map((i) => (
                  <Txt key={i.id} variant="caption" color={color.ink}>
                    • {i.label}. {i.hint}
                  </Txt>
                ))
              ) : (
                <Txt variant="caption">No full names, exact places, phone numbers or health details found.</Txt>
              )}
            </View>
          </Animated.View>
        ) : null}

        {step === 3 ? (
          <Animated.View entering={FadeIn} style={{ gap: space.lg }}>
            {photo ? (
              <ShieldReview
                key={photo.uri}
                uri={photo.uri}
                width={photo.width}
                height={photo.height}
                pickerHasGPS={photo.hasGPS}
                onRetake={() => {
                  setPhoto(null);
                  setCover(undefined);
                }}
                onDone={(out) => {
                  setCover(out.uri);
                  setPhoto(null);
                  setStep(4);
                }}
              />
            ) : (
              <>
                <Txt variant="callout">
                  Optional. Show the items or the setting — not the person. Every photo goes through Privacy Shield on
                  this phone before it can be posted.
                </Txt>
                {cover ? <CoverArt cause={{ category, items, coverUri: cover }} height={220} /> : <CoverArt cause={{ category, items }} height={220} />}
                <Button label="Choose a photo" kind="shield" symbol="photo.on.rectangle" onPress={() => choose(false)} />
                {cameraAvailable() ? <Button label="Take a photo" kind="secondary" symbol="camera.fill" onPress={() => choose(true)} /> : null}
                <Button label={cover ? 'Continue' : 'Skip — use this illustration'} kind="ghost" onPress={() => setStep(4)} />
              </>
            )}
          </Animated.View>
        ) : null}

        {step === 4 ? (
          <Animated.View entering={FadeIn} style={{ gap: space.lg }}>
            <View style={styles.preview}>
              <CoverArt cause={{ category, items, coverUri: cover }} height={150} rounded={0} />
              <View style={{ padding: space.md, gap: 8 }}>
                <Txt variant="headline">{title}</Txt>
                <OrgLine org={org} size="sm" />
                <Txt variant="caption">
                  {money(goal)} goal · {items.length} items · {area}
                </Txt>
              </View>
            </View>
            <View style={{ gap: 4 }}>
              <Check
                checked={consent.consentObtained}
                onToggle={() => setConsent({ ...consent, consentObtained: !consent.consentObtained })}
                label="Consent obtained"
                detail="The person (or guardian) agreed to this cause being posted."
              />
              <Check
                checked={consent.noExactLocation}
                onToggle={() => setConsent({ ...consent, noExactLocation: !consent.noExactLocation })}
                label="No exact location"
                detail="Nothing here helps someone find where they live or sleep."
              />
              <Check
                checked={consent.imagesReviewed}
                onToggle={() => setConsent({ ...consent, imagesReviewed: !consent.imagesReviewed })}
                label="Images follow the dignity policy"
                detail="No identifiable faces, children or documents."
              />
            </View>
          </Animated.View>
        ) : null}
      </ScrollView>

      {step !== 3 || !photo ? (
        <View style={[styles.footer, { paddingBottom: insets.bottom + space.sm }]}>
          {step === 4 ? (
            <Button label="Publish cause" kind="sun" disabled={!canNext} onPress={publish} />
          ) : step !== 3 ? (
            <Button label="Continue" disabled={!canNext} onPress={() => setStep(step + 1)} />
          ) : null}
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.paper },
  done: { alignItems: 'center', paddingHorizontal: space.lg, gap: space.lg },
  doneBadge: { width: 96, height: 96, borderRadius: 48, backgroundColor: color.leaf, alignItems: 'center', justifyContent: 'center' },
  cats: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: color.card,
    borderWidth: 1,
    borderColor: color.line,
  },
  budgetRow: { flexDirection: 'row', gap: 8 },
  budgetInput: {
    height: 50,
    borderRadius: radius.md,
    backgroundColor: color.card,
    borderWidth: 1,
    borderColor: color.line,
    paddingHorizontal: 14,
    fontSize: 16,
    fontFamily: font.text,
    color: color.ink,
  },
  amountBox: { flexDirection: 'row', alignItems: 'center', gap: 4, width: 96 },
  amountInput: { flex: 1, textAlign: 'right', fontWeight: '700' },
  goalRow: { flexDirection: 'row', alignItems: 'center', paddingTop: space.sm, borderTopWidth: 1, borderTopColor: color.lineStrong },
  checkCard: { padding: space.md, borderRadius: radius.lg, gap: 6 },
  checkOk: { backgroundColor: color.leafSoft },
  checkWarn: { backgroundColor: color.sunSoft },
  preview: { backgroundColor: color.card, borderRadius: radius.lg, overflow: 'hidden' },
  footer: { paddingHorizontal: space.lg, paddingTop: space.sm, backgroundColor: color.paper },
});
