import type { Backend, Due, Project, Section, Task } from './types';
import { addDays, keepTimeOfDay, todayISO } from '../lib/dates';

/**
 * Sample tasks held in memory, so the app can be tried (and tested) without a
 * Todoist account. Nothing here touches Todoist; a reload starts over.
 */

const PROJECTS: Project[] = [
  { id: 'inbox', name: 'Inbox', parentId: null, isInbox: true, order: 0 },
  { id: 'home', name: 'Home', parentId: null, isInbox: false, order: 1 },
  { id: 'move', name: 'Moving out', parentId: 'home', isInbox: false, order: 1 },
  { id: 'supper', name: 'Supper club', parentId: null, isInbox: false, order: 2 },
  { id: 'errands', name: 'Errands', parentId: null, isInbox: false, order: 3 },
  { id: 'someday', name: 'Someday maybe', parentId: null, isInbox: false, order: 4 },
];

const SECTIONS: Record<string, Section[]> = {
  supper: [
    { id: 'sec-menu', name: 'Menu' },
    { id: 'sec-guests', name: 'Guests' },
  ],
};

type Seed = Pick<Task, 'id' | 'projectId' | 'content'> &
  Partial<Pick<Task, 'description' | 'sectionId' | 'parentId' | 'labels' | 'priority'>> & {
    /** Days from today; negative is overdue. */
    dueIn?: number;
    deadlineIn?: number;
    /** Renders as a Todoist header ("* "), which triage skips. */
    header?: boolean;
    time?: string;
    every?: string;
    addedDaysAgo: number;
  };

const SEEDS: Seed[] = [
  { id: 'd1', projectId: 'inbox', content: 'Call the dentist about the cracked crown', addedDaysAgo: 41, dueIn: -9, priority: 2 },
  { id: 'd2', projectId: 'inbox', content: 'Read that long article on sourdough hydration', addedDaysAgo: 120, labels: ['reading'] },
  { id: 'd3', projectId: 'inbox', content: 'Renew passport before the spring trip', addedDaysAgo: 18, deadlineIn: 50, priority: 1, description: 'Photos at the pharmacy on 4th St. Old passport is in the blue folder.' },
  { id: 'd4', projectId: 'inbox', content: 'Back up phone photos', addedDaysAgo: 60, dueIn: -2, every: 'every month' },
  { id: 'd5', projectId: 'inbox', content: 'Look into a cheaper phone plan', addedDaysAgo: 75 },
  { id: 'd6', projectId: 'home', content: 'Descale the espresso machine', addedDaysAgo: 30, dueIn: 0, every: 'every 4 weeks', labels: ['kitchen'] },
  { id: 'd7', projectId: 'home', content: 'Fix the wobbly bar stool', addedDaysAgo: 95, priority: 3 },
  { id: 'd8', projectId: 'home', content: 'Hang the framed menu from Lisbon', addedDaysAgo: 210 },
  { id: 'd9', projectId: 'move', content: 'Get three quotes from movers', addedDaysAgo: 12, dueIn: -1, priority: 1, description: 'Ask about piano handling and whether they bring wardrobe boxes.' },
  { id: 'd10', projectId: 'move', content: 'Photograph every room for the deposit', addedDaysAgo: 12, dueIn: 6 },
  { id: 'd11', projectId: 'move', content: 'Forward mail with USPS', addedDaysAgo: 9, dueIn: 14, priority: 2 },
  { id: 'd12', projectId: 'move', content: 'Cancel internet at the old place', addedDaysAgo: 9 },
  { id: 'd13', projectId: 'supper', sectionId: 'sec-menu', content: 'Test the vermouth spritz batch ratio', addedDaysAgo: 16, dueIn: -4, labels: ['bar'], priority: 2 },
  { id: 'd14', projectId: 'supper', sectionId: 'sec-menu', content: 'Confirm the fish order with the monger for Saturday', addedDaysAgo: 5, dueIn: 1, time: '10:00', priority: 1 },
  { id: 'd15', projectId: 'supper', sectionId: 'sec-menu', content: 'Write place cards', addedDaysAgo: 5, dueIn: 3 },
  { id: 'd16', projectId: 'supper', sectionId: 'sec-guests', content: 'Ask Priya about the shellfish allergy', addedDaysAgo: 22, dueIn: -6, labels: ['guests'] },
  { id: 'd17', projectId: 'supper', sectionId: 'sec-guests', content: 'Send the [RSVP form](https://example.com/rsvp) to the waitlist', addedDaysAgo: 8 },
  { id: 'd18', projectId: 'supper', content: 'Prep list', header: true, addedDaysAgo: 30 },
  { id: 'd19', projectId: 'supper', parentId: 'd14', content: 'Ask for the halibut collars too', addedDaysAgo: 5 },
  { id: 'd20', projectId: 'errands', content: 'Return the library books', addedDaysAgo: 26, dueIn: -12 },
  { id: 'd21', projectId: 'errands', content: 'Pick up dry cleaning', addedDaysAgo: 4, dueIn: 0, time: '17:30' },
  { id: 'd22', projectId: 'errands', content: 'Buy a birthday card for Mom', addedDaysAgo: 3, dueIn: 5, priority: 2 },
  { id: 'd23', projectId: 'someday', content: 'Learn to make proper tortillas', addedDaysAgo: 300 },
  { id: 'd24', projectId: 'someday', content: 'Plan a mezcal tasting weekend in Oaxaca', addedDaysAgo: 180 },
];

