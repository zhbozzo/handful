import { Share } from 'react-native';

import type { Cause } from '@/data/types';

import { money } from './format';

/**
 * Asking one friend is the most effective thing a donor can do after giving
 * (GoFundMe reports ~$13 more per share). The message names the need, never the person.
 */
export async function shareCause(cause: Cause, { justGave = false } = {}) {
  const left = cause.goal - cause.raised;
  const line =
    cause.status === 'delivered'
      ? `“${cause.title}” was delivered — the nonprofit posted the receipt and a privacy-safe photo on Handful.`
      : cause.status !== 'open'
        ? justGave
          ? `I just completed “${cause.title}” on Handful. The nonprofit posts the receipt and a privacy-safe photo when it’s delivered.`
          : `“${cause.title}” was fully funded on Handful — follow it to the delivery proof.`
        : justGave
          ? `I just gave to “${cause.title}” on Handful. Only ${money(left)} to go — want to help finish it?`
          : `“${cause.title}” on Handful: ${money(left)} to go, verified by a local nonprofit.`;
  try {
    // Text only: this demo has no public web page to link to, and an app-scheme link would open nothing.
    await Share.share({ message: line });
  } catch {
    // The share sheet was dismissed or unavailable; nothing to do.
  }
}
