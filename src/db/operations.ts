import { db } from './db';
import type { AuditItem, NewItem } from '../types';

export async function getAllItems(): Promise<AuditItem[]> {
  return db.items.orderBy('createdAt').reverse().toArray();
}

export async function addItem(item: NewItem): Promise<string> {
  const id = crypto.randomUUID();
  const now = Date.now();
  await db.items.add({ ...item, id, createdAt: now, updatedAt: now });
  return id;
}

export async function updateItem(id: string, patch: Partial<Omit<AuditItem, 'id' | 'createdAt'>>): Promise<void> {
  await db.items.update(id, { ...patch, updatedAt: Date.now() });
}

export async function deleteItem(id: string): Promise<void> {
  await db.items.delete(id);
}

export async function getItem(id: string): Promise<AuditItem | undefined> {
  return db.items.get(id);
}
