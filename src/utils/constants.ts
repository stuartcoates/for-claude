import type { Category, Disposition, PreciousnessLevel } from '../types';

export const PREDEFINED_ROOMS = [
  'Kitchen',
  'Living Room',
  'Bedroom',
  'Bathroom',
  'Closet',
  'Storage',
  'Other',
] as const;

export const CATEGORIES: Category[] = [
  'Furniture',
  'Kitchen',
  'Electronics',
  'Books',
  'Clothing',
  'Art/Decor',
  'Records/Media',
  'Sentimental',
  'Tools/Utility',
  'Other',
];

export const PRECIOUSNESS_TIERS: { level: PreciousnessLevel; label: string; description: string }[] = [
  { level: 1, label: 'Replaceable', description: 'Easy to replace, low attachment' },
  { level: 2, label: 'Convenient', description: 'Useful but not essential' },
  { level: 3, label: 'Valued', description: 'Meaningful, would miss it' },
  { level: 4, label: 'Cherished', description: 'Significant personal value' },
  { level: 5, label: 'Irreplaceable', description: 'Cannot be replaced' },
];

export const DISPOSITIONS: { value: Disposition; color: string; darkColor: string }[] = [
  { value: 'Keep', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', darkColor: 'dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700' },
  { value: 'Sell', color: 'bg-blue-100 text-blue-800 border-blue-200', darkColor: 'dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-700' },
  { value: 'Give Away', color: 'bg-orange-100 text-orange-800 border-orange-200', darkColor: 'dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-700' },
  { value: 'Store', color: 'bg-purple-100 text-purple-800 border-purple-200', darkColor: 'dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-700' },
  { value: 'Undecided', color: 'bg-gray-100 text-gray-700 border-gray-200', darkColor: 'dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600' },
];
