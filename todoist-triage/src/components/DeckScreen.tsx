import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { CalendarClock, Check, ChevronLeft, Ellipsis, ThumbsUp, Trash2, Undo2 } from 'lucide-react';
import type { Backend, Priority, Project, Task } from '../api/types';
import { describeDecision, type Decision } from '../lib/decisions';
import { countSubtasks } from '../lib/deck';
import { plainText } from '../lib/text';
import { readStored, writeStored } from '../lib/storage';
import { DELETE_GRACE_MS, useTriageSession } from '../hooks/useTriageSession';
import { SwipeCard, type ExitDir, type SwipeDir } from './SwipeCard';
import { TicketCard } from './TicketCard';
import { DetailsSheet, LaterSheet, MoreSheet, MoveSheet, PrioritySheet } from './Sheets';
import { Summary } from './Summary';

interface Props {
  backend: Backend;
  title: string;
  deck: Task[];
  allTasks: Task[];
  projects: Project[];
  today: string;
  onLocalChange: (original: Task, next: Task | null) => void;
  onExit: () => void;
  /** The project the summary suggests next, if any. */
  next: { label: string; start: () => void } | null;
}

interface Toast {
  id: number;
  text: string;
  detail?: string;
  tone: 'info' | 'error';
  undo?: boolean;
  ms: number;
}

type SheetName = 'later' | 'move' | 'priority' | 'more' | 'details';

const RECENT_MOVES = 'pass.recentMoves';

