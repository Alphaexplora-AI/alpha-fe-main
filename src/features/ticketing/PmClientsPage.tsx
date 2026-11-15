import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ArrowLeft, ArrowUpRight, FolderKanban, RefreshCw, Search, ShieldCheck, ShieldOff, Users } from 'lucide-react';

import { useApp, useTabSessionState } from '@/app/AppContext';
import { ApiRequestError } from '@/shared/services/apiService';
import { LoadingRows } from '@/shared/components/ui/skeleton';
import { pmTicketApi, type PmClientSummary } from './pmApi';
import { PmTicketsView } from './PmTicketsView';
import { pmTicketsIntakeEnabled, usePmWorkflowActions } from './PmTicketsPage';

export type ClientSection = 'tickets' | 'projects' | 'access';
const SECTIONS: Array<{ id: ClientSection; label: string }> = [
  { id: 'tickets', label: 'Tickets' },
  { id: 'projects', label: 'Projects' },
  { id: 'access', label: 'Access' },
];

/**
 * Why the list could not load, in words a PM can act on. In the desktop app
 * ticket requests are relayed to the cloud, and the relay passes its failures
 * through: 503 without a cloud connection, 502 when the cloud cannot be
 * reached, 404 when the cloud predates this page.
 */
export function clientsLoadError(error: unknown): string {
  const status = error instanceof ApiRequestError ? error.status : null;
  if (status === 503) return 'Clients need a connection to your team’s Alpha cloud workspace. Connect this workspace, then refresh.';
  if (status === 502) return 'The Alpha cloud can’t be reached right now. Check your connection and refresh.';
  if (status === 404) return 'The client list isn’t available on the server yet. It appears once the server is updated.';
  if (status === 401) return 'Sign in again to see your clients.';
  if (status === 403) return 'Only project managers can see the client list.';
  return 'The client list could not be loaded. Refresh to try again.';
}

const plural = (count: number, one: string, many = `${one}s`) => `${count} ${count === 1 ? one : many}`;
const shortDate = (value: string) => new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

/**
 * Clients: every client account in the workspace, those needing the PM first.
 * A client opens on its own page with three tabs: its tickets (the Tickets
 * view locked to this client), the projects it can see, and its portal access.
 * The Tickets page remains the queue across all clients.
 */
export function PmClientsPage() {
  const { activeWorkspace, projects, setActiveTab } = useApp();
  const [clients, setClients] = useState<PmClientSummary[] | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [search, setSearch] = useState('');
  // Tab session state, so "View client" on a ticket can open a client here.
  const [selectedKey, setSelectedKey] = useTabSessionState<string | null>('clients.selected', null);
  const [section, setSection] = useTabSessionState<ClientSection>('clients.section', 'tickets');
  const [, setSelectedProject] = useTabSessionState<string | null>('projects.selectedProject', null);
  const workflowActions = usePmWorkflowActions();

  useEffect(() => {
    let current = true;
    setLoading(true); setError('');
    void pmTicketApi.listClients().then(items => {
      if (current) setClients(items);
    }).catch(failure => {
      if (current) { setClients(null); setError(clientsLoadError(failure)); }
    }).finally(() => {
      if (current) setLoading(false);
    });
    return () => { current = false; };
  }, [activeWorkspace?.id, refreshVersion]);

  const refresh = useCallback(() => setRefreshVersion(value => value + 1), []);
  const selected = clients?.find(client => client.key === selectedKey) ?? null;
  const knownProjectIds = useMemo(() => new Set(projects.map(project => project.id)), [projects]);

  // A saved selection from another workspace, or a client that no longer
  // exists, falls back to the list rather than an empty page.
  useEffect(() => {
    if (clients && selectedKey && !selected) setSelectedKey(null);
  }, [clients, selectedKey, selected, setSelectedKey]);

  return <PmClientsView clients={clients} error={error} loading={loading} search={search} onSearch={setSearch}
    selectedKey={selectedKey} onSelect={key => { setSelectedKey(key); if (key) setSection('tickets'); }}
    section={section} onSection={setSection} knownProjectIds={knownProjectIds} onRefresh={refresh}
    onOpenProject={projectId => { setSelectedProject(projectId); setActiveTab('projects'); }}
    onOpenInquiries={() => setActiveTab('inquiries')}
    renderTickets={key => <div className="pm-ticket-page pm-ticket-page--nested">
      <div className="pm-ticket-page__content">
        <PmTicketsView key={`${activeWorkspace?.id ?? 'none'}:${key}`} fixedClientGroupKey={key}
          intakeEnabled={pmTicketsIntakeEnabled} workflowActions={workflowActions} communicationEnabled />
      </div>
    </div>} />;
}

