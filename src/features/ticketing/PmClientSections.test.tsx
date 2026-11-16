import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

vi.hoisted(() => { (globalThis as { window?: unknown }).window ??= globalThis; });

import { ClientConversations, ClientOverview, loadClientRequests } from './PmClientSections';
import type { PmClientConversation, PmClientSummary, PmTicketQueueItem, PmTicketQueuePage } from './pmApi';

const client: PmClientSummary = {
  key: 'client:ana', displayName: 'Ana Cruz', company: 'Resort Co', access: 'active',
  tickets: { needsPm: 1, waitingClient: 1, open: 2, closed: 1, unlinkedOpen: 0, accessRevoked: 0 },
  projects: [], lastActivityAt: '2026-11-15T10:00:00.000Z',
};
const request = (id: string, title: string, status: PmTicketQueueItem['status'], actionOwner: 'pm' | 'client' | null, updatedAt: string) => ({
  id, reference: id, title, status, createdAt: updatedAt, updatedAt, closedAt: null, readOnly: false, writesAvailable: true, requestedAction: null,
  internal: { updatedAt, actionOwner, nextAction: null, projectId: null, projectName: null,
    clientGroup: { key: client.key, displayName: client.displayName }, clientAccessActive: true, clientInvitation: null },
}) as unknown as PmTicketQueueItem;
const requests = [
  request('t1', 'Booking widget', 'in_progress', 'client', '2026-11-10T10:00:00.000Z'),
  request('t2', 'Fix checkout', 'under_review', 'pm', '2026-11-12T10:00:00.000Z'),
  request('t3', 'Old logo', 'closed', null, '2026-10-01T10:00:00.000Z'),
];
const conversations: PmClientConversation[] = [
  { ticketId: 't1', latestMessage: { id: 'm1', author: 'client', preview: 'Can we add dates?', truncated: true, createdAt: '2026-11-14T10:00:00.000Z' } },
  { ticketId: 't2', latestMessage: null },
];

describe('Client overview', () => {
  it('uses the server counts and lists open requests with the one needing the PM first', () => {
    const html = renderToStaticMarkup(<ClientOverview client={client} requests={requests} conversations={conversations} onOpenRequest={() => undefined} />);
    for (const shown of ['Need you', 'Waiting on client', 'Open requests', '1 needs you', 'Ana Cruz wrote on Booking widget']) expect(html).toContain(shown);
    expect(html.indexOf('Fix checkout')).toBeLessThan(html.indexOf('Booking widget'));
    expect(html.split('Recent activity')[0]).not.toContain('Old logo');
  });
});

describe('Client conversations', () => {
  it('shows one row per request with the latest message, newest first', () => {
    const html = renderToStaticMarkup(<ClientConversations client={client} requests={requests} conversations={conversations} error="" onOpenRequest={() => undefined} />);
    expect(html).toContain('Ana Cruz: Can we add dates?…');
    expect(html).toContain('No messages yet');
    expect(html.indexOf('Booking widget')).toBeLessThan(html.indexOf('Fix checkout'));
  });
  it('shows the error instead of rows', () => {
    const html = renderToStaticMarkup(<ClientConversations client={client} requests={requests} conversations={null} error="Conversations could not be loaded." onOpenRequest={() => undefined} />);
    expect(html).toContain('role="alert"');
    expect(html).not.toContain('Booking widget');
  });
});

describe('Loading a client’s requests', () => {
  it('reads every page for this client only', async () => {
    const pages: Record<string, PmTicketQueuePage> = {
      start: { items: requests.slice(0, 2), nextCursor: 'next', counters: null } as unknown as PmTicketQueuePage,
      next: { items: requests.slice(2), nextCursor: null, counters: null } as unknown as PmTicketQueuePage,
    };
    const list = vi.fn(async (options: { after?: string | null; clientGroupKey?: string }) => pages[options.after ?? 'start']);
    const result = await loadClientRequests(list as never, 'client:ana');
    expect(result.items.map(item => item.id)).toEqual(['t1', 't2', 't3']);
    for (const [options] of list.mock.calls) expect(options.clientGroupKey).toBe('client:ana');
  });
});
