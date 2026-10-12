import { useCallback, useEffect, useReducer, useRef } from 'react';
import type { Backend, Task } from '../api/types';
import { describeError, toTodoistError } from '../api/errors';
import { applyRemote, localAfter, revertRemote, type Decision } from '../lib/decisions';

/** A delete waits this long before it reaches Todoist, because deletes can't be undone there. */
export const DELETE_GRACE_MS = 5000;

export interface Entry {
  key: number;
  task: Task;
  decision: Decision;
  /** `held`: a delete still inside its grace period. `final`: a delete Todoist has carried out. */
  status: 'held' | 'sent' | 'final';
}

interface State {
  queue: Task[];
  history: Entry[];
  total: number;
}

type Action =
  | { type: 'decide'; entry: Entry }
  | { type: 'undo'; key: number }
  | { type: 'restore'; entry: Entry } // an undo that Todoist refused: the decision stands
  | { type: 'failed'; key: number } // a decision Todoist refused: the card comes back
  | { type: 'status'; key: number; status: Entry['status'] };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'decide': {
      const { entry } = action;
      const rest = state.queue.filter((t) => t.id !== entry.task.id);
      return {
        ...state,
        queue: entry.decision.kind === 'skip' ? [...rest, entry.task] : rest,
        history: [...state.history, entry],
      };
    }
    case 'undo': {
      const entry = state.history.find((e) => e.key === action.key);
      if (!entry) return state;
      return {
        ...state,
        queue: [entry.task, ...state.queue.filter((t) => t.id !== entry.task.id)],
        history: state.history.filter((e) => e.key !== action.key),
      };
    }
    case 'restore': {
      const { entry } = action;
      return {
        ...state,
        queue: state.queue.filter((t) => t.id !== entry.task.id),
        history: [...state.history, entry].sort((a, b) => a.key - b.key),
      };
    }
    case 'failed': {
      const entry = state.history.find((e) => e.key === action.key);
      if (!entry) return state;
      return {
        ...state,
        queue: [entry.task, ...state.queue.filter((t) => t.id !== entry.task.id)],
        history: state.history.filter((e) => e.key !== action.key),
      };
    }
    case 'status':
      return {
        ...state,
        history: state.history.map((e) => (e.key === action.key ? { ...e, status: action.status } : e)),
      };
  }
}

interface Options {
  backend: Backend;
  deck: Task[];
  /** Keep the app-wide task list in step: `next` is the task's new state, or null when it's gone. */
  onLocalChange: (original: Task, next: Task | null) => void;
  onError: (message: string) => void;
}

export function useTriageSession({ backend, deck, onLocalChange, onError }: Options) {
  const [state, dispatch] = useReducer(reducer, deck, (d): State => ({ queue: d, history: [], total: d.length }));
  const nextKey = useRef(1);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());
  const held = useRef(new Map<number, Entry>());
  // Calls for the same task run one after another, so an undo never overtakes its decision.
  const chains = useRef(new Map<string, Promise<unknown>>());
  // Finished deletes the user has already been told about; undo steps past them.
  const acknowledged = useRef(new Set<number>());

  const optionsRef = useRef({ backend, onLocalChange, onError });
  useEffect(() => {
    optionsRef.current = { backend, onLocalChange, onError };
  });

  const serial = useCallback(<T,>(taskId: string, run: () => Promise<T>): Promise<T> => {
    const previous = chains.current.get(taskId) ?? Promise.resolve();
    const next = previous.catch(() => undefined).then(run);
    chains.current.set(taskId, next);
    return next;
  }, []);

  const send = useCallback(
    (entry: Entry) => {
      const { backend: b } = optionsRef.current;
      serial(entry.task.id, () => applyRemote(b, entry.task, entry.decision)).then(
        () => {
          if (entry.decision.kind === 'delete') dispatch({ type: 'status', key: entry.key, status: 'final' });
        },
        (err) => {
          const { onLocalChange: change, onError: report } = optionsRef.current;
          dispatch({ type: 'failed', key: entry.key });
          change(entry.task, entry.task);
          report(`${describeError(toTodoistError(err))} The card is back on top.`);
        },
      );
    },
    [serial],
  );

  const release = useCallback(
    (key: number) => {
      const entry = held.current.get(key);
      const timer = timers.current.get(key);
      if (timer) clearTimeout(timer);
      timers.current.delete(key);
      held.current.delete(key);
      if (entry) {
        dispatch({ type: 'status', key, status: 'sent' });
        send(entry);
      }
    },
    [send],
  );

  const decide = useCallback(
    (task: Task, decision: Decision) => {
      const entry: Entry = { key: nextKey.current++, task, decision, status: decision.kind === 'delete' ? 'held' : 'sent' };
      dispatch({ type: 'decide', entry });
      if (decision.kind !== 'skip') optionsRef.current.onLocalChange(task, localAfter(task, decision));
      if (decision.kind === 'delete') {
        held.current.set(entry.key, entry);
        timers.current.set(
          entry.key,
          setTimeout(() => release(entry.key), DELETE_GRACE_MS),
        );
      } else {
        send(entry);
      }
      return entry;
    },
    [send, release],
  );

  /** Undo the most recent decision. Returns a message when it couldn't be undone. */
  const undo = useCallback((): string | null => {
    const entry = state.history.findLast((e) => !acknowledged.current.has(e.key));
    if (!entry) return null;
    const { backend: b, onLocalChange: change, onError: report } = optionsRef.current;

    if (entry.status === 'held') {
      clearTimeout(timers.current.get(entry.key));
      timers.current.delete(entry.key);
      held.current.delete(entry.key);
      dispatch({ type: 'undo', key: entry.key });
      change(entry.task, entry.task);
      return null;
    }
    if (entry.decision.kind === 'delete') {
      acknowledged.current.add(entry.key);
      return 'That task is already deleted in Todoist, so it can’t come back.';
    }
    dispatch({ type: 'undo', key: entry.key });
    if (entry.decision.kind === 'skip' || entry.decision.kind === 'keep') return null;
    change(entry.task, entry.task);
    serial(entry.task.id, () => revertRemote(b, entry.task, entry.decision)).catch((err) => {
      dispatch({ type: 'restore', entry });
      change(entry.task, localAfter(entry.task, entry.decision));
      report(`Couldn’t undo. ${describeError(toTodoistError(err))}`);
    });
    return null;
  }, [state.history, serial]);

  /** Send held deletes now (leaving the deck, closing the page). */
  const flush = useCallback(() => {
    for (const key of [...held.current.keys()]) release(key);
  }, [release]);

  useEffect(() => {
    const onHide = () => flush();
    window.addEventListener('pagehide', onHide);
    return () => {
      window.removeEventListener('pagehide', onHide);
    };
  }, [flush]);

  // Leaving the deck (unmount) sends anything still held.
  useEffect(() => () => flush(), [flush]);

  const decided = state.history.filter((e) => e.decision.kind !== 'skip').length;
  return { queue: state.queue, history: state.history, total: state.total, decided, decide, undo, flush, release };
}
