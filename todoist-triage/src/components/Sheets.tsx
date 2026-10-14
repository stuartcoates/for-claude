import { useMemo, useState } from 'react';
import { ArrowUpRight, CalendarX, Flag, FolderInput, SkipForward, Sun, Trash2 } from 'lucide-react';
import type { Priority, Project, Task } from '../api/types';
import { formatDate, laterOptions } from '../lib/dates';
import { projectTree } from '../lib/deck';
import { plainText, todoistTaskUrl } from '../lib/text';
import { Sheet } from './Sheet';

const title = (task: Task) => plainText(task.content);

export function LaterSheet({
  task,
  today,
  onToday,
  onPick,
  onClose,
}: {
  task: Task;
  today: string;
  onToday: () => void;
  onPick: (date: string | null) => void;
  onClose: () => void;
}) {
  const [custom, setCustom] = useState('');
  return (
    <Sheet title="When?" subtitle={title(task)} onClose={onClose}>
      <ul className="options">
        <li>
          <button type="button" className="option" onClick={onToday}>
            <Sun size={18} aria-hidden style={{ color: 'var(--heat)' }} />
            Today
            <span className="when">T</span>
          </button>
        </li>
        {laterOptions(today).map((o) => (
          <li key={o.key}>
            <button type="button" className="option" onClick={() => onPick(o.date)}>
              {o.label}
              <span className="when">{formatDate(o.date, today)}</span>
            </button>
          </li>
        ))}
        {task.due && (
          <li>
            <button type="button" className="option" onClick={() => onPick(null)}>
              <CalendarX size={18} aria-hidden />
              {task.due.recurring ? 'Remove date (stops repeating)' : 'Remove date'}
            </button>
          </li>
        )}
      </ul>
      <form
        className="date-row"
        onSubmit={(e) => {
          e.preventDefault();
          if (custom) onPick(custom);
        }}
      >
        <label className="sr-only" htmlFor="later-date">
          Pick a date
        </label>
        <input id="later-date" className="field" type="date" min={today} value={custom} onChange={(e) => setCustom(e.target.value)} />
        <button className="btn primary" type="submit" disabled={!custom}>
          Set date
        </button>
      </form>
    </Sheet>
  );
}

export function PrioritySheet({ task, onPick, onClose }: { task: Task; onPick: (p: Priority) => void; onClose: () => void }) {
  const levels: { p: Priority; label: string }[] = [
    { p: 1, label: 'Priority 1 — urgent' },
    { p: 2, label: 'Priority 2 — high' },
    { p: 3, label: 'Priority 3 — medium' },
    { p: 4, label: 'Priority 4 — none' },
  ];
  return (
    <Sheet title="Set priority" subtitle={title(task)} onClose={onClose}>
      <ul className="options">
        {levels.map(({ p, label }) => (
          <li key={p}>
            <button type="button" className="option" onClick={() => onPick(p)} aria-current={task.priority === p}>
              <Flag size={18} aria-hidden style={{ color: p < 4 ? `var(--p${p})` : 'var(--ink-faint)' }} />
              {label}
              {task.priority === p && <span className="when">current</span>}
            </button>
          </li>
        ))}
      </ul>
    </Sheet>
  );
}

export function MoveSheet({
  task,
  projects,
  recent,
  onPick,
  onClose,
}: {
  task: Task;
  projects: Project[];
  recent: string[];
  onPick: (p: Project) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const rows = useMemo(() => projectTree(projects).filter((r) => r.project.id !== task.projectId), [projects, task.projectId]);
  const q = query.trim().toLowerCase();
  const shown = q ? rows.filter((r) => r.project.name.toLowerCase().includes(q)) : rows;
  const recentProjects = q ? [] : recent.map((id) => projects.find((p) => p.id === id)).filter((p): p is Project => !!p && p.id !== task.projectId);

  return (
    <Sheet title="Move to project" subtitle={title(task)} onClose={onClose}>
      <label className="sr-only" htmlFor="move-search">
        Find a project
      </label>
      <input id="move-search" className="field" type="search" placeholder="Find a project" value={query} onChange={(e) => setQuery(e.target.value)} autoComplete="off" />
      {recentProjects.length > 0 && (
        <>
          <p className="eyebrow" style={{ marginTop: 14 }}>
            Recent
          </p>
          <ul className="options">
            {recentProjects.map((p) => (
              <li key={`recent-${p.id}`}>
                <button type="button" className="option" onClick={() => onPick(p)}>
                  <FolderInput size={18} aria-hidden />
                  <span className="name">{p.name}</span>
                </button>
              </li>
            ))}
          </ul>
          <p className="eyebrow" style={{ marginTop: 14 }}>
            All projects
          </p>
        </>
      )}
      <ul className="options">
        {shown.map(({ project, depth }) => (
          <li key={project.id}>
            <button type="button" className="option" onClick={() => onPick(project)} style={{ paddingLeft: 4 + (q ? 0 : depth * 16) }}>
              <span className="name">{project.name}</span>
            </button>
          </li>
        ))}
        {shown.length === 0 && <li className="sub">No project matches “{query}”.</li>}
      </ul>
    </Sheet>
  );
}

export function MoreSheet({
  task,
  onPriority,
  onMove,
  onSkip,
  onDelete,
  onClose,
}: {
  task: Task;
  onPriority: () => void;
  onMove: () => void;
  onSkip: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  return (
    <Sheet title="More" subtitle={title(task)} onClose={onClose}>
      <ul className="options">
        <li>
          <button type="button" className="option" onClick={onPriority}>
            <Flag size={18} aria-hidden /> Set priority <span className="when">P</span>
          </button>
        </li>
        <li>
          <button type="button" className="option" onClick={onMove}>
            <FolderInput size={18} aria-hidden /> Move to another project <span className="when">M</span>
          </button>
        </li>
        <li>
          <button type="button" className="option" onClick={onSkip}>
            <SkipForward size={18} aria-hidden /> Skip for now (back of the deck) <span className="when">S</span>
          </button>
        </li>
        <li>
          <a className="option" href={todoistTaskUrl(task.id)} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
            <ArrowUpRight size={18} aria-hidden /> Open in Todoist
          </a>
        </li>
        <li>
          <button type="button" className="option danger" onClick={onDelete}>
            <Trash2 size={18} aria-hidden /> Delete task <span className="when">↓</span>
          </button>
        </li>
      </ul>
    </Sheet>
  );
}

export function DetailsSheet({ task, subtasks, onClose }: { task: Task; subtasks: Task[]; onClose: () => void }) {
  return (
    <Sheet title="Details" onClose={onClose}>
      <p className="details-body" style={{ fontWeight: 600, marginTop: 0 }}>
        {plainText(task.content)}
      </p>
      {task.description ? <p className="details-body">{task.description}</p> : <p className="sub">No description.</p>}
      {subtasks.length > 0 && (
        <>
          <p className="eyebrow" style={{ marginTop: 16 }}>
            Subtasks
          </p>
          <ul className="subtasks">
            {subtasks.map((s) => (
              <li key={s.id}>{plainText(s.content)}</li>
            ))}
          </ul>
        </>
      )}
      <div className="button-row" style={{ marginTop: 18 }}>
        <a className="btn" href={todoistTaskUrl(task.id)} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
          Open in Todoist <ArrowUpRight size={16} aria-hidden />
        </a>
        <button type="button" className="btn primary" onClick={onClose}>
          Back to the card
        </button>
      </div>
    </Sheet>
  );
}
