import type { AnalysisResult } from '@modules/privacy-shield';

import { buildFindings, checkStory, headRegion } from '../privacy';

const base: AnalysisResult = {
  width: 2000,
  height: 1333,
  faces: [],
  texts: [],
  documents: [],
  metadata: { hasGPS: false },
  durationMs: 12,
};

const text = (t: string, x = 0.1, y = 0.1) => ({ text: t, x, y, w: 0.1, h: 0.03, confidence: 0.9 });

describe('buildFindings', () => {
  it('always protects faces and expands them to cover the whole head', () => {
    const face = { x: 0.4, y: 0.3, w: 0.1, h: 0.12, confidence: 0.98 };
    const { findings } = buildFindings({ ...base, faces: [face] });
    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({ kind: 'face', protect: true, locked: true });
    const box = findings[0].box!;
    expect(box.x).toBeLessThan(face.x);
    expect(box.y).toBeLessThan(face.y);
    expect(box.w).toBeGreaterThan(face.w);
    expect(box.h).toBeGreaterThan(face.h);
  });

  it.each([
    ['BBCL·42', 'plate'],
    ['HJ 4521', 'plate'],
    ['12.345.678-5', 'id'],
    ['RUT 9.876.543-K', 'id'],
    ['Av. Matta 1234', 'address'],
    ['+56 9 8765 4321', 'phone'],
    ['maria@example.com', 'email'],
  ])('flags “%s” as %s', (t, kind) => {
    const { findings } = buildFindings({ ...base, texts: [text(t)] });
    expect(findings.map((f) => f.kind)).toEqual([kind]);
    expect(findings[0].protect).toBe(true);
  });

  it('leaves ordinary text alone', () => {
    const { findings, safeText } = buildFindings({
      ...base,
      texts: [text('VOLUNTEER'), text('Food aid'), text('DONATE')],
    });
    expect(findings).toHaveLength(0);
    expect(safeText).toBe(3);
  });

  it('never shows the raw sensitive text back to the user', () => {
    const { findings } = buildFindings({ ...base, texts: [text('12.345.678-5')] });
    expect(findings[0].detail).not.toContain('345');
  });

  it('hides a document when it holds several lines of text', () => {
    const doc = { x: 0.1, y: 0.1, w: 0.5, h: 0.5, confidence: 0.9 };
    const lines = [text('Line one', 0.15, 0.15), text('Line two', 0.15, 0.25), text('Line three', 0.15, 0.35)];
    const { findings } = buildFindings({ ...base, texts: lines, documents: [doc] });
    expect(findings.some((f) => f.kind === 'document')).toBe(true);
  });

  it('reports GPS metadata from the file or from the picker', () => {
    expect(buildFindings({ ...base, metadata: { hasGPS: true } }).findings[0].kind).toBe('location');
    expect(buildFindings(base, true).findings[0]).toMatchObject({ kind: 'location', locked: true });
    expect(buildFindings(base).findings).toHaveLength(0);
  });
});

describe('scene check', () => {
  it('warns when the photo looks like where someone sleeps', () => {
    const { findings } = buildFindings({ ...base, scene: [{ label: 'tent', confidence: 0.82 }] });
    expect(findings).toEqual([expect.objectContaining({ kind: 'setting', advisory: true, protect: false })]);
  });

  it('ignores low-confidence or unrelated scene labels', () => {
    expect(buildFindings({ ...base, scene: [{ label: 'tent', confidence: 0.1 }] }).findings).toHaveLength(0);
    expect(buildFindings({ ...base, scene: [{ label: 'grocery_store', confidence: 0.9 }] }).findings).toHaveLength(0);
  });
});

describe('headRegion', () => {
  it('stays inside the image', () => {
    const r = headRegion({ x: 0.01, y: 0.01, w: 0.2, h: 0.2 });
    expect(r.x).toBeGreaterThanOrEqual(0);
    expect(r.y).toBeGreaterThanOrEqual(0);
    expect(r.x + r.w).toBeLessThanOrEqual(1);
    expect(r.y + r.h).toBeLessThanOrEqual(1);
  });
});

describe('checkStory', () => {
  it('passes a needs-first story', () => {
    expect(
      checkStory(
        'A man our team has known for two years asked for a warm coat before winter gets worse. We buy it second-hand and hand it over on Friday’s round.',
      ),
    ).toEqual([]);
  });

  it.each([
    ['He sleeps under the bridge near the station.', 'where'],
    ['She lives at Av. Matta 1234, depto 5.', 'address'],
    ['Call her at +56 9 8765 4321.', 'phone'],
    ['He was diagnosed with diabetes last year.', 'medical'],
    ['A 7-year-old needs school shoes.', 'minor'],
    ['Juan Carlos Pérez needs a coat.', 'name'],
  ])('flags “%s”', (story, id) => {
    expect(checkStory(story).map((i) => i.id)).toContain(id);
  });
});
