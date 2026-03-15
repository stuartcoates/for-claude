import { PRECIOUSNESS_TIERS, DISPOSITIONS } from './constants';
import type { PreciousnessLevel, Disposition } from '../types';

export function formatCurrency(value: number | null): string {
  if (value === null) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

export function getPreciousnessLabel(level: PreciousnessLevel): string {
  return PRECIOUSNESS_TIERS.find(t => t.level === level)?.label ?? String(level);
}

export function getDispositionColors(disposition: Disposition): string {
  const d = DISPOSITIONS.find(d => d.value === disposition);
  return d ? `${d.color} ${d.darkColor}` : '';
}

export function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(timestamp));
}

export function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) + '…' : str;
}
