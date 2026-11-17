import React, { useRef } from 'react';
import { BookOpen, ExternalLink } from 'lucide-react';
import { apiService, type ProjectMemory, type ProjectMemoryRepository } from '@/shared/services/apiService';
import { githubLink } from '@/shared/lib/githubLink';
import { useRepoResource } from './repository/useRepoResource';
import { RefreshButton, SectionError, SectionLoading } from './repository/SectionState';

const number = (value: number) => value.toLocaleString();

function originLabel(entry: ProjectMemoryRepository): string {
  if (entry.origin === 'checkout') return "This computer's checkout";
  if (entry.origin === 'github') return 'GitHub';
  const at = entry.fetchedAt ? new Date(entry.fetchedAt) : null;
  const time = at && !Number.isNaN(at.getTime()) ? at.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '';
  return entry.stale ? `Saved copy${time ? ` from ${time}` : ''}; GitHub could not be reached` : `GitHub, checked${time ? ` at ${time}` : ''}`;
}

/** One repository's memory card. Exported for tests. */
export function MemoryCard({ entry, perRepo }: { entry: ProjectMemoryRepository; perRepo: number }) {
  const repoUrl = githubLink(`https://github.com/${entry.repository}`);
  const fileUrl = entry.file ? githubLink(`https://github.com/${entry.repository}/blob/HEAD/${entry.file}`) : undefined;
  return (
    <li className="rounded-lg border border-divider bg-well p-3">
      <div className="mb-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="font-mono text-[11.5px] text-content">{entry.repository}</span>
        {entry.file && <span className="text-[11px] text-content-secondary">{entry.file}</span>}
        <span className={`text-[11px] ${entry.stale ? 'text-status-warning' : 'text-content-muted'}`}>{originLabel(entry)}</span>
        {entry.file && (
          <span className={`ml-auto text-[11px] tabular-nums ${entry.shortened ? 'text-status-warning' : 'text-content-muted'}`}>
            {number(entry.characters)} / {number(perRepo)} characters{entry.shortened ? ` · agents get the first ${number(entry.sentCharacters)}` : ''}
          </span>
        )}
      </div>
      {entry.file ? (
        <>
          <pre className="max-h-64 select-text overflow-auto whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed text-content-secondary">{entry.text}</pre>
          {fileUrl && (
            <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-link hover:text-link-hover">
              Open on GitHub <ExternalLink aria-hidden="true" className="h-3 w-3" />
            </a>
          )}
        </>
      ) : (
        <p className="text-[11.5px] text-content-muted">
          No AGENTS.md in this repository yet. Add one at its root to give every agent this repository's rules.
          {repoUrl && <> <a href={repoUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-link hover:text-link-hover">Open repository</a></>}
        </p>
      )}
    </li>
  );
}

/** The section body for one answer. Exported for tests. */
export function ProjectMemoryBody({ memory }: { memory: ProjectMemory }) {
  if (!memory.repositories.length) return <p className="text-content-muted">This project has no repositories yet.</p>;
  return (
    <>
      <ul className="space-y-2">
        {memory.repositories.map(entry => <MemoryCard key={entry.repository} entry={entry} perRepo={memory.limits.PER_REPO} />)}
      </ul>
      <p className="mt-3 text-[11px] text-content-muted">
        Agents read this before every chat, plan and build: {number(memory.sentCharacters)} of {number(memory.limits.TOTAL)} characters in this project.
        Never put secrets, client details or notes about people here.
      </p>
    </>
  );
}

/**
 * Project → Details: what every agent in this project reads first.
 *
 * Shown to developers and PMs; the server refuses clients. Read-only: memory is
 * edited in each repository's AGENTS.md.
 */
export const ProjectMemorySection: React.FC<{ projectId: string }> = ({ projectId }) => {
  const refreshNext = useRef(false);
  const memory = useRepoResource(() => {
    const refresh = refreshNext.current;
    refreshNext.current = false;
    return apiService.getProjectMemory(projectId, refresh);
  }, projectId);

  return (
    <section aria-labelledby="project-memory" className="rounded-xl border border-divider bg-surface-raised p-4">
      <div className="mb-1 flex items-center justify-between gap-2">
        <h2 id="project-memory" className="flex items-center gap-1.5 text-[13px] font-semibold text-content">
          <BookOpen className="h-3.5 w-3.5 text-status-info" aria-hidden />Project memory
        </h2>
        <RefreshButton label="Check GitHub for changes" loading={memory.loading} onClick={() => { refreshNext.current = true; memory.reload(); }} />
      </div>
      <p className="mb-3 text-content-muted">Each repository's AGENTS.md. Every agent in this project reads it first; if the code disagrees, the code wins.</p>
      {memory.error
        ? <SectionError message={memory.error} onRetry={memory.reload} />
        : memory.data
          ? <ProjectMemoryBody memory={memory.data} />
          : <SectionLoading label="Loading project memory" layout="list" rows={2} />}
    </section>
  );
};
