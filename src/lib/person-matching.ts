import type { Person } from '../types'

// --- Types ---

export interface MatchCandidate {
  person: Person
  score: number
  breakdown: FieldScore[]
}

export interface FieldScore {
  field: string
  label: string
  score: number
  weight: number
  contribution: number
}

export interface MatchQuery {
  firstName?: string
  lastName?: string
  age?: number | null
  sex?: string
  city?: string
  lastLocation?: string
  hospital?: string
  phone?: string
  whatsapp?: string
  date?: string
  source?: string
  // Future: photoEmbedding?: number[]
  // Future: facialHash?: string
  // Future: semanticVector?: number[]
}

// --- Weights (sum = 100) ---

const WEIGHTS: Record<string, number> = {
  firstName: 25,
  lastName: 25,
  phone: 15,
  city: 10,
  age: 8,
  hospital: 7,
  lastLocation: 5,
  date: 3,
  sex: 2,
}

// --- Similarity functions ---

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
}

function stringSimilarity(a: string, b: string): number {
  const na = normalize(a)
  const nb = normalize(b)
  if (!na || !nb) return 0
  if (na === nb) return 1

  if (na.includes(nb) || nb.includes(na)) return 0.85

  const longer = na.length >= nb.length ? na : nb
  const shorter = na.length < nb.length ? na : nb
  const dist = levenshtein(longer, shorter)
  return Math.max(0, 1 - dist / longer.length)
}

function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0) as number[])
  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    }
  }
  return dp[m][n]
}

function phoneSimilarity(a: string, b: string): number {
  const cleanA = a.replace(/\D/g, '').slice(-10)
  const cleanB = b.replace(/\D/g, '').slice(-10)
  if (!cleanA || !cleanB) return 0
  if (cleanA === cleanB) return 1
  if (cleanA.endsWith(cleanB) || cleanB.endsWith(cleanA)) return 0.9
  return 0
}

function ageSimilarity(a: number, b: number): number {
  const diff = Math.abs(a - b)
  if (diff === 0) return 1
  if (diff <= 2) return 0.8
  if (diff <= 5) return 0.5
  if (diff <= 10) return 0.2
  return 0
}

// --- Core matching ---

function scoreCandidate(query: MatchQuery, person: Person): MatchCandidate {
  const breakdown: FieldScore[] = []

  const addScore = (field: string, label: string, score: number) => {
    const weight = WEIGHTS[field] || 0
    breakdown.push({ field, label, score, weight, contribution: score * weight })
  }

  if (query.firstName) {
    addScore('firstName', 'Nombre', stringSimilarity(query.firstName, person.first_name))
  }

  if (query.lastName) {
    addScore('lastName', 'Apellido', stringSimilarity(query.lastName, person.last_name))
  }

  if (query.phone) {
    const personPhone = (person.metadata as Record<string, unknown>)?.phone as string || ''
    const contactVal = (person as unknown as Record<string, unknown>).contact_value as string || ''
    const best = Math.max(
      phoneSimilarity(query.phone, personPhone),
      phoneSimilarity(query.phone, contactVal)
    )
    addScore('phone', 'Telefono', best)
  }

  if (query.city && person.city) {
    addScore('city', 'Ciudad', stringSimilarity(query.city, person.city))
  }

  if (query.lastLocation) {
    const best = Math.max(
      person.last_known_address ? stringSimilarity(query.lastLocation, person.last_known_address) : 0,
      person.sector ? stringSimilarity(query.lastLocation, person.sector) : 0
    )
    if (person.last_known_address || person.sector) {
      addScore('lastLocation', 'Ultima ubicacion', best)
    }
  }

  if (query.age != null && person.approximate_age != null) {
    addScore('age', 'Edad', ageSimilarity(query.age, person.approximate_age))
  }

  if (query.hospital && person.last_known_address) {
    addScore('hospital', 'Hospital', stringSimilarity(query.hospital, person.last_known_address))
  }

  if (query.sex) {
    const personSex = (person.metadata as Record<string, unknown>)?.sex as string || ''
    if (personSex) {
      addScore('sex', 'Sexo', normalize(query.sex)[0] === normalize(personSex)[0] ? 1 : 0)
    }
  }

  const totalWeight = breakdown.reduce((s, b) => s + b.weight, 0)
  const totalContribution = breakdown.reduce((s, b) => s + b.contribution, 0)
  const score = totalWeight > 0 ? Math.round(totalContribution / totalWeight * 100) : 0

  return { person, score, breakdown }
}

export function findMatches(query: MatchQuery, candidates: Person[], minScore = 30): MatchCandidate[] {
  return candidates
    .map(p => scoreCandidate(query, p))
    .filter(m => m.score >= minScore)
    .sort((a, b) => b.score - a.score)
}

export function buildMatchQuery(extracted: {
  firstName?: string
  lastName?: string
  age?: string
  sex?: string
  city?: string
  lastLocation?: string
  hospital?: string
  phone?: string
  whatsapp?: string
  date?: string
  source?: string
}): MatchQuery {
  return {
    firstName: extracted.firstName || undefined,
    lastName: extracted.lastName || undefined,
    age: extracted.age ? parseInt(extracted.age, 10) || null : null,
    sex: extracted.sex || undefined,
    city: extracted.city || undefined,
    lastLocation: extracted.lastLocation || undefined,
    hospital: extracted.hospital || undefined,
    phone: extracted.phone || extracted.whatsapp || undefined,
    whatsapp: extracted.whatsapp || undefined,
    date: extracted.date || undefined,
    source: extracted.source || undefined,
  }
}

// --- Match level labels ---

export type MatchLevel = 'high' | 'medium' | 'low'

export function getMatchLevel(score: number): MatchLevel {
  if (score >= 75) return 'high'
  if (score >= 50) return 'medium'
  return 'low'
}

export const MATCH_LEVEL_CONFIG: Record<MatchLevel, { label: string; color: string; bg: string }> = {
  high: { label: 'Alta coincidencia', color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
  medium: { label: 'Coincidencia media', color: '#eab308', bg: 'rgba(234,179,8,0.12)' },
  low: { label: 'Baja coincidencia', color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' },
}
