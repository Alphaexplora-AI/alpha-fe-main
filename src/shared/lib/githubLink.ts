/**
 * A GitHub address that is safe to open, or undefined.
 *
 * Pull request URLs reach the page from builds, agents and synced issues, so a
 * stored value is not trusted as a link: anything other than https://github.com
 * (a javascript: URL, another host) is dropped instead of opened.
 */
export function githubLink(value: string | undefined): string | undefined {
  try {
    const url = new URL(value ?? '');
    return url.protocol === 'https:' && url.hostname === 'github.com' ? url.href : undefined;
  } catch {
    return undefined;
  }
}
