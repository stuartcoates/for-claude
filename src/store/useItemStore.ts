import { create } from 'zustand';
import type { AuditItem, NewItem } from '../types';
import { getAllItems, addItem, updateItem, deleteItem } from '../db/operations';

interface ItemStore {
  items: AuditItem[];
  isLoaded: boolean;
  loadItems: () => Promise<void>;
  addItem: (item: NewItem) => Promise<string>;
  updateItem: (id: string, patch: Partial<Omit<AuditItem, 'id' | 'createdAt'>>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
}

export const useItemStore = create<ItemStore>((set) => ({
  items: [],
  isLoaded: false,

  loadItems: async () => {
    const items = await getAllItems();
    set({ items, isLoaded: true });
  },

  addItem: async (item: NewItem) => {
    const id = await addItem(item);
    const items = await getAllItems();
    set({ items });
    return id;
  },

  updateItem: async (id, patch) => {
    await updateItem(id, patch);
    set(state => ({
      items: state.items.map(item =>
        item.id === id ? { ...item, ...patch, updatedAt: Date.now() } : item
      ),
    }));
  },

  deleteItem: async (id) => {
    await deleteItem(id);
    set(state => ({ items: state.items.filter(item => item.id !== id) }));
  },
}));
