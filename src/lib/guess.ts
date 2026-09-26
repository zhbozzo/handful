/**
 * Small helpers that save a nonprofit taps while posting: the category and each item's
 * icon are guessed from what they type. Always overridable; never sent anywhere.
 */
import type { CategoryId } from '@/data/types';

type Rule = { words: string[]; category?: CategoryId; symbol: string };

// Order matters: the first rule that matches wins.
const RULES: Rule[] = [
  { words: ['dog', 'cat', 'pet', 'vet', 'kibble', 'puppy', 'kitten'], category: 'animals', symbol: 'pawprint.fill' },
  {
    words: ['medicine', 'medication', 'prescription', 'pills', 'insulin', 'inhaler'],
    category: 'health',
    symbol: 'pills.fill',
  },
  { words: ['glasses', 'eyeglasses', 'lenses'], category: 'health', symbol: 'eyeglasses' },
  {
    words: ['doctor', 'dentist', 'clinic', 'checkup', 'bandage', 'bandages', 'first aid'],
    category: 'health',
    symbol: 'cross.case.fill',
  },
  { words: ['bus', 'fare', 'fares'], category: 'transport', symbol: 'bus.fill' },
  { words: ['metro', 'train', 'subway', 'tram'], category: 'transport', symbol: 'tram.fill' },
  { words: ['taxi', 'ride', 'uber'], category: 'transport', symbol: 'car.fill' },
  { words: ['bike', 'bicycle'], category: 'transport', symbol: 'bicycle' },
  { words: ['backpack', 'school bag'], category: 'education', symbol: 'backpack.fill' },
  { words: ['book', 'books', 'notebook', 'notebooks', 'textbook'], category: 'education', symbol: 'book.fill' },
  { words: ['pencil', 'pencils', 'pens', 'supplies', 'school'], category: 'education', symbol: 'pencil' },
  { words: ['uniform', 'tuition', 'course', 'class'], category: 'education', symbol: 'graduationcap.fill' },
  { words: ['flashlight', 'torch'], category: 'emergency', symbol: 'flashlight.on.fill' },
  { words: ['battery', 'batteries', 'charger', 'power bank'], category: 'emergency', symbol: 'bolt.fill' },
  { words: ['candle', 'candles', 'gas', 'heater', 'firewood'], category: 'emergency', symbol: 'flame.fill' },
  {
    words: ['blanket', 'blankets', 'sleeping bag', 'mattress', 'bed', 'pillow'],
    category: 'shelter',
    symbol: 'bed.double.fill',
  },
  { words: ['rent', 'room', 'tent', 'roof'], category: 'shelter', symbol: 'house.fill' },
  { words: ['diaper', 'diapers', 'formula', 'baby', 'wipes'], category: 'families', symbol: 'basket.fill' },
  { words: ['groceries', 'grocery', 'pantry', 'staples'], category: 'families', symbol: 'cart.fill' },
  {
    words: ['soap', 'shampoo', 'toiletries', 'toiletry', 'deodorant'],
    category: 'hygiene',
    symbol: 'bubbles.and.sparkles.fill',
  },
  {
    words: ['toothbrush', 'toothpaste', 'razor', 'pads', 'tampons', 'hygiene', 'shower'],
    category: 'hygiene',
    symbol: 'drop.fill',
  },
  { words: ['shoes', 'boots', 'sneakers', 'shoe'], category: 'clothing', symbol: 'shoe.fill' },
  { words: ['socks', 'gloves', 'beanie', 'scarf', 'thermal'], category: 'clothing', symbol: 'snowflake' },
  {
    words: ['coat', 'jacket', 'sweater', 'hoodie', 'clothes', 'clothing', 'shirt', 'pants', 'jeans'],
    category: 'clothing',
    symbol: 'tshirt.fill',
  },
  { words: ['water', 'juice', 'drinks'], category: 'food', symbol: 'waterbottle.fill' },
  { words: ['coffee', 'tea', 'breakfast'], category: 'food', symbol: 'cup.and.saucer.fill' },
  { words: ['vegetables', 'fruit', 'veggies', 'produce'], category: 'food', symbol: 'carrot.fill' },
  { words: ['cake', 'birthday'], category: 'food', symbol: 'birthday.cake.fill' },
  {
    words: ['meal', 'meals', 'food', 'lunch', 'dinner', 'soup', 'bread', 'rice', 'milk', 'snack', 'snacks'],
    category: 'food',
    symbol: 'fork.knife',
  },
];

function matches(text: string, rule: Rule) {
  const t = ` ${text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ')} `;
  return rule.words.some((w) => t.includes(` ${w} `));
}

/** The category the words most likely belong to, or undefined when nothing matches. */
export function guessCategory(...texts: string[]): CategoryId | undefined {
  for (const text of texts) {
    const rule = RULES.find((r) => r.category && matches(text, r));
    if (rule) return rule.category;
  }
  return undefined;
}

/** An SF Symbol for a budget line, falling back to the category's own symbol. */
export function guessSymbol(label: string, fallback: string): string {
  return RULES.find((r) => matches(label, r))?.symbol ?? fallback;
}
