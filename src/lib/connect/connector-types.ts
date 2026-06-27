// Unified types for the NODO Adaptive Federation Engine

export type ConnectorType = 'json' | 'api' | 'search' | 'html' | 'manual'

export const CONNECTOR_PRIORITY: ConnectorType[] = ['json', 'api', 'search', 'html', 'manual']

export interface ConnectorConfig {
  providerId: string
  type: ConnectorType
  enabled: boolean
  endpoint?: string
  timeout: number
  rateLimit: RateLimitConfig
  headers?: Record<string, string>
  // Future: authType?: 'none' | 'apiKey' | 'oauth'
  // Future: apiKey?: string
}

export interface RateLimitConfig {
  minIntervalMs: number
  maxPerMinute: number
}

export type EntityType = 'person' | 'hospital' | 'shelter' | 'pet' | 'resource'

export interface FederatedResult {
  id: string
  providerId: string
  providerName: string
  entityType: EntityType
  firstName: string
  lastName: string
  age: number | null
  status: string
  city: string | null
  lastLocation: string | null
  photoUrl: string | null
  phone: string | null
  description: string | null
  sourceUrl: string | null
  retrievedAt: string
  metadata?: Record<string, unknown>
  raw?: unknown
}

export interface ConnectorResponse {
  providerId: string
  results: FederatedResult[]
  fromCache: boolean
  responseTimeMs: number
  error: string | null
}

export interface ConnectorMetrics {
  providerId: string
  totalRequests: number
  totalErrors: number
  avgResponseMs: number
  lastRequestAt: string | null
  lastErrorAt: string | null
  isTemporarilyDown: boolean
  downSince: string | null
}

export interface AdaptiveSearchConfig {
  highMatchThreshold: number
  cacheTtlMs: number
  maxConcurrentPerProvider: number
  globalTimeoutMs: number
  respectPlatformPolicy: boolean
}

export const DEFAULT_SEARCH_CONFIG: AdaptiveSearchConfig = {
  highMatchThreshold: 95,
  cacheTtlMs: 5 * 60 * 1000,
  maxConcurrentPerProvider: 1,
  globalTimeoutMs: 15000,
  respectPlatformPolicy: true,
}

export const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  minIntervalMs: 2000,
  maxPerMinute: 10,
}

export interface Connector {
  config: ConnectorConfig
  search(query: string): Promise<FederatedResult[]>
}
