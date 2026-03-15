import { formatCurrency } from '../../utils/formatters';

interface Row {
  label: string;
  count: number;
  value: number | null;
  badge?: string;
}

interface Props {
  title: string;
  rows: Row[];
}

export function BreakdownTable({ title, rows }: Props) {
  if (rows.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{title}</h3>
      </div>
      <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
        {rows.map(row => (
          <div key={row.label} className="flex items-center px-4 py-2.5 gap-3">
            {row.badge && (
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: row.badge }} />
            )}
            <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">{row.label}</span>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100 tabular-nums">{row.count}</span>
            {row.value !== null && (
              <span className="text-xs text-gray-400 dark:text-gray-500 tabular-nums w-16 text-right">{formatCurrency(row.value)}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
