import { seedCauses } from '@/data/seed';
import type { Contribution } from '@/data/types';

import { recentGifts } from '../activity';

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
