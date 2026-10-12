import { useCallback, useEffect, useRef, useState } from 'react';
import type { Backend, Project, Task } from './api/types';
import { describeError, toTodoistError, TodoistError } from './api/errors';
import { detectConnector } from './api/connectorBackend';
import { createTokenBackend } from './api/tokenBackend';
import { createDemoBackend } from './api/demoBackend';
import { buildDeck, statsByProject } from './lib/deck';
import { todayISO } from './lib/dates';
import { readStored, writeStored } from './lib/storage';
import { WelcomeScreen } from './components/WelcomeScreen';
import { ProjectPicker } from './components/ProjectPicker';
import { DeckScreen } from './components/DeckScreen';

const TOKEN_KEY = 'pass.todoistToken';
const SUBTASKS_KEY = 'pass.includeSubtasks';
/** The claude.ai artifact sandbox blocks direct calls to Todoist, so there only the connector works. */
const insideClaude = typeof window !== 'undefined' && typeof window.claude?.use === 'function';

type View =
  | { name: 'boot' }
  | { name: 'loading' }
  | { name: 'welcome'; error?: string }
  | { name: 'projects' }
  | { name: 'deck'; key: number; title: string; projectIds: string[]; deck: Task[] };

export default function App() {
  const [view, setView] = useState<View>({ name: 'boot' });
  const [backend, setBackend] = useState<Backend | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [includeSubtasks, setIncludeSubtasks] = useState(() => readStored(SUBTASKS_KEY, false));
  const [today, setToday] = useState(todayISO);

  // If the page stays open past midnight, "today" moves with it.
  useEffect(() => {
    const onVisible = () => document.visibilityState === 'visible' && setToday(todayISO());
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  const load = useCallback(async (b: Backend) => {
    const [p, t] = await Promise.all([b.listProjects(), b.listTasks()]);
    setProjects(p);
    setTasks(t);
  }, []);

  const connect = useCallback(
    async (b: Backend) => {
      setView({ name: 'loading' });
      try {
        await load(b);
        setBackend(b);
        setNotice(null);
        setView({ name: 'projects' });
      } catch (err) {
        const e = toTodoistError(err);
        if (b.kind === 'token' && e.kind === 'auth') writeStored(TOKEN_KEY, null);
        setView({ name: 'welcome', error: describeError(e) });
      }
    },
    [load],
  );

  // Inside claude.ai, use the Todoist connector; elsewhere, a saved token; otherwise, the welcome screen.
  const start = useCallback(async () => {
    setView({ name: 'boot' });
    const connector = await detectConnector();
    if (connector) return connect(connector);
    if (insideClaude) return setView({ name: 'welcome', error: describeError(new TodoistError('not-connected')) });
    const token = readStored<string | null>(TOKEN_KEY, null);
    if (token) return connect(createTokenBackend(token));
    setView({ name: 'welcome' });
  }, [connect]);

  const booted = useRef(false);
  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    void start();
  }, [start]);

  const refresh = useCallback(async () => {
    if (!backend) return;
    setRefreshing(true);
    try {
      await load(backend);
      setNotice(null);
    } catch (err) {
      setNotice(`Couldn’t refresh. ${describeError(toTodoistError(err))}`);
    } finally {
      setRefreshing(false);
    }
  }, [backend, load]);

  const startDeck = useCallback(
    (title: string, projectIds: string[]) => {
      const deck = buildDeck(tasks, new Set(projectIds), includeSubtasks, today);
      if (deck.length === 0) return;
      setView({ name: 'deck', key: Date.now(), title, projectIds, deck });
    },
    [tasks, includeSubtasks, today],
  );

  const onLocalChange = useCallback((original: Task, next: Task | null) => {
    setTasks((list) => {
      if (next === null) return list.filter((t) => t.id !== original.id && t.parentId !== original.id);
      return list.some((t) => t.id === original.id) ? list.map((t) => (t.id === original.id ? next : t)) : [...list, next];
    });
  }, []);

  const backToProjects = useCallback(() => {
    setView({ name: 'projects' });
    // Pick up what Todoist did on its side (repeating tasks' next dates, subtasks).
    void refresh();
  }, [refresh]);

  const signOut = useCallback(() => {
    writeStored(TOKEN_KEY, null);
    setBackend(null);
    setProjects([]);
    setTasks([]);
    setView({ name: 'welcome' });
  }, []);

  const onToken = useCallback(
    async (token: string) => {
      const b = createTokenBackend(token);
      try {
        await load(b);
        writeStored(TOKEN_KEY, token);
        setBackend(b);
        setNotice(null);
        setView({ name: 'projects' });
      } catch (err) {
        setView({ name: 'welcome', error: describeError(toTodoistError(err)) });
      }
    },
    [load],
  );

  const nextSuggestion = (currentIds: string[]) => {
    const stats = statsByProject(tasks, includeSubtasks, today);
    const best = projects
      .filter((p) => !currentIds.includes(p.id) && (stats.get(p.id)?.count ?? 0) > 0)
      .sort((a, b) => {
        const sa = stats.get(a.id)!;
        const sb = stats.get(b.id)!;
        return sb.overdue - sa.overdue || sb.count - sa.count;
      })[0];
    if (!best) return null;
    const s = stats.get(best.id)!;
    return {
      label: `${best.name} (${s.overdue ? `${s.overdue} late` : s.count})`,
      start: () => startDeck(best.name, [best.id]),
    };
  };

  return (
    <main className="app">
      {(view.name === 'boot' || view.name === 'loading') && (
        <div className="loading" role="status">
          <div className="ticket" aria-hidden />
          <p>{view.name === 'boot' ? 'Opening the pass…' : 'Fetching your projects and tasks…'}</p>
        </div>
      )}

      {view.name === 'welcome' && (
        <WelcomeScreen
          error={view.error}
          insideClaude={insideClaude}
          onToken={onToken}
          onRetryConnector={() => void start()}
          onDemo={() => connect(createDemoBackend())}
        />
      )}

      {view.name === 'projects' && backend && (
        <ProjectPicker
          projects={projects}
          tasks={tasks}
          today={today}
          source={backend.kind}
          includeSubtasks={includeSubtasks}
          onIncludeSubtasks={(value) => {
            setIncludeSubtasks(value);
            writeStored(SUBTASKS_KEY, value);
          }}
          onStart={startDeck}
          onRefresh={refresh}
          refreshing={refreshing}
          onSignOut={backend.kind === 'connector' ? undefined : signOut}
          notice={notice}
        />
      )}

      {view.name === 'deck' && backend && (
        <DeckScreen
          key={view.key}
          backend={backend}
          title={view.title}
          deck={view.deck}
          allTasks={tasks}
          projects={projects}
          today={today}
          onLocalChange={onLocalChange}
          onExit={backToProjects}
          next={nextSuggestion(view.projectIds)}
        />
      )}
    </main>
  );
}
