import type { Backend, Priority, Project, Section, Task } from './types';
import { TodoistError } from './errors';

/**
 * Talks to Todoist through the viewer's claude.ai Todoist connector, via the artifact
 * runtime's `mcp` capability. No token ever reaches this page.
 * The tool names here must match the `mcp` manifest the artifact is published with.
 */
export const CONNECTOR = 'Todoist';

export const CONNECTOR_TOOLS = [
  'find-projects',
  'find-tasks',
  'find-sections',
  'complete-tasks',
  'uncomplete-tasks',
  'update-tasks',
  'reschedule-tasks',
  'delete-object',
] as const;

type Tool = (typeof CONNECTOR_TOOLS)[number];

/** Resolves the connector backend inside claude.ai, or null anywhere else. */
export async function detectConnector(): Promise<Backend | null> {
  if (typeof window === 'undefined' || !window.claude?.use) return null;
  try {
    const mcp = (await window.claude.use('mcp')) as ClaudeMcp | null;
    return mcp ? createConnectorBackend(mcp) : null;
  } catch {
    return null;
  }
}

function mapMcpError(err: unknown): TodoistError {
  const e = err as Partial<ClaudeMcpError> | undefined;
  switch (e?.code) {
    case 'needs_reauth':
      return new TodoistError('auth', e.message);
    case 'server_not_connected':
    case 'server_not_found':
    case 'not_granted':
    case 'capability_disabled':
    case 'capability_removed':
      return new TodoistError('not-connected', e.message);
    case 'not_in_manifest':
    case 'blocked_by_policy':
    case 'consent_required':
    case 'approval_required':
      return new TodoistError('not-allowed', e.message);
    case 'selection_required':
      return new TodoistError('choose-connection', e.message);
    case 'server_unavailable':
    case 'rate_limited':
      return new TodoistError('busy', e.message, Boolean(e.retryable));
    case 'tool_error':
      return new TodoistError('todoist', e.message);
    default:
      return new TodoistError('unknown', e?.message ?? String(err), Boolean(e?.retryable));
  }
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Batch tools report per-item failures inside a successful result; surface them as errors. */
function throwOnFailures(payload: unknown): void {
  const failures = (payload as { failures?: { error?: string }[] } | null)?.failures;
  if (Array.isArray(failures) && failures.length > 0) {
    throw new TodoistError('todoist', failures[0]?.error ?? 'Todoist refused the change.');
  }
}

interface McpTask {
  id: string;
  content: string;
  description?: string;
  dueDate?: string;
  recurring?: string | false;
  deadlineDate?: string;
  priority?: 'p1' | 'p2' | 'p3' | 'p4';
  projectId: string;
  sectionId?: string;
  parentId?: string;
  labels?: string[];
  addedAt?: string;
}

interface McpProject {
  id: string;
  name: string;
  parentId?: string;
  inboxProject?: boolean;
  childOrder?: number;
  isArchived?: boolean;
}

export function fromMcpTask(t: McpTask): Task {
  return {
    id: t.id,
    content: t.content,
    description: t.description ?? '',
    projectId: t.projectId,
    sectionId: t.sectionId ?? null,
    parentId: t.parentId ?? null,
    priority: t.priority ? (Number(t.priority.slice(1)) as Priority) : 4,
    due: t.dueDate ? { date: t.dueDate, recurring: t.recurring || null } : null,
    deadline: t.deadlineDate ?? null,
    labels: t.labels ?? [],
    addedAt: t.addedAt ?? null,
  };
}

export function createConnectorBackend(mcp: ClaudeMcp): Backend {
  async function call(tool: Tool, input: unknown, { read = false } = {}): Promise<unknown> {
    try {
      const result = await mcp.callTool(CONNECTOR, tool, input, { cache: false });
      const payload = result.payload ?? result.structuredContent;
      throwOnFailures(payload);
      return payload;
    } catch (err) {
      const mapped = err instanceof TodoistError ? err : mapMcpError(err);
      // Reads may be retried once; a write that failed ambiguously is never re-sent unattended.
      if (read && mapped.retryable) {
        const after = (err as ClaudeMcpError).retryAfterMs ?? 0;
        await wait(Math.max(after, 600 + Math.random() * 900));
        const result = await mcp.callTool(CONNECTOR, tool, input, { cache: false }).catch((e2) => {
          throw mapMcpError(e2);
        });
        return result.payload ?? result.structuredContent;
      }
      throw mapped;
    }
  }

  async function paged<T>(tool: Tool, input: Record<string, unknown>, key: string): Promise<T[]> {
    const items: T[] = [];
    let cursor: string | undefined;
    for (let page = 0; page < 50; page++) {
      const payload = (await call(tool, cursor ? { ...input, cursor } : input, { read: true })) as Record<string, unknown>;
      items.push(...((payload?.[key] as T[]) ?? []));
      cursor = payload?.nextCursor as string | undefined;
      if (!payload?.hasMore || !cursor) break;
    }
    return items;
  }

  return {
    kind: 'connector',

    async listProjects(): Promise<Project[]> {
      const projects = await paged<McpProject>('find-projects', { limit: 200 }, 'projects');
      return projects
        .filter((p) => !p.isArchived)
        .map((p) => ({
          id: p.id,
          name: p.name,
          parentId: p.parentId ?? null,
          isInbox: Boolean(p.inboxProject),
          order: p.childOrder ?? 0,
        }));
    },

    async listTasks(): Promise<Task[]> {
      // find-tasks needs some filter; this one matches every open task.
      const tasks = await paged<McpTask>('find-tasks', { filter: 'no date | !no date', limit: 100 }, 'tasks');
      return tasks.map(fromMcpTask);
    },

    async listSections(projectId: string): Promise<Section[]> {
      const payload = (await call('find-sections', { projectId }, { read: true })) as { sections?: Section[] };
      return (payload?.sections ?? []).map((s) => ({ id: s.id, name: s.name }));
    },

    async complete(task) {
      await call('complete-tasks', { ids: [task.id] });
    },

    async reopen(task) {
      await call('uncomplete-tasks', { ids: [task.id] });
    },

    async remove(task) {
      await call('delete-object', { type: 'task', id: task.id });
    },

    async setPriority(task, priority) {
      await call('update-tasks', { tasks: [{ id: task.id, priority: `p${priority}` }] });
    },

    async move(task, target) {
      await call('update-tasks', { tasks: [{ id: task.id, ...target }] });
    },

    async setDueString(task, dueString) {
      await call('update-tasks', { tasks: [{ id: task.id, dueString }] });
    },

    async reschedule(task, date) {
      // The connector keeps the repeat rule and the time of day for us.
      await call('reschedule-tasks', { tasks: [{ id: task.id, date }] });
    },

    async clearDue(task) {
      await call('update-tasks', { tasks: [{ id: task.id, dueString: 'remove' }] });
    },
  };
}
