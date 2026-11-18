import { parseApiError } from '@/shared/services/apiService';

/**
 * What the chat shows when a message could not be sent.
 *
 * An error with an HTTP status came from the engine itself: it was reached and
 * refused or failed the message, so "could not reach the daemon" would send the
 * person off checking a backend that is running. Only an error without a status
 * (a network failure, the engine not started) means it was not reached.
 */
export function chatSendFailureText(error: unknown): string {
  const { status, message } = parseApiError(error);
  const reason = `Reason: ${message || 'the request failed'}`;
  if (status === null) {
    return ['I could not reach the Alpha daemon, so nobody has seen this message yet.', '', reason, '', 'Check that the backend is running, then send it again.'].join('\n');
  }
  if (status >= 500) {
    return ['The Alpha engine ran into an error with this message, so nobody has seen it yet.', '', reason, '', 'Send it again. If it keeps failing, the engine log has the details.'].join('\n');
  }
  return ['Alpha did not accept this message, so nobody has seen it yet.', '', reason].join('\n');
}
