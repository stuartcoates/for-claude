import type { AuditItem } from '../../types';
import { ItemCard } from './ItemCard';
import { Package } from 'lucide-react';

interface Props {
  items: AuditItem[];
  emptyMessage?: string;
}

export function ItemList({ items, emptyMessage = 'No items yet' }: Props) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-6">
        <Package size={48} strokeWidth={1} className="text-gray-300 dark:text-gray-600 mb-4" />
        <p className="text-gray-500 dark:text-gray-400 font-medium">{emptyMessage}</p>
        <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Tap + to add your first item</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 px-4 pb-6">
      {items.map(item => (
        <ItemCard key={item.id} item={item} />
      ))}
    </div>
  );
}
