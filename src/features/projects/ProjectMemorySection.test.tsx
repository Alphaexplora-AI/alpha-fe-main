import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { ProjectMemory } from '@/shared/services/apiService';
import { ProjectMemoryBody } from './ProjectMemorySection';

const memory: ProjectMemory = {
  limits: { PER_REPO: 3000, TOTAL: 6000 },
  sentCharacters: 3027,
  repositories: [
    { repository: 'acme/shop-be', file: 'AGENTS.md', text: 'Login: POST /api/auth/login', characters: 27, sentCharacters: 27, shortened: false, origin: 'checkout' },
    { repository: 'acme/shop-fe', file: 'AGENTS.md', text: 'x'.repeat(3500), characters: 3500, sentCharacters: 3000, shortened: true, origin: 'cache', stale: true, fetchedAt: '2026-11-18T10:42:00.000Z' },
    { repository: 'acme/shop-docs', text: '', characters: 0, sentCharacters: 0, shortened: false, origin: 'github' }
  ]
};

describe('Project memory', () => {
  const html = renderToStaticMarkup(<ProjectMemoryBody memory={memory} />);

  it('shows each repository\'s memory, where it came from and its size', () => {
    for (const shown of ['acme/shop-be', 'Login: POST /api/auth/login', "This computer&#x27;s checkout", '27 / 3,000 characters']) expect(html).toContain(shown);
    expect(html).toContain('href="https://github.com/acme/shop-be/blob/HEAD/AGENTS.md"');
  });

  it('says when agents get a shortened copy and when GitHub could not be reached', () => {
    expect(html).toContain('3,500 / 3,000 characters · agents get the first 3,000');
    expect(html).toContain('GitHub could not be reached');
  });

  it('explains how to add memory to a repository that has none', () => {
    expect(html).toContain('No AGENTS.md in this repository yet');
    expect(html).toContain('href="https://github.com/acme/shop-docs"');
  });

  it('states the project total and what must never go in memory', () => {
    expect(html).toContain('3,027 of 6,000 characters');
    expect(html).toContain('Never put secrets, client details or notes about people here.');
  });

  it('says so when the project has no repositories', () => {
    expect(renderToStaticMarkup(<ProjectMemoryBody memory={{ ...memory, sentCharacters: 0, repositories: [] }} />)).toContain('no repositories yet');
  });
});
