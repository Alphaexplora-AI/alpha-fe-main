import React, { useEffect, useRef, useState } from 'react';
import { Archive, X } from 'lucide-react';
import type { Issue } from '@/shared/types';
import { Modal } from '@/shared/components/Modal';
import type { SelectionState } from './taskSelection';

/** A checkbox that also shows "some selected", which plain HTML can only set from script. */
export const SelectionCheckbox: React.FC<{ state: SelectionState; label: string; onChange: (on: boolean) => void }> = ({ state, label, onChange }) => {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = state === 'some';
  }, [state]);
  return (
    <input
      ref={ref}
      type="checkbox"
      aria-label={label}
      checked={state === 'all'}
      onChange={event => onChange(event.target.checked)}
      onClick={event => event.stopPropagation()}
      className="rounded bg-transparent border-control text-link focus:ring-0 cursor-pointer"
    />
  );
};

const names = (issues: readonly Issue[]) => issues.map(issue => issue.identifier).join(', ');

/**
 * The bar shown while tasks are selected in the list, and its confirmation.
 *
 * Archiving takes tasks off the board and keeps them restorable from Archived. Tasks
 * whose build is still attached stay where they are and are named, so nobody wonders
 * why a selected card did not move.
 */
export const ArchiveSelectedBar: React.FC<{
  archive: Issue[];
  held: Issue[];
  onArchive: (issues: Issue[]) => void;
  onClear: () => void;
}> = ({ archive, held, onArchive, onClear }) => {
  const [confirming, setConfirming] = useState(false);
  const total = archive.length + held.length;
  if (total === 0) return null;
  const plural = (count: number) => (count === 1 ? '1 task' : `${count} tasks`);

  return (
    <div role="region" aria-label="Selected tasks" className="sticky top-0 z-10 flex flex-wrap items-center gap-3 rounded-lg border border-divider bg-surface-raised px-3 py-2 text-xs shadow-sm">
      <span className="font-semibold text-content">{plural(total)} selected</span>
      {held.length > 0 && <span className="text-content-muted">{names(held)}: stop the build first</span>}
      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          disabled={archive.length === 0}
          onClick={() => setConfirming(true)}
          className="inline-flex h-7 items-center gap-1.5 rounded-md bg-action px-2.5 font-semibold text-on-action hover:bg-action-hover disabled:opacity-40"
        >
          <Archive aria-hidden="true" className="h-3.5 w-3.5" /> Archive {plural(archive.length)}
        </button>
        <button type="button" onClick={onClear} aria-label="Clear selection" className="rounded-md p-1.5 text-content-muted hover:bg-surface-high hover:text-content">
          <X aria-hidden="true" className="h-3.5 w-3.5" />
        </button>
      </div>

      <Modal
        isOpen={confirming}
        onClose={() => setConfirming(false)}
        title={`Archive ${plural(archive.length)}?`}
        maxWidth="max-w-md"
        footer={(
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setConfirming(false)} className="rounded-md border border-divider px-3.5 py-2 text-sm font-medium text-content-secondary hover:bg-surface-high hover:text-content">
              Keep them
            </button>
            <button
              type="button"
              onClick={() => { setConfirming(false); onArchive(archive); }}
              className="inline-flex items-center gap-1.5 rounded-md bg-action px-3.5 py-2 text-sm font-semibold text-on-action hover:bg-action-hover"
            >
              <Archive aria-hidden="true" className="h-3.5 w-3.5" /> Archive {plural(archive.length)}
            </button>
          </div>
        )}
      >
        <div className="space-y-3 text-sm leading-relaxed text-content-secondary">
          <p className="font-mono text-xs text-content">{names(archive)}</p>
          <p>They leave the board. Their subtasks, comments and history are kept, and you can restore any of them from Archived. Linked GitHub issues are left as they are.</p>
          {held.length > 0 && (
            <p className="rounded-md border border-status-warning-border bg-status-warning-subtle px-3 py-2 text-status-warning">
              {names(held)} {held.length === 1 ? 'stays' : 'stay'} on the board: stop {held.length === 1 ? 'its build' : 'their builds'} first.
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
};
