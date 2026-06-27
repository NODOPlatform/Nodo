import type { ConnectorMetrics } from './connector-types'
import { getRegisteredConnectors, getMetricsFor } from './connector-manager'
import { adaptiveSearch } from './connector-manager'

export type ValidatorStatus = 'available' | 'slow' | 'error' | 'unknown'

export interface ValidatorResult {
  providerId: string
  status: ValidatorStatus
  responseMs: number
  resultCount: number
  connectorType: string
  error: string | null
  metrics: ConnectorMetrics | null
  checkedAt: string
}

export interface ValidationReport {
  results: ValidatorResult[]
  totalConnectors: number
  available: number
  slow: number
  errors: number
  avgResponseMs: number
  generatedAt: string
}

const SLOW_THRESHOLD_MS = 3000
const TEST_QUERY = 'test'

export async function validateConnector(providerId: string): Promise<ValidatorResult> {
  const configs = getRegisteredConnectors()
  const config = configs.find(c => c.providerId === providerId)

  if (!config) {
    return {
      providerId,
      status: 'unknown',
      responseMs: 0,
      resultCount: 0,
      connectorType: 'unknown',
      error: 'connector_not_found',
      metrics: null,
      checkedAt: new Date().toISOString(),
    }
  }

  const start = Date.now()
  try {
    const result = await adaptiveSearch(TEST_QUERY, () => 0, {
      highMatchThreshold: 100,
      cacheTtlMs: 0,
      maxConcurrentPerProvider: 1,
      globalTimeoutMs: config.timeout,
      respectPlatformPolicy: true,
    })

    const response = result.responses.find(r => r.providerId === providerId)
    const responseMs = response?.responseTimeMs ?? (Date.now() - start)
    const resultCount = response?.results.length ?? 0
    const error = response?.error ?? null

    let status: ValidatorStatus = 'available'
    if (error) status = 'error'
    else if (responseMs > SLOW_THRESHOLD_MS) status = 'slow'

    return {
      providerId,
      status,
      responseMs,
      resultCount,
      connectorType: config.type,
      error,
      metrics: getMetricsFor(providerId),
      checkedAt: new Date().toISOString(),
    }
  } catch {
    return {
      providerId,
      status: 'error',
      responseMs: Date.now() - start,
      resultCount: 0,
      connectorType: config.type,
      error: 'validation_failed',
      metrics: getMetricsFor(providerId),
      checkedAt: new Date().toISOString(),
    }
  }
}

export async function validateAll(): Promise<ValidationReport> {
  const configs = getRegisteredConnectors().filter(c => c.enabled)
  const results: ValidatorResult[] = []

  for (const config of configs) {
    results.push(await validateConnector(config.providerId))
  }

  const available = results.filter(r => r.status === 'available').length
  const slow = results.filter(r => r.status === 'slow').length
  const errors = results.filter(r => r.status === 'error').length
  const totalMs = results.reduce((s, r) => s + r.responseMs, 0)

  return {
    results,
    totalConnectors: results.length,
    available,
    slow,
    errors,
    avgResponseMs: results.length > 0 ? Math.round(totalMs / results.length) : 0,
    generatedAt: new Date().toISOString(),
  }
}

export function getValidatorStatusIcon(status: ValidatorStatus): string {
  const icons: Record<ValidatorStatus, string> = {
    available: '✅',
    slow: '⚠️',
    error: '❌',
    unknown: '❓',
  }
  return icons[status]
}
