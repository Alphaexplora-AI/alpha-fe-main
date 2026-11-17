import type { Issue } from '@/shared/types';

export type SelectionState = 'none' | 'some' | 'all';

/** Whether a section's tasks are all, some or none of the selection: drives its checkbox. */
export function selectionState(ids: readonly string[], selected: ReadonlySet<string>): SelectionState {
  const count = ids.filter(id => selected.has(id)).length;
  if (count === 0) return 'none';
  return count === ids.length ? 'all' : 'some';
}

/** The selection with these tasks added (on) or removed (off). Never changes the set it is given. */
export function withTasks(selected: ReadonlySet<string>, ids: readonly string[], on: boolean): Set<string> {
  const next = new Set(selected);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return next;
}

/**
 * Which selected tasks can be archived now, and which must stay.
 *
 * A task with a build still attached cannot be archived (the server refuses it too),
 * so it is named instead of being skipped without a word. Only tasks that are still
 * on the board count: one archived elsewhere drops out of the selection.
 */
export function splitForArchive(
  issues: readonly Issue[],
  selected: ReadonlySet<string>,
  hasActiveBuild: (issue: Issue) => boolean
): { archive: Issue[]; held: Issue[] } {
  const chosen = issues.filter(issue => selected.has(issue.id) && !issue.archivedAt);
  return {
    archive: chosen.filter(issue => !hasActiveBuild(issue)),
    held: chosen.filter(issue => hasActiveBuild(issue))
  };
}
