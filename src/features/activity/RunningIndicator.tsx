import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, ChevronDown, MessageSquare } from 'lucide-react';
import { SkeletonList } from '@/shared/components/ui/skeleton';
import { useApp } from '@/app/AppContext';
import type { RunningItem, RunningWork } from '@/shared/services/apiService';
import { elapsedLabel, runningLabel, useRunningWork, type RunningWorkState } from './runningWork';

const TONE = {
  idle: { text: 'text-content-muted', dot: '' },
  running: { text: 'text-status-info', dot: 'bg-status-info animate-pulse' },
  interrupted: { text: 'text-status-warning', dot: 'bg-status-warning' }
} as const;

function ItemRow({ item, onOpen }: { item: RunningItem; onOpen: (item: RunningItem) => void }) {
  const elapsed = elapsedLabel(item.startedAt);
  const opens = Boolean(item.issueId || item.threadId);
  return (
    <li>
      <button
        type="button"
        disabled={!opens}
        onClick={() => onOpen(item)}
        className="flex w-full items-start gap-2.5 rounded-md px-2.5 py-2 text-left hover:bg-surface-high disabled:cursor-default disabled:hover:bg-transparent"
      >
        {item.kind === 'chat' && !item.issueId
          ? <MessageSquare aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-content-muted" />
          : <span aria-hidden="true" className="mt-1 h-2 w-2 shrink-0 rounded-full bg-status-info" />}
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline gap-2">
            {item.identifier && <span className="shrink-0 font-mono text-[11px] text-content-secondary">{item.identifier}</span>}
            <span className="truncate text-[12.5px] font-medium text-content">{item.title}</span>
          </span>
          <span className="mt-0.5 block truncate text-[11.5px] text-content-muted">
            {[item.agentName, item.activity, elapsed].filter(Boolean).join(' · ')}
          </span>
        </span>
      </button>
    </li>
  );
}

/** The dropdown's body for one refresh of running work. Exported for tests. */
export function RunningList({ state, onOpen }: { state: RunningWorkState; onOpen: (item: RunningItem) => void }) {
  if (state.status === 'loading') return <SkeletonList label="Checking what is running" rows={2} avatar={false} className="px-3 py-1" />;
  if (state.status === 'unavailable') return <p className="px-3 py-3 text-[12.5px] text-content-muted">The local engine did not answer, so running work cannot be shown.</p>;
  const { running, interrupted } = state.work;
  if (!running.length && !interrupted.length) return <p className="px-3 py-3 text-[12.5px] text-content-muted">Nothing is running on this computer.</p>;
  return (
    <div className="space-y-2 p-1.5">
      {running.length > 0 && (
        <section aria-label="Running now">
          <h3 className="px-2.5 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wide text-content-muted">Running now</h3>
          <ul>{running.map(item => <ItemRow key={item.id} item={item} onOpen={onOpen} />)}</ul>
        </section>
      )}
      {interrupted.length > 0 && (
        <section aria-label="Interrupted" className={running.length ? 'border-t border-divider pt-1.5' : ''}>
          <h3 className="flex items-center gap-1.5 px-2.5 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wide text-status-warning">
            <AlertTriangle aria-hidden="true" className="h-3 w-3" /> Interrupted
          </h3>
          <p className="px-2.5 pb-1 text-[11.5px] text-content-muted">Saved as running, but nothing is running it. Open the task to resume or stop it.</p>
          <ul>{interrupted.map(item => <ItemRow key={item.id} item={item} onOpen={onOpen} />)}</ul>
        </section>
      )}
    </div>
  );
}

/** The button's words and colour; "Nothing running" stays quiet. Exported for tests. */
export function RunningButtonLabel({ state }: { state: RunningWorkState }) {
  const label = state.status === 'ready'
    ? runningLabel(state.work as RunningWork)
    : { text: state.status === 'loading' ? 'Checking…' : 'Running work unavailable', tone: 'idle' as const };
  const tone = TONE[label.tone];
  return (
    <>
      {tone.dot && <span aria-hidden="true" className={`h-2 w-2 rounded-full ${tone.dot}`} />}
      <span className={`${tone.text} ${label.tone === 'idle' ? '' : 'font-medium'}`}>{label.text}</span>
    </>
  );
}

/**
 * "N running" in the top bar, on every page, from the engine's live processes.
 * Clicking it lists what is running; clicking an entry opens that task on its Build
 * tab (or the chat being answered), where it can be stopped.
 */
export const RunningIndicator: React.FC = () => {
  const { setActiveTab, setTabSessionState, activeTabId, openChatThread } = useApp();
  const state = useRunningWork();
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; right: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return undefined;
    const place = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (rect) setPosition({ top: rect.bottom + 6, right: Math.max(8, window.innerWidth - rect.right) });
    };
    const closeOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!buttonRef.current?.contains(target) && !panelRef.current?.contains(target)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    place();
    window.addEventListener('resize', place);
    document.addEventListener('mousedown', closeOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      window.removeEventListener('resize', place);
      document.removeEventListener('mousedown', closeOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  const openItem = (item: RunningItem) => {
    setOpen(false);
    if (item.issueId) {
      // The board reads these from the tab's saved state: show the task's project, the task, and its Build tab.
      setActiveTab('issues');
      if (item.projectId) setTabSessionState(activeTabId, 'issues.project', item.projectId);
      setTabSessionState(activeTabId, 'issues.selectedIssue', item.issueId);
      setTabSessionState(activeTabId, 'issues.drawerTab', 'build');
    } else if (item.threadId) {
      openChatThread(item.threadId);
    }
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(value => !value)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs transition-colors hover:bg-surface-high"
      >
        <RunningButtonLabel state={state} />
        <ChevronDown aria-hidden="true" className={`h-3 w-3 text-content-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && position && createPortal(
        <div
          ref={panelRef}
          role="dialog"
          aria-label="What is running"
          style={{ top: position.top, right: position.right }}
          className="app-no-drag fixed z-[65] max-h-[60vh] w-[360px] max-w-[calc(100vw-16px)] overflow-y-auto rounded-xl border border-divider bg-surface text-content shadow-2xl"
        >
          <RunningList state={state} onOpen={openItem} />
        </div>,
        document.body
      )}
    </>
  );
};
