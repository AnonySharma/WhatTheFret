/** Placeholder shown while a lazily loaded tab, lesson or lab downloads. */
export function PanelFallback() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center justify-center gap-3 py-16 rounded-2xl bg-ink-900/60 border border-ink-800 text-ink-400 text-xs font-semibold"
    >
      <span className="w-4 h-4 rounded-full border-2 border-ink-700 border-t-brand-400 animate-spin" aria-hidden />
      Loading...
    </div>
  );
}
