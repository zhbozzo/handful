/**
 * Where the money is — for the nonprofit (what it can withdraw) and for the donor
 * (how much of what they gave has already reached people).
 */
import type { Cause, Contribution } from '@/data/types';

/** A nonprofit's view of one cause, from first gift to delivery. */
export type Stage = 'collecting' | 'available' | 'paidOut' | 'bought' | 'delivered';

/** The tracker nonprofits see once money starts moving. */
export const TRACK = ['Funded', 'Paid out', 'Bought', 'Delivered'];
export const TRACK_DONE: Record<Stage, number> = { collecting: 0, available: 1, paidOut: 2, bought: 3, delivered: 4 };

export const STAGE_PILL: Record<Stage, { label: string; tone: 'sun' | 'leaf' | 'neutral' }> = {
  collecting: { label: 'Collecting', tone: 'neutral' },
  available: { label: 'Ready to withdraw', tone: 'sun' },
  paidOut: { label: 'Needs proof', tone: 'sun' },
  bought: { label: 'Needs photo', tone: 'sun' },
  delivered: { label: 'Delivered', tone: 'leaf' },
};

export function stageOf(cause: Cause): Stage {
  if (cause.status === 'delivered') return 'delivered';
  if (cause.status === 'purchased') return 'bought';
  if (cause.status === 'funded') return cause.payout ? 'paidOut' : 'available';
  return 'collecting';
}

export type OrgFunds = {
  /** Everything donors have given to this nonprofit's causes. */
  received: number;
  /** Given to causes that are still open — released once each one is fully funded. */
  collecting: number;
  /** Fully funded and not yet withdrawn. */
  available: number;
  /** Already transferred to the nonprofit's bank account. */
  paidOut: number;
};

export function orgFunds(causes: Cause[], orgId: string): OrgFunds {
  const mine = causes.filter((c) => c.orgId === orgId);
  const sum = (list: Cause[], pick: (c: Cause) => number) => list.reduce((s, c) => s + pick(c), 0);
  return {
    received: sum(mine, (c) => c.raised),
    collecting: sum(
      mine.filter((c) => stageOf(c) === 'collecting'),
      (c) => c.raised,
    ),
    available: sum(
      mine.filter((c) => stageOf(c) === 'available'),
      (c) => c.raised,
    ),
    paidOut: sum(mine, (c) => c.payout?.amount ?? 0),
  };
}

export type MoneySplit = { delivered: number; onTheWay: number; funding: number; total: number };

/** The donor's gifts, split by where each one is now. */
export function whereYourMoneyIs(contributions: Contribution[], causes: Cause[]): MoneySplit {
  const out: MoneySplit = { delivered: 0, onTheWay: 0, funding: 0, total: 0 };
  for (const g of contributions) {
    const status = causes.find((c) => c.id === g.causeId)?.status;
    if (status === 'delivered') out.delivered += g.amount;
    else if (status === 'funded' || status === 'purchased') out.onTheWay += g.amount;
    else out.funding += g.amount;
    out.total += g.amount;
  }
  return out;
}
