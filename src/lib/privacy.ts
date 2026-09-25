/**
 * Privacy Shield — the JavaScript half.
 * Native detection lives in modules/privacy-shield (Apple Vision, on-device).
 * This file decides what counts as identifying and what gets blurred.
 */
import PrivacyShield, { type AnalysisResult, type Box, type RedactRegion } from '@modules/privacy-shield';

export type FindingKind = 'face' | 'plate' | 'id' | 'address' | 'phone' | 'email' | 'document' | 'location';

export type Finding = {
  id: string;
  kind: FindingKind;
  label: string;
  detail: string;
  box?: Box;
  /** Will be blurred / removed. */
  protect: boolean;
  /** Can't be switched off (faces, location). */
  locked: boolean;
};

export const shieldAvailable = () => !!PrivacyShield;

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

/**
 * Vision's face rectangle covers eyes-to-mouth. For privacy we cover the whole head:
 * forehead, hair and ears. The same region is drawn in the UI and blurred natively.
 */
export function headRegion(b: Box): Box {
  const x = clamp01(b.x - b.w * 0.32);
  const y = clamp01(b.y - b.h * 0.55);
  const r = clamp01(b.x + b.w * 1.32);
  const bottom = clamp01(b.y + b.h * 1.2);
  return { x, y, w: r - x, h: bottom - y };
}

const PLATE = [
  /^[A-Z]{4}[\s·•\-]?\d{2}$/, // Chile (BBBB·12)
  /^[A-Z]{2}[\s·•\-]?[A-Z]{2}[\s·•\-]?\d{2}$/, // Chile with separators
  /^[A-Z]{2}[\s·•\-]?\d{4}$/, // Chile (older)
  /^[A-Z]{3}[\s\-]?\d{3,4}$/, // many countries
  /^\d{3,4}[\s\-]?[A-Z]{3}$/,
];
const ID_WORDS =
  /\b(rut|run|dni|c[ée]dula|pasaporte|passport|identidad|identity|licencia|license|nacimiento|birth|ssn|nombre|name|apellido|surname)\b/i;
const ID_NUMBER = [/\b\d{1,2}\.?\d{3}\.?\d{3}\s?-\s?[\dkK]\b/, /\b\d{3}-\d{2}-\d{4}\b/, /\b\d{8,}\b/];
const ADDRESS =
  /\b(calle|avenida|pasaje|street|avenue|road|block|villa|poblaci[óo]n)\b|\b(av|avda|psje|st|ave|rd|depto|dpto|apt)\.|\bn[°º]\s?\d+|#\s?\d{1,5}\b/i;
const PHONE = /(\+?\d[\d\s\-().]{7,}\d)/;
const EMAIL = /[^\s@]+@[^\s@]+\.[a-z]{2,}/i;

function classify(text: string): { kind: FindingKind; label: string } | null {
  const t = text.trim();
  const compact = t.toUpperCase().replace(/\s+/g, ' ');
  if (PLATE.some((r) => r.test(compact))) return { kind: 'plate', label: 'License plate' };
  if (EMAIL.test(t)) return { kind: 'email', label: 'Email address' };
  if (ID_NUMBER.some((r) => r.test(t)) || ID_WORDS.test(t)) return { kind: 'id', label: 'ID or personal data' };
  if (ADDRESS.test(t)) return { kind: 'address', label: 'Address' };
  const digits = (t.match(/\d/g) ?? []).length;
  if (PHONE.test(t) && digits >= 8) return { kind: 'phone', label: 'Phone number' };
  return null;
}

const inside = (inner: Box, outer: Box) =>
  inner.x >= outer.x - 0.02 &&
  inner.y >= outer.y - 0.02 &&
  inner.x + inner.w <= outer.x + outer.w + 0.02 &&
  inner.y + inner.h <= outer.y + outer.h + 0.02;

const mask = (text: string) =>
  text.length <= 3 ? '•••' : `${text.slice(0, 2)}${'•'.repeat(Math.min(6, text.length - 2))}`;

