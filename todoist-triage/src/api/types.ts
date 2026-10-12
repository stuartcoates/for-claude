/** Todoist's own numbering: P1 is the most urgent, P4 is "no priority". */
export type Priority = 1 | 2 | 3 | 4;

export interface Project {
  id: string;
  name: string;
  parentId: string | null;
  isInbox: boolean;
  order: number;
}

export interface Section {
  id: string;
  name: string;
}

export interface Due {
  /** `YYYY-MM-DD`, or `YYYY-MM-DDTHH:MM:SS` (optionally with `Z`) when the task has a time. */
  date: string;
  /** The repeat rule as Todoist words it ("every mon"), or null for a one-off date. */
  recurring: string | null;
  /** The REST API's due object, kept so a reschedule can send it back unchanged. */
  raw?: RestDue;
}

export interface RestDue {
  date: string;
  string: string;
  is_recurring: boolean;
  datetime?: string | null;
  timezone?: string | null;
  lang?: string | null;
}

export interface Task {
  id: string;
  content: string;
  description: string;
  projectId: string;
  sectionId: string | null;
  parentId: string | null;
  priority: Priority;
  due: Due | null;
  deadline: string | null;
  labels: string[];
  addedAt: string | null;
}

export type MoveTarget = { projectId: string } | { sectionId: string } | { parentId: string };

export type BackendKind = 'connector' | 'token' | 'demo';

/**
 * Everything the app needs from Todoist. Three implementations: the claude.ai
 * connector, the public REST API with a personal token, and in-memory sample data.
 * Writes resolve once Todoist has accepted them and reject with a TodoistError.
 */
export interface Backend {
  kind: BackendKind;
  listProjects(): Promise<Project[]>;
  /** Every open task the user can see, across all projects. */
  listTasks(): Promise<Task[]>;
  listSections(projectId: string): Promise<Section[]>;
  complete(task: Task): Promise<void>;
  reopen(task: Task): Promise<void>;
  remove(task: Task): Promise<void>;
  setPriority(task: Task, priority: Priority): Promise<void>;
  move(task: Task, target: MoveTarget): Promise<void>;
  /** Set a due date from words or an ISO date. Only for tasks with no due date. */
  setDueString(task: Task, dueString: string): Promise<void>;
  /** Move a dated task to a new date, keeping its repeat rule and time of day. */
  reschedule(task: Task, date: string): Promise<void>;
  clearDue(task: Task): Promise<void>;
}
