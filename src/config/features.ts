import type { NavigationTab, UserRole } from '@/shared/types';
import { isDesktop } from '@/shared/desktop';

/**
 * `always`: every runtime. `desktop`: only in the desktop app, never on the
 * hosted web app. `never`: hidden everywhere.
 */
export type AiAccess = 'always' | 'desktop' | 'never';

/**
 * Which roles see Alpha's AI tooling: Chat with Alpha, agents, Orchestrator builds,
 * runtimes and integrations, runtime usage, autonomy governance, and repository
 * setup when creating a project, and attaching folders or repositories to a project.
 *
 * Project managers get it in the desktop app only. The hosted backend runs no
 * agents (orchestration is off in cloud mode), so on the web these screens
 * would only describe work that cannot happen there. In the desktop app they
 * can inspect agents, ask/review agent work, and inspect cached runtime/skill
 * catalogs; capability checks keep execution, runtime scans, and configuration
 * read-only for them.
 */
export const AI_FEATURES_BY_ROLE: Record<UserRole, AiAccess> = {
  client: 'always',
  dev: 'always',
  pm: 'desktop',
  admin: 'always'
};

/** Navigation destinations that exist only to work with AI agents. */
export const AI_NAV_TABS: readonly NavigationTab[] = ['chat', 'agents', 'runtimes', 'skills'];

/**
 * Whether this role sees AI tooling here. `desktopApp` defaults to the running
 * app and is a parameter so tests can ask about either runtime.
 */
export const aiFeaturesEnabled = (role: UserRole, desktopApp: boolean = isDesktop): boolean => {
  const access = AI_FEATURES_BY_ROLE[role];
  return access === 'always' || (access === 'desktop' && desktopApp);
};

/**
 * Whether the standalone Chat tab is in the navigation.
 *
 * Off while project work happens on the board: each task builds through its own
 * private conversation, and the board shows the decisions that need a person.
 * Turning this back on restores the tab exactly as it was; board builds stay
 * out of the Chat list, and "Open in chat" on a card opens that task's thread.
 */
export const CHAT_TAB_ENABLED = true;

/** Whether the Orchestrator bar and its visualization show above a chat conversation. */
export const CHAT_ORCHESTRATOR_BAR_ENABLED = false;
