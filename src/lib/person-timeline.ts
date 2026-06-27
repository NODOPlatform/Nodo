// --- Timeline event types ---

export type TimelineEventType =
  | 'reported_missing'
  | 'last_seen'
  | 'found'
  | 'hospitalized'
  | 'blood_request'
  | 'discharged'
  | 'reunited'
  | 'status_update'
  | 'sighting'
  | 'transferred'
  | 'identified'
  | 'info_update'

export interface TimelineSource {
  platform: string
  platformIcon?: string
  organization?: string
  verificationLevel: 'verified' | 'community' | 'unverified'
  url?: string
}

export interface TimelineEvent {
  id: string
  type: TimelineEventType
  date: string
  title: string
  description?: string
  location?: string
  source: TimelineSource
  // Future: attachments?: string[]
  // Future: confidence?: number
}

// --- Event type config ---

export const EVENT_TYPE_CONFIG: Record<TimelineEventType, { icon: string; label: string; color: string }> = {
  reported_missing: { icon: '🔍', label: 'Reportado como desaparecido', color: '#ef4444' },
  last_seen: { icon: '👁️', label: 'Visto por ultima vez', color: '#f59e0b' },
  found: { icon: '✅', label: 'Encontrado', color: '#22c55e' },
  hospitalized: { icon: '🏥', label: 'Hospitalizado', color: '#3b82f6' },
  blood_request: { icon: '🩸', label: 'Solicitud de sangre', color: '#dc2626' },
  discharged: { icon: '🏠', label: 'Alta medica', color: '#10b981' },
  reunited: { icon: '❤️', label: 'Reunido con su familia', color: '#ec4899' },
  status_update: { icon: '📋', label: 'Actualizacion de estado', color: '#6366f1' },
  sighting: { icon: '📍', label: 'Posible avistamiento', color: '#8b5cf6' },
  transferred: { icon: '🚑', label: 'Trasladado', color: '#0ea5e9' },
  identified: { icon: '🪪', label: 'Identificado', color: '#14b8a6' },
  info_update: { icon: '📝', label: 'Informacion actualizada', color: '#64748b' },
}

export const VERIFICATION_LABELS: Record<string, { label: string; color: string }> = {
  verified: { label: 'Verificado', color: '#22c55e' },
  community: { label: 'Reporte comunitario', color: '#eab308' },
  unverified: { label: 'Sin verificar', color: '#94a3b8' },
}

// --- Build timeline from Person record + status history ---

import type { Person, PersonStatusHistory } from '../types'

function statusToEventType(status: string): TimelineEventType {
  const map: Record<string, TimelineEventType> = {
    unknown: 'reported_missing',
    missing: 'reported_missing',
    found: 'found',
    safe: 'reunited',
    hospitalized: 'hospitalized',
    deceased: 'status_update',
  }
  return map[status] || 'status_update'
}

export function buildTimeline(person: Person, history: PersonStatusHistory[]): TimelineEvent[] {
  const events: TimelineEvent[] = []

  events.push({
    id: `created-${person.id}`,
    type: person.is_found ? 'found' : 'reported_missing',
    date: person.created_at,
    title: person.is_found ? 'Persona reportada como encontrada' : 'Persona reportada como desaparecida',
    description: person.description || undefined,
    location: person.last_known_address || [person.sector, person.city].filter(Boolean).join(', ') || undefined,
    source: {
      platform: 'NODO',
      platformIcon: '🌐',
      verificationLevel: 'community',
    },
  })

  for (const h of history) {
    events.push({
      id: h.id,
      type: statusToEventType(h.status),
      date: h.created_at,
      title: EVENT_TYPE_CONFIG[statusToEventType(h.status)]?.label || 'Actualizacion',
      description: h.notes || undefined,
      location: h.address_text || undefined,
      source: {
        platform: 'NODO',
        platformIcon: '🌐',
        verificationLevel: 'community',
      },
    })
  }

  if (person.current_status !== (person.is_found ? 'found' : 'unknown')) {
    const alreadyHas = events.some(e =>
      statusToEventType(person.current_status) === e.type && e.date === person.updated_at
    )
    if (!alreadyHas) {
      events.push({
        id: `current-${person.id}`,
        type: statusToEventType(person.current_status),
        date: person.updated_at,
        title: EVENT_TYPE_CONFIG[statusToEventType(person.current_status)]?.label || 'Estado actual',
        source: {
          platform: 'NODO',
          platformIcon: '🌐',
          verificationLevel: 'community',
        },
      })
    }
  }

  events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  return events
}

// Future: merge timelines from multiple providers
// export function mergeTimelines(timelines: TimelineEvent[][]): TimelineEvent[] { ... }
// Future: detect contradictions between sources
// export function detectConflicts(events: TimelineEvent[]): Conflict[] { ... }
