import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { Issue } from '@/shared/types';

vi.hoisted(() => { (globalThis as { window?: unknown }).window ??= globalThis; });

import { ArchiveSelectedBar } from './ArchiveSelectedBar';

const task = (identifier: string) => ({ id: identifier.toLowerCase(), identifier }) as Issue;
const render = (archive: Issue[], held: Issue[]) =>
  renderToStaticMarkup(<ArchiveSelectedBar archive={archive} held={held} onArchive={() => undefined} onClear={() => undefined} />);

describe('ArchiveSelectedBar', () => {
  it('stays hidden until something is selected', () => {
    expect(render([], [])).toBe('');
  });

  it('counts the selection and names tasks that must keep their build', () => {
    const html = render([task('TES2-1'), task('TES2-2')], [task('TES2-106')]);
    expect(html).toContain('3 tasks selected');
    expect(html).toContain('Archive 2 tasks');
    expect(html).toContain('TES2-106: stop the build first');
  });

  it('cannot archive when every selected task still has a build', () => {
    expect(render([], [task('CAP-102')])).toMatch(/<button[^>]*disabled=""[^>]*>.*?Archive 0 tasks/);
  });
});
