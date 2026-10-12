import type { Project, Task } from '../api/types';
import { dueState, parseDue } from './dates';

/** Todoist section-style headers ("* Prep list") can't be completed, so they never become cards. */
export function isHeader(task: Task): boolean {
  return task.content.startsWith('* ');
}

export function isTriageable(task: Task, includeSubtasks: boolean): boolean {
  return !isHeader(task) && (includeSubtasks || task.parentId === null);
}

const RANK = { overdue: 0, today: 1, none: 2, upcoming: 3 } as const;

/**
 * Card order: overdue first (oldest due date first), then due today, then undated
 * (oldest added first), then upcoming (soonest first). The things rotting come up first.
 */
export function compareForTriage(a: Task, b: Task, today: string): number {
  const ra = RANK[dueState(a.due, today)];
  const rb = RANK[dueState(b.due, today)];
  if (ra !== rb) return ra - rb;
  if (a.due && b.due) {
    const da = parseDue(a.due.date).day;
    const db = parseDue(b.due.date).day;
    if (da !== db) return da < db ? -1 : 1;
  }
  return (a.addedAt ?? '').localeCompare(b.addedAt ?? '');
}

export function buildDeck(tasks: Task[], projectIds: ReadonlySet<string>, includeSubtasks: boolean, today: string): Task[] {
  return tasks
    .filter((t) => projectIds.has(t.projectId) && isTriageable(t, includeSubtasks))
    .sort((a, b) => compareForTriage(a, b, today));
}

export interface ProjectStats {
  count: number;
  overdue: number;
}

export function statsByProject(tasks: Task[], includeSubtasks: boolean, today: string): Map<string, ProjectStats> {
  const stats = new Map<string, ProjectStats>();
  for (const task of tasks) {
    if (!isTriageable(task, includeSubtasks)) continue;
    const s = stats.get(task.projectId) ?? { count: 0, overdue: 0 };
    s.count += 1;
    if (dueState(task.due, today) === 'overdue') s.overdue += 1;
    stats.set(task.projectId, s);
  }
  return stats;
}

export function sumStats(ids: Iterable<string>, stats: Map<string, ProjectStats>): ProjectStats {
  const total = { count: 0, overdue: 0 };
  for (const id of ids) {
    const s = stats.get(id);
    if (s) {
      total.count += s.count;
      total.overdue += s.overdue;
    }
  }
  return total;
}

export interface TreeRow {
  project: Project;
  depth: number;
  /** This project plus every project nested under it. */
  familyIds: string[];
}

/** Projects in Todoist's sidebar order (Inbox first), each with its nesting depth. */
export function projectTree(projects: Project[]): TreeRow[] {
  const byParent = new Map<string | null, Project[]>();
  const ids = new Set(projects.map((p) => p.id));
  for (const p of projects) {
    const parent = p.parentId && ids.has(p.parentId) ? p.parentId : null;
    byParent.set(parent, [...(byParent.get(parent) ?? []), p]);
  }
  const sortSiblings = (list: Project[]) =>
    [...list].sort((a, b) => Number(b.isInbox) - Number(a.isInbox) || a.order - b.order);

  const rows: TreeRow[] = [];
  const walk = (parent: string | null, depth: number): string[] => {
    const collected: string[] = [];
    for (const project of sortSiblings(byParent.get(parent) ?? [])) {
      const row: TreeRow = { project, depth, familyIds: [project.id] };
      rows.push(row);
      row.familyIds.push(...walk(project.id, depth + 1));
      collected.push(...row.familyIds);
    }
    return collected;
  };
  walk(null, 0);
  return rows;
}

export function countSubtasks(tasks: Task[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const t of tasks) {
    if (t.parentId) counts.set(t.parentId, (counts.get(t.parentId) ?? 0) + 1);
  }
  return counts;
}
