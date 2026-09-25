import { money, pct, plural } from '../format';

it('formats whole and fractional dollars', () => {
  expect(money(4)).toBe('$4');
  expect(money(35.4)).toBe('$35.40');
});

it('caps percentages at 100', () => {
  expect(pct(14, 18)).toBe(78);
  expect(pct(30, 18)).toBe(100);
  expect(pct(1, 0)).toBe(0);
});

it('pluralizes', () => {
  expect(plural(1, 'donor')).toBe('1 donor');
  expect(plural(5, 'donor')).toBe('5 donors');
});
