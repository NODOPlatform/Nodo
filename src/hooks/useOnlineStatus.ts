import { signal } from '@preact/signals'
import { processQueue } from '../lib/sync'
import { loadActiveEmergency } from '../store/emergency'

export const isOnline = signal(navigator.onLine)

let initialized = false

export function initOnlineListener() {
  if (initialized) return
  initialized = true

  window.addEventListener('online', async () => {
    isOnline.value = true
    await loadActiveEmergency()
    processQueue()
  })
  window.addEventListener('offline', () => {
    isOnline.value = false
  })
}

export function useOnlineStatus() {
  initOnlineListener()
  return isOnline
}
