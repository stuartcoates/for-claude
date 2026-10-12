/**
 * One error type for every backend, so the UI can say what went wrong and what fixes it.
 * `kind` decides the copy; `detail` carries Todoist's own message when there is one.
 */
export type ErrorKind =
  | 'auth' // token rejected, or the connector needs reconnecting
  | 'not-connected' // no Todoist connector on this claude.ai account
  | 'not-allowed' // the viewer turned Todoist off for this page
  | 'choose-connection' // more than one Todoist connector, none chosen yet
  | 'busy' // rate limited or Todoist briefly unreachable
  | 'network'
  | 'todoist' // Todoist answered with an error about this request
  | 'unknown';

export class TodoistError extends Error {
  kind: ErrorKind;
  detail?: string;
  retryable: boolean;

  constructor(kind: ErrorKind, detail?: string, retryable = false) {
    super(detail ?? kind);
    this.name = 'TodoistError';
    this.kind = kind;
    this.detail = detail;
    this.retryable = retryable;
  }
}

export function toTodoistError(err: unknown): TodoistError {
  if (err instanceof TodoistError) return err;
  if (err instanceof Error) return new TodoistError('unknown', err.message);
  return new TodoistError('unknown', String(err));
}

/** A sentence for a toast or banner: what happened, then what to do about it. */
export function describeError(err: TodoistError): string {
  switch (err.kind) {
    case 'auth':
      return 'Todoist didn’t accept the sign-in. Reconnect Todoist in claude.ai Settings → Connectors, or paste a fresh API token.';
    case 'not-connected':
      return 'Todoist isn’t connected to your Claude account. Add it in claude.ai Settings → Connectors, then reload this page.';
    case 'not-allowed':
      return 'Todoist access is turned off for this page. Turn it on from the page’s Permissions menu, then reload.';
    case 'choose-connection':
      return 'You have more than one Todoist connection. Choose one when Claude asks, then reload.';
    case 'busy':
      return 'Todoist is busy right now. Wait a few seconds and try again.';
    case 'network':
      return 'Couldn’t reach Todoist. Check your connection and try again.';
    case 'todoist':
      return err.detail ? `Todoist said: ${err.detail}` : 'Todoist refused that change.';
    default:
      return err.detail ? `Something went wrong: ${err.detail}` : 'Something went wrong.';
  }
}
