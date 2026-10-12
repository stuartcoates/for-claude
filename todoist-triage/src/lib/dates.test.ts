import { describe, expect, it } from 'vitest';
import { addDays, ageLabel, dueState, keepTimeOfDay, laterOptions, parseDue } from './dates';

describe('dates', () => {
  it('adds days across month and year ends', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('reads floating times as local and keeps date-only dates whole', () => {
    expect(parseDue('2026-10-13')).toEqual({ day: '2026-10-13', time: null });
    expect(parseDue('2026-10-13T09:30:00')).toEqual({ day: '2026-10-13', time: '09:30' });
  });

  it('keeps the time of day when moving a timed task to a new day', () => {
    expect(keepTimeOfDay('2026-10-20', '2026-10-13T09:30:00')).toBe('2026-10-20T09:30:00');
    expect(keepTimeOfDay('2026-10-20', '2026-10-13')).toBe('2026-10-20');
    expect(keepTimeOfDay('2026-10-20T08:00:00', '2026-10-13T09:30:00')).toBe('2026-10-20T08:00:00');
  });

  it('classifies due dates against today', () => {
    const today = '2026-10-12';
    expect(dueState(null, today)).toBe('none');
    expect(dueState({ date: '2026-10-11', recurring: null }, today)).toBe('overdue');
    expect(dueState({ date: '2026-10-12T18:00:00', recurring: null }, today)).toBe('today');
    expect(dueState({ date: '2026-10-13', recurring: 'every day' }, today)).toBe('upcoming');
  });

  it('offers Later dates that land where their labels say', () => {
    // 2026-10-12 is a Monday.
    const byKey = Object.fromEntries(laterOptions('2026-10-12').map((o) => [o.key, o]));
    expect(byKey.tomorrow.date).toBe('2026-10-13');
    expect(byKey.weekend).toMatchObject({ label: 'This weekend', date: '2026-10-17' });
    expect(byKey['next-week'].date).toBe('2026-10-19');
    expect(byKey['next-month'].date).toBe('2026-11-01');
    // On a Saturday, "weekend" means the next one, and next week is two days out.
    const saturday = Object.fromEntries(laterOptions('2026-10-17').map((o) => [o.key, o]));
    expect(saturday.weekend).toMatchObject({ label: 'Next weekend', date: '2026-10-24' });
    expect(saturday['next-week'].date).toBe('2026-10-19');
  });

  it('describes how long a task has been waiting', () => {
    const today = '2026-10-12';
    expect(ageLabel(null, today)).toBeNull();
    expect(ageLabel(new Date(2026, 9, 12, 8).toISOString(), today)).toBe('added today');
    expect(ageLabel(new Date(2026, 9, 2, 8).toISOString(), today)).toBe('added 10d ago');
    expect(ageLabel(new Date(2026, 7, 1, 8).toISOString(), today)).toBe('added 10w ago');
  });
});
