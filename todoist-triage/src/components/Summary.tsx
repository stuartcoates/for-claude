import type { Entry } from '../hooks/useTriageSession';
import { describeDecision } from '../lib/decisions';
import { plainText } from '../lib/text';

interface Props {
  title: string;
  history: Entry[];
  today: string;
  onBack: () => void;
  onUndo?: () => void;
  next: { label: string; start: () => void } | null;
}

/** The end of a deck: what changed, as a receipt, and where to go next. */
export function Summary({ title, history, today, onBack, onUndo, next }: Props) {
  const decided = history.filter((e) => e.decision.kind !== 'skip');
  const count = (test: (e: Entry) => boolean) => decided.filter(test).length;
  const stats = [
    { label: 'Done', value: count((e) => e.decision.kind === 'done') },
    { label: 'Kept', value: count((e) => e.decision.kind === 'keep' || e.decision.kind === 'priority') },
    { label: 'Today', value: count((e) => e.decision.kind === 'schedule' && e.decision.date === today) },
    { label: 'Later', value: count((e) => e.decision.kind === 'schedule' && e.decision.date !== today) },
    { label: 'Moved', value: count((e) => e.decision.kind === 'move') },
    { label: 'Deleted', value: count((e) => e.decision.kind === 'delete') },
  ];

  return (
    <section className="summary" aria-labelledby="summary-title">
      <div>
        <p className="eyebrow">{title}</p>
        <h2 className="summary-title headline" id="summary-title">
          {decided.length === 0 ? 'Nothing left in this deck' : `${decided.length} task${decided.length === 1 ? '' : 's'} sorted`}
        </h2>
      </div>

      <div className="stat-grid">
        {stats.map((s) => (
          <div className="stat" key={s.label}>
            <strong>{s.value}</strong>
            <span className="eyebrow">{s.label}</span>
          </div>
        ))}
      </div>

      {decided.length > 0 && (
        <ul className="receipt" aria-label="What changed">
          {decided.map((e) => (
            <li key={e.key}>
              <span className="what">{plainText(e.task.content)}</span>
              <span className="verdict">{describeDecision(e.decision, today)}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="button-row">
        {next && (
          <button type="button" className="btn primary" onClick={next.start}>
            Next: {next.label}
          </button>
        )}
        <button type="button" className={`btn ${next ? '' : 'primary'}`} onClick={onBack}>
          Back to projects
        </button>
        {onUndo && (
          <button type="button" className="btn ghost" onClick={onUndo}>
            Undo last
          </button>
        )}
      </div>
    </section>
  );
}
