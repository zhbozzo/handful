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

export const CATEGORIES: Category[] = [
  { id: 'food', label: 'Food', symbol: 'fork.knife', tint: '#F8E2C6', ink: '#A4561A' },
  { id: 'hygiene', label: 'Hygiene', symbol: 'drop.fill', tint: '#D9ECEC', ink: '#27777D' },
  { id: 'clothing', label: 'Clothing', symbol: 'tshirt.fill', tint: '#EFE2D3', ink: '#80542A' },
  { id: 'shelter', label: 'Shelter', symbol: 'house.fill', tint: '#DFE5F3', ink: '#3A579C' },
  { id: 'health', label: 'Health', symbol: 'cross.case.fill', tint: '#F4DEDA', ink: '#9C4237' },
  { id: 'transport', label: 'Transport', symbol: 'bus.fill', tint: '#E4E0F4', ink: '#5446A6' },
  { id: 'families', label: 'Families', symbol: 'basket.fill', tint: '#F6E6CF', ink: '#95602A' },
  { id: 'animals', label: 'Animals', symbol: 'pawprint.fill', tint: '#E1ECD7', ink: '#4A7330' },
  { id: 'education', label: 'Education', symbol: 'backpack.fill', tint: '#F8EDC4', ink: '#806410' },
  { id: 'emergency', label: 'Emergency', symbol: 'flashlight.on.fill', tint: '#F3DFD2', ink: '#A6481F' },
];

export const categoryById = (id: CategoryId): Category => CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[0];
