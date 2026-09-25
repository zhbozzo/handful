import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const on = Platform.OS === 'ios' || Platform.OS === 'android';

export const tap = () => on && Haptics.selectionAsync().catch(() => {});
export const press = () => on && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
export const thud = () => on && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
export const success = () => on && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
export const warn = () => on && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
