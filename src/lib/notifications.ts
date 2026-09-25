import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
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

/** Opens the proof screen when the donor taps the "Delivered" notification. */
export function listenForNotificationTaps(): () => void {
  if (!enabled) return () => {};
  const sub = Notifications.addNotificationResponseReceivedListener((response) => {
    const url = response.notification.request.content.data?.url;
    if (typeof url === 'string') router.push(url as never);
  });
  return () => sub.remove();
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
