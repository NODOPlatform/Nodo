import { signal } from '@preact/signals'
import { getPendingCount, processQueue } from '../lib/sync'

export const pendingCount = signal(0)

export async function refreshPendingCount() {
  try {
    pendingCount.value = await getPendingCount()
  } catch {
    // IndexedDB may be unavailable
  }
}

let interval: ReturnType<typeof setInterval> | null = null

export function startQueueMonitor() {
  if (interval) return
  refreshPendingCount()
  interval = setInterval(async () => {
    if (navigator.onLine) {
      await processQueue()
    }
    await refreshPendingCount()
  }, 15000)
}
