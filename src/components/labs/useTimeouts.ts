import { useCallback, useEffect, useRef } from 'react';

/** setTimeout helper that cancels every pending timer when the component unmounts. */
export function useTimeouts() {
  const ids = useRef<number[]>([]);

  const after = useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(() => {
      ids.current = ids.current.filter(x => x !== id);
      fn();
    }, ms);
    ids.current.push(id);
    return id;
  }, []);

  const clear = useCallback(() => {
    ids.current.forEach(id => window.clearTimeout(id));
    ids.current = [];
  }, []);

  useEffect(() => clear, [clear]);

  return { after, clear };
}
