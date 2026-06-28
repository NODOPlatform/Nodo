// NODO Connect — Connector 007: Hospitales (OpenStreetMap)
// Type: manual — snapshot de datos reales de OpenStreetMap (no inventados).
// Source: OpenStreetMap via Overpass API. Datos (c) colaboradores de OSM, licencia ODbL.
// Strategy: snapshot embebido (335 hospitales de Venezuela), regenerable con
//           scripts/build-osm-hospitales.mjs. La query nacional en vivo tarda 10-22s
//           en la instancia publica de Overpass — inviable al momento de buscar.

import type { Connector, FederatedResult } from '../connector-types'
import { registerConnector } from '../connector-manager'
import { OSM_HOSPITALES, type OsmHospital } from './data/osm-hospitales-data'

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
}

function matchesQuery(h: OsmHospital, terms: string[]): boolean {
  const searchable = normalize([
    h.name,
    h.city || '',
    h.state || '',
    h.address || '',
  ].join(' '))
  return terms.every(t => searchable.includes(t))
}

function toResult(h: OsmHospital): FederatedResult {
  const descParts: string[] = []
  if (h.emergency) descParts.push('Con emergencia')
  if (h.state) descParts.push(h.state)

  return {
    id: `osm-${h.id}`,
    providerId: 'osm-hospitales',
    providerName: 'Hospitales (OpenStreetMap)',
    entityType: 'hospital',
    firstName: h.name,
    lastName: '',
    age: null,
    status: 'active',
    city: h.city,
    lastLocation: h.address,
    photoUrl: null,
    phone: h.phone,
    description: descParts.length > 0 ? descParts.join(' — ') : null,
    sourceUrl: `https://www.openstreetmap.org/${h.id}`,
    retrievedAt: new Date().toISOString(),
    metadata: {
      state: h.state,
      coordinates: h.lat != null && h.lng != null ? { lat: h.lat, lng: h.lng } : null,
      emergency: h.emergency,
      osmId: h.id,
    },
  }
}

async function search(query: string): Promise<FederatedResult[]> {
  const terms = normalize(query).split(/\s+/).filter(Boolean)
  if (terms.length === 0) return []
  return OSM_HOSPITALES.filter(h => matchesQuery(h, terms)).map(toResult)
}

export const osmHospitalesConnector: Connector = {
  config: {
    providerId: 'osm-hospitales',
    type: 'manual',
    enabled: true,
    timeout: 5000,
    rateLimit: { minIntervalMs: 500, maxPerMinute: 60 },
  },
  search,
}

export function initOsmHospitalesConnector(): void {
  registerConnector(osmHospitalesConnector)
}
