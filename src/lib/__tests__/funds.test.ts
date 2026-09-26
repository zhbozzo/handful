import { seedCauses, STUDIO_ORG_ID } from '@/data/seed';
import type { Contribution } from '@/data/types';

import { orgFunds, sortForTracking, stageOf, trackCause, whereYourMoneyIs } from '../funds';

const causes = seedCauses();
const byId = (id: string) => causes.find((c) => c.id === id)!;

describe('stageOf', () => {
  it('follows a cause from collecting to delivered', () => {
    expect(stageOf(byId('hot-meal-tonight'))).toBe('collecting');
    expect(stageOf({ ...byId('hot-meal-tonight'), status: 'funded' })).toBe('available');
    expect(
      stageOf({ ...byId('hot-meal-tonight'), status: 'funded', payout: { amount: 18, at: 0, account: '1' } }),
    ).toBe('paidOut');
    expect(stageOf(byId('winter-blanket'))).toBe('bought');
    expect(stageOf(byId('family-groceries'))).toBe('delivered');
  });
});

describe('orgFunds', () => {
  it('splits the demo nonprofit’s money by where it is', () => {
    const f = orgFunds(causes, STUDIO_ORG_ID);
    // hot-meal-tonight is open with $14; winter-blanket was funded ($28) and paid out.
    expect(f).toEqual({ received: 42, collecting: 14, available: 0, paidOut: 28 });
  });

  it('makes a fully funded cause available until it is withdrawn', () => {
    const funded = causes.map((c) =>
      c.id === 'hot-meal-tonight' ? { ...c, raised: c.goal, status: 'funded' as const } : c,
    );
    expect(orgFunds(funded, STUDIO_ORG_ID)).toMatchObject({ collecting: 0, available: 18 });
  });
});

describe('whereYourMoneyIs', () => {
  const g = (causeId: string, amount: number): Contribution => ({
    id: causeId,
    causeId,
    amount,
    at: 0,
    completedCause: false,
    productId: '',
    transactionId: '',
    rail: 'offline-demo',
  });

  it('adds up to what you gave', () => {
    const split = whereYourMoneyIs([g('family-groceries', 5), g('winter-blanket', 3), g('bus-fare', 2)], causes);
    expect(split).toEqual({ delivered: 5, onTheWay: 3, funding: 2, total: 10 });
  });
});

describe('trackCause', () => {
  it('tells the donor where a cause is and what happens next', () => {
    expect(trackCause(byId('hot-meal-tonight'))).toMatchObject({ done: 0, label: 'Collecting', finished: false });
    expect(trackCause(byId('hot-meal-tonight')).next).toContain('$4 to go');
    expect(trackCause({ ...byId('hot-meal-tonight'), status: 'funded' }).next).toContain('buys the items');
    expect(trackCause(byId('winter-blanket'))).toMatchObject({ done: 2, label: 'Bought' });
    expect(trackCause(byId('family-groceries'))).toMatchObject({ done: 3, finished: true });
  });

  it('puts causes still moving first and delivered last', () => {
    const order = sortForTracking([byId('family-groceries'), byId('bus-fare'), byId('winter-blanket')]).map(
      (c) => c.id,
    );
    expect(order).toEqual(['winter-blanket', 'bus-fare', 'family-groceries']);
  });
});
