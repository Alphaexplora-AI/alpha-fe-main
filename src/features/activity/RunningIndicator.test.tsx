import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { RunningWork } from '@/shared/services/apiService';

vi.hoisted(() => { (globalThis as { window?: unknown }).window ??= globalThis; });
vi.mock('@/app/AppContext', () => ({ useApp: () => ({}) }));

import { RunningButtonLabel, RunningList } from './RunningIndicator';

const work: RunningWork = {
  running: [
    { id: 'run:r1', kind: 'agent', issueId: 'i1', identifier: 'TES2-104', title: 'Fix the CI workflow', agentName: 'Frontend Agent', activity: 'Writing code' },
    { id: 'chat:t1:0', kind: 'chat', threadId: 't1', title: 'API questions', agentName: 'Architect', activity: 'Replying in chat' }
  ],
  interrupted: [{ id: 'run:r2', kind: 'agent', issueId: 'i2', identifier: 'CAP-102', title: 'Landing page', activity: 'Nothing is running it any more' }]
};
const list = (state: Parameters<typeof RunningList>[0]['state']) => renderToStaticMarkup(<RunningList state={state} onOpen={() => undefined} />);

describe('RunningIndicator', () => {
  it('lists running work with task, agent and activity, and interrupted runs apart', () => {
    const html = list({ status: 'ready', work });
    for (const shown of ['Running now', 'TES2-104', 'Fix the CI workflow', 'Frontend Agent · Writing code', 'API questions', 'Interrupted', 'CAP-102', 'Open the task to resume or stop it']) {
      expect(html).toContain(shown);
    }
  });

  it('says plainly when nothing runs or the engine does not answer', () => {
    expect(list({ status: 'ready', work: { running: [], interrupted: [] } })).toContain('Nothing is running on this computer.');
    expect(list({ status: 'unavailable' })).toContain('The local engine did not answer');
  });

  it('shows a pulsing count while work runs and quiet text otherwise', () => {
    expect(renderToStaticMarkup(<RunningButtonLabel state={{ status: 'ready', work }} />)).toMatch(/animate-pulse.*2 running · 1 interrupted/);
    const idle = renderToStaticMarkup(<RunningButtonLabel state={{ status: 'ready', work: { running: [], interrupted: [] } }} />);
    expect(idle).toContain('Nothing running');
    expect(idle).not.toContain('animate-pulse');
  });
});
