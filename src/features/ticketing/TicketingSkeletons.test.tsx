import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { TicketDetailSkeleton, TicketQueueSkeleton } from './TicketingSkeletons';

const count = (html: string, pattern: RegExp) => html.match(pattern)?.length ?? 0;

describe('ticketing skeletons', () => {
  it('announce a ticket detail once and shape the conversation and context column', () => {
    const html = renderToStaticMarkup(<TicketDetailSkeleton label="Loading ticket" />);
    expect(count(html, /role="status"/g)).toBe(1);
    expect(html).toContain('aria-busy="true"');
    expect(count(html, /data-skeleton="message"/g)).toBe(3);
    expect(html).toContain('data-skeleton="ticket-context"');
    expect(html).not.toContain('data-skeleton="progress"');
  });

  it('adds the client progress line and can drop the context column', () => {
    const html = renderToStaticMarkup(<TicketDetailSkeleton label="Loading request" stepper context={false} />);
    expect(html).toContain('data-skeleton="progress"');
    expect(html).not.toContain('data-skeleton="ticket-context"');
  });

  it('draws the queue as a table on wide screens and stacked rows on phones under one label', () => {
    const html = renderToStaticMarkup(<TicketQueueSkeleton label="Loading tickets" rows={4} />);
    expect(count(html, /role="status"/g)).toBe(1);
    expect(count(html, /data-skeleton="table-row"/g)).toBe(5);
    expect(count(html, /data-skeleton="queue-card"/g)).toBe(4);
    expect(html).toContain('hidden md:block');
    expect(html).toContain('md:hidden');
  });
});
