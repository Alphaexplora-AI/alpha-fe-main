import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { LoadingRows, Skeleton, SkeletonConversation, SkeletonDetail, SkeletonList, SkeletonPageHeader, SkeletonRegion, SkeletonStats, SkeletonTable, SkeletonText } from './skeleton';

const count = (html: string, pattern: RegExp) => html.match(pattern)?.length ?? 0;

describe('skeleton primitives', () => {
  it('only pulses for motion-safe users and uses theme tokens', () => {
    const html = renderToStaticMarkup(<Skeleton className="h-3" />);
    expect(html).toContain('motion-safe:animate-pulse');
    expect(html).not.toMatch(/(^|\s)animate-pulse/);
    expect(html).toContain('bg-surface-high');
    expect(html).toContain('aria-hidden="true"');
  });

  it('announces a region once with aria-busy and a hidden label', () => {
    const html = renderToStaticMarkup(<SkeletonRegion label="Loading tickets"><SkeletonTable rows={4} /><SkeletonText /></SkeletonRegion>);
    expect(html).toContain('aria-busy="true"');
    expect(count(html, /role="status"/g)).toBe(1);
    expect(html).toContain('<span role="status" class="sr-only">Loading tickets</span>');
  });

  it('renders composites bare when unlabelled so they can be composed', () => {
    for (const node of [<SkeletonText key="t" />, <SkeletonTable key="b" />, <SkeletonList key="l" />, <SkeletonPageHeader key="h" />, <SkeletonStats key="s" />, <SkeletonDetail key="d" />]) {
      const html = renderToStaticMarkup(node);
      expect(html).not.toContain('role="status"');
      expect(html).not.toContain('aria-busy');
    }
  });

  it('wraps a composite in a region when it has a label', () => {
    const html = renderToStaticMarkup(<SkeletonList label="Loading clients" />);
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('Loading clients');
  });

  it('draws the requested shape counts', () => {
    expect(count(renderToStaticMarkup(<SkeletonText lines={5} />), /h-2\.5/g)).toBe(5);
    expect(count(renderToStaticMarkup(<SkeletonTable rows={4} columns={3} header />), /data-skeleton="table-row"/g)).toBe(5);
    expect(count(renderToStaticMarkup(<SkeletonList rows={2} variant="card" />), /data-skeleton="list-row"/g)).toBe(2);
    expect(count(renderToStaticMarkup(<SkeletonStats count={3} />), /data-skeleton="stat"/g)).toBe(3);
  });

  it('alternates conversation bubbles and adds a composer on request', () => {
    const html = renderToStaticMarkup(<SkeletonConversation messages={4} composer />);
    expect(count(html, /data-skeleton="message"/g)).toBe(4);
    expect(count(html, /flex-row-reverse/g)).toBe(2);
    expect(html).toContain('h-20 w-full');
  });

  it('puts an avatar in the first table cell when asked', () => {
    expect(count(renderToStaticMarkup(<SkeletonTable rows={2} avatar />), /rounded-full/g)).toBe(2);
    expect(renderToStaticMarkup(<SkeletonTable rows={2} />)).not.toContain('rounded-full');
  });

  it('lays a table out with one grid track per column', () => {
    expect(renderToStaticMarkup(<SkeletonTable columns={4} rows={1} />)).toContain('grid-template-columns:2fr repeat(3, minmax(0, 1fr))');
  });

  it('shows page header actions and tabs on request', () => {
    const html = renderToStaticMarkup(<SkeletonPageHeader actions={2} tabs={5} />);
    expect(count(html, /h-8 w-20/g)).toBe(2);
    expect(count(html, /h-3 w-16/g)).toBe(5);
  });

  it('includes the side column of a detail layout only when asked', () => {
    expect(renderToStaticMarkup(<SkeletonDetail />)).toContain('data-skeleton="aside"');
    expect(renderToStaticMarkup(<SkeletonDetail aside={false} />)).not.toContain('data-skeleton="aside"');
  });

  it('keeps LoadingRows backwards compatible and busy', () => {
    const html = renderToStaticMarkup(<LoadingRows label="Loading projects" layout="table" rows={2} />);
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('Loading projects');
    expect(count(html, /grid-cols-\[2fr_1fr_1fr\]/g)).toBe(2);
  });
});
