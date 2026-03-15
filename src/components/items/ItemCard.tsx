import { useNavigate } from 'react-router-dom';
import type { AuditItem } from '../../types';
import { DispositionChip } from '../ui/DispositionChip';
import { getPreciousnessLabel, formatCurrency, truncate } from '../../utils/formatters';
import { MapPin, Tag } from 'lucide-react';

interface Props {
  item: AuditItem;
}

const PRECIOUSNESS_DOT: Record<number, string> = {
  1: 'bg-gray-400',
  2: 'bg-sky-400',
  3: 'bg-amber-400',
  4: 'bg-orange-400',
  5: 'bg-rose-500',
};

export function ItemCard({ item }: Props) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(`/items/${item.id}`)}
      className="w-full text-left flex gap-3 p-3 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-700 transition-colors active:bg-gray-50 dark:active:bg-gray-750"
    >
      {/* Photo */}
      <div className="flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700">
        {item.photoDataUrl ? (
          <img src={item.photoDataUrl} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-2xl">📦</div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0 py-0.5">
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm leading-tight">{truncate(item.name, 40)}</p>
          <DispositionChip value={item.disposition} />
        </div>

        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
            <MapPin size={11} />
            {item.room}
          </span>
          <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
            <Tag size={11} />
            {item.category}
          </span>
        </div>

        <div className="flex items-center gap-2 mt-1.5">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${PRECIOUSNESS_DOT[item.preciousness]}`} />
          <span className="text-xs text-gray-500 dark:text-gray-400">{getPreciousnessLabel(item.preciousness)}</span>
          {item.estimatedValue !== null && (
            <span className="ml-auto text-xs font-medium text-gray-700 dark:text-gray-300">{formatCurrency(item.estimatedValue)}</span>
          )}
        </div>
      </div>
    </button>
  );
}
