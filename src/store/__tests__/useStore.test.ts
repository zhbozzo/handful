import { useStore } from '../useStore';

const gift = (causeId: string, amount: number) => ({
  causeId,
  amount,
  productId: `handful_gift_${amount}`,
  transactionId: `test_${amount}`,
  rail: 'revenuecat-test-store' as const,
});

const cause = (id: string) => useStore.getState().causes.find((c) => c.id === id)!;

beforeEach(() => useStore.getState().resetDemo());

describe('gifts', () => {
  it('adds a partial gift without closing the cause', () => {
    const before = cause('bus-fare');
    const { completed } = useStore.getState().contribute(gift('bus-fare', 2));
    expect(completed).toBe(false);
    expect(cause('bus-fare')).toMatchObject({ raised: before.raised + 2, donors: before.donors + 1, status: 'open' });
  });

  it('closes the cause when a gift covers what is left', () => {
    const c = cause('hot-meal-tonight');
    const { completed, contribution } = useStore.getState().contribute(gift('hot-meal-tonight', c.goal - c.raised));
    expect(completed).toBe(true);
    expect(contribution.completedCause).toBe(true);
    expect(cause('hot-meal-tonight')).toMatchObject({ raised: c.goal, status: 'funded' });
    expect(cause('hot-meal-tonight').timeline.map((t) => t.status)).toEqual(['open', 'funded']);
  });

  it('never moves a cause backwards once it is funded or delivered', () => {
    const before = cause('family-groceries');
    const { completed } = useStore.getState().contribute(gift('family-groceries', 5));
    expect(completed).toBe(false);
    expect(cause('family-groceries')).toMatchObject({
      status: 'delivered',
      raised: before.raised,
      donors: before.donors,
    });
  });

  it('never raises more than the goal', () => {
    const c = cause('toby-food');
    useStore.getState().contribute(gift('toby-food', c.goal));
    expect(cause('toby-food').raised).toBe(c.goal);
  });
});

describe('proof', () => {
  it('moves a funded cause to delivered and tells the people who gave', () => {
    const c = cause('hot-meal-tonight');
    useStore.getState().contribute(gift('hot-meal-tonight', c.goal - c.raised));
    useStore.getState().postProof('hot-meal-tonight', {
      privacy: { facesBlurred: 1, textBlurred: 0, locationRemoved: true },
      store: 'Test market',
      receipt: [{ label: 'Hot meal', amount: 5.7 }],
      note: 'Delivered.',
    });
    const done = cause('hot-meal-tonight');
    expect(done.status).toBe('delivered');
    expect(done.timeline.map((t) => t.status)).toEqual(['open', 'funded', 'purchased', 'delivered']);
    expect(useStore.getState().inbox[0]).toMatchObject({ causeId: 'hot-meal-tonight', kind: 'delivered', read: false });
  });

  it('does not notify anyone who did not give', () => {
    useStore.getState().postProof('winter-blanket', {
      privacy: { facesBlurred: 0, textBlurred: 0, locationRemoved: true },
      store: 'Test market',
      receipt: [{ label: 'Wool blanket', amount: 15.9 }],
      note: 'Delivered.',
    });
    expect(useStore.getState().inbox).toHaveLength(0);
    // purchase step already existed, so it is not duplicated
    expect(cause('winter-blanket').timeline.filter((t) => t.status === 'purchased')).toHaveLength(1);
  });
});

describe('nonprofit studio', () => {
  it('publishes a cause whose goal is the sum of its items', () => {
    const created = useStore.getState().createCause({
      title: 'Winter coat + gloves',
      summary: 'A warm coat before winter gets worse.',
      category: 'clothing',
      beneficiary: 'individual',
      area: 'Santiago Centro',
      items: [
        { id: 'a', label: 'Winter coat', amount: 15, symbol: 'tshirt.fill' },
        { id: 'b', label: 'Gloves + beanie', amount: 6, symbol: 'snowflake' },
      ],
      consent: { consentObtained: true, noExactLocation: true, imagesReviewed: true },
    });
    expect(created).toMatchObject({ goal: 21, raised: 0, status: 'open', isDemo: true, createdHere: true });
    expect(useStore.getState().causes[0].id).toBe(created.id);
  });
});

describe('payouts', () => {
  it('only releases money once a cause is fully funded, and only once', () => {
    const s = useStore.getState();
    expect(s.withdraw('hot-meal-tonight')).toBe(0);
    const c = cause('hot-meal-tonight');
    s.contribute(gift('hot-meal-tonight', c.goal - c.raised));
    expect(useStore.getState().withdraw('hot-meal-tonight')).toBe(c.goal);
    expect(cause('hot-meal-tonight').payout).toMatchObject({ amount: c.goal, account: '4821' });
    expect(useStore.getState().withdraw('hot-meal-tonight')).toBe(0);
  });

  it('records the payout when proof is posted without an explicit withdrawal', () => {
    const c = cause('hot-meal-tonight');
    useStore.getState().contribute(gift('hot-meal-tonight', c.goal - c.raised));
    useStore.getState().postProof('hot-meal-tonight', {
      privacy: { facesBlurred: 1, textBlurred: 0, locationRemoved: true },
      store: 'Market',
      receipt: [{ label: 'Hot meal', amount: 6 }],
      note: 'Delivered tonight.',
    });
    expect(cause('hot-meal-tonight').payout?.amount).toBe(c.goal);
  });
});
