import type { CategoryId } from './types';

export type Category = {
  id: CategoryId;
  label: string;
  symbol: string;
  /** Soft background for covers and chips. */
  tint: string;
  /** Foreground for symbols on the tint. */
  ink: string;
};

/**
 * Categories share one warm family (amber, terracotta, clay, ochre, cocoa) so covers sit with the
 * sun accent. Green and violet stay reserved for meaning: delivered/trust and privacy.
 */
const AMBER = { tint: '#FBE6C6', ink: '#A0580C' };
const TERRACOTTA = { tint: '#F7DDD0', ink: '#A1492A' };
const CLAY = { tint: '#F4DFDA', ink: '#96474A' };
const OCHRE = { tint: '#F4E9C4', ink: '#83630F' };
const COCOA = { tint: '#EEE2D4', ink: '#77502F' };

export const CATEGORIES: Category[] = [
  { id: 'food', label: 'Food', symbol: 'fork.knife', ...AMBER },
  { id: 'hygiene', label: 'Hygiene', symbol: 'drop.fill', ...CLAY },
  { id: 'clothing', label: 'Clothing', symbol: 'tshirt.fill', ...COCOA },
  { id: 'shelter', label: 'Shelter', symbol: 'house.fill', ...TERRACOTTA },
  { id: 'health', label: 'Health', symbol: 'cross.case.fill', ...CLAY },
  { id: 'transport', label: 'Transport', symbol: 'bus.fill', ...OCHRE },
  { id: 'families', label: 'Families', symbol: 'basket.fill', ...AMBER },
  { id: 'animals', label: 'Animals', symbol: 'pawprint.fill', ...COCOA },
  { id: 'education', label: 'Education', symbol: 'backpack.fill', ...OCHRE },
  { id: 'emergency', label: 'Emergency', symbol: 'flashlight.on.fill', ...TERRACOTTA },
];

export const categoryById = (id: CategoryId): Category => CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[0];
