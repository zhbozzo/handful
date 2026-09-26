import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, LinearTransition, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { CoverArt } from '@/components/CoverArt';
import { ConfirmAll, Field, FlowHeader, Segmented, StepIn } from '@/components/Form';
import { Icon } from '@/components/Icon';
import { OrgLine } from '@/components/OrgLine';
import { ShieldReview } from '@/components/ShieldReview';
import { Txt } from '@/components/Txt';
import { CATEGORIES, categoryById } from '@/data/categories';
import { orgById, STUDIO_ORG_ID } from '@/data/seed';
import type { Beneficiary, Cause, CategoryId, CauseItem } from '@/data/types';
import { money } from '@/lib/format';
import { guessCategory, guessSymbol } from '@/lib/guess';
import { success, tap } from '@/lib/haptics';
import { cameraAvailable, pickFromLibrary, type PickedPhoto, takePhoto } from '@/lib/photos';
import { checkStory } from '@/lib/privacy';
import { useStore } from '@/store/useStore';
import { color, font, radius, space } from '@/theme/tokens';

const TITLES = ['The need', 'Story & photo', 'Review & publish'];

const COMMITMENTS = [
  'They (or a guardian) agreed to this being posted.',
  'Nothing reveals where they live or sleep.',
  'No identifiable faces, children or documents.',
];

type Row = { id: string; label: string; amount: string };

const EXAMPLE = {
  title: 'Winter coat + gloves',
  beneficiary: 'individual' as Beneficiary,
  area: 'Santiago Centro',
  rows: [
    { id: 'a', label: 'Winter coat', amount: '15' },
    { id: 'b', label: 'Gloves + beanie', amount: '6' },
    { id: 'c', label: 'Thermal socks ×2', amount: '5' },
  ],
  summary:
    'A man our team has known for two years asked for a warm coat before winter gets worse. We buy it second-hand and hand it over on Friday’s round.',
};

