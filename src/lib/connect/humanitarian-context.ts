// NODO 5.0 — Humanitarian Context Engine
// Finds relationships between entities already loaded by connectors.
// No AI. No invented relations. Only data that exists in the current search results.

import type { FederatedResult, EntityType } from './connector-types'
import type { EvidenceReport, EvidenceLevel } from './evidence-engine'

export interface ContextLink {
  id: string
  entityType: EntityType
  name: string
  relation: string
  source: string
  evidenceLevel: EvidenceLevel | null
  lastUpdated: string | null
  result: FederatedResult
}

export interface ContextCategory {
  entityType: EntityType
  icon: string
  label: string
  links: ContextLink[]
}

export interface HumanitarianContext {
  subjectName: string
  categories: ContextCategory[]
  totalLinks: number
  sources: string[]
}

const CATEGORY_META: Record<EntityType, { icon: string; label: string; order: number }> = {
  person: { icon: '👤', label: 'Personas relacionadas', order: 1 },
  hospital: { icon: '🏥', label: 'Salud', order: 2 },
  shelter: { icon: '🏠', label: 'Refugios', order: 3 },
  resource: { icon: '📦', label: 'Recursos y campanas', order: 4 },
  pet: { icon: '🐾', label: 'Mascotas', order: 5 },
}

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
}

function findCityMatch(subject: FederatedResult, candidate: FederatedResult): boolean {
  if (!subject.city || !candidate.city) return false
  return normalize(subject.city) === normalize(candidate.city)
}

function findHospitalLink(subject: FederatedResult, candidate: FederatedResult): boolean {
  if (candidate.entityType !== 'hospital') return false
  const subjectHospital = (subject.metadata?.hospital as string) || ''
  if (!subjectHospital) return findCityMatch(subject, candidate)
  return normalize(candidate.firstName).includes(normalize(subjectHospital)) ||
         normalize(subjectHospital).includes(normalize(candidate.firstName))
}

function findShelterLink(subject: FederatedResult, candidate: FederatedResult): boolean {
  if (candidate.entityType !== 'shelter') return false
  return findCityMatch(subject, candidate)
}

function findResourceLink(subject: FederatedResult, candidate: FederatedResult): boolean {
  if (candidate.entityType !== 'resource') return false
  return findCityMatch(subject, candidate)
}

function findPersonLink(subject: FederatedResult, candidate: FederatedResult): boolean {
  if (candidate.entityType !== 'person' || candidate.id === subject.id) return false
  if (findCityMatch(subject, candidate)) return true
  const subjectHospital = (subject.metadata?.hospital as string) || ''
  const candidateHospital = (candidate.metadata?.hospital as string) || ''
  if (subjectHospital && candidateHospital && normalize(subjectHospital) === normalize(candidateHospital)) return true
  return false
}

function findPetLink(subject: FederatedResult, candidate: FederatedResult): boolean {
  if (candidate.entityType !== 'pet' || candidate.id === subject.id) return false
  return findCityMatch(subject, candidate)
}

function describeRelation(subject: FederatedResult, linked: FederatedResult): string {
  if (linked.entityType === 'pet') {
    const species = (linked.metadata?.species as string) || 'Mascota'
    return `${species} reportado/a en ${linked.city}`
  }
  if (linked.entityType === 'hospital') {
    const subjectHospital = (subject.metadata?.hospital as string) || ''
    if (subjectHospital && normalize(linked.firstName).includes(normalize(subjectHospital))) {
      return 'Hospital donde fue reportado/a'
    }
    return `Hospital en ${linked.city}`
  }
  if (linked.entityType === 'shelter') return `Refugio en ${linked.city}`
  if (linked.entityType === 'resource') {
    if (normalize(linked.firstName).includes('sangre') || normalize(linked.firstName).includes('donacion')) {
      return 'Campana de sangre activa'
    }
    if (normalize(linked.firstName).includes('acopio')) return `Centro de acopio en ${linked.city}`
    return `Recurso disponible en ${linked.city}`
  }
  if (linked.entityType === 'person') {
    const linkedHospital = (linked.metadata?.hospital as string) || ''
    const subjectHospital = (subject.metadata?.hospital as string) || ''
    if (linkedHospital && subjectHospital && normalize(linkedHospital) === normalize(subjectHospital)) {
      return `Mismo hospital: ${linkedHospital}`
    }
    return `Misma zona: ${linked.city}`
  }
  return `Relacionado en ${linked.city}`
}

function findEvidenceLevel(result: FederatedResult, evidence: EvidenceReport[]): EvidenceLevel | null {
  const key = `${result.firstName.toLowerCase().trim()}::${(result.lastName || result.city || '').toLowerCase().trim()}`
  const report = evidence.find(e => e.personKey === key)
  return report?.evidenceLevel ?? null
}

export function buildContext(
  subjectResults: FederatedResult[],
  allResults: FederatedResult[],
  evidence: EvidenceReport[],
  subjectName: string,
): HumanitarianContext | null {
  if (subjectResults.length === 0 || allResults.length < 2) return null

  const subject = subjectResults[0]
  const links: ContextLink[] = []
  const seen = new Set<string>()

  const linkers: Array<(s: FederatedResult, c: FederatedResult) => boolean> = [
    findHospitalLink,
    findShelterLink,
    findResourceLink,
    findPersonLink,
    findPetLink,
  ]

  for (const candidate of allResults) {
    if (candidate.id === subject.id) continue
    if (seen.has(candidate.id)) continue

    for (const linker of linkers) {
      if (linker(subject, candidate)) {
        seen.add(candidate.id)
        links.push({
          id: candidate.id,
          entityType: candidate.entityType,
          name: candidate.firstName + (candidate.lastName ? ` ${candidate.lastName}` : ''),
          relation: describeRelation(subject, candidate),
          source: candidate.providerName,
          evidenceLevel: findEvidenceLevel(candidate, evidence),
          lastUpdated: (candidate.metadata?.updatedAt as string) || candidate.retrievedAt,
          result: candidate,
        })
        break
      }
    }
  }

  if (links.length === 0) return null

  const categoryMap = new Map<EntityType, ContextLink[]>()
  for (const link of links) {
    const list = categoryMap.get(link.entityType) || []
    list.push(link)
    categoryMap.set(link.entityType, list)
  }

  const categories: ContextCategory[] = []
  for (const [type, typeLinks] of categoryMap) {
    const meta = CATEGORY_META[type]
    categories.push({ entityType: type, icon: meta.icon, label: meta.label, links: typeLinks })
  }
  categories.sort((a, b) => CATEGORY_META[a.entityType].order - CATEGORY_META[b.entityType].order)

  return {
    subjectName,
    categories,
    totalLinks: links.length,
    sources: [...new Set(links.map(l => l.source))],
  }
}
