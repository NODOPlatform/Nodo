// NODO Connect — Base: Person Search Connector (reusable template)
// Used by: Venezuela Te Busca, Encuentra Venezuela, Desaparecidos Terremoto, Reencuentro Venezuela
// Type: manual (curated, upgradeable to json/api)

import type { Connector, ConnectorConfig, FederatedResult } from '../connector-types'
import { registerConnector } from '../connector-manager'

export interface PersonRecord {
  id: string
  firstName: string
  lastName: string
  age: number | null
  sex: string | null
  photoUrl: string | null
  city: string | null
  state: string | null
  lastLocation: string | null
  hospital: string | null
  status: string
  description: string | null
  publishedAt: string
  updatedAt: string | null
  organization: string
  sourceUrl: string
  confidence: 'high' | 'medium' | 'low'
}

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
}

function matchesTerm(record: PersonRecord, terms: string[]): boolean {
  const searchable = normalize([
    record.firstName,
    record.lastName,
    record.city || '',
    record.state || '',
    record.lastLocation || '',
    record.hospital || '',
    record.description || '',
  ].join(' '))
  return terms.every(t => searchable.includes(t))
}

function toFederatedResult(r: PersonRecord, providerId: string, providerName: string): FederatedResult {
  return {
    id: `${providerId}-${r.id}`,
    providerId,
    providerName,
    entityType: 'person',
    firstName: r.firstName,
    lastName: r.lastName,
    age: r.age,
    status: r.status,
    city: r.city,
    lastLocation: r.lastLocation,
    photoUrl: r.photoUrl,
    phone: null,
    description: r.description,
    sourceUrl: r.sourceUrl,
    retrievedAt: new Date().toISOString(),
    metadata: {
      sex: r.sex,
      state: r.state,
      hospital: r.hospital,
      publishedAt: r.publishedAt,
      updatedAt: r.updatedAt,
      organization: r.organization,
      confidence: r.confidence,
    },
  }
}

export interface PersonSearchConnectorInit {
  providerId: string
  providerName: string
  config: Omit<ConnectorConfig, 'providerId'>
  records: PersonRecord[]
  // Future: endpoint for live search
  // endpoint?: string
}

export function createPersonSearchConnector(init: PersonSearchConnectorInit): Connector {
  const config: ConnectorConfig = { ...init.config, providerId: init.providerId }

  const connector: Connector = {
    config,
    async search(query: string): Promise<FederatedResult[]> {
      const terms = normalize(query).split(/\s+/).filter(Boolean)
      if (terms.length === 0) return []

      // Future: if config.endpoint, fetch from external API
      // if (config.endpoint) { return fetchFromAPI(config.endpoint, query) }

      return init.records
        .filter(r => matchesTerm(r, terms))
        .map(r => toFederatedResult(r, init.providerId, init.providerName))
    },
  }

  return connector
}

export function registerPersonSearchConnector(init: PersonSearchConnectorInit): void {
  registerConnector(createPersonSearchConnector(init))
}
