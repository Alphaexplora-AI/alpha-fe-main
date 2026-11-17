import { describe, expect, it } from 'vitest';
import { githubLink } from './githubLink';

describe('githubLink', () => {
  it('keeps https GitHub addresses', () => {
    expect(githubLink('https://github.com/acme/web/pull/7')).toBe('https://github.com/acme/web/pull/7');
  });

  it('drops other schemes, hosts and junk', () => {
    for (const value of ['javascript:alert(1)', 'http://github.com/acme/web/pull/7', 'https://github.com.evil.test/x', 'https://evil.test/github.com', 'not a url', '', undefined]) {
      expect(githubLink(value)).toBeUndefined();
    }
  });
});
