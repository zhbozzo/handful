import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { proofPhoto } from '@/data/photos';
import { orgById } from '@/data/seed';
import type { Cause } from '@/data/types';
import { ago, money } from '@/lib/format';
import { color, radius, shadow, space } from '@/theme/tokens';

import { Icon } from './Icon';
import { OrgLine } from './OrgLine';
import { PressableScale } from './PressableScale';
import { Txt } from './Txt';

/** A finished cause, shown the way donors experience it: the protected thank-you photo and the note. */
export function DeliveredCard({ cause }: { cause: Cause }) {
  const ev = cause.evidence;
  const photo = proofPhoto(ev);
  const org = orgById(cause.orgId);
  const at = cause.timeline.find((t) => t.status === 'delivered')?.at ?? cause.createdAt;
  return (
    <PressableScale
      onPress={() => router.push(`/proof/${cause.id}`)}
      scaleTo={0.98}
      style={styles.card}
      accessibilityRole="button"
      accessibilityLabel={`${cause.title}, delivered ${ago(at)}. See the receipt and photo.`}>
      {photo ? (
        <View>
          <Image source={photo} style={styles.photo} contentFit="cover" transition={200} />
          <View style={styles.chip}>
            <Icon name="checkmark.seal.fill" size={12} color={color.leaf} />
            <Txt variant="caption" color={color.leaf} style={{ fontSize: 12, fontWeight: '700' }}>
              Delivered {ago(at)}
            </Txt>
          </View>
        </View>
      ) : null}
      <View style={{ padding: space.md, gap: 8 }}>
        <Txt variant="bodyStrong" numberOfLines={2}>
          {cause.title}
        </Txt>
        {ev ? (
          <Txt variant="callout" color={color.ink} numberOfLines={2}>
            “{ev.note}”
          </Txt>
        ) : null}
        <View style={styles.foot}>
          <OrgLine org={org} size="sm" />
          <Txt variant="caption" color={color.ink} style={{ fontWeight: '700' }}>
            {money(cause.raised)} · receipt →
          </Txt>
        </View>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: color.card, borderRadius: radius.lg, overflow: 'hidden', ...shadow.card },
  photo: { height: 170, backgroundColor: color.paperDeep },
  chip: {
    position: 'absolute',
    left: 10,
    top: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.94)',
  },
  foot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
});
