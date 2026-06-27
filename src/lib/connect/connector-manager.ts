import type {
  Connector,
  ConnectorConfig,
  ConnectorMetrics,
  ConnectorResponse,
  ConnectorType,
  FederatedResult,
  AdaptiveSearchConfig,
} from './connector-types'
import { DEFAULT_SEARCH_CONFIG, DEFAULT_RATE_LIMIT } from './connector-types'
import { getCached, setCached } from './connector-cache'
import { canRequest, recordRequest, getWaitTime } from './connector-rate-limit'
import { deduplicateResults } from './connector-normalizer'
import { groupByPriority, getNextGroup, shouldStopSearch } from './connector-priority'

// --- Platform Respect Policy ---
// 1. Never make parallel mass requests to the same platform.
// 2. Respect the configured rate limit for each platform.
// 3. Prefer cached data when recent enough.
// 4. If a platform is down, mark it temporarily unavailable and continue.
// 5. Track response time and error metrics per connector for reliability.

// --- Connector registry ---

const connectors = new Map<string, Connector>()
const metrics = new Map<string, ConnectorMetrics>()

const DOWN_COOLDOWN_MS = 5 * 60 * 1000
const DOWN_THRESHOLD = 3

function initMetrics(providerId: string): ConnectorMetrics {
  return {
    providerId,
    totalRequests: 0,
    totalErrors: 0,
    avgResponseMs: 0,
    lastRequestAt: null,
    lastErrorAt: null,
    isTemporarilyDown: false,
    downSince: null,
  }
}

function getMetrics(providerId: string): ConnectorMetrics {
  let m = metrics.get(providerId)
  if (!m) {
    m = initMetrics(providerId)
    metrics.set(providerId, m)
  }
  return m
}

function updateMetricsSuccess(providerId: string, responseMs: number): void {
  const m = getMetrics(providerId)
  m.totalRequests++
  m.lastRequestAt = new Date().toISOString()
  m.avgResponseMs = m.totalRequests === 1
    ? responseMs
    : Math.round((m.avgResponseMs * (m.totalRequests - 1) + responseMs) / m.totalRequests)
  if (m.isTemporarilyDown) {
    m.isTemporarilyDown = false
    m.downSince = null
  }
}

function updateMetricsError(providerId: string): void {
  const m = getMetrics(providerId)
  m.totalRequests++
  m.totalErrors++
  m.lastRequestAt = new Date().toISOString()
  m.lastErrorAt = new Date().toISOString()

  const recentErrors = m.totalErrors
  if (recentErrors >= DOWN_THRESHOLD && !m.isTemporarilyDown) {
    m.isTemporarilyDown = true
    m.downSince = new Date().toISOString()
  }
}

function isAvailable(providerId: string): boolean {
  const m = metrics.get(providerId)
  if (!m || !m.isTemporarilyDown) return true
  if (m.downSince && Date.now() - new Date(m.downSince).getTime() > DOWN_COOLDOWN_MS) {
    m.isTemporarilyDown = false
    m.downSince = null
    m.totalErrors = 0
    return true
  }
  return false
}

// --- Public API ---

export function registerConnector(connector: Connector): void {
  connectors.set(connector.config.providerId, connector)
}

export function unregisterConnector(providerId: string): void {
  connectors.delete(providerId)
  metrics.delete(providerId)
}

export function getRegisteredConnectors(): ConnectorConfig[] {
  return Array.from(connectors.values()).map(c => c.config)
}

export function getConnectorMetrics(): ConnectorMetrics[] {
  return Array.from(metrics.values())
}

export function getMetricsFor(providerId: string): ConnectorMetrics | null {
  return metrics.get(providerId) || null
}

async function executeConnector(
  connector: Connector,
  query: string,
  config: AdaptiveSearchConfig,
): Promise<ConnectorResponse> {
  const { providerId } = connector.config
  const start = Date.now()

  if (!isAvailable(providerId)) {
    return { providerId, results: [], fromCache: false, responseTimeMs: 0, error: 'temporarily_down' }
  }

  const cached = getCached(query, providerId, config.cacheTtlMs)
  if (cached) {
    return { providerId, results: cached, fromCache: true, responseTimeMs: 0, error: null }
  }

  const rateConfig = connector.config.rateLimit || DEFAULT_RATE_LIMIT
  if (!canRequest(providerId, rateConfig)) {
    const wait = getWaitTime(providerId, rateConfig)
    return { providerId, results: [], fromCache: false, responseTimeMs: 0, error: `rate_limited:${wait}ms` }
  }

  try {
    recordRequest(providerId, rateConfig)

    const timeout = connector.config.timeout || config.globalTimeoutMs
    const resultPromise = connector.search(query)
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), timeout)
    )

    const results = await Promise.race([resultPromise, timeoutPromise])
    const responseTimeMs = Date.now() - start

    setCached(query, providerId, results)
    updateMetricsSuccess(providerId, responseTimeMs)

    return { providerId, results, fromCache: false, responseTimeMs, error: null }
  } catch (err) {
    updateMetricsError(providerId)
    const responseTimeMs = Date.now() - start
    const message = err instanceof Error ? err.message : 'unknown_error'
    return { providerId, results: [], fromCache: false, responseTimeMs, error: message }
  }
}

export interface AdaptiveSearchResult {
  allResults: FederatedResult[]
  responses: ConnectorResponse[]
  stoppedEarly: boolean
  bestScore: number
  groupsSearched: ConnectorType[]
  groupsSkipped: ConnectorType[]
}

export async function adaptiveSearch(
  query: string,
  scoreResults: (results: FederatedResult[]) => number,
  config: AdaptiveSearchConfig = DEFAULT_SEARCH_CONFIG,
): Promise<AdaptiveSearchResult> {
  const allConfigs = getRegisteredConnectors().filter(c => c.enabled)
  const groups = groupByPriority(allConfigs)

  const allResults: FederatedResult[] = []
  const responses: ConnectorResponse[] = []
  const completedTypes = new Set<ConnectorType>()
  const groupsSearched: ConnectorType[] = []
  const groupsSkipped: ConnectorType[] = []
  let bestScore = 0
  let stoppedEarly = false

  while (true) {
    const nextGroup = getNextGroup(groups, completedTypes)
    if (!nextGroup) break

    completedTypes.add(nextGroup.type)
    groupsSearched.push(nextGroup.type)

    for (const connectorConfig of nextGroup.connectors) {
      const connector = connectors.get(connectorConfig.providerId)
      if (!connector) continue

      const response = await executeConnector(connector, query, config)
      responses.push(response)

      if (response.results.length > 0) {
        allResults.push(...response.results)
      }
    }

    const deduplicated = deduplicateResults(allResults)
    bestScore = scoreResults(deduplicated)

    if (shouldStopSearch(bestScore, config.highMatchThreshold)) {
      stoppedEarly = true
      for (const g of groups) {
        if (!completedTypes.has(g.type)) groupsSkipped.push(g.type)
      }
      break
    }
  }

  return {
    allResults: deduplicateResults(allResults),
    responses,
    stoppedEarly,
    bestScore,
    groupsSearched,
    groupsSkipped,
  }
}

export function resetMetrics(): void {
  metrics.clear()
}

export function resetAll(): void {
  connectors.clear()
  metrics.clear()
}
