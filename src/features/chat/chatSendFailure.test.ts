import { describe, expect, it } from 'vitest';
import { chatSendFailureText } from './chatSendFailure';

describe('chat send failure text', () => {
  it('only blames reachability when the engine was not reached', () => {
    const text = chatSendFailureText(new TypeError('Failed to fetch'));
    expect(text).toContain('I could not reach the Alpha daemon');
    expect(text).toContain('Reason: Failed to fetch');
  });

  it('says the engine refused the message, with its reason, for a 4xx', () => {
    const text = chatSendFailureText(new Error('API Error [400]: A task can only be attached to a build request'));
    expect(text).toContain('Alpha did not accept this message');
    expect(text).toContain('Reason: A task can only be attached to a build request');
    expect(text).not.toContain('could not reach');
    expect(text).not.toContain('backend is running');
  });

  it('says the engine failed, not that it was unreachable, for a 5xx', () => {
    const text = chatSendFailureText(new Error('API Error [500]: Internal error'));
    expect(text).toContain('ran into an error');
    expect(text).not.toContain('could not reach');
  });
});
