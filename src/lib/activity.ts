/**
 * Recent gifts on a cause: the donor's own gifts (real, from this device) plus the
 * other donors in the demo seed. Donors are anonymous by default — the list says
 * how many people gave and when, never who.
 */
import type { Cause, Contribution } from '@/data/types';

export type RecentGift = { key: string; amount: number; at: number; you: boolean; completed: boolean };

/** Small deterministic hash so the demo list is stable between renders and launches. */
function seed(text: string) {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) >>> 0;
  return h;
}

/**
 * Whole-dollar gifts for the other donors that add up exactly to what they gave,
 * varied deterministically so the list doesn't look uniform.
 */
export function splitAmounts(total: number, count: number, h: number): number[] {
  if (count <= 0 || total <= 0) return [];
  const base = Math.floor(total / count);
  if (base < 1) return Array.from({ length: Math.min(count, total) }, () => 1);
  const out = Array.from({ length: count }, (_, i) => base + (i < total % count ? 1 : 0));
  for (let k = 0; k < count; k++) {
    const from = (h + k * 3) % count;
    const to = (h + k * 5 + 1) % count;
    const move = (h >>> k) % 3;
    if (from !== to && out[from] - move >= 1) {
      out[from] -= move;
      out[to] += move;
    }
  }
  return out;
}

export function recentGifts(cause: Cause, contributions: Contribution[], now = Date.now(), limit = 3): RecentGift[] {
  const mine = contributions
    .filter((c) => c.causeId === cause.id)
    .map((c) => ({ key: c.id, amount: c.amount, at: c.at, you: true, completed: c.completedCause }));

  const others = Math.max(0, cause.donors - mine.length);
  const theirs = Math.max(0, cause.raised - mine.reduce((sum, g) => sum + g.amount, 0));
  // Gifts arrive while the cause is open: until now, or until the moment it was funded.
  const end = cause.status === 'open' ? now : (cause.timeline.find((t) => t.status === 'funded')?.at ?? now);
  const span = Math.max(60_000, Math.min(now, end) - cause.createdAt);
  const h = seed(cause.id);
  const amounts = splitAmounts(theirs, others, h);
  const demo: RecentGift[] = amounts.slice(0, limit).map((amount, i) => ({
    key: `demo-${cause.id}-${i}`,
    amount,
    // Spread across the time the cause has been open, most recent first.
    at: cause.createdAt + span * (0.85 - i * 0.27),
    you: false,
    completed: false,
  }));

  return [...mine, ...demo].sort((a, b) => b.at - a.at).slice(0, limit);
}
