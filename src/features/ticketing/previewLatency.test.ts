import { describe, expect, it } from 'vitest';
import { previewLatency, withPreviewLatency } from './previewLatency';

describe('preview latency switch', () => {
  it('reads a capped delay or a hold from the query string', () => {
    expect(previewLatency('')).toBeNull();
    expect(previewLatency('?preview-latency=1500')).toBe(1500);
    expect(previewLatency('?preview-latency=999999')).toBe(30_000);
    expect(previewLatency('?preview-latency=hold')).toBe('hold');
    expect(previewLatency('?preview-latency=-5')).toBeNull();
    expect(previewLatency('?preview-latency=soon')).toBeNull();
  });

  it('leaves reads untouched when no latency is requested', () => {
    const read = async () => 'sample';
    expect(withPreviewLatency(read)).toBe(read);
  });
});
