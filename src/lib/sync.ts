import { supabase } from './supabase'
import { db } from './db'
import { currentEmergency } from '../store/emergency'
import { DEFAULT_CENTER } from './constants'

let processing = false

function resolveEmergencyId(payload: Record<string, unknown>): boolean {
  if (payload.emergency_id === 'default' || payload.emergency_id === null) {
    if (currentEmergency.value) {
      payload.emergency_id = currentEmergency.value.id
      return true
    }
    return false
  }
  return true
}

export async function enqueue(
  tableName: string,
  payload: Record<string, unknown>,
): Promise<{ synced: boolean; error?: string }> {
  const offlineId = crypto.randomUUID()
  payload.offline_id = offlineId

  resolveEmergencyId(payload)

  if (payload.latitude === null || payload.latitude === undefined) payload.latitude = DEFAULT_CENTER.lat
  if (payload.longitude === null || payload.longitude === undefined) payload.longitude = DEFAULT_CENTER.lng

  if (navigator.onLine && supabase && payload.emergency_id && payload.emergency_id !== 'default') {
    try {
      const { error } = await supabase.from(tableName).insert(payload)
      if (error) throw error
      return { synced: true }
    } catch {
      // falls through to offline queue
    }
  }

  await db.offlineQueue.add({
    table_name: tableName,
    operation: 'insert',
    payload,
    status: 'pending',
    retry_count: 0,
    created_at: new Date().toISOString(),
  })

  return { synced: false }
}

export async function processQueue(): Promise<number> {
  if (!navigator.onLine || !supabase || processing) return 0
  processing = true

  try {
    const pending = await db.offlineQueue
      .where('status')
      .equals('pending')
      .toArray()

    let synced = 0

    for (const item of pending) {
      try {
        if (!resolveEmergencyId(item.payload)) {
          continue
        }

        await db.offlineQueue.update(item.id!, { status: 'syncing' })

        const { error } = await supabase.from(item.table_name).insert(item.payload)

        if (error) {
          if (error.code === '23505') {
            await db.offlineQueue.update(item.id!, { status: 'synced' })
            synced++
          } else {
            throw error
          }
        } else {
          await db.offlineQueue.update(item.id!, { status: 'synced' })
          synced++
        }
      } catch (err) {
        await db.offlineQueue.update(item.id!, {
          status: 'pending',
          retry_count: (item.retry_count || 0) + 1,
          last_error: err instanceof Error ? err.message : 'Error desconocido',
        })
      }
    }

    await db.offlineQueue.where('status').equals('synced').delete()

    return synced
  } finally {
    processing = false
  }
}

export async function getPendingCount(): Promise<number> {
  return db.offlineQueue.where('status').equals('pending').count()
}
