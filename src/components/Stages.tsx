import { Fragment } from 'react';
import { StyleSheet, View } from 'react-native';

import { color } from '@/theme/tokens';

import { Icon } from './Icon';
import { Txt } from './Txt';

/**
 * A compact step tracker: done steps are green, the next one has a sun ring.
 * `compact` shows only the dots and the next step's label, for narrow cards.
 */
export function Stages({ labels, done, compact = false }: { labels: string[]; done: number; compact?: boolean }) {
  return (
    <View
      style={styles.row}
      accessible
      accessibilityLabel={`${labels.slice(0, done).join(', ') || 'Nothing'} done.${labels[done] ? ` Next: ${labels[done]}.` : ''}`}>
      {labels.map((label, i) => {
        const isDone = i < done;
        const isNext = i === done;
        return (
          <Fragment key={label}>
            {i > 0 ? <View style={[styles.line, isDone && { backgroundColor: color.leaf }]} /> : null}
            <View style={styles.step}>
              <View style={[styles.dot, isDone && styles.dotDone, isNext && styles.dotNext]}>
                {isDone ? <Icon name="checkmark" size={9} color={color.white} weight="heavy" /> : null}
              </View>
              {!compact || isNext ? (
                <Txt
                  variant="caption"
                  color={isDone ? color.leaf : isNext ? color.ink : color.ink3}
                  style={{ fontSize: 12, fontWeight: isNext ? '700' : '500' }}>
                  {label}
                </Txt>
              ) : null}
            </View>
          </Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  step: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  line: { flex: 1, height: 2, borderRadius: 1, backgroundColor: color.line, marginHorizontal: 6 },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: color.paperDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotDone: { backgroundColor: color.leaf },
  dotNext: { backgroundColor: color.card, borderWidth: 2, borderColor: color.sun },
});
