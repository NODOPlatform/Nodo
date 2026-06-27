// NODO 6.0 — Centro Nacional de Situación
// Aggregates the full state of the Red NODO from existing infrastructure.
// No new queries. No new tables. Only reads connector registry + metrics + raw records.

import type { ConnectorConfig, ConnectorMetrics, EntityType } from './connector-types'
import { getRegisteredConnectors, getConnectorMetrics } from './connector-manager'

// Import raw records directly — no search queries needed
import { HOSPITALS as HOSPITALES } from './connectors/hospitales-connector'
import { RECORDS as VTB } from './connectors/venezuela-te-busca-connector'
import { RECORDS as DESAPARECIDOS } from './connectors/desaparecidos-terremoto-connector'
import { RECORDS as VZLAAYUDA } from './connectors/vzlaayuda-connector'
import { RECORDS as PATITAS } from './connectors/patitas-connector'
import { RECORDS as REENCUENTRO } from './connectors/reencuentro-connector'

export interface NetworkStatus {
  totalConnectors: number
  activeConnectors: number
  avgResponseMs: number
  lastActivity: string | null
  healthStatus: 'operational' | 'degraded' | 'down'
  connectorDetails: ConnectorDetail[]
}

export interface ConnectorDetail {
  providerId: string
  providerName: string
  type: string
  enabled: boolean
  recordCount: number
  metrics: ConnectorMetrics | null
}

export interface EntityCounts {
  persons: { total: number; missing: number; found: number; safe: number; hospitalized: number; reunited: number; deceased: number }
  hospitals: { total: number }
  shelters: { total: number }
  resources: { total: number; acopio: number; campaigns: number }
  pets: { total: number; missing: number; found: number; shelter: number; reunited: number }
}

export interface RecentUpdate {
  name: string
  status: string
  entityType: EntityType
  source: string
  date: string
  staleness: string
}

export interface CoverageEntry {
  providerId: string
  providerName: string
  recordCount: number
  entityTypes: EntityType[]
}

export interface SituationData {
  network: NetworkStatus
  counts: EntityCounts
  recentUpdates: RecentUpdate[]
  coverage: CoverageEntry[]
  generatedAt: string
}

interface RawRecord {
  status: string
  updatedAt?: string | null
  publishedAt?: string | null
  entityType?: string
  name?: string
  firstName?: string
  lastName?: string
}

const CONNECTOR_NAMES: Record<string, string> = {
  'hospitales-venezuela': 'Hospitales Venezuela',
  'venezuela-te-busca': 'Venezuela Te Busca',
  'desaparecidos-terremoto': 'Desaparecidos Terremoto',
  'vzla-ayuda': 'VzlaAyuda',
  'patitas-a-salvo': 'Patitas a Salvo',
  'reencuentro-venezuela': 'Reencuentro Venezuela',
}

