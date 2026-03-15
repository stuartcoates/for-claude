export type Category =
  | 'Furniture'
  | 'Kitchen'
  | 'Electronics'
  | 'Books'
  | 'Clothing'
  | 'Art/Decor'
  | 'Records/Media'
  | 'Sentimental'
  | 'Tools/Utility'
  | 'Other';

export type Disposition =
  | 'Keep'
  | 'Sell'
  | 'Give Away'
  | 'Store'
  | 'Undecided';

export type PreciousnessLevel = 1 | 2 | 3 | 4 | 5;

export interface AuditItem {
  id: string;
  name: string;
  room: string;
  category: Category;
  preciousness: PreciousnessLevel;
  disposition: Disposition;
  estimatedValue: number | null;
  notes: string;
  photoDataUrl: string;
  createdAt: number;
  updatedAt: number;
}

export type NewItem = Omit<AuditItem, 'id' | 'createdAt' | 'updatedAt'>;

export type SortField = 'name' | 'room' | 'category' | 'preciousness' | 'estimatedValue' | 'disposition' | 'createdAt';

export interface FilterState {
  room: string | null;
  category: Category | null;
  disposition: Disposition | null;
  preciousness: PreciousnessLevel | null;
}