export interface PmClientsViewProps {
  clients: PmClientSummary[] | null;
  error: string;
  loading: boolean;
  search: string;
  onSearch: (value: string) => void;
  selectedKey: string | null;
  onSelect: (key: string | null) => void;
  section: ClientSection;
  onSection: (section: ClientSection) => void;
  /** Projects in this PM's project list; others are named but not linked. */
  knownProjectIds: ReadonlySet<string>;
  onRefresh: () => void;
  onOpenProject: (projectId: string) => void;
  onOpenInquiries: () => void;
  /** The Tickets tab's content for one client. */
  renderTickets: (clientKey: string) => ReactNode;
}

/** The Clients list and a client's page, from props alone. */
export function PmClientsView({ clients, error, loading, search, onSearch, selectedKey, onSelect, section, onSection,
  knownProjectIds, onRefresh, onOpenProject, onOpenInquiries, renderTickets }: PmClientsViewProps) {
  const selected = clients?.find(client => client.key === selectedKey) ?? null;
  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (clients ?? []).filter(client => !query
      || `${client.displayName} ${client.company ?? ''}`.toLowerCase().includes(query));
  }, [clients, search]);

  if (selected) {
    const openSection: ClientSection = SECTIONS.some(item => item.id === section) ? section : 'tickets';
    return <div className="flex h-full min-h-0 flex-col bg-canvas">
      <header className="shrink-0 border-b border-divider px-6 pb-0 pt-4">
        <button type="button" onClick={() => onSelect(null)} className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium text-content-muted hover:text-content">
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> All clients
        </button>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold text-content">{selected.displayName}</h1>
            <p className="mt-0.5 text-xs text-content-muted">
              {[selected.company, plural(selected.tickets.open, 'open request'), plural(selected.projects.length, 'project')].filter(Boolean).join(' · ')}
            </p>
          </div>
          <AccessBadge access={selected.access} />
        </div>
        <div role="tablist" aria-label="Client sections" className="mt-4 flex gap-5">
          {SECTIONS.map(item => <button key={item.id} type="button" role="tab" aria-selected={openSection === item.id}
            onClick={() => onSection(item.id)}
            className={`relative inline-flex h-9 items-center gap-1.5 text-[13px] font-medium ${openSection === item.id
              ? 'text-content after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:rounded-full after:bg-link'
              : 'text-content-muted hover:text-content-secondary'}`}>
            {item.label}
            {item.id === 'tickets' && selected.tickets.needsPm > 0 && <span className="rounded-full bg-selected px-1.5 text-[10.5px] font-semibold text-selected-content">{selected.tickets.needsPm}</span>}
          </button>)}
        </div>
      </header>

      <div role="tabpanel" aria-label={SECTIONS.find(item => item.id === openSection)?.label} className="min-h-0 flex-1">
        {openSection === 'tickets' && renderTickets(selected.key)}

        {openSection === 'projects' && <div className="h-full overflow-y-auto px-6 py-5">
          {selected.projects.length === 0
            ? <p className="text-[13px] text-content-muted">This client can’t see any projects yet. A project shows here once one of their requests is linked to it and shared with them.</p>
            : <ul className="divide-y divide-divider border-y border-divider">
              {selected.projects.map(project => <li key={project.projectId} className="flex items-center gap-3 py-3">
                <FolderKanban className="h-4 w-4 shrink-0 text-content-muted" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-content">{project.name}</p>
                  <p className="text-[11.5px] text-content-muted">{project.previewPublished ? 'Preview shared with the client' : 'No preview shared yet'}</p>
                </div>
                {/* Only link to a project this PM's project list has; never a dead link. */}
                {knownProjectIds.has(project.projectId) && <button type="button"
                  onClick={() => onOpenProject(project.projectId)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-link hover:text-link-hover">
                  Open project <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </button>}
              </li>)}
            </ul>}
          {selected.tickets.unlinkedOpen > 0 && <p className="mt-4 text-[12.5px] text-content-secondary">
            {plural(selected.tickets.unlinkedOpen, 'open request isn’t', 'open requests aren’t')} linked to a project yet.{' '}
            <button type="button" onClick={() => onSection('tickets')} className="font-semibold text-link hover:text-link-hover">Review in Tickets</button>
          </p>}
        </div>}

        {openSection === 'access' && <div className="h-full space-y-4 overflow-y-auto px-6 py-5 text-[13px]">
          <div className="flex items-start gap-3">
            <AccessBadge access={selected.access} />
            <p className="text-content-secondary">{selected.access === 'active'
              ? 'Can sign in to the client portal, follow their requests and see the projects shared with them.'
              : 'Portal access is off. This client can’t sign in or see their requests and projects.'}</p>
          </div>
          {selected.tickets.accessRevoked > 0 && <p className="rounded-md border border-status-warning-border bg-status-warning-subtle px-3 py-2 text-status-warning">
            Access was removed on {plural(selected.tickets.accessRevoked, 'request')}. The client can’t open {selected.tickets.accessRevoked === 1 ? 'it' : 'them'}.
          </p>}
          <p className="text-xs text-content-muted">Invitations and access are managed on each request in the Tickets tab.</p>
        </div>}
      </div>
    </div>;
  }

  return <div className="flex h-full min-h-0 flex-col bg-canvas">
    <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 px-6 pb-3 pt-5">
      <div className="flex items-baseline gap-2">
        <h1 className="text-lg font-semibold text-content">Clients</h1>
        <span className="text-xs tabular-nums text-content-muted">{clients ? clients.length : '…'}</span>
      </div>
      <div className="flex items-center gap-2">
        <label className="flex h-8 w-64 max-w-full items-center gap-2 rounded-md border border-control bg-well px-2.5 focus-within:ring-2 focus-within:ring-focus">
          <Search className="h-3.5 w-3.5 text-content-muted" aria-hidden="true" />
          <span className="sr-only">Search clients</span>
          <input value={search} onChange={event => onSearch(event.target.value)} placeholder="Search clients…" className="min-w-0 flex-1 bg-transparent text-xs text-content placeholder-content-muted focus:outline-none" />
        </label>
        <button type="button" onClick={onRefresh} disabled={loading} title="Refresh clients"
          className="inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium text-content-secondary hover:bg-surface-high hover:text-content disabled:opacity-50">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" /> Refresh
        </button>
      </div>
    </header>

    <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">
      {error ? <p role="alert" className="rounded-md border border-status-danger-border bg-status-danger-subtle px-3 py-2 text-[13px] text-status-danger">{error}</p>
        : loading && !clients ? <LoadingRows label="Loading clients" layout="table" rows={4} />
        : clients && clients.length === 0 ? <div className="flex flex-col items-center gap-2 py-16 text-center">
          <Users className="h-6 w-6 text-content-muted" aria-hidden="true" />
          <p className="text-[13px] font-medium text-content">No clients yet</p>
          <p className="max-w-sm text-xs text-content-muted">Clients appear here once they have a portal account. New inquiries are in Inquiries.</p>
          <button type="button" onClick={onOpenInquiries} className="mt-1 text-xs font-semibold text-link hover:text-link-hover">Open Inquiries</button>
        </div>
        : <table className="w-full text-left text-[13px]">
          <thead className="text-[10.5px] font-semibold uppercase tracking-wide text-content-muted">
            <tr className="border-b border-divider">
              <th scope="col" className="py-2 pr-3 font-semibold">Client</th>
              <th scope="col" className="py-2 pr-3 font-semibold">Needs you</th>
              <th scope="col" className="hidden py-2 pr-3 font-semibold sm:table-cell">Open</th>
              <th scope="col" className="hidden py-2 pr-3 font-semibold md:table-cell">Projects</th>
              <th scope="col" className="hidden py-2 pr-3 font-semibold md:table-cell">Access</th>
              <th scope="col" className="py-2 text-right font-semibold">Last activity</th>
            </tr>
          </thead>
          <tbody>
            {visible.map(client => <tr key={client.key} className="border-b border-divider hover:bg-surface-high/40">
              <td className="py-3 pr-3">
                <button type="button" onClick={() => onSelect(client.key)} className="block min-w-0 text-left">
                  <span className="block truncate font-medium text-content hover:text-link">{client.displayName}</span>
                  {client.company && <span className="block truncate text-[11.5px] text-content-muted">{client.company}</span>}
                </button>
              </td>
              <td className="py-3 pr-3">{client.tickets.needsPm > 0
                ? <span className="rounded-full bg-selected px-2 py-0.5 text-[11.5px] font-semibold text-selected-content">{client.tickets.needsPm}</span>
                : <span className="text-content-muted">—</span>}</td>
              <td className="hidden py-3 pr-3 tabular-nums text-content-secondary sm:table-cell">{client.tickets.open}</td>
              <td className="hidden py-3 pr-3 tabular-nums text-content-secondary md:table-cell">{client.projects.length}</td>
              <td className="hidden py-3 pr-3 md:table-cell"><AccessBadge access={client.access} compact /></td>
              <td className="py-3 text-right tabular-nums text-content-muted">{shortDate(client.lastActivityAt)}</td>
            </tr>)}
          </tbody>
        </table>}
      {clients && clients.length > 0 && visible.length === 0 && <p className="py-6 text-center text-xs text-content-muted">No clients match “{search.trim()}”.</p>}
    </div>
  </div>;
}

function AccessBadge({ access, compact = false }: { access: PmClientSummary['access']; compact?: boolean }) {
  const Icon = access === 'active' ? ShieldCheck : ShieldOff;
  return <span className={`inline-flex shrink-0 items-center gap-1 text-[11.5px] font-medium ${access === 'active' ? 'text-status-success' : 'text-content-muted'}`}>
    <Icon className="h-3.5 w-3.5" aria-hidden="true" />{access === 'active' ? (compact ? 'Active' : 'Portal access on') : (compact ? 'Off' : 'Portal access off')}
  </span>;
}

