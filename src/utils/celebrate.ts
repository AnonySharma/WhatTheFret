import type { Options } from 'canvas-confetti';

/** Fire confetti. The library is loaded on first use so it stays out of the main bundle. */
export function celebrate(options?: Options): void {
  void import('canvas-confetti').then(m => m.default(options)).catch(() => {});
}
