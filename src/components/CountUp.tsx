import { useEffect, useRef, useState } from 'react';

import { Txt, type TxtVariant } from './Txt';

/** Eases a number from its previous value to `value` (whole units — money, counts). */
export function useCountUp(value: number, duration = 650, initial = value) {
  const [shown, setShown] = useState(initial);
  const from = useRef(initial);

  useEffect(() => {
    const start = from.current;
    if (start === value) return;
    let frame = 0;
    const t0 = Date.now();
    const step = () => {
      const t = Math.min(1, (Date.now() - t0) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(Math.round(start + (value - start) * eased));
      if (t < 1) frame = requestAnimationFrame(step);
      else from.current = value;
    };
    frame = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(frame);
      from.current = value;
    };
  }, [value, duration]);

  return shown;
}

type Props = {
  value: number;
  /** Rendered around the number, e.g. (n) => `$${n}`. */
  format?: (n: number) => string;
  variant?: TxtVariant;
  color?: string;
  style?: React.ComponentProps<typeof Txt>['style'];
  duration?: number;
  /** Start value on first render; defaults to `value` (no entrance animation). */
  from?: number;
};

export function CountUp({ value, format = String, variant = 'number', color, style, duration, from }: Props) {
  const n = useCountUp(value, duration, from);
  return (
    <Txt variant={variant} color={color} style={style}>
      {format(n)}
    </Txt>
  );
}
