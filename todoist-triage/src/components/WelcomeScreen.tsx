import { useState } from 'react';

interface Props {
  error?: string | null;
  /** Inside claude.ai the page can only reach Todoist through the connector, so there's no token form. */
  insideClaude: boolean;
  onToken: (token: string) => Promise<void>;
  onRetryConnector: () => void;
  onDemo: () => void;
}

/** Shown when Todoist isn't connected yet: connect (connector or token), or try the sample. */
export function WelcomeScreen({ error, insideClaude, onToken, onRetryConnector, onDemo }: Props) {
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);

  return (
    <>
      <div className="rail">
        <div className="grow">
          <h1>The Pass</h1>
        </div>
      </div>
      <div className="welcome">
        <p className="lede">Sort your Todoist tasks one project at a time. Each task comes up as a ticket; swipe to decide.</p>
        <ul className="legend" aria-label="Swipe directions">
          <li>
            <span className="arrow" style={{ color: 'var(--done)' }}>←</span> Done
          </li>
          <li>
            <span className="arrow">→</span> Keep as is
          </li>
          <li>
            <span className="arrow" style={{ color: 'var(--heat)' }}>↑</span> Do today
          </li>
          <li>
            <span className="arrow" style={{ color: 'var(--later)' }}>↓</span> Later…
          </li>
        </ul>

        {error && (
          <p className="banner" role="alert">
            {error}
          </p>
        )}

        {insideClaude ? (
          <div className="panel">
            <h3>Connect Todoist</h3>
            <p>This page reads your tasks through the Todoist connector in claude.ai. Add or reconnect Todoist in Settings → Connectors, then try again.</p>
            <button type="button" className="btn primary" onClick={onRetryConnector}>
              Try again
            </button>
          </div>
        ) : (
          <form
            className="panel"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!token.trim()) return;
              setBusy(true);
              try {
                await onToken(token.trim());
              } finally {
                setBusy(false);
              }
            }}
          >
            <h3>Connect Todoist</h3>
            <p>
              Paste your API token from Todoist: Settings → Integrations → Developer. It stays in this browser and is sent only to Todoist.
            </p>
            <label className="sr-only" htmlFor="token">
              Todoist API token
            </label>
            <input
              id="token"
              className="field"
              type="password"
              autoComplete="off"
              spellCheck={false}
              placeholder="API token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
            <button className="btn primary" type="submit" disabled={busy || !token.trim()}>
              {busy ? 'Checking…' : 'Connect'}
            </button>
          </form>
        )}

        <div className="panel">
          <h3>Just looking?</h3>
          <p>Try it with example tasks. Nothing reaches Todoist.</p>
          <button type="button" className="btn" onClick={onDemo}>
            Try the sample deck
          </button>
        </div>
      </div>
    </>
  );
}
