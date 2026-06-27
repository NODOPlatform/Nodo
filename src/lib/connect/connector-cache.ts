import type { FederatedResult } from './connector-types'
import { DEFAULT_SEARCH_CONFIG } from './connector-types'

interface CacheEntry {
  results: FederatedResult[]
  timestamp: number
  providerId: string
}

const cache = new Map<string, CacheEntry>()

function buildKey(query: string, providerId: string): string {
  return `${providerId}::${query.toLowerCase().trim()}`
}

export function getCached(query: string, providerId: string, ttlMs = DEFAULT_SEARCH_CONFIG.cacheTtlMs): FederatedResult[] | null {
  const key = buildKey(query, providerId)
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() - entry.timestamp > ttlMs) {
    cache.delete(key)
    return null
  }
  return entry.results
}

export function setCached(query: string, providerId: string, results: FederatedResult[]): void {
  const key = buildKey(query, providerId)
  cache.set(key, { results, timestamp: Date.now(), providerId })
}

export function getCachedGlobal(query: string, ttlMs = DEFAULT_SEARCH_CONFIG.cacheTtlMs): FederatedResult[] | null {
  const normalizedQuery = query.toLowerCase().trim()
  const allResults: FederatedResult[] = []
  let hasAny = false

  for (const [key, entry] of cache.entries()) {
    if (!key.endsWith(`::${normalizedQuery}`)) continue
    if (Date.now() - entry.timestamp > ttlMs) {
      cache.delete(key)
      continue
    }
    allResults.push(...entry.results)
    hasAny = true
  }

  return hasAny ? allResults : null
}

export function invalidateProvider(providerId: string): void {
  for (const key of cache.keys()) {
    if (key.startsWith(`${providerId}::`)) cache.delete(key)
  }
}

export function clearCache(): void {
  cache.clear()
}

export function getCacheStats(): { entries: number; providers: Set<string> } {
  const providers = new Set<string>()
  for (const entry of cache.values()) providers.add(entry.providerId)
  return { entries: cache.size, providers }
}
