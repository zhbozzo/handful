import type { ImageSourcePropType } from 'react-native';

/**
 * Illustrative photos for the demo causes (Unsplash, credited in the README): the setting, the items
 * or a volunteer's hands — never the face of a person being helped. A cause without one falls back
 * to its illustration.
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
