import { useMemo } from 'react';
import type { AuditItem } from '../../types';
import { StatCard } from './StatCard';
import { BreakdownTable } from './BreakdownTable';
import { DISPOSITIONS, PRECIOUSNESS_TIERS } from '../../utils/constants';
import { formatCurrency } from '../../utils/formatters';
import { useExport } from '../../hooks/useExport';
import { Button } from '../ui/Button';
import { Download } from 'lucide-react';

const DISPOSITION_COLORS: Record<string, string> = {
  Keep: '#10b981',
  Sell: '#3b82f6',
  'Give Away': '#f97316',
  Store: '#a855f7',
  Undecided: '#9ca3af',
};

interface Props {
  items: AuditItem[];
}

export function Dashboard({ items }: Props) {
  const { exportCsv } = useExport();

  const totalValue = useMemo(
    () => items.reduce((sum, i) => sum + (i.estimatedValue ?? 0), 0),
    [items]
  );

  const byDisposition = useMemo(() => {
    const map = new Map<string, { count: number; value: number }>();
    DISPOSITIONS.forEach(d => map.set(d.value, { count: 0, value: 0 }));
    items.forEach(item => {
      const entry = map.get(item.disposition)!;
      entry.count++;
      entry.value += item.estimatedValue ?? 0;
    });
    return DISPOSITIONS.map(d => ({
      label: d.value,
      count: map.get(d.value)!.count,
      value: map.get(d.value)!.value,
      badge: DISPOSITION_COLORS[d.value],
    })).filter(r => r.count > 0);
  }, [items]);

  const byRoom = useMemo(() => {
    const map = new Map<string, number>();
    items.forEach(item => map.set(item.room, (map.get(item.room) ?? 0) + 1));
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([label, count]) => ({ label, count, value: null }));
  }, [items]);

  const byPreciousness = useMemo(() => {
    const map = new Map<number, number>();
    items.forEach(item => map.set(item.preciousness, (map.get(item.preciousness) ?? 0) + 1));
    return PRECIOUSNESS_TIERS.map(t => ({
      label: t.label,
      count: map.get(t.level) ?? 0,
      value: null,
    })).filter(r => r.count > 0);
  }, [items]);

  if (items.length === 0) {
    return (
      <div className="px-4 py-16 text-center">
        <p className="text-gray-400 dark:text-gray-500 text-lg">No items yet</p>
        <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Add items to see your summary here</p>
      </div>
    );
  }

  return (
    <div className="px-4 pb-8 space-y-4">
      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <StatCard label="Total Items" value={items.length} />
        <StatCard label="Est. Total Value" value={formatCurrency(totalValue)} />
        <StatCard
          label="To Sell"
          value={byDisposition.find(r => r.label === 'Sell')?.count ?? 0}
          sub={formatCurrency(byDisposition.find(r => r.label === 'Sell')?.value ?? 0)}
        />
        <StatCard
          label="Irreplaceable"
          value={byPreciousness.find(r => r.label === 'Irreplaceable')?.count ?? 0}
          sub="items"
        />
      </div>

      {/* Breakdown tables */}
      <BreakdownTable title="By Disposition" rows={byDisposition} />
      <BreakdownTable title="By Room" rows={byRoom} />
      <BreakdownTable title="By Preciousness" rows={byPreciousness} />

      {/* Export */}
      <Button
        variant="secondary"
        className="w-full gap-2"
        onClick={() => exportCsv(items)}
      >
        <Download size={16} /> Export as CSV
      </Button>
    </div>
  );
}
