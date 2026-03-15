import { useAppStore } from '../../store/useAppStore';
import { useItemStore } from '../../store/useItemStore';
import type { Category, Disposition, PreciousnessLevel } from '../../types';
import { DISPOSITIONS, PRECIOUSNESS_TIERS } from '../../utils/constants';
import { X } from 'lucide-react';
import { useMemo } from 'react';

export function FilterBar() {
  const filters = useAppStore(s => s.filters);
  const setFilterRoom = useAppStore(s => s.setFilterRoom);
  const setFilterCategory = useAppStore(s => s.setFilterCategory);
  const setFilterDisposition = useAppStore(s => s.setFilterDisposition);
  const setFilterPreciousness = useAppStore(s => s.setFilterPreciousness);
  const clearFilters = useAppStore(s => s.clearFilters);
  const items = useItemStore(s => s.items);

  const rooms = useMemo(() => [...new Set(items.map(i => i.room))].sort(), [items]);
  const categories = useMemo(() => [...new Set(items.map(i => i.category))].sort() as Category[], [items]);

  const hasActiveFilters = filters.room || filters.category || filters.disposition || filters.preciousness;

  return (
    <div className="space-y-2 px-4 py-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      <div className="overflow-x-auto">
        <div className="flex gap-2 pb-1 min-w-max">
          {/* Rooms */}
          {rooms.map(room => (
            <FilterChip
              key={room}
              label={room}
              active={filters.room === room}
              onToggle={() => setFilterRoom(filters.room === room ? null : room)}
            />
          ))}

          {rooms.length > 0 && categories.length > 0 && <span className="w-px bg-gray-300 dark:bg-gray-600 self-stretch mx-1" />}

          {/* Categories */}
          {categories.map(cat => (
            <FilterChip
              key={cat}
              label={cat}
              active={filters.category === cat}
              onToggle={() => setFilterCategory(filters.category === cat ? null : cat as Category)}
            />
          ))}

          {categories.length > 0 && <span className="w-px bg-gray-300 dark:bg-gray-600 self-stretch mx-1" />}

          {/* Dispositions */}
          {DISPOSITIONS.map(({ value }) => (
            <FilterChip
              key={value}
              label={value}
              active={filters.disposition === value}
              onToggle={() => setFilterDisposition(filters.disposition === value ? null : value as Disposition)}
            />
          ))}

          <span className="w-px bg-gray-300 dark:bg-gray-600 self-stretch mx-1" />

          {/* Preciousness */}
          {PRECIOUSNESS_TIERS.map(({ level, label }) => (
            <FilterChip
              key={level}
              label={label}
              active={filters.preciousness === level}
              onToggle={() => setFilterPreciousness(filters.preciousness === level ? null : level as PreciousnessLevel)}
            />
          ))}
        </div>
      </div>

      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
        >
          <X size={12} /> Clear all filters
        </button>
      )}
    </div>
  );
}

function FilterChip({ label, active, onToggle }: { label: string; active: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`px-2.5 py-1 rounded-full text-xs font-medium border whitespace-nowrap transition-colors ${
        active
          ? 'bg-indigo-600 text-white border-indigo-600 dark:bg-indigo-500 dark:border-indigo-500'
          : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:bg-gray-700'
      }`}
    >
      {label}
    </button>
  );
}
