import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

const enabled = Platform.OS === 'ios' || Platform.OS === 'android';

if (enabled) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

/**
 * Opens the proof screen when the donor taps the "Delivered" notification —
 * whether the app was open, in the background, or launched by the tap.
 */
export function useNotificationTaps() {
  const last = Notifications.useLastNotificationResponse();
  const handled = useRef<string | null>(null);
  useEffect(() => {
    if (!enabled || !last || last.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
    const id = last.notification.request.identifier;
    if (handled.current === id) return;
    handled.current = id;
    const url = last.notification.request.content.data?.url;
    if (typeof url !== 'string') return;
    // The tap can arrive while a modal (e.g. the nonprofit flow) is on screen: close it first.
    if (router.canDismiss()) router.dismissAll();
    setTimeout(() => router.push(url as never), 400);
  }, [last]);
}

export async function notificationsGranted(): Promise<boolean> {
  if (!enabled) return false;
  try {
    return (await Notifications.getPermissionsAsync()).granted;
  } catch {
    return false;
  }
}

/** Asked at the moment it makes sense: right after a gift, "tell me when it's delivered". */
export async function askForDeliveryUpdates(): Promise<boolean> {
  if (!enabled) return false;
  try {
    return (await Notifications.requestPermissionsAsync()).granted;
  } catch {
    return false;
  }
}

/**
 * The donor side of "proof posted". In production this is a push from the server;
 * in this single-device demo it is a local notification a few seconds later.
 */
export async function notifyDelivered(causeId: string, title: string) {
  if (!enabled) return;
  try {
    if (!(await Notifications.getPermissionsAsync()).granted) return;
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Delivered ✓',
        body: `“${title}” reached the person it was for. See the receipt and photo.`,
        data: { url: `/proof/${causeId}` },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 4 },
    });
  } catch {
    // Notifications are a nice-to-have; the Impact tab always shows the update.
  }
}
