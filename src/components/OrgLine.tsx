import { StyleSheet, View } from 'react-native';

import type { Organization } from '@/data/types';
import { color } from '@/theme/tokens';

import { Icon } from './Icon';
import { Txt } from './Txt';

export function OrgAvatar({ org, size = 28 }: { org: Organization; size?: number }) {
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: org.tint }]}>
      <Txt variant="micro" color={color.white} style={{ fontSize: size * 0.36, letterSpacing: 0.2 }}>
        {org.initials}
      </Txt>
    </View>
  );
}

/** "Ronda Nocturna ✓" — verification is the trust layer, so it is always visible. */
export function OrgLine({ org, size = 'md', sub }: { org: Organization; size?: 'sm' | 'md'; sub?: string }) {
  const small = size === 'sm';
  return (
    <View style={styles.row} accessibilityLabel={`${org.name}, verified nonprofit (demo)`}>
      <OrgAvatar org={org} size={small ? 22 : 30} />
      <View style={{ flexShrink: 1 }}>
        <View style={styles.nameRow}>
          <Txt
            variant={small ? 'caption' : 'bodyStrong'}
            color={color.ink}
            numberOfLines={1}
            style={small ? { fontWeight: '600' } : null}>
            {org.name}
          </Txt>
          <Icon name="checkmark.seal.fill" size={small ? 13 : 15} color={color.leaf} />
        </View>
        {sub ? (
          <Txt variant="caption" numberOfLines={1}>
            {sub}
          </Txt>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: { alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