export function buildFindings(result: AnalysisResult, extraGPS = false): { findings: Finding[]; safeText: number } {
  const findings: Finding[] = [];

  result.faces.forEach((f, i) =>
    findings.push({
      id: `face-${i}`,
      kind: 'face',
      label: 'Face',
      detail: 'Always blurred in public posts',
      box: headRegion(f),
      protect: true,
      locked: true,
    }),
  );

  let safeText = 0;
  const flaggedTexts: Box[] = [];
  result.texts.forEach((t, i) => {
    const c = classify(t.text);
    if (!c) {
      safeText += 1;
      return;
    }
    flaggedTexts.push(t);
    findings.push({
      id: `text-${i}`,
      kind: c.kind,
      label: c.label,
      detail: `Reads “${mask(t.text)}”`,
      box: t,
      protect: true,
      locked: false,
    });
  });

  result.documents.forEach((d, i) => {
    const lines = result.texts.filter((t) => inside(t, d)).length;
    const hasSensitive = flaggedTexts.some((t) => inside(t, d));
    if (lines >= 3 || hasSensitive) {
      findings.push({
        id: `doc-${i}`,
        kind: 'document',
        label: 'Document',
        detail: `${lines} lines of text — may identify someone`,
        box: d,
        protect: true,
        locked: false,
      });
    }
  });

  if (result.metadata.hasGPS || extraGPS) {
    findings.push({
      id: 'gps',
      kind: 'location',
      label: 'Location metadata',
      detail: 'GPS coordinates embedded in the file',
      protect: true,
      locked: true,
    });
  }

  return { findings, safeText };
}

export async function analyzePhoto(uri: string, extraGPS = false) {
  if (!PrivacyShield) throw new Error('Privacy Shield needs the iOS app build.');
  const result = await PrivacyShield.analyze(uri);
  return { result, ...buildFindings(result, extraGPS) };
}

export async function protectPhoto(uri: string, findings: Finding[]) {
  if (!PrivacyShield) throw new Error('Privacy Shield needs the iOS app build.');
  const regions: RedactRegion[] = findings
    .filter((f) => f.protect && f.box)
    .map((f) => ({
      ...f.box!,
      shape: f.kind === 'face' ? 'ellipse' : 'rect',
      padding: f.kind === 'face' ? 0.04 : f.kind === 'document' ? 0.04 : 0.12,
    }));
  return PrivacyShield.redact(uri, regions);
}

export type PhotoReport = { facesBlurred: number; textBlurred: number; locationRemoved: boolean };

export const reportFor = (findings: Finding[]): PhotoReport => ({
  facesBlurred: findings.filter((f) => f.kind === 'face' && f.protect).length,
  textBlurred: findings.filter((f) => f.kind !== 'face' && f.kind !== 'location' && f.protect).length,
  locationRemoved: true,
});

/* ---------- Story check: the same idea, for words ---------- */

export type StoryIssue = { id: string; label: string; hint: string };

const MEDICAL =
  /\b(diagn[oó]s\w*|cancer|c[áa]ncer|hiv|vih|sida|aids|diabet\w*|depress\w*|schizo\w*|esquizo\w*|bipolar|overdose|addict\w*|adicci[óo]n|alcoholi\w*|pregnan\w*|embaraz\w*|tumou?r|disease|enfermedad)\b/i;
const MINOR_AGE = /\b([0-9]|1[0-7])[\s-]?(years?[\s-]old|y\/o|a[ñn]os)\b/i;

export function checkStory(text: string): StoryIssue[] {
  const issues: StoryIssue[] = [];
  if (ADDRESS.test(text) || /\b\d{1,5}\s+[A-Z][a-z]+\s+(St|Street|Ave|Road)\b/.test(text))
    issues.push({ id: 'address', label: 'Looks like an exact address', hint: 'Use a neighborhood or city instead.' });
  if (
    /\b(sleeps?|duerme|lives?|vive)\b.{0,30}\b(under|bajo|behind|detr[áa]s|next to|al lado|outside|afuera|corner|esquina)\b/i.test(
      text,
    )
  )
    issues.push({
      id: 'where',
      label: 'Describes where someone sleeps or lives',
      hint: 'Leave out anything that helps find the person.',
    });
  if (PHONE.test(text) && (text.match(/\d/g) ?? []).length >= 8)
    issues.push({ id: 'phone', label: 'Contains a phone number', hint: 'Contact details never go in a public story.' });
  if (ID_NUMBER.some((r) => r.test(text)))
    issues.push({ id: 'id', label: 'Contains an ID-like number', hint: 'Remove ID and document numbers.' });
  if (MEDICAL.test(text))
    issues.push({
      id: 'medical',
      label: 'Mentions a health condition',
      hint: 'Describe the item needed, not the diagnosis.',
    });
  if (MINOR_AGE.test(text))
    issues.push({ id: 'minor', label: 'Mentions a child’s exact age', hint: 'Say “a child” or “a third grader”.' });
  if (/\b[A-ZÁÉÍÓÚ][a-záéíóúñ]+\s+[A-ZÁÉÍÓÚ][a-záéíóúñ]{2,}\s+[A-ZÁÉÍÓÚ][a-záéíóúñ]{2,}\b/.test(text))
    issues.push({ id: 'name', label: 'Might include a full name', hint: 'First name only, and only with consent.' });
  return issues;
}
