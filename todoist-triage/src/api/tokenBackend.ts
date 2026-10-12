import type { Backend, Priority, Project, RestDue, Section, Task } from './types';
import { TodoistError } from './errors';
import { keepTimeOfDay } from '../lib/dates';

/**
 * Talks to Todoist's public API (v1) straight from the browser with a personal API
 * token. Todoist allows cross-origin requests from any site, so no server is needed.
 * Endpoints follow Todoist's official TypeScript SDK.
 */
const API = 'https://api.todoist.com/api/v1/';

interface RestTask {
  id: string;
  content: string;
  description: string;
  project_id: string;
  section_id: string | null;
  parent_id: string | null;
  priority: number; // 4 = P1 (urgent) … 1 = P4
  due: RestDue | null;
  deadline: { date: string } | null;
  labels: string[];
  added_at: string | null;
  checked?: boolean;
  is_deleted?: boolean;
}

interface RestProject {
  id: string;
  name: string;
  parent_id: string | null;
  inbox_project?: boolean;
  child_order: number;
  is_archived?: boolean;
  is_deleted?: boolean;
}

export function fromRestTask(t: RestTask): Task {
  return {
    id: t.id,
    content: t.content,
    description: t.description ?? '',
    projectId: t.project_id,
    sectionId: t.section_id ?? null,
    parentId: t.parent_id ?? null,
    priority: (5 - (t.priority || 1)) as Priority,
    due: t.due ? { date: t.due.datetime ?? t.due.date, recurring: t.due.is_recurring ? t.due.string : null, raw: t.due } : null,
    deadline: t.deadline?.date ?? null,
    labels: t.labels ?? [],
    addedAt: t.added_at ?? null,
  };
}

function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;
}

export function createTokenBackend(token: string): Backend {
  async function request<T>(method: 'GET' | 'POST' | 'DELETE', path: string, body?: unknown, query?: Record<string, string>): Promise<T> {
    const url = new URL(path, API);
    for (const [k, v] of Object.entries(query ?? {})) url.searchParams.set(k, v);
    const isForm = body instanceof URLSearchParams;
    let res: Response;
    try {
      res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          ...(body && !isForm ? { 'Content-Type': 'application/json' } : {}),
        },
        body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
      });
    } catch {
      throw new TodoistError('network');
    }
    if (res.status === 401 || res.status === 403) throw new TodoistError('auth');
    if (res.status === 429 || res.status >= 500) throw new TodoistError('busy', `HTTP ${res.status}`, true);
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      let detail = text;
      try {
        const json = JSON.parse(text) as { error?: string };
        detail = json.error ?? text;
      } catch {
        // Plain-text error body.
      }
      throw new TodoistError('todoist', detail || `HTTP ${res.status}`);
    }
    if (res.status === 204) return undefined as T;
    const text = await res.text();
    return (text ? JSON.parse(text) : undefined) as T;
  }

  async function paged<T>(path: string, query: Record<string, string> = {}): Promise<T[]> {
    const items: T[] = [];
    let cursor: string | null = null;
    for (let page = 0; page < 50; page++) {
      const data: { results: T[]; next_cursor: string | null } = await request('GET', path, undefined, {
        limit: '200',
        ...query,
        ...(cursor ? { cursor } : {}),
      });
      items.push(...data.results);
      cursor = data.next_cursor;
      if (!cursor) break;
    }
    return items;
  }

  /** One Sync API command; used for reschedules, which the REST endpoints can't do without losing the repeat rule. */
  async function syncCommand(type: string, args: Record<string, unknown>): Promise<void> {
    const id = uuid();
    const form = new URLSearchParams({ commands: JSON.stringify([{ type, uuid: id, args }]) });
    const data = await request<{ sync_status?: Record<string, unknown> }>('POST', 'sync', form);
    const status = data?.sync_status?.[id];
    if (status !== 'ok') {
      const err = status as { error?: string } | undefined;
      throw new TodoistError('todoist', err?.error ?? 'Todoist didn’t confirm the change.');
    }
  }

  return {
    kind: 'token',

    async listProjects(): Promise<Project[]> {
      const projects = await paged<RestProject>('projects');
      return projects
        .filter((p) => !p.is_archived && !p.is_deleted)
        .map((p) => ({
          id: p.id,
          name: p.name,
          parentId: p.parent_id,
          isInbox: Boolean(p.inbox_project),
          order: p.child_order,
        }));
    },

    async listTasks(): Promise<Task[]> {
      const tasks = await paged<RestTask>('tasks');
      return tasks.filter((t) => !t.checked && !t.is_deleted).map(fromRestTask);
    },

    async listSections(projectId: string): Promise<Section[]> {
      const sections = await paged<{ id: string; name: string }>('sections', { project_id: projectId });
      return sections.map((s) => ({ id: s.id, name: s.name }));
    },

    async complete(task) {
      await request('POST', `tasks/${task.id}/close`);
    },

    async reopen(task) {
      await request('POST', `tasks/${task.id}/reopen`);
    },

    async remove(task) {
      await request('DELETE', `tasks/${task.id}`);
    },

    async setPriority(task, priority) {
      await request('POST', `tasks/${task.id}`, { priority: 5 - priority });
    },

    async move(task, target) {
      const body =
        'projectId' in target
          ? { project_id: target.projectId }
          : 'sectionId' in target
            ? { section_id: target.sectionId }
            : { parent_id: target.parentId };
      await request('POST', `tasks/${task.id}/move`, body);
    },

    async setDueString(task, dueString) {
      const body = /^\d{4}-\d{2}-\d{2}$/.test(dueString) ? { due_date: dueString } : { due_string: dueString };
      await request('POST', `tasks/${task.id}`, body);
    },

    async reschedule(task, date) {
      const raw = task.due?.raw;
      if (!raw) throw new TodoistError('todoist', 'This task has no date to move.');
      // Same command Todoist's own MCP server sends: new date, original wording and repeat rule.
      await syncCommand('item_update', {
        id: task.id,
        due: {
          date: keepTimeOfDay(date, raw.datetime ?? raw.date),
          string: raw.string,
          is_recurring: raw.is_recurring,
          ...(raw.timezone ? { timezone: raw.timezone } : {}),
          ...(raw.lang ? { lang: raw.lang } : {}),
        },
      });
    },

    async clearDue(task) {
      await request('POST', `tasks/${task.id}`, { due_string: 'no date' });
    },
  };
}

/** Cheap check that a pasted token works before we store it. */
export async function verifyToken(token: string): Promise<void> {
  await createTokenBackend(token).listProjects();
}
