import Dexie, { type Table } from 'dexie';
import type { AuditItem } from '../types';

class AuditDatabase extends Dexie {
  items!: Table<AuditItem>;

  constructor() {
    super('HomeAuditDB');
    this.version(1).stores({
      items: 'id, room, category, disposition, preciousness, createdAt',
    });
  }
}

export const db = new AuditDatabase();
