import { useMemo } from 'react';
import { LogOut, RefreshCw } from 'lucide-react';
import type { BackendKind, Project, Task } from '../api/types';
import { projectTree, statsByProject, sumStats } from '../lib/deck';

interface Props {
  projects: Project[];
  tasks: Task[];
  today: string;
  source: BackendKind;
  includeSubtasks: boolean;
  onIncludeSubtasks: (value: boolean) => void;
  onStart: (title: string, projectIds: string[]) => void;
  onRefresh: () => void;
  refreshing: boolean;
  onSignOut?: () => void;
  notice?: string | null;
}

const SOURCE_LABEL: Record<BackendKind, string> = {
  connector: 'Todoist · via Claude',
  token: 'Todoist · API token',
  demo: 'Sample tasks',
};

export function ProjectPicker({ projects, tasks, today, source, includeSubtasks, onIncludeSubtasks, onStart, onRefresh, refreshing, onSignOut, notice }: Props) {
  const rows = useMemo(() => projectTree(projects), [projects]);
  const stats = useMemo(() => statsByProject(tasks, includeSubtasks, today), [tasks, includeSubtasks, today]);
  const total = sumStats(stats.keys(), stats);

  return (
    <>
      <div className="rail">
        <div className="grow">
          <h1>The Pass</h1>
        </div>
        <span className={`source-chip ${source === 'demo' ? 'demo' : ''}`}>
          <span className="dot" aria-hidden />
          {SOURCE_LABEL[source]}
        </span>
        <button type="button" className="icon-btn" onClick={onRefresh} disabled={refreshing} aria-label="Reload tasks from Todoist">
          <RefreshCw size={18} className={refreshing ? 'spin' : undefined} />
        </button>
        {onSignOut && (
          <button type="button" className="icon-btn" onClick={onSignOut} aria-label={source === 'demo' ? 'Leave the sample' : 'Forget my API token'}>
            <LogOut size={18} />
          </button>
        )}
      </div>

      <div className="projects">
        {source === 'demo' && <p className="banner demo">These are example tasks, not yours. Nothing you do here reaches Todoist.</p>}
        {notice && <p className="banner">{notice}</p>}

        <div className="tally" style={{ marginTop: 14 }}>
          <span>
            <strong>{total.count}</strong> <span className="eyebrow">open</span>
          </span>
          <span className="overdue">
            <strong>{total.overdue}</strong> <span className="eyebrow">overdue</span>
          </span>
        </div>
        <p className="eyebrow" style={{ margin: '0 0 6px' }}>
          Pick a project to sort, one card at a time
        </p>

        <label className="toggle" htmlFor="include-subtasks">
          <input id="include-subtasks" type="checkbox" checked={includeSubtasks} onChange={(e) => onIncludeSubtasks(e.target.checked)} />
          Include subtasks as their own cards
        </label>

        <ul className="project-list">
          {rows.map(({ project, depth, familyIds }) => {
            const own = stats.get(project.id) ?? { count: 0, overdue: 0 };
            const family = familyIds.length > 1 ? sumStats(familyIds, stats) : null;
            return (
              <li key={project.id} className="project-row" style={{ ['--depth' as string]: depth }}>
                <button type="button" className="open" disabled={own.count === 0} onClick={() => onStart(project.name, [project.id])}>
                  <span className="name">{project.name}</span>
                  <span className="count">
                    {own.overdue > 0 && <span className="late">{own.overdue} late</span>}
                    <span>{own.count}</span>
                  </span>
                </button>
                {family && family.count > own.count && (
                  <button
                    type="button"
                    className="family"
                    onClick={() => onStart(`${project.name} + nested`, familyIds)}
                    aria-label={`Sort all ${family.count} tasks in ${project.name} and its nested projects`}
                  >
                    All {family.count}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}
