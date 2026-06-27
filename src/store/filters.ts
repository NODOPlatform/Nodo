import { signal } from '@preact/signals'

export const activeFilters = signal<{
  layers: Set<string>
  city: string
  urgency: string
  status: string
}>({
  layers: new Set([
    'help_request', 'person_found', 'shelter', 'hospital',
    'medical_center', 'community_kitchen', 'collection_center',
    'danger_zone', 'blocked_road', 'health_request', 'campaign',
  ]),
  city: '',
  urgency: '',
  status: '',
})

export function toggleLayer(layer: string) {
  const current = activeFilters.value
  const layers = new Set(current.layers)
  if (layers.has(layer)) layers.delete(layer)
  else layers.add(layer)
  activeFilters.value = { ...current, layers }
}

export function setFilter(key: 'city' | 'urgency' | 'status', value: string) {
  activeFilters.value = { ...activeFilters.value, [key]: value }
}
