import { useAppStore } from '../../store/useAppStore';
import type { SortField } from '../../types';
import { ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react';

const SORT_OPTIONS: { value: SortField; label: string }[] = [
  { value: 'createdAt', label: 'Date Added' },
  { value: 'name', label: 'Name' },
  { value: 'room', label: 'Room' },
  { value: 'preciousness', label: 'Preciousness' },
  { value: 'estimatedValue', label: 'Value' },
  { value: 'disposition', label: 'Disposition' },
];

export function SortControl() {
  const sortField = useAppStore(s => s.sortField);
  const sortDirection = useAppStore(s => s.sortDirection);
  const setSort = useAppStore(s => s.setSort);

  function handleFieldChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setSort(e.target.value as SortField, sortDirection);
  }

  function toggleDirection() {
    setSort(sortField, sortDirection === 'asc' ? 'desc' : 'asc');
  }

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
      <ArrowUpDown size={14} className="text-gray-400 flex-shrink-0" />
      <select
        value={sortField}
        onChange={handleFieldChange}
        className="flex-1 text-sm text-gray-700 dark:text-gray-300 bg-transparent focus:outline-none cursor-pointer"
      >
        {SORT_OPTIONS.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <button onClick={toggleDirection} className="p-1 rounded text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
        {sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
    </div>
  );
}
