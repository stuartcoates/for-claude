import { describe, expect, it } from 'vitest';
import type { Project, Task } from '../api/types';
import { buildDeck, projectTree, statsByProject } from './deck';
import { plainText } from './text';
import { resolveSwipe } from './swipe';

const task = (id: string, extra: Partial<Task> = {}): Task => ({
  id,
  content: id,
  description: '',
  projectId: 'p',
  sectionId: null,
  parentId: null,
  priority: 4,
  due: null,
  deadline: null,
  labels: [],
  addedAt: '2026-09-01T00:00:00Z',
  ...extra,
});

describe('deck order', () => {
  const today = '2026-10-12';
  const tasks = [
    task('upcoming', { due: { date: '2026-10-20', recurring: null } }),
    task('undated-new', { addedAt: '2026-10-01T00:00:00Z' }),
    task('overdue-recent', { due: { date: '2026-10-10', recurring: null } }),
    task('today', { due: { date: '2026-10-12T09:00:00', recurring: null } }),
    task('undated-old', { addedAt: '2026-01-01T00:00:00Z' }),
    task('overdue-old', { due: { date: '2026-09-01', recurring: 'every month' } }),
    task('header', { content: '* Prep list' }),
    task('subtask', { parentId: 'today' }),
    task('elsewhere', { projectId: 'q' }),
  ];

  it('puts overdue first, then today, then undated oldest-first, then upcoming', () => {
    expect(buildDeck(tasks, new Set(['p']), false, today).map((t) => t.id)).toEqual([
      'overdue-old',
      'overdue-recent',
      'today',
      'undated-old',
      'undated-new',
      'upcoming',
    ]);
  });

  it('skips headers always, and subtasks unless asked', () => {
    expect(buildDeck(tasks, new Set(['p']), true, today).map((t) => t.id)).toContain('subtask');
    expect(buildDeck(tasks, new Set(['p']), true, today).map((t) => t.id)).not.toContain('header');
  });

  it('counts open and overdue tasks per project', () => {
    const stats = statsByProject(tasks, false, today);
    expect(stats.get('p')).toEqual({ count: 6, overdue: 2 });
    expect(stats.get('q')).toEqual({ count: 1, overdue: 0 });
  });
});

describe('project tree', () => {
  it('nests projects in sidebar order with the Inbox first', () => {
    const projects: Project[] = [
      { id: 'b', name: 'B', parentId: null, isInbox: false, order: 2 },
      { id: 'a', name: 'A', parentId: null, isInbox: false, order: 1 },
      { id: 'a2', name: 'A2', parentId: 'a', isInbox: false, order: 2 },
      { id: 'a1', name: 'A1', parentId: 'a', isInbox: false, order: 1 },
      { id: 'a1x', name: 'A1x', parentId: 'a1', isInbox: false, order: 1 },
      { id: 'in', name: 'Inbox', parentId: null, isInbox: true, order: 5 },
    ];
    const rows = projectTree(projects);
    expect(rows.map((r) => `${r.depth}:${r.project.id}`)).toEqual(['0:in', '0:a', '1:a1', '2:a1x', '1:a2', '0:b']);
    expect(rows.find((r) => r.project.id === 'a')!.familyIds).toEqual(['a', 'a1', 'a1x', 'a2']);
  });
});

describe('plain text', () => {
  it('strips Todoist markdown but keeps the words', () => {
    expect(plainText('Send the [RSVP form](https://example.com) **today**')).toBe('Send the RSVP form today');
    expect(plainText('Fix `snake_case_name` in *the* doc')).toBe('Fix snake_case_name in the doc');
  });
});

describe('swipe resolution', () => {
  it('needs real distance or a flick, and picks the dominant axis', () => {
    expect(resolveSwipe(30, 5, 400)).toBeNull();
    expect(resolveSwipe(-150, 20, 400)).toBe('left');
    expect(resolveSwipe(150, -30, 400)).toBe('right');
    expect(resolveSwipe(10, -140, 400)).toBe('up');
    expect(resolveSwipe(5, 130, 400)).toBe('down');
    expect(resolveSwipe(60, 0, 50)).toBe('right'); // quick flick
  });
});
