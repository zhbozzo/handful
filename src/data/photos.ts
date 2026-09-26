import type { ImageSourcePropType } from 'react-native';

import type { Evidence } from './types';

/**
 * Illustrative photos for the demo causes (Unsplash, credited in the README): the situation, with people
 * only from behind, far away or as hands — never an identifiable face of someone being helped.
 * A cause without one falls back to its illustration.
 */
const CAUSE_PHOTOS: Partial<Record<string, ImageSourcePropType>> = {
  'bus-fare': require('@/assets/causes/bus-fare.jpg'),
  'family-groceries': require('@/assets/causes/family-groceries.jpg'),
  'fire-kit': require('@/assets/causes/fire-kit.jpg'),
  'hot-meal-tonight': require('@/assets/causes/hot-meal-tonight.jpg'),
  prescription: require('@/assets/causes/prescription.jpg'),
  'school-supplies': require('@/assets/causes/school-supplies.jpg'),
  'shelter-hygiene': require('@/assets/causes/shelter-hygiene.jpg'),
  'toby-food': require('@/assets/causes/toby-food.jpg'),
  'winter-blanket': require('@/assets/causes/winter-blanket.jpg'),
};

export const causePhoto = (id?: string): ImageSourcePropType | undefined => (id ? CAUSE_PHOTOS[id] : undefined);

/** Delivery (thank-you) photos bundled with the seed data. */
const PROOF_PHOTOS: Record<NonNullable<Evidence['photoAsset']>, ImageSourcePropType> = {
  groceries: require('@/assets/images/proof-groceries.jpg'),
};

/** The protected thank-you photo a nonprofit posted with its proof, if any. */
export const proofPhoto = (ev?: Evidence): ImageSourcePropType | undefined =>
  ev?.photoUri ? { uri: ev.photoUri } : ev?.photoAsset ? PROOF_PHOTOS[ev.photoAsset] : undefined;
