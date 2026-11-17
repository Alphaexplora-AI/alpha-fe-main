import { describe, expect, it } from 'vitest';
import { elapsedLabel, runningLabel } from './runningWork';

const item = (id: string) => ({ id, kind: 'agent' as const, title: id, activity: 'Writing code' });

describe('running work labels', () => {
  it('stays quiet when nothing runs', () => {
    expect(runningLabel({ running: [], interrupted: [] })).toEqual({ text: 'Nothing running', tone: 'idle' });
  });

  it('counts running work, and adds interrupted runs when there are any', () => {
    expect(runningLabel({ running: [item('a'), item('b')], interrupted: [] })).toEqual({ text: '2 running', tone: 'running' });
    expect(runningLabel({ running: [item('a')], interrupted: [item('c')] })).toEqual({ text: '1 running · 1 interrupted', tone: 'running' });
    expect(runningLabel({ running: [], interrupted: [item('c')] })).toEqual({ text: '1 interrupted', tone: 'interrupted' });
  });

  it('says how long something has been going in plain units', () => {
    const now = Date.parse('2026-11-18T10:00:00Z');
    expect(elapsedLabel('2026-11-18T09:59:40Z', now)).toBe('just now');
    expect(elapsedLabel('2026-11-18T09:56:00Z', now)).toBe('4 min');
    expect(elapsedLabel('2026-11-18T07:55:00Z', now)).toBe('2 h 5 min');
    expect(elapsedLabel('2026-11-18T08:00:00Z', now)).toBe('2 h');
    expect(elapsedLabel('2026-11-14T10:00:00Z', now)).toBe('4 days');
    expect(elapsedLabel(undefined, now)).toBeUndefined();
  });
});
