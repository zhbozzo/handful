import * as Linking from 'expo-linking';
import { Share } from 'react-native';

import type { Cause } from '@/data/types';

import { money } from './format';

/**
 * Asking one friend is the most effective thing a donor can do after giving
 * (GoFundMe reports ~$13 more per share). The message names the need, never the person.
 */
export async function shareCause(cause: Cause, { justGave = false } = {}) {
  const left = cause.goal - cause.raised;
  const url = Linking.createURL(`/cause/${cause.id}`);
  const line =
    cause.status !== 'open'
      ? `“${cause.title}” was fully funded on Handful — follow it to the delivery proof.`
      : justGave
        ? `I just gave to “${cause.title}” on Handful. Only ${money(left)} to go — want to help finish it?`
        : `“${cause.title}” on Handful: ${money(left)} to go, verified by a local nonprofit.`;
  try {
    await Share.share({ message: `${line}\n${url}`, url });
  } catch {
    // The share sheet was dismissed or unavailable; nothing to do.
  }
}