export default function NewCause() {
  const insets = useSafeAreaInsets();
  const createCause = useStore((s) => s.createCause);
  const org = orgById(STUDIO_ORG_ID);

  // Dev/QA: /nonprofit/new?step=2&example=1 opens a later step pre-filled.
  const dev = useLocalSearchParams<{ step?: string; example?: string }>();
  const [step, setStep] = useState(__DEV__ && dev.step ? Math.min(2, Number(dev.step)) : 0);
  // A new step starts at the top, with no leftover scroll momentum that would swallow the next tap.
  const scrollRef = useRef<ScrollView>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [step]);
  const [title, setTitle] = useState('');
  const [picked, setPicked] = useState<CategoryId | null>(null);
  const [beneficiary, setBeneficiary] = useState<Beneficiary>('individual');
  const [area, setArea] = useState('');
  const [rows, setRows] = useState<Row[]>([
    { id: 'r1', label: '', amount: '' },
    { id: 'r2', label: '', amount: '' },
  ]);
  const [summary, setSummary] = useState('');
  const [devFilled, setDevFilled] = useState(false);
  const [photo, setPhoto] = useState<PickedPhoto | null>(null);
  const [cover, setCover] = useState<string | undefined>();
  const [confirmed, setConfirmed] = useState(false);
  const [published, setPublished] = useState<Cause | null>(null);
  const catScroll = useRef<ScrollView>(null);
  const chipX = useRef<Partial<Record<CategoryId, number>>>({});

  // The category follows what's typed until the nonprofit picks one themselves.
  const guessed = guessCategory(title, ...rows.map((r) => r.label));
  const category: CategoryId = picked ?? guessed ?? 'food';
  const cat = categoryById(category);
  // Bring the chosen category into view, including when it was guessed from the title.
  useEffect(() => {
    const x = chipX.current[category];
    if (x !== undefined) catScroll.current?.scrollTo({ x: Math.max(0, x - space.lg - 40), animated: true });
  }, [category]);
  const items: CauseItem[] = rows
    .filter((r) => r.label.trim() && Number(r.amount) > 0)
    .map((r) => ({
      id: r.id,
      label: r.label.trim(),
      amount: Math.round(Number(r.amount)),
      symbol: guessSymbol(r.label, cat.symbol),
    }));
  const goal = items.reduce((s, i) => s + i.amount, 0);
  const issues = checkStory(`${title}. ${summary}`);

  const stepOk = [
    title.trim().length >= 4 && items.length > 0 && goal >= 3 && goal <= 100,
    summary.trim().length >= 20 && area.trim().length >= 2 && issues.length === 0,
    confirmed,
  ];
  const missing = [
    title.trim().length < 4
      ? 'Name what’s needed'
      : items.length === 0
        ? 'Add at least one item with a price'
        : goal > 100
          ? 'Keep the goal at $100 or less'
          : null,
    summary.trim().length < 20
      ? 'Write a short story (20+ characters)'
      : area.trim().length < 2
        ? 'Add a general area'
        : issues.length
          ? 'Fix the privacy check first'
          : null,
    confirmed ? null : 'Confirm the three commitments',
  ][step];

  const fill = () => {
    setTitle(EXAMPLE.title);
    setPicked(null);
    setBeneficiary(EXAMPLE.beneficiary);
    setArea(EXAMPLE.area);
    setRows(EXAMPLE.rows);
    setSummary(EXAMPLE.summary);
  };

  const close = () => router.back();

  if (__DEV__ && dev.example && !devFilled) {
    setDevFilled(true);
    fill();
  }

  function publish() {
    const cause = createCause({
      title: title.trim(),
      summary: summary.trim(),
      category,
      beneficiary,
      area: area.trim(),
      items,
      consent: { consentObtained: confirmed, noExactLocation: confirmed, imagesReviewed: confirmed },
      coverUri: cover,
    });
    success();
    setPublished(cause);
  }

  async function choose(fromCamera: boolean) {
    const p = fromCamera ? await takePhoto() : await pickFromLibrary();
    if (p) setPhoto(p);
  }

  const updateRow = (id: string, patch: Partial<Row>) =>
    setRows(rows.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  if (published) {
    return (
      <View
        style={[
          styles.screen,
          styles.done,
          { paddingTop: insets.top + space.xl, paddingBottom: insets.bottom + space.sm },
        ]}>
        <Animated.View entering={ZoomIn.springify().damping(12)} style={styles.doneBadge}>
          <Icon name="checkmark" size={34} color={color.white} weight="heavy" />
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(200)} style={{ gap: space.sm, alignItems: 'center' }}>
          <Txt variant="display" align="center">
            Published.
          </Txt>
          <Txt variant="callout" align="center" style={{ maxWidth: 300 }}>
            It’s live for donors with a {money(published.goal)} goal. You’ll post the receipt and photo once it’s
            funded.
          </Txt>
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(350).springify().damping(18)} style={{ alignSelf: 'stretch' }}>
          <Preview
            title={published.title}
            category={published.category}
            items={published.items}
            cover={published.coverUri}
            goal={published.goal}
            area={published.area}
          />
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

  const reviewing = step === 1 && !!photo;

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
          onClose={close}
          onBack={step > 0 ? () => setStep(step - 1) : undefined}
        />

        {step === 0 ? (
          <StepIn style={{ gap: space.lg }}>
            <Field
              label="What’s needed?"
              placeholder="e.g. Winter coat + gloves"
              value={title}
              onChangeText={setTitle}
              maxLength={48}
              hint="Name the help, not the person."
            />

            <View style={{ gap: 8 }}>
              <Label text="Who is it for?" />
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
              <View style={styles.labelRow}>
                <Label text="Category" />
                {!picked && guessed ? (
                  <Animated.View entering={FadeIn} style={styles.autoTag}>
                    <Icon name="sparkles" size={10} color={color.sunDeep} />
                    <Txt variant="caption" color={color.sunDeep} style={{ fontSize: 11, fontWeight: '700' }}>
                      From your title
                    </Txt>
                  </Animated.View>
                ) : null}
              </View>
              <ScrollView
                ref={catScroll}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                style={{ marginHorizontal: -space.lg }}
                contentContainerStyle={{ paddingHorizontal: space.lg, gap: 8 }}>
                {CATEGORIES.map((c) => {
                  const on = c.id === category;
                  return (
                    <Pressable
                      key={c.id}
                      onLayout={(e) => {
                        chipX.current[c.id] = e.nativeEvent.layout.x;
                      }}
                      onPress={() => {
                        tap();
                        setPicked(c.id);
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
              </ScrollView>
            </View>

            <View style={{ gap: 8 }}>
              <Label text="What it pays for" />
              <View style={styles.budget}>
                {rows.map((r, i) => (
                  <Animated.View
                    key={r.id}
                    layout={LinearTransition.springify().damping(20)}
                    entering={i > 1 ? FadeInDown.duration(220) : undefined}
                    style={[styles.budgetRow, i > 0 && styles.budgetBorder]}>
                    <View style={[styles.rowIcon, { backgroundColor: cat.tint }]}>
                      <Icon name={guessSymbol(r.label, cat.symbol)} size={15} color={cat.ink} />
                    </View>
                    <TextInput
                      value={r.label}
                      onChangeText={(t) => updateRow(r.id, { label: t })}
                      placeholder={i === 0 ? 'Item' : 'Another item'}
                      placeholderTextColor={color.ink3}
                      style={styles.itemInput}
                      returnKeyType="next"
                    />
                    <View style={styles.amountBox}>
                      <Txt variant="number" color={r.amount ? color.ink : color.ink3}>
                        $
                      </Txt>
                      <TextInput
                        value={r.amount}
                        onChangeText={(t) => updateRow(r.id, { amount: t.replace(/[^0-9]/g, '') })}
                        keyboardType="number-pad"
                        placeholder="0"
                        placeholderTextColor={color.ink3}
                        style={styles.amountInput}
                        maxLength={3}
                      />
                    </View>
                    {rows.length > 1 ? (
                      <Pressable
                        onPress={() => setRows(rows.filter((x) => x.id !== r.id))}
                        hitSlop={8}
                        accessibilityRole="button"
                        accessibilityLabel={`Remove ${r.label || 'item'}`}>
                        <Icon name="minus.circle.fill" size={18} color={color.lineStrong} />
                      </Pressable>
                    ) : null}
                  </Animated.View>
                ))}
                {rows.length < 5 ? (
                  <Pressable
                    onPress={() => {
                      tap();
                      setRows([...rows, { id: `r${Date.now()}`, label: '', amount: '' }]);
                    }}
                    style={[styles.addRow, styles.budgetBorder]}
                    accessibilityRole="button">
                    <Icon name="plus.circle.fill" size={18} color={color.sunDeep} />
                    <Txt variant="caption" color={color.sunDeep} style={{ fontWeight: '700' }}>
                      Add item
                    </Txt>
                  </Pressable>
                ) : null}
                <View style={styles.goalRow}>
                  <Txt variant="bodyStrong" style={{ flex: 1 }}>
                    Goal
                  </Txt>
                  <Txt
                    variant="number"
                    style={{ fontSize: 22, lineHeight: 28 }}
                    color={goal > 100 ? color.error : color.ink}>
                    {money(goal)}
                  </Txt>
                </View>
              </View>
              <Txt variant="caption" color={goal > 100 ? color.error : color.ink3}>
                Keep it small — causes under $60 usually fund within a day. Up to $100.
              </Txt>
            </View>

            <Pressable
              onPress={() => {
                tap();
                fill();
              }}
              style={styles.exampleLink}
              accessibilityRole="button">
              <Icon name="wand.and.stars" size={14} color={color.ink2} />
              <Txt variant="caption" color={color.ink2} style={{ fontWeight: '600' }}>
                Fill with an example
              </Txt>
            </Pressable>
          </StepIn>
        ) : null}

        {step === 1 ? (
          <StepIn style={{ gap: space.lg }}>
            {photo ? (
              <ShieldReview
                key={photo.uri}
                uri={photo.uri}
                width={photo.width}
                height={photo.height}
                pickerHasGPS={photo.hasGPS}
                onRetake={() => setPhoto(null)}
                onDone={(out) => {
                  setCover(out.uri);
                  setPhoto(null);
                }}
              />
            ) : (
              <>
                <Field
                  label="Short story"
                  placeholder="What’s the need, and what will you do with the money?"
                  value={summary}
                  onChangeText={setSummary}
                  multiline
                  maxLength={280}
                  hint={`${summary.length}/280 · describe the need, not the person`}
                />
                <Field
                  label="General area"
                  placeholder="Neighborhood or city"
                  value={area}
                  onChangeText={setArea}
                  maxLength={40}
                  hint="Never a street, a shelter name or where someone sleeps."
                />
                <Animated.View
                  layout={LinearTransition.springify().damping(20)}
                  style={[styles.checkCard, issues.length ? styles.checkWarn : styles.checkOk]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Icon
                      name={issues.length ? 'exclamationmark.shield.fill' : 'checkmark.shield.fill'}
                      size={16}
                      color={issues.length ? color.sunDeep : color.leaf}
                    />
                    <Txt variant="caption" color={color.ink} style={{ fontWeight: '700', flex: 1 }}>
                      {issues.length ? 'Privacy check: fix before publishing' : 'Privacy check: looks good'}
                    </Txt>
                  </View>
                  {issues.map((i) => (
                    <Txt key={i.id} variant="caption" color={color.ink}>
                      • {i.label}. {i.hint}
                    </Txt>
                  ))}
                </Animated.View>

                <View style={{ gap: 8 }}>
                  <View style={styles.labelRow}>
                    <Label text="Photo" />
                    <Txt variant="caption" color={color.ink3}>
                      Optional
                    </Txt>
                  </View>
                  <View style={styles.photoCard}>
                    <View style={{ width: 96 }}>
                      <CoverArt cause={{ category, items, coverUri: cover }} height={96} rounded={14} alive={false} />
                    </View>
                    <View style={{ flex: 1, gap: 8 }}>
                      <Txt variant="caption">
                        {cover
                          ? 'Protected by Privacy Shield. Faces blurred, location removed.'
                          : 'Without one, donors see this illustration of the items.'}
                      </Txt>
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <Button
                          label={cover ? 'Change' : 'Add photo'}
                          compact
                          symbol="photo.on.rectangle"
                          onPress={() => choose(false)}
                        />
                        {cameraAvailable() ? (
                          <Button
                            label="Camera"
                            kind="secondary"
                            compact
                            symbol="camera.fill"
                            onPress={() => choose(true)}
                          />
                        ) : null}
                      </View>
                    </View>
                  </View>
                </View>
              </>
            )}
          </StepIn>
        ) : null}

        {step === 2 ? (
          <StepIn style={{ gap: space.lg }}>
            <View style={{ gap: 8 }}>
              <Label text="What donors will see" />
              <Preview
                title={title.trim()}
                category={category}
                items={items}
                cover={cover}
                goal={goal}
                area={area.trim()}
                summary={summary.trim()}
                org={org}
              />
            </View>
          </StepIn>
        ) : null}
      </ScrollView>

      {/* Keeps scrolled content from running under the status bar / Dynamic Island. */}
      <View pointerEvents="none" style={[styles.statusFade, { height: insets.top }]} />

      {!reviewing ? (
        <View style={[styles.footer, { paddingBottom: insets.bottom + space.sm }]}>
          {step === 2 ? (
            <ConfirmAll
              checked={confirmed}
              onToggle={() => setConfirmed(!confirmed)}
              title="I confirm, for this cause:"
              lines={COMMITMENTS}
            />
          ) : missing ? (
            <Txt variant="caption" color={color.ink3} align="center">
              {missing}
            </Txt>
          ) : null}
          {step === 2 ? (
            <Button label="Publish cause" kind="sun" symbol="paperplane.fill" disabled={!stepOk[2]} onPress={publish} />
          ) : (
            <Button label="Continue" disabled={!stepOk[step]} onPress={() => setStep(step + 1)} />
          )}
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

function Label({ text }: { text: string }) {
  return (
    <Txt variant="caption" color={color.ink} style={{ fontWeight: '700' }}>
      {text}
    </Txt>
  );
}

/** The cause as it will appear to donors. */
function Preview({
  title,
  category,
  items,
  cover,
  goal,
  area,
  summary,
  org,
}: {
  title: string;
  category: CategoryId;
  items: CauseItem[];
  cover?: string;
  goal: number;
  area: string;
  summary?: string;
  org?: ReturnType<typeof orgById>;
}) {
  const cat = categoryById(category);
  return (
    <View style={styles.preview}>
      <CoverArt cause={{ category, items, coverUri: cover }} height={120} rounded={0} />
      <View style={{ padding: space.md, gap: 10 }}>
        <View style={styles.previewTop}>
          <View style={[styles.catPill, { backgroundColor: cat.tint }]}>
            <Icon name={cat.symbol} size={11} color={cat.ink} />
            <Txt variant="micro" color={cat.ink}>
              {cat.label}
            </Txt>
          </View>
          <Txt variant="caption" color={color.ink3}>
            {area}
          </Txt>
        </View>
        <Txt variant="headline">{title}</Txt>
        {org ? <OrgLine org={org} size="sm" /> : null}
        {summary ? (
          <Txt variant="caption" numberOfLines={2}>
            {summary}
          </Txt>
        ) : null}
        <View style={styles.previewItems}>
          {items.map((i) => (
            <View key={i.id} style={styles.previewItem}>
              <Icon name={i.symbol} size={12} color={cat.ink} />
              <Txt variant="caption" color={color.ink} style={{ flex: 1 }} numberOfLines={1}>
                {i.label}
              </Txt>
              <Txt variant="caption" color={color.ink} style={{ fontWeight: '700' }}>
                {money(i.amount)}
              </Txt>
            </View>
          ))}
        </View>
        <View style={styles.previewGoal}>
          <View style={styles.previewTrack} />
          <Txt variant="caption" color={color.ink2}>
            <Txt variant="caption" color={color.ink} style={{ fontWeight: '700' }}>
              $0
            </Txt>{' '}
            of {money(goal)}
          </Txt>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.paper },
  done: { alignItems: 'center', paddingHorizontal: space.lg, gap: space.md },
  doneBadge: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: color.leaf,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  autoTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: color.sunSoft,
  },
  cat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: color.card,
    borderWidth: 1,
    borderColor: color.line,
  },
  budget: { backgroundColor: color.card, borderRadius: radius.lg, paddingHorizontal: space.md },
  budgetRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 54 },
  budgetBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: color.line },
  rowIcon: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  itemInput: { flex: 1, height: 54, fontSize: 16, fontFamily: font.medium, color: color.ink },
  amountBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    width: 72,
    height: 38,
    paddingHorizontal: 10,
    borderRadius: radius.sm,
    backgroundColor: color.paper,
  },
  amountInput: { flex: 1, textAlign: 'right', fontSize: 16, fontFamily: font.bold, color: color.ink },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 48 },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: color.lineStrong,
  },
  exampleLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 6 },
  checkCard: { paddingHorizontal: space.md, paddingVertical: 12, borderRadius: radius.md, gap: 6 },
  checkOk: { backgroundColor: color.leafSoft },
  checkWarn: { backgroundColor: color.sunSoft },
  photoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.sm,
    borderRadius: radius.lg,
    backgroundColor: color.card,
  },
  preview: { backgroundColor: color.card, borderRadius: radius.lg, overflow: 'hidden' },
  previewTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  previewItems: { gap: 6, paddingVertical: 4 },
  previewItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  previewGoal: { gap: 6 },
  previewTrack: { height: 6, borderRadius: 3, backgroundColor: color.paperDeep },
  footer: {
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    gap: 10,
    backgroundColor: color.paper,
    shadowColor: '#3B2F1A',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
  },
  statusFade: { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: color.paper },
});
