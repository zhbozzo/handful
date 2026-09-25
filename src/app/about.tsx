import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { Txt } from '@/components/Txt';
import { color, radius, space } from '@/theme/tokens';

const FLOW = [
  { symbol: 'checkmark.seal.fill', title: 'A verified nonprofit spots a need', body: 'Only vetted nonprofits can post. Never anonymous individuals.' },
  { symbol: 'list.bullet.rectangle.fill', title: 'They break it into a small cause', body: 'Items, prices and a goal — usually under $60.' },
  { symbol: 'circle.circle.fill', title: 'People fund it, often in a day', body: 'Anyone can give a few dollars, or complete what’s left.' },
  { symbol: 'receipt.fill', title: 'The nonprofit buys the items', body: 'Money goes to the nonprofit, never to an individual.' },
  { symbol: 'checkmark.shield.fill', title: 'Proof, without exposure', body: 'Receipt + a delivery photo processed by Privacy Shield.' },
];

const DEMO = [
  'All nonprofits, causes, amounts and donor counts are fictional seed data.',
  'Gifts are RevenueCat Test Store purchases. No real money moves and nothing is delivered.',
  'Verification and consent checks are simulated.',
  'Your impact screen only counts what you do in this app.',
];

export default function AboutSheet() {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={{ backgroundColor: color.paper }}
      contentContainerStyle={{ padding: space.lg, paddingTop: space.xxl, paddingBottom: insets.bottom + space.xl, gap: space.xl }}>
      <View style={{ gap: space.sm }}>
        <Txt variant="title">
          How Handful{' '}
          <Txt variant="title" italic>
            works
          </Txt>
        </Txt>
        <Txt variant="callout">Help should be easy to give and easy to trust.</Txt>
      </View>

      <View style={styles.card}>
        {FLOW.map((f, i) => (
          <View key={f.title} style={styles.step}>
            <View style={styles.num}>
              <Icon name={f.symbol} size={16} color={color.ink} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Txt variant="bodyStrong">
                {i + 1}. {f.title}
              </Txt>
              <Txt variant="caption">{f.body}</Txt>
            </View>
          </View>
        ))}
      </View>

      <View style={[styles.card, { backgroundColor: color.sunSoft, gap: 10 }]}>
        <Txt variant="micro" color={color.sunDeep}>
          This is a demo
        </Txt>
        {DEMO.map((d) => (
          <View key={d} style={{ flexDirection: 'row', gap: 8 }}>
            <Txt variant="callout" color={color.ink}>
              •
            </Txt>
            <Txt variant="callout" color={color.ink} style={{ flex: 1 }}>
              {d}
            </Txt>
          </View>
        ))}
      </View>

      <Txt variant="caption" color={color.ink3}>
        In production, gifts would be processed with Apple Pay by Apple-approved nonprofits (App Store Guideline
        3.2.1(vi)) and paid out to the nonprofit — never to individuals.
      </Txt>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: color.card, borderRadius: radius.lg, padding: space.md, gap: 16 },
  step: { flexDirection: 'row', gap: 12 },
  num: { width: 32, height: 32, borderRadius: 10, backgroundColor: color.paperDeep, alignItems: 'center', justifyContent: 'center' },
});