function staleness(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `Hace ${mins}min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `Hace ${hours}h`
  return `Hace ${Math.floor(hours / 24)}d`
}

function getAllRawRecords(): Array<RawRecord & { providerId: string; entityType: EntityType }> {
  const all: Array<RawRecord & { providerId: string; entityType: EntityType }> = []

  for (const r of VTB) all.push({ ...r, providerId: 'venezuela-te-busca', entityType: 'person' })
  for (const r of DESAPARECIDOS) all.push({ ...r, providerId: 'desaparecidos-terremoto', entityType: 'person' })
  for (const r of REENCUENTRO) all.push({ ...r, providerId: 'reencuentro-venezuela', entityType: 'person' })
  for (const r of VZLAAYUDA) all.push({ ...r as RawRecord, providerId: 'vzla-ayuda', entityType: (r.entityType as EntityType) || 'resource' })
  for (const r of PATITAS) all.push({ ...r as RawRecord, providerId: 'patitas-a-salvo', entityType: (r.entityType as EntityType) || 'pet' })
  for (const r of HOSPITALES) all.push({ name: r.name, status: 'active', providerId: 'hospitales-venezuela', entityType: 'hospital', publishedAt: null, updatedAt: null })

  return all
}

function buildNetworkStatus(configs: ConnectorConfig[], allMetrics: ConnectorMetrics[]): NetworkStatus {
  const active = configs.filter(c => c.enabled)
  const metricsWithData = allMetrics.filter(m => m.totalRequests > 0)
  const avgMs = metricsWithData.length > 0
    ? Math.round(metricsWithData.reduce((s, m) => s + m.avgResponseMs, 0) / metricsWithData.length)
    : 0

  const lastDates = allMetrics.map(m => m.lastRequestAt).filter(Boolean) as string[]
  const lastActivity = lastDates.length > 0 ? lastDates.sort().reverse()[0] : null

  const downCount = allMetrics.filter(m => m.isTemporarilyDown).length
  let healthStatus: NetworkStatus['healthStatus'] = 'operational'
  if (downCount > 0 && downCount < active.length) healthStatus = 'degraded'
  else if (downCount >= active.length && active.length > 0) healthStatus = 'down'

  const connectorDetails: ConnectorDetail[] = configs.map(c => {
    const m = allMetrics.find(x => x.providerId === c.providerId)
    const records = getAllRawRecords().filter(r => r.providerId === c.providerId)
    return {
      providerId: c.providerId,
      providerName: CONNECTOR_NAMES[c.providerId] || c.providerId,
      type: c.type,
      enabled: c.enabled,
      recordCount: records.length,
      metrics: m ?? null,
    }
  })

  return {
    totalConnectors: configs.length,
    activeConnectors: active.length,
    avgResponseMs: avgMs,
    lastActivity,
    healthStatus,
    connectorDetails,
  }
}

function buildEntityCounts(records: Array<RawRecord & { entityType: EntityType }>): EntityCounts {
  const persons = records.filter(r => r.entityType === 'person')
  const pets = records.filter(r => r.entityType === 'pet')
  const resources = records.filter(r => r.entityType === 'resource')
  const norm = (s: string) => s.toLowerCase()

  return {
    persons: {
      total: persons.length,
      missing: persons.filter(r => r.status === 'missing').length,
      found: persons.filter(r => r.status === 'found').length,
      safe: persons.filter(r => r.status === 'safe').length,
      hospitalized: persons.filter(r => r.status === 'hospitalized').length,
      reunited: persons.filter(r => r.status === 'reunited').length,
      deceased: persons.filter(r => r.status === 'deceased').length,
    },
    hospitals: { total: records.filter(r => r.entityType === 'hospital').length },
    shelters: { total: records.filter(r => r.entityType === 'shelter').length },
    resources: {
      total: resources.length,
      acopio: resources.filter(r => norm(r.name || '').includes('acopio')).length,
      campaigns: resources.filter(r => norm(r.name || '').includes('campana') || norm(r.name || '').includes('donacion') || norm(r.name || '').includes('jornada')).length,
    },
    pets: {
      total: pets.length,
      missing: pets.filter(r => r.status === 'missing').length,
      found: pets.filter(r => r.status === 'found').length,
      shelter: pets.filter(r => r.status === 'shelter').length,
      reunited: pets.filter(r => r.status === 'reunited').length,
    },
  }
}

function buildRecentUpdates(records: Array<RawRecord & { providerId: string; entityType: EntityType }>): RecentUpdate[] {
  return records
    .filter(r => r.updatedAt || r.publishedAt)
    .map(r => ({
      name: r.firstName ? `${r.firstName} ${r.lastName || ''}`.trim() : (r.name || 'Sin nombre'),
      status: r.status,
      entityType: r.entityType,
      source: CONNECTOR_NAMES[r.providerId] || r.providerId,
      date: (r.updatedAt || r.publishedAt)!,
      staleness: staleness((r.updatedAt || r.publishedAt)!),
    }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10)
}

function buildCoverage(records: Array<RawRecord & { providerId: string; entityType: EntityType }>): CoverageEntry[] {
  const byProvider = new Map<string, { count: number; types: Set<EntityType> }>()
  for (const r of records) {
    const entry = byProvider.get(r.providerId) || { count: 0, types: new Set<EntityType>() }
    entry.count++
    entry.types.add(r.entityType)
    byProvider.set(r.providerId, entry)
  }
  return Array.from(byProvider.entries())
    .map(([id, data]) => ({
      providerId: id,
      providerName: CONNECTOR_NAMES[id] || id,
      recordCount: data.count,
      entityTypes: Array.from(data.types),
    }))
    .sort((a, b) => b.recordCount - a.recordCount)
}

export function buildSituationData(): SituationData {
  const configs = getRegisteredConnectors()
  const allMetrics = getConnectorMetrics()
  const records = getAllRawRecords()

  return {
    network: buildNetworkStatus(configs, allMetrics),
    counts: buildEntityCounts(records),
    recentUpdates: buildRecentUpdates(records),
    coverage: buildCoverage(records),
    generatedAt: new Date().toISOString(),
  }
}
