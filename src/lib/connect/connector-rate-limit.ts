import type { RateLimitConfig } from './connector-types'
import { DEFAULT_RATE_LIMIT } from './connector-types'

interface ProviderWindow {
  timestamps: number[]
  config: RateLimitConfig
}

const windows = new Map<string, ProviderWindow>()

function getWindow(providerId: string, config?: RateLimitConfig): ProviderWindow {
  let w = windows.get(providerId)
  if (!w) {
    w = { timestamps: [], config: config || DEFAULT_RATE_LIMIT }
    windows.set(providerId, w)
  }
  if (config) w.config = config
  return w
}

function pruneOld(w: ProviderWindow): void {
  const cutoff = Date.now() - 60000
  w.timestamps = w.timestamps.filter(t => t > cutoff)
}

export function canRequest(providerId: string, config?: RateLimitConfig): boolean {
  const w = getWindow(providerId, config)
  pruneOld(w)

  if (w.timestamps.length >= w.config.maxPerMinute) return false

  const last = w.timestamps[w.timestamps.length - 1]
  if (last && Date.now() - last < w.config.minIntervalMs) return false

  return true
}

export function recordRequest(providerId: string, config?: RateLimitConfig): void {
  const w = getWindow(providerId, config)
  pruneOld(w)
  w.timestamps.push(Date.now())
}

export function getWaitTime(providerId: string, config?: RateLimitConfig): number {
  const w = getWindow(providerId, config)
  pruneOld(w)

  if (w.timestamps.length >= w.config.maxPerMinute) {
    const oldest = w.timestamps[0]
    return oldest ? (oldest + 60000) - Date.now() : 0
  }

  const last = w.timestamps[w.timestamps.length - 1]
  if (last) {
    const elapsed = Date.now() - last
    if (elapsed < w.config.minIntervalMs) return w.config.minIntervalMs - elapsed
  }

  return 0
}

export function resetProvider(providerId: string): void {
  windows.delete(providerId)
}

export function resetAll(): void {
  windows.clear()
}
