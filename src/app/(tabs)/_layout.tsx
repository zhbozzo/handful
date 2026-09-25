import { Redirect } from 'expo-router';
import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { useStore } from '@/store/useStore';
import { color } from '@/theme/tokens';

export default function TabsLayout() {
  const onboarded = useStore((s) => s.onboarded);
  const unread = useStore((s) => s.inbox.filter((i) => !i.read).length);

  if (!onboarded) return <Redirect href="/onboarding" />;

  return (
    <NativeTabs tintColor={color.ink} iconColor={{ default: color.ink3, selected: color.ink }} minimizeBehavior="never">
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Causes</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'square.grid.2x2', selected: 'square.grid.2x2.fill' }} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="impact">
        <NativeTabs.Trigger.Label>Your impact</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'hands.and.sparkles', selected: 'hands.and.sparkles.fill' }} />
        {unread > 0 ? <NativeTabs.Trigger.Badge>{String(unread)}</NativeTabs.Trigger.Badge> : null}
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="studio">
        <NativeTabs.Trigger.Label>Nonprofits</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'building.2', selected: 'building.2.fill' }} />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
