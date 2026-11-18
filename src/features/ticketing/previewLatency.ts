/**
 * Development preview only: simulates a slow network so loading skeletons can be inspected.
 * `?preview-latency=1500` delays every sample read by 1.5s (capped at 30s);
 * `?preview-latency=hold` never resolves, freezing each view in its loading state.
 */
export function previewLatency(search = typeof location === 'undefined' ? '' : location.search): number | 'hold' | null {
  const value = new URLSearchParams(search).get('preview-latency');
  if (!value) return null;
  if (value === 'hold') return 'hold';
  const ms = Number(value);
  return Number.isFinite(ms) && ms > 0 ? Math.min(ms, 30_000) : null;
}

export function previewDelay(latency = previewLatency()): Promise<void> {
  if (latency === null) return Promise.resolve();
  if (latency === 'hold') return new Promise(() => undefined);
  return new Promise(resolve => setTimeout(resolve, latency));
}

const wrapped = new WeakMap<object, unknown>();

/**
 * Wraps a sample read so it waits for the configured preview latency first.
 * Returns the read itself when no latency is set, and the same wrapper on every call,
 * so proxy lookups keep stable function identities.
 */
export function withPreviewLatency<Read extends (...args: never[]) => unknown>(read: Read): Read {
  if (previewLatency() === null) return read;
  if (!wrapped.has(read)) wrapped.set(read, async (...args: Parameters<Read>) => { await previewDelay(); return read(...args); });
  return wrapped.get(read) as Read;
}
