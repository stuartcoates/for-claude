import { DISPOSITIONS } from '../../utils/constants';
import type { Disposition } from '../../types';

interface Props {
  value: Disposition;
  size?: 'sm' | 'md';
}

export function DispositionChip({ value, size = 'sm' }: Props) {
  const d = DISPOSITIONS.find(d => d.value === value);
  if (!d) return null;
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';
  return (
    <span className={`inline-flex items-center rounded-full border font-medium ${sizeClass} ${d.color} ${d.darkColor}`}>
      {value}
    </span>
  );
}

interface SelectorProps {
  value: Disposition | null;
  onChange: (d: Disposition) => void;
}

export function DispositionSelector({ value, onChange }: SelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {DISPOSITIONS.map(({ value: dv, color, darkColor }) => {
        const selected = value === dv;
        return (
          <button
            key={dv}
            type="button"
            onClick={() => onChange(dv)}
            className={`px-3 py-1.5 rounded-full border text-sm font-medium transition-all ${color} ${darkColor} ${selected ? 'ring-2 ring-offset-1 ring-indigo-400 scale-105' : 'opacity-60 hover:opacity-90'}`}
          >
            {dv}
          </button>
        );
      })}
    </div>
  );
}
