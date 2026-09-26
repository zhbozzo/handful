import type { ImageSourcePropType } from 'react-native';

/**
 * Illustrative photos of what each demo cause pays for — objects only, never people
 * (generated for this demo). A cause without one falls back to its illustration.
 */
const CAUSE_PHOTOS: Partial<Record<string, ImageSourcePropType>> = {};

export const causePhoto = (id?: string): ImageSourcePropType | undefined => (id ? CAUSE_PHOTOS[id] : undefined);
