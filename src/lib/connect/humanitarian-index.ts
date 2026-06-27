// NODO Humanitarian Index — Logical view across all sources
// Not a new table. Aggregates connector results + NODO data into a location/topic summary.

import type { EntityType, FederatedResult } from './connector-types'

export interface IndexCategory {
  entityType: EntityType
  icon: string
  label: string
  count: number
  results: FederatedResult[]
}

export interface HumanitarianSummary {
  query: string
  categories: IndexCategory[]
  totalResults: number
  sources: string[]
  generatedAt: string
}

const ENTITY_CONFIG: Record<EntityType, { icon: string; label: string; order: number }> = {
  person: { icon: '👤', label: 'Personas', order: 1 },
  hospital: { icon: '🏥', label: 'Hospitales', order: 2 },
  shelter: { icon: '🏠', label: 'Refugios', order: 3 },
  resource: { icon: '📦', label: 'Recursos y campanas', order: 4 },
  pet: { icon: '🐾', label: 'Mascotas', order: 5 },
}

export function buildHumanitarianIndex(query: string, results: FederatedResult[]): HumanitarianSummary {
  const byType = new Map<EntityType, FederatedResult[]>()

  for (const r of results) {
    const list = byType.get(r.entityType) || []
    list.push(r)
    byType.set(r.entityType, list)
  }

  const categories: IndexCategory[] = []
  for (const [type, items] of byType) {
    const cfg = ENTITY_CONFIG[type]
    categories.push({
      entityType: type,
      icon: cfg.icon,
      label: cfg.label,
      count: items.length,
      results: items,
    })
  }
  categories.sort((a, b) => (ENTITY_CONFIG[a.entityType].order) - (ENTITY_CONFIG[b.entityType].order))

  const sources = [...new Set(results.map(r => r.providerName))]

  return {
    query,
    categories,
    totalResults: results.length,
    sources,
    generatedAt: new Date().toISOString(),
  }
}
