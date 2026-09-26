import { Redirect } from 'expo-router';
import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { useStore } from '@/store/useStore';
import { color, font } from '@/theme/tokens';

export default function TabsLayout() {
  const onboarded = useStore((s) => s.onboarded);
  const unread = useStore((s) => s.inbox.filter((i) => !i.read).length);

  if (!onboarded) return <Redirect href="/onboarding" />;

  return (
    <NativeTabs
      tintColor={color.ink}
      iconColor={{ default: color.ink3, selected: color.ink }}
      labelStyle={{
        default: { fontFamily: font.semibold, fontSize: 10, color: color.ink3 },
        selected: { fontFamily: font.bold, fontSize: 10, color: color.ink },
      }}
      badgeBackgroundColor={color.sunDeep}
      minimizeBehavior="never">
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Causes</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'heart.circle', selected: 'heart.circle.fill' }} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="impact">
        <NativeTabs.Trigger.Label>Your impact</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'gift', selected: 'gift.fill' }} />
        {unread > 0 ? <NativeTabs.Trigger.Badge>{String(unread)}</NativeTabs.Trigger.Badge> : null}
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="studio">
        <NativeTabs.Trigger.Label>Nonprofits</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'building.2', selected: 'building.2.fill' }} />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
