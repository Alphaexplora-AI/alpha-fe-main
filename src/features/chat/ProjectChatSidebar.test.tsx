import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { ChatThread, Project } from '@/shared/types';

vi.hoisted(() => { (globalThis as { window?: unknown }).window ??= globalThis; });

const project = { id: 'p1', name: 'E-Commerce', key: 'ECO', resources: [] } as unknown as Project;
const thread = (id: string, title: string, projectId?: string) =>
  ({ id, title, projectId, lastMessageAt: '2026-11-18T01:00:00Z', lastMessageSnippet: '', agentIds: [] }) as unknown as ChatThread;

vi.mock('@/app/AppContext', () => ({
  useApp: () => ({
    tabs: [], activeTabId: 't1', chatThreadsLoadState: 'ready', retryChatThreads: () => undefined, chatTypingByThread: {},
    projects: [project],
    chatThreads: [thread('c-hello', 'hello'), thread('c-cicd', 'can you check the cicd', 'p1')],
    openChatDraft: () => undefined, openChatThread: () => undefined, openChatHistory: () => undefined, openNewTab: () => undefined,
    can: () => true
  })
}));
// Room for every row: the sidebar otherwise trims rows to the height it measures.
vi.mock('@/shared/layout/useFitHeight', async importOriginal => ({
  ...(await importOriginal<typeof import('@/shared/layout/useFitHeight')>()),
  useFitHeight: () => [{ current: null }, 10_000]
}));
vi.mock('./useProjectChatPins', () => ({ useProjectChatPins: () => [[], () => undefined] }));
vi.mock('./ChatThreadDialogs', () => ({ ChatThreadDialogs: () => null }));
vi.mock('@/features/projects/CreateProjectModal', () => ({ CreateProjectModal: () => null }));

import { ProjectChatSidebar } from './ProjectChatSidebar';

describe('ProjectChatSidebar', () => {
  it('offers the chat menu, with Delete chat, on Recent rows too', () => {
    const html = renderToStaticMarkup(<ProjectChatSidebar onNavigate={() => undefined} storageKey="test" />);
    // "hello" has no project, so Recent is the only place it is listed.
    expect(html).toContain('aria-label="Options for hello"');
    expect(html).toContain('aria-label="Options for can you check the cicd"');
  });
});
