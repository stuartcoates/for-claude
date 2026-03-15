import { PRECIOUSNESS_TIERS } from '../../utils/constants';
import type { PreciousnessLevel } from '../../types';

interface Props {
  value: PreciousnessLevel | null;
  onChange: (level: PreciousnessLevel) => void;
}

const TIER_STYLES: Record<number, string> = {
  1: 'border-gray-300 dark:border-gray-600 data-[selected=true]:bg-gray-100 data-[selected=true]:border-gray-500 dark:data-[selected=true]:bg-gray-700 dark:data-[selected=true]:border-gray-400',
  2: 'border-sky-200 dark:border-sky-800 data-[selected=true]:bg-sky-50 data-[selected=true]:border-sky-400 dark:data-[selected=true]:bg-sky-900/40 dark:data-[selected=true]:border-sky-500',
  3: 'border-amber-200 dark:border-amber-800 data-[selected=true]:bg-amber-50 data-[selected=true]:border-amber-400 dark:data-[selected=true]:bg-amber-900/40 dark:data-[selected=true]:border-amber-500',
  4: 'border-orange-200 dark:border-orange-800 data-[selected=true]:bg-orange-50 data-[selected=true]:border-orange-400 dark:data-[selected=true]:bg-orange-900/40 dark:data-[selected=true]:border-orange-500',
  5: 'border-rose-200 dark:border-rose-800 data-[selected=true]:bg-rose-50 data-[selected=true]:border-rose-400 dark:data-[selected=true]:bg-rose-900/40 dark:data-[selected=true]:border-rose-500',
};

const FONT_WEIGHTS = ['font-normal', 'font-normal', 'font-medium', 'font-semibold', 'font-bold'];

export function PreciousnessScale({ value, onChange }: Props) {
  return (
    <div role="radiogroup" aria-label="Preciousness" className="flex gap-2 overflow-x-auto pb-1">
      {PRECIOUSNESS_TIERS.map(({ level, label }) => {
        const selected = value === level;
        return (
          <button
            key={level}
            type="button"
            role="radio"
            aria-checked={selected}
            data-selected={selected}
            onClick={() => onChange(level)}
            className={`flex-shrink-0 px-3 py-2 rounded-xl border text-sm transition-all cursor-pointer text-gray-800 dark:text-gray-200 ${FONT_WEIGHTS[level - 1]} ${TIER_STYLES[level]} ${selected ? 'ring-2 ring-offset-1 ring-indigo-400' : 'hover:opacity-80'}`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
