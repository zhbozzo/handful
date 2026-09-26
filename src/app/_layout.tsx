import {
  Figtree_400Regular,
  Figtree_500Medium,
  Figtree_600SemiBold,
  Figtree_700Bold,
  Figtree_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/figtree';
import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { LogBox, Platform, Settings, useWindowDimensions } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { runDevLaunchAction } from '@/lib/devLaunch';
import { LaunchSplash } from '@/components/LaunchSplash';
import { setLaunching } from '@/lib/launch';
import { useNotificationTaps } from '@/lib/notifications';
import { configurePurchases, listenToCustomerInfo, refreshSupporter } from '@/lib/purchases';
import { useHydrated, useStore } from '@/store/useStore';
import { color } from '@/theme/tokens';

SplashScreen.preventAutoHideAsync();
// The JS launch animation starts on the same frame, so the native splash can leave quickly.
SplashScreen.setOptions({ duration: 120, fade: true });

// Known third-party dev warnings; nothing actionable in our code.
LogBox.ignoreLogs(['Sending `onAnimatedValueUpdate` with no listeners', '[RevenueCat] ⚠️ Using a Test Store API key']);
// Screen recordings (`-handfulRecording 1`): no dev toasts on screen at all.
if (__DEV__ && Platform.OS === 'ios' && Settings.get('handfulRecording') === '1') LogBox.ignoreAllLogs();

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: color.paper,
    card: color.paper,
    text: color.ink,
    primary: color.ink,
    border: color.line,
  },
};

const sheet = {
  presentation: 'formSheet' as const,
  sheetGrabberVisible: true,
  sheetCornerRadius: 28,
  contentStyle: { backgroundColor: color.paper },
  headerShown: false,
};

export default function RootLayout() {
  // With large accessibility text the gift sheet opens full height so the button is never cut off.
  const { fontScale } = useWindowDimensions();
  const [fontsLoaded] = useFonts({
    Figtree_400Regular,
    Figtree_500Medium,
    Figtree_600SemiBold,
    Figtree_700Bold,
    Figtree_800ExtraBold,
  });
  const hydrated = useHydrated();
  const setSupporter = useStore((s) => s.setSupporter);

  useEffect(() => {
    if (!configurePurchases()) return;
    refreshSupporter().then((active) => active !== null && setSupporter(active));
    return listenToCustomerInfo(setSupporter);
  }, [setSupporter]);

  useNotificationTaps();

  const devRan = useRef(false);
  useEffect(() => {
    if (!fontsLoaded || !hydrated || devRan.current) return;
    devRan.current = true;
    runDevLaunchAction();
  }, [fontsLoaded, hydrated]);

  // The native splash hands over to <LaunchSplash> once its first frame is on screen;
  // this is only a fallback in case that never happens.
  const [launched, setLaunched] = useState(false);
  useEffect(() => {
    if (!fontsLoaded || !hydrated) return;
    const t = setTimeout(() => SplashScreen.hideAsync(), 1500);
    return () => clearTimeout(t);
  }, [fontsLoaded, hydrated]);
  const onboarded = useStore((s) => s.onboarded);
  const hideNative = useCallback(() => {
    SplashScreen.hideAsync();
  }, []);
  const finishLaunch = useCallback(() => {
    setLaunching(false);
    setLaunched(true);
  }, []);
  if (!fontsLoaded || !hydrated) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: color.paper }}>
      <ThemeProvider value={theme}>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.paper } }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="onboarding"
            options={{ presentation: 'fullScreenModal', gestureEnabled: false, animation: 'fade' }}
          />
          <Stack.Screen name="cause/[id]" />
          <Stack.Screen
            name="give/[id]"
            options={{ ...sheet, sheetAllowedDetents: fontScale > 1.15 ? [1] : [0.72, 1] }}
          />
          <Stack.Screen
            name="success/[id]"
            options={{ presentation: 'fullScreenModal', animation: 'fade', gestureEnabled: false }}
          />
          <Stack.Screen name="proof/[id]" />
          <Stack.Screen name="supporter" options={{ ...sheet, sheetAllowedDetents: [1] }} />
          <Stack.Screen name="about" options={{ ...sheet, sheetAllowedDetents: [0.75, 1] }} />
          <Stack.Screen name="nonprofit/new" options={{ presentation: 'fullScreenModal' }} />
          <Stack.Screen name="nonprofit/proof/[id]" options={{ presentation: 'fullScreenModal' }} />
          <Stack.Screen name="nonprofit/cause/[id]" />
          <Stack.Screen
            name="nonprofit/withdraw/[id]"
            options={{ ...sheet, sheetAllowedDetents: fontScale > 1.15 ? [1] : [0.82, 1] }}
          />
          <Stack.Screen name="dev" options={{ animation: 'none' }} />
        </Stack>
      </ThemeProvider>
      {!launched ? <LaunchSplash onReady={hideNative} onDone={finishLaunch} headerSize={onboarded ? 30 : 26} /> : null}
    </GestureHandlerRootView>
  );
}
