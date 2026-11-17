import { useEffect, useState } from 'react';
import { apiService, type RunningWork } from '@/shared/services/apiService';
import { isDesktop } from '@/shared/desktop';

/** What the indicator shows: nothing yet, the latest answer, or that the engine did not answer. */
export type RunningWorkState = { status: 'loading' } | { status: 'ready'; work: RunningWork } | { status: 'unavailable' };

const REFRESH_MS = 5_000;

/**
 * One poller shared by every indicator on screen, so two of them never double the
 * requests. It runs only while something is listening and skips refreshes while the
 * window is hidden; work runs on the desktop only, so the web app never asks.
 */
let state: RunningWorkState = { status: 'loading' };
const listeners = new Set<(next: RunningWorkState) => void>();
let timer: ReturnType<typeof setInterval> | undefined;

async function refresh(): Promise<void> {
  if (typeof document !== 'undefined' && document.hidden) return;
  try {
    state = { status: 'ready', work: await apiService.getRunningWork() };
  } catch {
    state = { status: 'unavailable' };
  }
  for (const listener of listeners) listener(state);
}

export function useRunningWork(): RunningWorkState {
  const [current, setCurrent] = useState<RunningWorkState>(state);
  useEffect(() => {
    if (!isDesktop) return undefined;
    listeners.add(setCurrent);
    if (listeners.size === 1) {
      void refresh();
      timer = setInterval(() => void refresh(), REFRESH_MS);
    }
    return () => {
      listeners.delete(setCurrent);
      if (listeners.size === 0 && timer !== undefined) {
        clearInterval(timer);
        timer = undefined;
      }
    };
  }, []);
  return current;
}

/** The indicator's words: what is running, and how many runs stopped with nothing behind them. */
export function runningLabel(work: RunningWork): { text: string; tone: 'idle' | 'running' | 'interrupted' } {
  const running = work.running.length;
  const interrupted = work.interrupted.length;
  if (running > 0) return { text: interrupted > 0 ? `${running} running · ${interrupted} interrupted` : `${running} running`, tone: 'running' };
  if (interrupted > 0) return { text: `${interrupted} interrupted`, tone: 'interrupted' };
  return { text: 'Nothing running', tone: 'idle' };
}

/** How long something has been going: "just now", "4 min", "2 h 5 min". */
export function elapsedLabel(startedAt: string | undefined, now = Date.now()): string | undefined {
  const started = startedAt ? Date.parse(startedAt) : Number.NaN;
  if (!Number.isFinite(started)) return undefined;
  const minutes = Math.floor(Math.max(0, now - started) / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours >= 48) return `${Math.floor(hours / 24)} days`;
  return minutes % 60 ? `${hours} h ${minutes % 60} min` : `${hours} h`;
}
