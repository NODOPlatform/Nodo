// NODO 5.1 — Humanitarian Brief Engine
// Builds an executive summary from existing search data.
// No AI. No invented information. Only summarizes what the engines already found.

import type { FederatedResult } from './connector-types'
import type { EvidenceReport, EvidenceLevel } from './evidence-engine'
import type { HumanitarianContext } from './humanitarian-context'
import type { HumanitarianSummary } from './humanitarian-index'

export interface ConfidenceFactor {
  label: string
  met: boolean
}

export interface HumanitarianBrief {
  query: string
  hasResults: boolean
  sentences: string[]
  confidence: number
  confidenceLabel: string
  confidenceFactors: ConfidenceFactor[]
  evidenceLevel: EvidenceLevel | null
  lastUpdated: string | null
  staleness: string | null
  sourceCount: number
  sourceNames: string[]
}

function staleness(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `Hace ${mins} minuto${mins === 1 ? '' : 's'}`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `Hace ${hours} hora${hours === 1 ? '' : 's'}`
  return `Hace ${Math.floor(hours / 24)} dia(s)`
}

const EVIDENCE_SCORE: Record<EvidenceLevel, number> = {
  verified: 30,
  corroborated: 20,
  single_source: 10,
  unconfirmed: 0,
}

const CONFIDENCE_LABELS: [number, string][] = [
  [90, 'Muy alta'],
  [70, 'Alta'],
  [50, 'Moderada'],
  [30, 'Baja'],
  [0, 'Muy baja'],
]

function getConfidenceLabel(score: number): string {
  for (const [threshold, label] of CONFIDENCE_LABELS) {
    if (score >= threshold) return label
  }
  return 'Muy baja'
}

export function buildBrief(
  query: string,
  allResults: FederatedResult[],
  evidence: EvidenceReport[],
  context: HumanitarianContext | null,
  index: HumanitarianSummary | null,
): HumanitarianBrief {
  const personResults = allResults.filter(r => r.entityType === 'person')
  const allSources = [...new Set(allResults.map(r => r.providerName))]

  if (allResults.length === 0) {
    return {
      query, hasResults: false,
      sentences: [
        'No se encontraron coincidencias en las plataformas conectadas.',
        'No existen registros confirmados hasta este momento.',
        'La busqueda permanecera disponible para futuras actualizaciones.',
      ],
      confidence: 0, confidenceLabel: 'Sin datos',
      confidenceFactors: [],
      evidenceLevel: null, lastUpdated: null, staleness: null,
      sourceCount: 0, sourceNames: [],
    }
  }

  const sentences: string[] = []
  const factors: ConfidenceFactor[] = []
  let score = 0

  // Factor: multiple sources
  const multiSource = allSources.length > 1
  factors.push({ label: 'Coincidencia en multiples plataformas', met: multiSource })
  if (multiSource) score += 20

  // Factor: person evidence
  const personEvidence = evidence.filter(e => e.sources.length > 0)
  const bestEvidence = personEvidence.length > 0
    ? personEvidence.reduce((best, e) => EVIDENCE_SCORE[e.evidenceLevel] > EVIDENCE_SCORE[best.evidenceLevel] ? e : best)
    : null
  const evidenceLevel = bestEvidence?.evidenceLevel ?? null

  if (bestEvidence) {
    score += EVIDENCE_SCORE[bestEvidence.evidenceLevel]
  }

  // Factor: recent update
  const allDates = allResults.map(r => r.retrievedAt).filter(Boolean).sort().reverse()
  const lastUpdated = allDates[0] || null
  const isRecent = lastUpdated ? (Date.now() - new Date(lastUpdated).getTime()) < 86400000 : false
  factors.push({ label: 'Actualizacion reciente', met: isRecent })
  if (isRecent) score += 15

  // Factor: name match in persons
  const qNorm = query.toLowerCase().trim()
  const nameMatch = personResults.some(r =>
    `${r.firstName} ${r.lastName}`.toLowerCase().includes(qNorm) ||
    qNorm.includes(r.firstName.toLowerCase())
  )
  factors.push({ label: 'Coincidencia de nombre', met: nameMatch })
  if (nameMatch) score += 15

  // Factor: city match
  const cities = [...new Set(personResults.map(r => r.city).filter(Boolean))]
  const cityMatch = cities.length > 0 && personResults.length > 1 &&
    personResults.some((r, _, arr) => arr.some(o => o.id !== r.id && o.city === r.city && r.city))
  factors.push({ label: 'Coincidencia de ciudad', met: cityMatch })
  if (cityMatch) score += 10

  // Factor: hospital match
  const hospitals = personResults
    .map(r => (r.metadata?.hospital as string) || '')
    .filter(Boolean)
  const hospitalMatch = hospitals.length > 0
  factors.push({ label: 'Coincidencia de hospital', met: hospitalMatch })
  if (hospitalMatch) score += 10

  score = Math.min(score, 100)

  // Build sentences from data
  if (personResults.length > 0) {
    sentences.push(
      `Se encontraron ${personResults.length} coincidencia${personResults.length === 1 ? '' : 's'} de personas en ${allSources.length} fuente${allSources.length === 1 ? '' : 's'} ${multiSource ? 'verificadas' : ''}.`.replace(/  /g, ' ')
    )
  }

  // Hospital info
  if (hospitals.length > 0) {
    const uniqueHospitals = [...new Set(hospitals)]
    sentences.push(
      `La informacion mas reciente indica una posible ubicacion en ${uniqueHospitals[0]}.`
    )
  }

  // Best status
  if (bestEvidence) {
    const statusMap: Record<string, string> = {
      safe: 'a salvo', found: 'encontrado/a', hospitalized: 'hospitalizado/a',
      missing: 'desaparecido/a', reunited: 'reunido/a con familiares',
    }
    const statusText = statusMap[bestEvidence.bestStatus]
    if (statusText) {
      sentences.push(`El estado mas reciente reportado es: ${statusText}.`)
    }
  }

  // Context relationships
  if (context && context.totalLinks > 0) {
    const contextTypes: string[] = []
    for (const cat of context.categories) {
      if (cat.entityType === 'hospital') contextTypes.push('centros de salud')
      else if (cat.entityType === 'shelter') contextTypes.push('refugios')
      else if (cat.entityType === 'resource') contextTypes.push('recursos y campanas')
      else if (cat.entityType === 'pet') contextTypes.push('mascotas')
      else if (cat.entityType === 'person') contextTypes.push('personas relacionadas')
    }
    if (contextTypes.length > 0) {
      sentences.push(`Se localizaron ${contextTypes.join(', ')} relacionados.`)
    }
  }

  // Non-person entities from index
  if (index) {
    const nonPersonCats = index.categories.filter(c => c.entityType !== 'person' && c.count > 0)
    if (nonPersonCats.length > 0 && sentences.length < 5) {
      const parts = nonPersonCats.map(c => `${c.count} ${c.label.toLowerCase()}`)
      sentences.push(`Tambien se encontraron: ${parts.join(', ')}.`)
    }
  }

  return {
    query,
    hasResults: true,
    sentences,
    confidence: score,
    confidenceLabel: getConfidenceLabel(score),
    confidenceFactors: factors,
    evidenceLevel,
    lastUpdated,
    staleness: lastUpdated ? staleness(lastUpdated) : null,
    sourceCount: allSources.length,
    sourceNames: allSources,
  }
}
