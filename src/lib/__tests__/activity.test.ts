import { seedCauses } from '@/data/seed';
import type { Contribution } from '@/data/types';

import { recentGifts, splitAmounts } from '../activity';

const cause = seedCauses().find((c) => c.id === 'hot-meal-tonight')!;

describe('recentGifts', () => {
  it('shows anonymous demo donors, newest first, capped', () => {
    const list = recentGifts(cause, [], Date.now());
    expect(list).toHaveLength(3);
    expect(list.every((g) => !g.you)).toBe(true);
    expect(list[0].at).toBeGreaterThanOrEqual(list[1].at);
  });

  it('puts your own gift first and counts it as one of the donors', () => {
    const now = Date.now();
    const mine: Contribution = {
      id: 'g1',
      causeId: cause.id,
      amount: 4,
      at: now,
      completedCause: true,
      productId: 'handful_gift_4',
      transactionId: 't',
      rail: 'offline-demo',
    };
    const list = recentGifts({ ...cause, donors: cause.donors + 1 }, [mine], now);
    expect(list[0]).toMatchObject({ you: true, amount: 4, completed: true });
    expect(list).toHaveLength(3);
  });

  it('is stable between calls', () => {
    const now = Date.now();
    expect(recentGifts(cause, [], now)).toEqual(recentGifts(cause, [], now));
  });
});

describe('splitAmounts', () => {
  it('adds up exactly to what the other donors gave', () => {
    for (const c of seedCauses()) {
      const parts = splitAmounts(c.raised, c.donors, 12345);
      expect(parts.reduce((a, b) => a + b, 0)).toBe(c.raised);
      expect(parts.every((p) => p >= 1 && Number.isInteger(p))).toBe(true);
    }
  });

  it('never shows a zero or negative gift, for any seed cause or hash', () => {
    for (const c of seedCauses()) {
      for (const g of recentGifts(c, [], Date.now(), 10)) expect(g.amount).toBeGreaterThanOrEqual(1);
    }
    for (const h of [0, 1, 2 ** 31 + 7, 2 ** 32 - 1]) {
      const parts = splitAmounts(18, 5, h);
      expect(parts.every((p) => p >= 1)).toBe(true);
      expect(parts.reduce((a, b) => a + b, 0)).toBe(18);
    }
  });

  it('never shows a single gift larger than what was raised', () => {
    const bus = seedCauses().find((c) => c.id === 'bus-fare')!;
    const list = recentGifts(bus, [], Date.now());
    expect(list.reduce((a, g) => a + g.amount, 0)).toBeLessThanOrEqual(bus.raised);
  });
});