export function DeckScreen({ backend, title, deck, allTasks, projects, today, onLocalChange, onExit, next }: Props) {
  const [toast, setToast] = useState<Toast | null>(null);
  const showToast = useCallback((t: Omit<Toast, 'id'>) => setToast({ ...t, id: Date.now() + Math.random() }), []);
  const onError = useCallback((text: string) => showToast({ text, tone: 'error', ms: 7000 }), [showToast]);

  const session = useTriageSession({ backend, deck, onLocalChange, onError });
  const current: Task | undefined = session.queue[0];

  const [exit, setExit] = useState<{ task: Task; dir: ExitDir; decision: Decision } | null>(null);
  const [sheet, setSheet] = useState<SheetName | null>(null);
  const [recentMoves, setRecentMoves] = useState<string[]>(() => readStored<string[]>(RECENT_MOVES, []));

  const projectNames = useMemo(() => new Map(projects.map((p) => [p.id, p.name])), [projects]);
  const subtaskCounts = useMemo(() => countSubtasks(allTasks), [allTasks]);
  const tasksById = useMemo(() => new Map(allTasks.map((t) => [t.id, t])), [allTasks]);

  // Section names load per project, the first time one of its cards comes up.
  const [sections, setSections] = useState<Record<string, Record<string, string>>>({});
  const requested = useRef(new Set<string>());
  useEffect(() => {
    const projectId = current?.projectId;
    if (!projectId || !current?.sectionId || requested.current.has(projectId)) return;
    requested.current.add(projectId);
    backend
      .listSections(projectId)
      .then((list) => setSections((s) => ({ ...s, [projectId]: Object.fromEntries(list.map((x) => [x.id, x.name])) })))
      .catch(() => undefined); // Section names are a nicety; the card works without them.
  }, [backend, current?.projectId, current?.sectionId]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast((t) => (t?.id === toast.id ? null : t)), toast.ms);
    return () => clearTimeout(timer);
  }, [toast]);

  const commit = useCallback(
    (decision: Decision, dir: ExitDir) => {
      if (!current || exit) return;
      setSheet(null);
      setExit({ task: current, dir, decision });
    },
    [current, exit],
  );

  const onExited = useCallback(() => {
    if (!exit) return;
    const { task, decision } = exit;
    session.decide(task, decision);
    setExit(null);
    if (decision.kind === 'skip') {
      showToast({ text: 'Skipped', detail: plainText(task.content), tone: 'info', undo: true, ms: 2500 });
    } else {
      showToast({
        text: describeDecision(decision, today),
        detail: plainText(task.content),
        tone: 'info',
        undo: true,
        ms: decision.kind === 'delete' ? DELETE_GRACE_MS : 4000,
      });
    }
  }, [exit, session, showToast, today]);

  const undo = useCallback(() => {
    if (exit) return;
    const message = session.undo();
    if (message) showToast({ text: message, tone: 'error', ms: 5000 });
    else setToast(null);
  }, [exit, session, showToast]);

  const act = useMemo(
    () => ({
      keep: () => commit({ kind: 'keep' }, 'left'),
      done: () => commit({ kind: 'done' }, 'right'),
      today: () => commit({ kind: 'schedule', date: today }, 'up'),
      later: () => current && !exit && setSheet('later'),
      skip: () => commit({ kind: 'skip' }, 'fade'),
      remove: () => commit({ kind: 'delete' }, 'down'),
      schedule: (date: string | null) => commit({ kind: 'schedule', date }, 'up'),
      priority: (priority: Priority) => commit({ kind: 'priority', priority }, 'fade'),
      move: (project: Project) => {
        const recent = [project.id, ...recentMoves.filter((id) => id !== project.id)].slice(0, 3);
        setRecentMoves(recent);
        writeStored(RECENT_MOVES, recent);
        commit({ kind: 'move', projectId: project.id, projectName: project.name }, 'fade');
      },
    }),
    [commit, current, exit, recentMoves, today],
  );

  const onSwipe = useCallback(
    (dir: SwipeDir) => {
      if (dir === 'left') act.keep();
      else if (dir === 'right') act.done();
      else if (dir === 'up') act.later();
      else act.remove();
    },
    [act],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (sheet || e.altKey) return;
      const target = e.target as HTMLElement;
      if (target.closest('input, textarea, select')) return;
      const key = e.key.toLowerCase();
      if ((e.metaKey || e.ctrlKey) && key === 'z') {
        e.preventDefault();
        undo();
        return;
      }
      if (e.metaKey || e.ctrlKey) return;
      const map: Record<string, () => void> = {
        arrowleft: act.keep,
        arrowright: act.done,
        arrowup: act.later,
        arrowdown: act.remove,
        t: act.today,
        z: undo,
        u: undo,
        s: act.skip,
        m: () => current && setSheet('move'),
        p: () => current && setSheet('priority'),
        backspace: act.remove,
        delete: act.remove,
      };
      const run = map[key];
      if (run) {
        e.preventDefault();
        run();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [act, current, sheet, undo]);

  const exitDeck = () => {
    session.flush();
    onExit();
  };

  const finished = !current;
  const number = Math.min(session.decided + 1, session.total);
  const percent = session.total ? (session.decided / session.total) * 100 : 100;
  const canUndo = session.history.length > 0 && !exit;

  const cardFor = (task: Task, position: number) => {
    const parent = task.parentId ? tasksById.get(task.parentId) : undefined;
    const subtasks = subtaskCounts.get(task.id) ?? 0;
    return (
      <TicketCard
        task={task}
        number={Math.min(number + position, session.total)}
        total={session.total}
        today={today}
        projectName={projectNames.get(task.projectId) ?? 'Project'}
        sectionName={task.sectionId ? sections[task.projectId]?.[task.sectionId] : undefined}
        parentTitle={parent?.content}
        subtaskCount={subtasks}
        onDetails={position === 0 && (task.description || subtasks > 0) ? () => setSheet('details') : undefined}
      />
    );
  };

  return (
    <div className="deck-screen">
      <div className="rail">
        <button type="button" className="icon-btn" onClick={exitDeck} aria-label="Back to projects">
          <ChevronLeft size={20} />
        </button>
        <div className="grow">
          <div className="eyebrow">{finished ? 'Sorted' : `${session.decided} of ${session.total} sorted`}</div>
          <h2>{title}</h2>
        </div>
      </div>
      <div className="progress" aria-hidden>
        <span style={{ width: `${percent}%` }} />
      </div>

      {finished ? (
        <Summary title={title} history={session.history} today={today} onBack={exitDeck} onUndo={canUndo ? undo : undefined} next={next} />
      ) : (
        <>
          <div className="deck">
            {session.queue
              .slice(1, 3)
              .reverse()
              .map((task) => {
                const position = session.queue.indexOf(task);
                return (
                  <div key={task.id} className={`card-slot behind${position === 2 ? ' behind-2' : ''}`} aria-hidden>
                    {cardFor(task, position)}
                  </div>
                );
              })}
            <SwipeCard key={current.id} exit={exit?.task.id === current.id ? exit.dir : null} onExited={onExited} onSwipe={onSwipe}>
              {cardFor(current, 0)}
            </SwipeCard>
          </div>
          <p className="sr-only" aria-live="polite">
            {`Ticket ${number} of ${session.total}: ${plainText(current.content)}`}
          </p>
        </>
      )}

      <div className="toast-wrap">
        {toast && (
          <div className={`toast ${toast.tone === 'error' ? 'error' : ''}`} role={toast.tone === 'error' ? 'alert' : 'status'}>
            <div className="msg">
              {toast.text}
              {toast.detail && <span> · {toast.detail}</span>}
            </div>
            {toast.undo && canUndo && (
              <button type="button" onClick={undo}>
                Undo
              </button>
            )}
          </div>
        )}
      </div>

      {!finished && (
        <nav className="actions" aria-label="Decide this task">
          <ActionButton className="small" label="Undo" onClick={undo} disabled={!canUndo} icon={<Undo2 size={18} />} />
          <ActionButton className="keep" label="Keep ←" onClick={act.keep} icon={<ThumbsUp size={22} />} />
          <ActionButton className="later" label="Later ↑" onClick={act.later} icon={<CalendarClock size={22} />} />
          <ActionButton className="delete" label="Delete ↓" onClick={act.remove} icon={<Trash2 size={21} />} />
          <ActionButton className="done" label="Done →" onClick={act.done} icon={<Check size={24} />} />
          <ActionButton className="small" label="More" onClick={() => setSheet('more')} icon={<Ellipsis size={18} />} />
        </nav>
      )}

      {current && sheet === 'later' && <LaterSheet task={current} today={today} onToday={act.today} onPick={act.schedule} onClose={() => setSheet(null)} />}
      {current && sheet === 'priority' && <PrioritySheet task={current} onPick={act.priority} onClose={() => setSheet(null)} />}
      {current && sheet === 'move' && (
        <MoveSheet task={current} projects={projects} recent={recentMoves} onPick={act.move} onClose={() => setSheet(null)} />
      )}
      {current && sheet === 'more' && (
        <MoreSheet
          task={current}
          onPriority={() => setSheet('priority')}
          onMove={() => setSheet('move')}
          onSkip={act.skip}
          onDelete={act.remove}
          onClose={() => setSheet(null)}
        />
      )}
      {current && sheet === 'details' && (
        <DetailsSheet task={current} subtasks={allTasks.filter((t) => t.parentId === current.id)} onClose={() => setSheet(null)} />
      )}
    </div>
  );
}

function ActionButton({ className, label, onClick, disabled, icon }: { className: string; label: string; onClick: () => void; disabled?: boolean; icon: ReactNode }) {
  return (
    <button type="button" className={`action ${className}`} onClick={onClick} disabled={disabled}>
      <span className="disc" aria-hidden>
        {icon}
      </span>
      <span className="label">{label}</span>
    </button>
  );
}

