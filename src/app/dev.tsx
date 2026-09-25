/**
 * Development-only QA helper, driven by deep links (never reachable in release builds):
 *   handful://dev?action=skip-onboarding
 *   handful://dev?action=reset
 *   handful://dev?action=shield          → runs Privacy Shield on a bundled demo photo
 *   handful://dev?action=go&to=/cause/hot-meal-tonight
 */
import { Asset } from 'expo-asset';
import { Image } from 'expo-image';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { ShieldReview } from '@/components/ShieldReview';
import { Txt } from '@/components/Txt';
import { useStore } from '@/store/useStore';
import { color, space } from '@/theme/tokens';

export default function Dev() {
  const { action, to, auto } = useLocalSearchParams<{ action?: string; to?: string; auto?: string }>();
  const [photo, setPhoto] = useState<{ uri: string; width: number; height: number } | null>(null);
  const [done, setDone] = useState<string | null>(null);

  useEffect(() => {
    if (!__DEV__) return;
    const s = useStore.getState();
    if (action === 'skip-onboarding') {
      s.finishOnboarding();
      router.replace('/');
    } else if (action === 'reset') {
      s.resetDemo();
      router.replace('/');
    } else if (action === 'go' && to) {
      s.finishOnboarding();
      router.replace(to as never);
    } else if (action === 'shield') {
      Asset.fromModule(require('@/assets/demo/delivery-with-gps.jpg'))
        .downloadAsync()
        .then((a) => setPhoto({ uri: a.localUri ?? a.uri, width: a.width ?? 2000, height: a.height ?? 1333 }));
    }
  }, [action, to]);

  if (!__DEV__) return <Redirect href="/" />;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: color.paper }}
      contentContainerStyle={{ padding: space.lg, paddingTop: 80, gap: space.lg }}>
      <Txt variant="micro">Dev · {action}</Txt>
      {photo ? (
        <ShieldReview
          uri={photo.uri}
          width={photo.width}
          height={photo.height}
          pickerHasGPS
          autoProtectMs={auto ? Number(auto) : undefined}
          onRetake={() => {}}
          onDone={(out) => setDone(out.uri)}
        />
      ) : null}
      {done ? (
        <View style={{ gap: 8 }}>
          <Txt variant="caption">Output: {done}</Txt>
          <Image source={{ uri: done }} style={{ width: '100%', aspectRatio: 1.5 }} contentFit="contain" />
        </View>
      ) : null}
    </ScrollView>
  );
}