function seedTasks(today: string): Task[] {
  return SEEDS.map((s) => {
    let due: Due | null = null;
    if (s.dueIn !== undefined) {
      const day = addDays(today, s.dueIn);
      due = { date: s.time ? `${day}T${s.time}:00` : day, recurring: s.every ?? null };
    }
    return {
      id: s.id,
      content: s.header ? `* ${s.content}` : s.content,
      description: s.description ?? '',
      projectId: s.projectId,
      sectionId: s.sectionId ?? null,
      parentId: s.parentId ?? null,
      priority: s.priority ?? 4,
      due,
      deadline: s.deadlineIn === undefined ? null : addDays(today, s.deadlineIn),
      labels: s.labels ?? [],
      addedAt: new Date(Date.now() - s.addedDaysAgo * 86_400_000).toISOString(),
    };
  });
}

export function createDemoBackend({ latencyMs = 250 } = {}): Backend {
  const today = todayISO();
  let tasks = seedTasks(today);
  const pause = () => new Promise((r) => setTimeout(r, latencyMs));
  const find = (id: string) => tasks.find((t) => t.id === id);
  const patch = (id: string, change: Partial<Task>) => {
    tasks = tasks.map((t) => (t.id === id ? { ...t, ...change } : t));
  };
  const completed = new Map<string, Task>();

  return {
    kind: 'demo',
    async listProjects() {
      await pause();
      return PROJECTS;
    },
    async listTasks() {
      await pause();
      return tasks.map((t) => ({ ...t }));
    },
    async listSections(projectId) {
      await pause();
      return SECTIONS[projectId] ?? [];
    },
    async complete(task) {
      await pause();
      const current = find(task.id);
      if (!current) return;
      if (current.due?.recurring) {
        // Like Todoist: a repeating task rolls forward instead of closing.
        patch(task.id, { due: { ...current.due, date: keepTimeOfDay(addDays(today, 7), current.due.date) } });
      } else {
        completed.set(task.id, current);
        tasks = tasks.filter((t) => t.id !== task.id && t.parentId !== task.id);
      }
    },
    async reopen(task) {
      await pause();
      const restored = completed.get(task.id);
      if (restored) tasks = [...tasks, restored];
    },
    async remove(task) {
      await pause();
      tasks = tasks.filter((t) => t.id !== task.id && t.parentId !== task.id);
    },
    async setPriority(task, priority) {
      await pause();
      patch(task.id, { priority });
    },
    async move(task, target) {
      await pause();
      if ('projectId' in target) patch(task.id, { projectId: target.projectId, sectionId: null, parentId: null });
      else if ('sectionId' in target) patch(task.id, { sectionId: target.sectionId, parentId: null });
      else patch(task.id, { parentId: target.parentId });
    },
    async setDueString(task, dueString) {
      await pause();
      patch(task.id, { due: { date: dueString, recurring: null } });
    },
    async reschedule(task, date) {
      await pause();
      const current = find(task.id);
      if (current?.due) patch(task.id, { due: { ...current.due, date: keepTimeOfDay(date, current.due.date) } });
    },
    async clearDue(task) {
      await pause();
      patch(task.id, { due: null });
    },
  };
}
