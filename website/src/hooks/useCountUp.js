import { useEffect, useRef, useState } from 'react';

/**
 * Smoothly animates a number from 0 to `target` over `duration` ms.
 * Triggers only once when `start` becomes true (tie to `useInView`).
 */
export default function useCountUp(target, { duration = 1400, start = true, decimals = 0 } = {}) {
  const [value, setValue] = useState(0);
  const rafId = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    if (!start || started.current) return;
    if (typeof target !== 'number' || Number.isNaN(target)) {
      setValue(target);
      return;
    }
    started.current = true;
    const startTs = performance.now();
    const from = 0;

    const tick = (now) => {
      const elapsed = now - startTs;
      const t = Math.min(1, elapsed / duration);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3);
      const next = from + (target - from) * eased;
      setValue(decimals > 0 ? Number(next.toFixed(decimals)) : Math.round(next));
      if (t < 1) rafId.current = requestAnimationFrame(tick);
    };
    rafId.current = requestAnimationFrame(tick);
    return () => rafId.current && cancelAnimationFrame(rafId.current);
  }, [target, duration, start, decimals]);

  return value;
}
