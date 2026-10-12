import { ArrowUpRight, CalendarDays, Flag, ListTree, Repeat, Tag, Target } from 'lucide-react';
import type { Task } from '../api/types';
import { ageLabel, dueState, formatDay, formatDue } from '../lib/dates';
import { plainText, todoistTaskUrl } from '../lib/text';

interface Props {
  task: Task;
  /** 1-based position in the deck, for the ticket number. */
  number: number;
  total: number;
  projectName: string;
  sectionName?: string;
  parentTitle?: string;
  subtaskCount: number;
  today: string;
  onDetails?: () => void;
}

const pad = (n: number) => String(n).padStart(2, '0');

export function TicketCard({ task, number, total, projectName, sectionName, parentTitle, subtaskCount, today, onDetails }: Props) {
  const state = dueState(task.due, today);
  const age = ageLabel(task.addedAt, today);
  const description = plainText(task.description);

  return (
    <article className="ticket" aria-label={plainText(task.content)}>
      <header className="ticket-head eyebrow">
        <span>
          Ticket {pad(number)}/{pad(total)}
        </span>
        {age && <span>{age}</span>}
      </header>

      <div className="crumbs">
        <span>{projectName}</span>
        {sectionName && <span>› {sectionName}</span>}
        {parentTitle && <span>› {plainText(parentTitle)}</span>}
      </div>

      <h3>{plainText(task.content)}</h3>
      {description && <p className="desc">{description}</p>}

      <div className="chips">
        {task.due && (
          <span className={`chip ${state === 'overdue' ? 'overdue' : state === 'today' ? 'today' : ''}`}>
            <CalendarDays size={14} aria-hidden />
            {state === 'overdue' ? `Overdue · ${formatDue(task.due, today)}` : formatDue(task.due, today)}
          </span>
        )}
        {task.due?.recurring && (
          <span className="chip" title="Repeats. Done moves it to the next date.">
            <Repeat size={14} aria-hidden />
            {task.due.recurring}
          </span>
        )}
        {task.deadline && (
          <span className="chip">
            <Target size={14} aria-hidden />
            Deadline {formatDay(task.deadline, today)}
          </span>
        )}
        {task.priority < 4 && (
          <span className={`chip p${task.priority}`}>
            <Flag size={14} aria-hidden />P{task.priority}
          </span>
        )}
        {task.labels.map((label) => (
          <span className="chip" key={label}>
            <Tag size={13} aria-hidden />
            {label}
          </span>
        ))}
        {subtaskCount > 0 && (
          <span className="chip">
            <ListTree size={14} aria-hidden />
            {subtaskCount} subtask{subtaskCount === 1 ? '' : 's'}
          </span>
        )}
      </div>

      <footer className="ticket-foot">
        <a className="link-btn" href={todoistTaskUrl(task.id)} target="_blank" rel="noreferrer">
          Open in Todoist <ArrowUpRight size={14} aria-hidden />
        </a>
        {onDetails && (
          <button type="button" className="link-btn" onClick={onDetails}>
            Details
          </button>
        )}
      </footer>
    </article>
  );
}
