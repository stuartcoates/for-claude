# The Pass

Swipe through your Todoist tasks one project at a time. Each task comes up as a ticket, like an order at a kitchen pass, and you decide what happens to it.

| Gesture | Key | What happens in Todoist |
|---|---|---|
| Swipe ← | ← | **Done**: completes the task. A repeating task moves to its next date instead. |
| Swipe → | → | **Keep**: nothing changes. The task stays as it is. |
| Swipe ↑ | ↑ | **Today**: due date set to today. Repeat rules and times of day are kept. |
| Swipe ↓ | ↓ | **Later**: pick tomorrow, this weekend, next week, next month, a date, or remove the date. |
| More → Move | M | Moves the task to another project. The last three destinations are listed first. |
| More → Priority | P | Sets P1–P4. |
| More → Skip | S | Sends the card to the back of the deck. Nothing changes. |
| More → Delete | ⌫ | Deletes the task, after a 5-second window to undo it. |
| Undo button | Z or ⌘Z | Reverses the last decision in Todoist. Deletes can only be undone within their 5 seconds. |

Cards come up in this order: overdue first (oldest due date first), then today, then undated (oldest first), then upcoming. Todoist headers (tasks starting with `* `) are skipped. Subtasks are skipped unless you tick **Include subtasks**. A parent project's **All N** button sorts it together with its nested projects.

## Three ways to run it

1. **Inside claude.ai** (published as an artifact). The page uses your claude.ai Todoist connector, so it needs no token. The first time it loads, Claude asks whether this page may use Todoist.
2. **Anywhere else** (`npm run dev`, or the `dist/` build on any static host). Paste a personal API token from Todoist → Settings → Integrations → Developer. It is kept in that browser's localStorage and sent only to `api.todoist.com`.
3. **Sample deck.** Example tasks held in memory. Nothing reaches Todoist. Useful for trying it out, and for tests.

## Develop

```sh
npm install
npm run dev              # http://localhost:5173
npm test                 # unit tests (dates, deck order, swipe math, what each decision sends)
npm run lint
npm run build            # static site in dist/
npm run build:artifact   # dist-artifact/the-pass.html: one self-contained page for claude.ai
```

The artifact must be published with an `mcp` capability for the `Todoist` connector listing the tools in `CONNECTOR_TOOLS` (`src/api/connectorBackend.ts`).

## How it fits together

- `src/api/`: one `Backend` interface with three implementations: `connectorBackend` (claude.ai connector), `tokenBackend` (Todoist API v1), `demoBackend` (sample data).
- `src/lib/decisions.ts`: what each decision sends to Todoist, and the reverse call for undo.
- `src/hooks/useTriageSession.ts`: the deck queue, undo history, the 5-second hold on deletes, and putting a card back on top when Todoist refuses a change.
- `src/components/`: the ticket card, swipe handling, sheets, project list and summary.

## What's verified (as of 2026-10-12)

- ✅ Todoist's API v1 accepts browser requests from any origin (live CORS preflight against `api.todoist.com`).
- ✅ The connector's read results (projects, tasks, sections) match the shapes the app parses. Checked with read-only calls.
- ✅ Write calls follow the connector's published tool schemas and Todoist's official SDK (`@doist/todoist-sdk`) and MCP server (`@doist/todoist-mcp`) source. Reschedules mirror the MCP's own `reschedule-tasks` command, which keeps repeat rules.
- ✅ The full swipe flow runs end to end against the sample deck in headless Chromium (phone size, light and dark).
- ⚠️ No write has been run against a live Todoist account during development, on purpose. Your first real swipes are the live test. A refused change puts the card back on top with Todoist's message.
- ⚠️ Through the connector, giving a date to an undated task sends it as an ISO date (`2026-10-13`) in Todoist's natural-language due field. Todoist's parser should accept that format, but it hasn't been confirmed live. Token mode uses the exact `due_date` field instead.
