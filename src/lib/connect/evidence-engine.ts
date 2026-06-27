// NODO Evidence Engine — Multi-source verification
// Transforms NODO from a search engine into a verification engine.
// Every match is backed by evidence: how many sources confirm it, how recent, how reliable.

import type { FederatedResult } from './connector-types'
import type { Person } from '../../types'

export type EvidenceLevel = 'verified' | 'corroborated' | 'single_source' | 'unconfirmed'

export interface EvidenceSource {
  providerId: string
  providerName: string
  status: string
  confidence: string
  updatedAt: string
  sourceUrl: string | null
}

export interface EvidenceReport {
  personKey: string
  firstName: string
  lastName: string
  age: number | null
  bestStatus: string
  sources: EvidenceSource[]
  sourceCount: number
  evidenceLevel: EvidenceLevel
  lastUpdated: string
  staleness: string
  recommendation: string | null
  matchScore: number
}

const STATUS_PRIORITY: Record<string, number> = {
  safe: 1, reunited: 1, found: 2, hospitalized: 3,
  missing: 4, unknown: 5, deceased: 0,
}

function personKey(firstName: string, lastName: string): string {
  return `${firstName.toLowerCase().trim()}::${lastName.toLowerCase().trim()}`
}

function staleness(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `Hace ${mins} minuto${mins === 1 ? '' : 's'}`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `Hace ${hours} hora${hours === 1 ? '' : 's'}`
  return `Hace ${Math.floor(hours / 24)} dia(s)`
}

function bestStatus(sources: EvidenceSource[]): string {
  if (sources.length === 0) return 'unknown'
  const sorted = [...sources].sort((a, b) => {
    const timeDiff = new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    if (timeDiff !== 0) return timeDiff
    return (STATUS_PRIORITY[a.status] ?? 5) - (STATUS_PRIORITY[b.status] ?? 5)
  })
  return sorted[0].status
}

function determineLevel(sources: EvidenceSource[]): EvidenceLevel {
  const uniqueProviders = new Set(sources.map(s => s.providerId))
  const highConfidence = sources.filter(s => s.confidence === 'high').length

  if (uniqueProviders.size >= 3 && highConfidence >= 2) return 'verified'
  if (uniqueProviders.size >= 2) return 'corroborated'
  if (uniqueProviders.size === 1 && highConfidence > 0) return 'single_source'
  return 'unconfirmed'
}

function recommendation(level: EvidenceLevel, sources: EvidenceSource[]): string | null {
  if (level === 'verified') return null
  if (level === 'corroborated') return null
  const latestUpdate = sources.reduce((latest, s) =>
    new Date(s.updatedAt) > new Date(latest) ? s.updatedAt : latest, sources[0]?.updatedAt || '')
  const daysSince = (Date.now() - new Date(latestUpdate).getTime()) / 86400000
  if (level === 'single_source') {
    return daysSince > 2
      ? 'Solo una fuente externa. Ultima actualizacion hace mas de 2 dias. Se recomienda verificar.'
      : 'Solo una plataforma externa confirma esta informacion.'
  }
  return 'Informacion sin confirmar. Se recomienda verificar con la fuente original.'
}

export function buildEvidenceFromFederated(
  federatedResults: FederatedResult[],
  nodoPersons: Person[],
  matchScore: number,
): EvidenceReport[] {
  const groups = new Map<string, { firstName: string; lastName: string; age: number | null; sources: EvidenceSource[]; score: number }>()

  for (const p of nodoPersons) {
    const key = personKey(p.first_name, p.last_name)
    if (!groups.has(key)) {
      groups.set(key, { firstName: p.first_name, lastName: p.last_name, age: p.approximate_age, sources: [], score: matchScore })
    }
    groups.get(key)!.sources.push({
      providerId: 'nodo',
      providerName: 'NODO',
      status: p.current_status,
      confidence: 'high',
      updatedAt: p.updated_at,
      sourceUrl: null,
    })
  }

  for (const r of federatedResults) {
    if (r.entityType !== 'person') continue
    const key = personKey(r.firstName, r.lastName)
    if (!groups.has(key)) {
      groups.set(key, { firstName: r.firstName, lastName: r.lastName, age: r.age, sources: [], score: matchScore })
    }
    groups.get(key)!.sources.push({
      providerId: r.providerId,
      providerName: r.providerName,
      status: r.status,
      confidence: (r.metadata?.confidence as string) || 'medium',
      updatedAt: (r.metadata?.updatedAt as string) || r.retrievedAt,
      sourceUrl: r.sourceUrl,
    })
  }

  const reports: EvidenceReport[] = []
  for (const [key, group] of groups) {
    const level = determineLevel(group.sources)
    const latest = group.sources.reduce((l, s) =>
      new Date(s.updatedAt) > new Date(l) ? s.updatedAt : l, group.sources[0]?.updatedAt || '')

    reports.push({
      personKey: key,
      firstName: group.firstName,
      lastName: group.lastName,
      age: group.age,
      bestStatus: bestStatus(group.sources),
      sources: group.sources,
      sourceCount: new Set(group.sources.map(s => s.providerId)).size,
      evidenceLevel: level,
      lastUpdated: latest,
      staleness: staleness(latest),
      recommendation: recommendation(level, group.sources),
      matchScore: group.score,
    })
  }

  return reports.sort((a, b) => b.sourceCount - a.sourceCount || b.matchScore - a.matchScore)
}

export function buildEntityEvidence(federatedResults: FederatedResult[]): EvidenceReport[] {
  const groups = new Map<string, { name: string; secondary: string; age: number | null; sources: EvidenceSource[] }>()

  for (const r of federatedResults) {
    const key = personKey(r.firstName, r.lastName || r.city || '')
    if (!groups.has(key)) {
      groups.set(key, { name: r.firstName, secondary: r.lastName, age: r.age, sources: [] })
    }
    groups.get(key)!.sources.push({
      providerId: r.providerId,
      providerName: r.providerName,
      status: r.status,
      confidence: (r.metadata?.confidence as string) || 'medium',
      updatedAt: (r.metadata?.updatedAt as string) || r.retrievedAt,
      sourceUrl: r.sourceUrl,
    })
  }

  const reports: EvidenceReport[] = []
  for (const [key, group] of groups) {
    if (new Set(group.sources.map(s => s.providerId)).size < 2) continue
    const level = determineLevel(group.sources)
    const latest = group.sources.reduce((l, s) =>
      new Date(s.updatedAt) > new Date(l) ? s.updatedAt : l, group.sources[0]?.updatedAt || '')
    reports.push({
      personKey: key,
      firstName: group.name,
      lastName: group.secondary,
      age: group.age,
      bestStatus: bestStatus(group.sources),
      sources: group.sources,
      sourceCount: new Set(group.sources.map(s => s.providerId)).size,
      evidenceLevel: level,
      lastUpdated: latest,
      staleness: staleness(latest),
      recommendation: recommendation(level, group.sources),
      matchScore: 0,
    })
  }
  return reports.sort((a, b) => b.sourceCount - a.sourceCount)
}

export const EVIDENCE_CONFIG: Record<EvidenceLevel, { icon: string; label: string; color: string; bg: string }> = {
  verified: { icon: '✅', label: 'Verificado por multiples fuentes', color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
  corroborated: { icon: '✅', label: 'Corroborado', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  single_source: { icon: '⚠️', label: 'Una sola fuente externa', color: '#eab308', bg: 'rgba(234,179,8,0.12)' },
  unconfirmed: { icon: '❓', label: 'Sin confirmar', color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' },
}
