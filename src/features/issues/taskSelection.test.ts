import { describe, expect, it } from 'vitest';
import type { Issue } from '@/shared/types';
import { selectionState, splitForArchive, withTasks } from './taskSelection';

const task = (id: string, archivedAt?: string) => ({ id, identifier: id.toUpperCase(), archivedAt }) as Issue;

describe('task selection', () => {
  it('reports a section as none, some or all selected', () => {
    expect(selectionState(['a', 'b'], new Set())).toBe('none');
    expect(selectionState(['a', 'b'], new Set(['a', 'z']))).toBe('some');
    expect(selectionState(['a', 'b'], new Set(['a', 'b']))).toBe('all');
  });

  it('adds and removes tasks without changing the set it was given', () => {
    const before = new Set(['a']);
    expect([...withTasks(before, ['b', 'c'], true)]).toEqual(['a', 'b', 'c']);
    expect([...withTasks(before, ['a'], false)]).toEqual([]);
    expect([...before]).toEqual(['a']);
  });

  it('holds back tasks with a build attached and drops ones already archived', () => {
    const issues = [task('tes2-1'), task('tes2-106'), task('eco-1', '2026-11-17T00:00:00Z'), task('cap-101')];
    const { archive, held } = splitForArchive(issues, new Set(['tes2-1', 'tes2-106', 'eco-1']), issue => issue.id === 'tes2-106');
    expect(archive.map(issue => issue.id)).toEqual(['tes2-1']);
    expect(held.map(issue => issue.id)).toEqual(['tes2-106']);
  });
});
