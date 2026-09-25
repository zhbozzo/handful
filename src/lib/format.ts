export const money = (n: number) =>
  Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`;

export const pct = (raised: number, goal: number) =>
  goal <= 0 ? 0 : Math.min(100, Math.round((raised / goal) * 100));

export function ago(ts: number, now = Date.now()) {
  const m = Math.max(0, Math.round((now - ts) / 60_000));
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return d === 1 ? 'yesterday' : `${d} days ago`;
}

export function when(ts: number, now = Date.now()) {
  const d = new Date(ts);
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const today = new Date(now);
  const sameDay = d.toDateString() === today.toDateString();
  if (sameDay) return `Today, ${time}`;
  const y = new Date(now - 86_400_000);
  if (d.toDateString() === y.toDateString()) return `Yesterday, ${time}`;
  return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${time}`;
}

export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
