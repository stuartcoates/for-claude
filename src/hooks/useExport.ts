import { useCallback } from 'react';
import Papa from 'papaparse';
import type { AuditItem } from '../types';
import { getPreciousnessLabel } from '../utils/formatters';

export function useExport() {
  const exportCsv = useCallback((items: AuditItem[]) => {
    const rows = items.map(item => ({
      id: item.id,
      name: item.name,
      room: item.room,
      category: item.category,
      preciousness: getPreciousnessLabel(item.preciousness),
      disposition: item.disposition,
      estimated_value: item.estimatedValue ?? '',
      notes: item.notes,
      created_at: new Date(item.createdAt).toISOString(),
    }));

    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const today = new Date().toISOString().slice(0, 10);
    const a = document.createElement('a');
    a.href = url;
    a.download = `home-audit-export-${today}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  return { exportCsv };
}
