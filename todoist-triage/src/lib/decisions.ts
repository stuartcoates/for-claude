import type { Backend, Due, Priority, Task } from '../api/types';
import { formatDay, keepTimeOfDay } from './dates';

/** One verdict on one card. Every decision moves the deck to the next card. */
export type Decision =
  | { kind: 'keep' }
  | { kind: 'skip' }
  | { kind: 'done' }
  | { kind: 'delete' }
  | { kind: 'schedule'; date: string | null }
  | { kind: 'priority'; priority: Priority }
  | { kind: 'move'; projectId: string; projectName: string };

export type DecisionKind = Decision['kind'];

/** The task as it should look in the local task list after the decision; null when it leaves the open list. */
export function localAfter(task: Task, d: Decision): Task | null {
  switch (d.kind) {
    case 'keep':
    case 'skip':
      return task;
    case 'done':
      // A repeating task rolls to its next date; the next refresh brings the real one.
      return task.due?.recurring ? task : null;
    case 'delete':
      return null;
    case 'priority':
      return { ...task, priority: d.priority };
    case 'move':
      return { ...task, projectId: d.projectId, sectionId: null, parentId: null };
    case 'schedule': {
      if (d.date === null) return { ...task, due: null };
      if (!task.due) return { ...task, due: { date: d.date, recurring: null } };
      const raw = task.due.raw;
      return {
        ...task,
        due: {
          ...task.due,
          date: keepTimeOfDay(d.date, task.due.date),
          raw: raw && { ...raw, date: keepTimeOfDay(d.date, raw.date), datetime: raw.datetime && keepTimeOfDay(d.date, raw.datetime) },
        },
      };
    }
  }
}

export async function applyRemote(b: Backend, task: Task, d: Decision): Promise<void> {
  switch (d.kind) {
    case 'keep':
    case 'skip':
      return;
    case 'done':
      return b.complete(task);
    case 'delete':
      return b.remove(task);
    case 'priority':
      return b.setPriority(task, d.priority);
    case 'move':
      return b.move(task, { projectId: d.projectId });
    case 'schedule':
      if (d.date === null) return task.due ? b.clearDue(task) : undefined;
      return task.due ? b.reschedule(task, d.date) : b.setDueString(task, d.date);
  }
}

/** Put a task's date back the way it was. `current` is the task as Todoist now has it. */
export async function restoreDue(b: Backend, current: Task, previous: Due | null): Promise<void> {
  if (!previous) {
    if (current.due) await b.clearDue(current);
    return;
  }
  if (current.due) return b.reschedule(current, previous.date);
  // The date was removed: restore the wording (and repeat rule), then pin the exact day and time.
  await b.setDueString(current, previous.recurring ?? previous.date.slice(0, 10));
  if (previous.recurring || previous.date.length > 10) await b.reschedule({ ...current, due: previous }, previous.date);
}

/** Undo a decision that already reached Todoist. `task` is the card as it was before the decision. */
export async function revertRemote(b: Backend, task: Task, d: Decision): Promise<void> {
  switch (d.kind) {
    case 'keep':
    case 'skip':
      return;
    case 'done':
      // Completing a repeating task only advanced its date, so move the date back.
      return task.due?.recurring ? b.reschedule(task, task.due.date) : b.reopen(task);
    case 'delete':
      throw new Error('A deleted task can’t be restored.');
    case 'priority':
      return b.setPriority(task, task.priority);
    case 'move':
      return b.move(task, task.parentId ? { parentId: task.parentId } : task.sectionId ? { sectionId: task.sectionId } : { projectId: task.projectId });
    case 'schedule': {
      const after = localAfter(task, d);
      return restoreDue(b, after ?? task, task.due);
    }
  }
}

/** Short past-tense label for toasts and the summary list. */
export function describeDecision(d: Decision, today: string): string {
  switch (d.kind) {
    case 'keep':
      return 'Kept';
    case 'skip':
      return 'Skipped';
    case 'done':
      return 'Done';
    case 'delete':
      return 'Deleted';
    case 'priority':
      return `Priority ${d.priority}`;
    case 'move':
      return `Moved to ${d.projectName}`;
    case 'schedule':
      if (d.date === null) return 'Date removed';
      return d.date === today ? 'Today' : `Later · ${formatDay(d.date, today)}`;
  }
}
