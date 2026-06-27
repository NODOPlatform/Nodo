// NODO Connect — Base: Multi-Entity Connector (reusable template)
// For platforms that provide multiple entity types (persons, shelters, supplies, etc.)

import type { Connector, ConnectorConfig, EntityType, FederatedResult } from '../connector-types'
import { registerConnector } from '../connector-manager'

export interface EntityRecord {
  id: string
  entityType: EntityType
  name: string
  secondaryName?: string
  age?: number | null
  status: string
  city: string | null
  state: string | null
  location: string | null
  phone: string | null
  photoUrl: string | null
  description: string | null
  sourceUrl: string
  publishedAt: string
  updatedAt: string | null
  organization: string
  confidence: 'high' | 'medium' | 'low'
  metadata?: Record<string, unknown>
}

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
}

function matchesTerm(record: EntityRecord, terms: string[]): boolean {
  const searchable = normalize([
    record.name,
    record.secondaryName || '',
    record.city || '',
    record.state || '',
    record.location || '',
    record.description || '',
  ].join(' '))
  return terms.every(t => searchable.includes(t))
}

function toResult(r: EntityRecord, providerId: string, providerName: string): FederatedResult {
  const isPersonType = r.entityType === 'person'
  const nameParts = r.name.trim().split(/\s+/)
  return {
    id: `${providerId}-${r.id}`,
    providerId,
    providerName,
    entityType: r.entityType,
    firstName: isPersonType ? (nameParts[0] || r.name) : r.name,
    lastName: isPersonType ? nameParts.slice(1).join(' ') : (r.secondaryName || ''),
    age: r.age ?? null,
    status: r.status,
    city: r.city,
    lastLocation: r.location,
    photoUrl: r.photoUrl,
    phone: r.phone,
    description: r.description,
    sourceUrl: r.sourceUrl,
    retrievedAt: new Date().toISOString(),
    metadata: {
      state: r.state,
      publishedAt: r.publishedAt,
      updatedAt: r.updatedAt,
      organization: r.organization,
      confidence: r.confidence,
      ...r.metadata,
    },
  }
}

export interface MultiEntityConnectorInit {
  providerId: string
  providerName: string
  config: Omit<ConnectorConfig, 'providerId'>
  records: EntityRecord[]
}

export function createMultiEntityConnector(init: MultiEntityConnectorInit): Connector {
  const config: ConnectorConfig = { ...init.config, providerId: init.providerId }
  return {
    config,
    async search(query: string): Promise<FederatedResult[]> {
      const terms = normalize(query).split(/\s+/).filter(Boolean)
      if (terms.length === 0) return []
      return init.records
        .filter(r => matchesTerm(r, terms))
        .map(r => toResult(r, init.providerId, init.providerName))
    },
  }
}

export function registerMultiEntityConnector(init: MultiEntityConnectorInit): void {
  registerConnector(createMultiEntityConnector(init))
}
