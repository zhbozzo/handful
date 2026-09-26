/**
 * Recent gifts on a cause: the donor's own gifts (real, from this device) plus the
 * other donors in the demo seed. Donors are anonymous by default — the list says
 * how many people gave and when, never who.
 */
import type { Cause, Contribution } from '@/data/types';

export type RecentGift = { key: string; amount: number; at: number; you: boolean; completed: boolean };

const AMOUNTS = [2, 5, 3, 4, 6, 5, 2, 10];

/** Small deterministic hash so the demo list is stable between renders and launches. */
function seed(text: string) {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) >>> 0;
  return h;
}

export function recentGifts(cause: Cause, contributions: Contribution[], now = Date.now(), limit = 3): RecentGift[] {
  const mine = contributions
    .filter((c) => c.causeId === cause.id)
    .map((c) => ({ key: c.id, amount: c.amount, at: c.at, you: true, completed: c.completedCause }));

  const others = Math.max(0, cause.donors - mine.length);
  // Gifts arrive while the cause is open: until now, or until the moment it was funded.
  const end = cause.status === 'open' ? now : (cause.timeline.find((t) => t.status === 'funded')?.at ?? now);
  const span = Math.max(60_000, Math.min(now, end) - cause.createdAt);
  const h = seed(cause.id);
  const demo: RecentGift[] = Array.from({ length: Math.min(others, limit) }, (_, i) => ({
    key: `demo-${cause.id}-${i}`,
    amount: AMOUNTS[(h + i * 7) % AMOUNTS.length],
    // Spread across the time the cause has been open, most recent first.
    at: cause.createdAt + span * (0.85 - i * 0.27),
    you: false,
    completed: false,
  }));

  return [...mine, ...demo].sort((a, b) => b.at - a.at).slice(0, limit);
}
