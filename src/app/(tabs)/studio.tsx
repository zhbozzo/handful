import { router } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { CoverThumb } from '@/components/CoverArt';
import { Icon } from '@/components/Icon';
import { OrgLine } from '@/components/OrgLine';
import { Pill } from '@/components/Pill';
import { Txt } from '@/components/Txt';
import { orgById, STUDIO_ORG_ID } from '@/data/seed';
import { money } from '@/lib/format';
import { useStore } from '@/store/useStore';
import { color, radius, shadow, space } from '@/theme/tokens';

export default function StudioScreen() {
  const insets = useSafeAreaInsets();
  const causes = useStore((s) => s.causes);
  const resetDemo = useStore((s) => s.resetDemo);
  const org = orgById(STUDIO_ORG_ID);

  const needsProof = causes.filter((c) => c.status === 'funded' || c.status === 'purchased');
  const mine = causes.filter((c) => c.orgId === STUDIO_ORG_ID && c.status === 'open');

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: color.paper }}
      contentContainerStyle={{ paddingTop: insets.top + space.md, paddingBottom: 120, paddingHorizontal: space.lg, gap: space.xl }}
      showsVerticalScrollIndicator={false}>
      <View style={{ gap: space.sm }}>
        <Pill label="Nonprofit view · demo" tone="shield" symbol="building.2.fill" />
        <Txt variant="title">Nonprofit studio</Txt>
        <Txt variant="callout">
          How a verified nonprofit posts a need and, later, the proof. In the real product this lives behind a verified
          account; here you can try it as a demo nonprofit.
        </Txt>
        <View style={styles.orgCard}>
          <OrgLine org={org} sub="Demo nonprofit · verification simulated" />
        </View>
      </View>

      <Pressable onPress={() => router.push('/nonprofit/new')} style={styles.hero} accessibilityRole="button">
        <View style={styles.heroIcon}>
          <Icon name="plus" size={22} color={color.ink} weight="bold" />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Txt variant="headline" color={color.white}>
            Post a new cause
          </Txt>
          <Txt variant="caption" color="rgba(255,255,255,0.7)">
            Need → budget → story → photo → Privacy Shield → publish
          </Txt>
        </View>
        <Icon name="chevron.right" size={15} color="rgba(255,255,255,0.7)" />
      </Pressable>

      <View style={{ gap: space.sm }}>
        <Txt variant="micro">Funded · waiting for proof</Txt>
        {needsProof.length === 0 ? (
          <Txt variant="caption">Nothing waiting. When a cause is fully funded it shows up here.</Txt>
        ) : (
          needsProof.map((c) => (
            <View key={c.id} style={styles.row}>
              <CoverThumb cause={c} size={48} />
              <View style={{ flex: 1, gap: 2 }}>
                <Txt variant="bodyStrong" numberOfLines={1}>
                  {c.title}
                </Txt>
                <Txt variant="caption" numberOfLines={1}>
                  {orgById(c.orgId).name} · {money(c.raised)} raised
                </Txt>
              </View>
              <Button label="Post proof" kind="leaf" compact onPress={() => router.push(`/nonprofit/proof/${c.id}`)} />
            </View>
          ))
        )}
      </View>

      <View style={{ gap: space.sm }}>
        <Txt variant="micro">Your open causes</Txt>
        {mine.map((c) => (
          <Pressable key={c.id} onPress={() => router.push(`/cause/${c.id}`)} style={styles.row} accessibilityRole="button">
            <CoverThumb cause={c} size={48} />
            <View style={{ flex: 1, gap: 2 }}>
              <Txt variant="bodyStrong" numberOfLines={1}>
                {c.title}
              </Txt>
              <Txt variant="caption">
                {money(c.raised)} of {money(c.goal)} · {c.donors} donors
              </Txt>
            </View>
            <Icon name="chevron.right" size={13} color={color.ink3} />
          </Pressable>
        ))}
      </View>

      <Button
        label="Reset demo data"
        kind="ghost"
        compact
        symbol="arrow.counterclockwise"
        onPress={() =>
          Alert.alert('Reset demo data?', 'Causes, your gifts and updates go back to the starting demo state.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Reset', style: 'destructive', onPress: resetDemo },
          ])
        }
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  orgCard: { backgroundColor: color.card, borderRadius: radius.lg, padding: space.md, marginTop: 4 },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: space.lg,
    borderRadius: radius.xl,
    backgroundColor: color.ink,
    ...shadow.lift,
  },
  heroIcon: { width: 46, height: 46, borderRadius: 23, backgroundColor: color.sun, alignItems: 'center', justifyContent: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: space.sm,
    backgroundColor: color.card,
    borderRadius: radius.lg,
  },
});
