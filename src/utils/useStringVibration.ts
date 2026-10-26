import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Wobble state for guitar strings. `vibrating[stringNumber]` is a token that changes on every new
 * pluck (use it as a React `key` so the CSS animation restarts) and disappears once the string has
 * settled. Every string has its own entry, so a strum can wobble all six at once.
 */
export function useStringVibration(durationMs = 600) {
  const [vibrating, setVibrating] = useState<Record<number, number>>({});
  const nextToken = useRef(0);
  const timers = useRef(new Set<number>());

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(t => window.clearTimeout(t));
  }, []);

  const later = useCallback((fn: () => void, delayMs: number) => {
    const id = window.setTimeout(() => {
      timers.current.delete(id);
      fn();
    }, delayMs);
    timers.current.add(id);
  }, []);

  /** Make a string wobble, optionally after `delayMs` (to line up with a strum's timing). */
  const pulse = useCallback(
    (stringNumber: number, delayMs = 0) => {
      const start = () => {
        const token = ++nextToken.current;
        setVibrating(v => ({ ...v, [stringNumber]: token }));
        later(() => {
          setVibrating(v => {
            if (v[stringNumber] !== token) return v; // plucked again meanwhile
            const { [stringNumber]: _settled, ...rest } = v;
            return rest;
          });
        }, durationMs);
      };
      if (delayMs > 0) later(start, delayMs);
      else start();
    },
    [durationMs, later]
  );

  return { vibrating, pulse };
}
