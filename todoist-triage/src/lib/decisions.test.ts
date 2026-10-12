import { describe, expect, it } from 'vitest';
import type { Backend, Task } from '../api/types';
import { applyRemote, revertRemote } from './decisions';

/** Records every call so each test can check exactly what would reach Todoist. */
function recorder() {
  const calls: string[] = [];
  const log =
    (name: string) =>
    async (task: Task, arg?: unknown) => {
      calls.push(arg === undefined ? `${name} ${task.id}` : `${name} ${task.id} ${JSON.stringify(arg)}`);
    };
  const backend: Backend = {
    kind: 'demo',
    listProjects: async () => [],
    listTasks: async () => [],
    listSections: async () => [],
    complete: log('complete'),
    reopen: log('reopen'),
    remove: log('remove'),
    setPriority: log('priority'),
    move: log('move'),
    setDueString: log('dueString'),
    reschedule: log('reschedule'),
    clearDue: log('clearDue'),
  };
  return { backend, calls };
}

const base: Task = {
  id: 't1',
  content: 'Task',
  description: '',
  projectId: 'p1',
  sectionId: null,
  parentId: null,
  priority: 4,
  due: null,
  deadline: null,
  labels: [],
  addedAt: null,
};

describe('decisions reaching Todoist', () => {
  it('gives an undated task a date, and undo removes it again', async () => {
    const { backend, calls } = recorder();
    const d = { kind: 'schedule', date: '2026-10-12' } as const;
    await applyRemote(backend, base, d);
    await revertRemote(backend, base, d);
    expect(calls).toEqual(['dueString t1 "2026-10-12"', 'clearDue t1']);
  });

  it('reschedules a dated task (keeping its repeat rule), and undo moves it back', async () => {
    const { backend, calls } = recorder();
    const task = { ...base, due: { date: '2026-10-01T09:00:00', recurring: 'every week' } };
    const d = { kind: 'schedule', date: '2026-10-12' } as const;
    await applyRemote(backend, task, d);
    await revertRemote(backend, task, d);
    expect(calls).toEqual(['reschedule t1 "2026-10-12"', 'reschedule t1 "2026-10-01T09:00:00"']);
  });

  it('restores a repeat rule when undoing "remove date"', async () => {
    const { backend, calls } = recorder();
    const task = { ...base, due: { date: '2026-10-01', recurring: 'every mon' } };
    const d = { kind: 'schedule', date: null } as const;
    await applyRemote(backend, task, d);
    await revertRemote(backend, task, d);
    expect(calls).toEqual(['clearDue t1', 'dueString t1 "every mon"', 'reschedule t1 "2026-10-01"']);
  });

  it('undoes Done on a repeating task by moving its date back, not reopening', async () => {
    const { backend, calls } = recorder();
    const task = { ...base, due: { date: '2026-10-05', recurring: 'every mon' } };
    await applyRemote(backend, task, { kind: 'done' });
    await revertRemote(backend, task, { kind: 'done' });
    expect(calls).toEqual(['complete t1', 'reschedule t1 "2026-10-05"']);
  });

  it('reopens a one-off task, and moves a task back to its old section', async () => {
    const { backend, calls } = recorder();
    await revertRemote(backend, base, { kind: 'done' });
    const sectioned = { ...base, sectionId: 's9' };
    await applyRemote(backend, sectioned, { kind: 'move', projectId: 'p2', projectName: 'Two' });
    await revertRemote(backend, sectioned, { kind: 'move', projectId: 'p2', projectName: 'Two' });
    expect(calls).toEqual(['reopen t1', 'move t1 {"projectId":"p2"}', 'move t1 {"sectionId":"s9"}']);
  });

  it('never sends anything for Keep or Skip', async () => {
    const { backend, calls } = recorder();
    await applyRemote(backend, base, { kind: 'keep' });
    await applyRemote(backend, base, { kind: 'skip' });
    expect(calls).toEqual([]);
  });
});
