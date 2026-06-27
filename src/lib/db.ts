import Dexie, { type EntityTable } from 'dexie'

interface OfflineQueueItem {
  id?: number
  table_name: string
  operation: 'insert' | 'update'
  payload: Record<string, unknown>
  photo_blob?: Blob
  status: 'pending' | 'syncing' | 'synced' | 'failed'
  retry_count: number
  created_at: string
  last_error?: string
}

interface CachedRecord {
  id?: number
  table_name: string
  record_id: string
  data: Record<string, unknown>
  synced_at: string
}

class NodoDatabase extends Dexie {
  offlineQueue!: EntityTable<OfflineQueueItem, 'id'>
  cache!: EntityTable<CachedRecord, 'id'>

  constructor() {
    super('NodoDB')
    this.version(1).stores({
      offlineQueue: '++id, table_name, status, created_at',
      cache: '++id, [table_name+record_id], table_name, synced_at',
    })
  }
}

export const db = new NodoDatabase()
export type { OfflineQueueItem, CachedRecord }
