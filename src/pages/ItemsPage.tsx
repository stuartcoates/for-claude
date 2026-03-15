import { useMemo } from 'react';
import { useItemStore } from '../store/useItemStore';
import { useAppStore } from '../store/useAppStore';
import { ItemList } from '../components/items/ItemList';
import { FilterBar } from '../components/filters/FilterBar';
import { SortControl } from '../components/filters/SortControl';
import type { AuditItem, SortField } from '../types';

function applyFiltersAndSort(
  items: AuditItem[],
  filters: ReturnType<typeof useAppStore.getState>['filters'],
  sortField: SortField,
  sortDirection: 'asc' | 'desc'
): AuditItem[] {
  let result = items;

  if (filters.room) result = result.filter(i => i.room === filters.room);
  if (filters.category) result = result.filter(i => i.category === filters.category);
  if (filters.disposition) result = result.filter(i => i.disposition === filters.disposition);
  if (filters.preciousness) result = result.filter(i => i.preciousness === filters.preciousness);

  result = [...result].sort((a, b) => {
    let av: string | number = a[sortField] ?? 0;
    let bv: string | number = b[sortField] ?? 0;
    if (typeof av === 'string') av = av.toLowerCase();
    if (typeof bv === 'string') bv = bv.toLowerCase();
    if (av < bv) return sortDirection === 'asc' ? -1 : 1;
    if (av > bv) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  return result;
}

export function ItemsPage() {
  const items = useItemStore(s => s.items);
  const isLoaded = useItemStore(s => s.isLoaded);
  const filters = useAppStore(s => s.filters);
  const sortField = useAppStore(s => s.sortField);
  const sortDirection = useAppStore(s => s.sortDirection);

  const displayed = useMemo(
    () => applyFiltersAndSort(items, filters, sortField, sortDirection),
    [items, filters, sortField, sortDirection]
  );

  const hasActiveFilters = filters.room || filters.category || filters.disposition || filters.preciousness;

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {items.length > 0 && (
        <>
          <FilterBar />
          <SortControl />
          {displayed.length > 0 && (
            <p className="px-4 py-2 text-xs text-gray-400 dark:text-gray-500">
              {displayed.length} item{displayed.length !== 1 ? 's' : ''}
              {hasActiveFilters ? ' (filtered)' : ''}
            </p>
          )}
        </>
      )}
      <ItemList
        items={displayed}
        emptyMessage={hasActiveFilters ? 'No items match your filters' : 'No items yet'}
      />
    </div>
  );
}
