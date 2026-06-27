import type { Person } from '../types'
import type { TimelineEvent } from './person-timeline'
import type { MatchCandidate } from './person-matching'

// --- Unified person profile ---

export interface PersonSource {
  platform: string
  platformIcon: string
  recordId: string
  status: string
  lastUpdated: string
  verificationLevel: 'verified' | 'community' | 'unverified'
  url?: string
}

export interface UnifiedProfile {
  primaryId: string
  firstName: string
  lastName: string
  age: number | null
  currentStatus: string
  lastUpdated: string
  photoUrl: string | null
  city: string | null
  lastLocation: string | null
  sources: PersonSource[]
  matchCount: number
  confidence: number
  timeline: TimelineEvent[]
  // Future: relatedPersons?: string[]
  // Future: facialMatchScore?: number
  // Future: semanticSummary?: string
}

// --- Build profile from a Person record ---

export function buildProfile(person: Person, timeline: TimelineEvent[], matches: MatchCandidate[]): UnifiedProfile {
  const images = (person.metadata?.images as string[]) || []

  const sources: PersonSource[] = [
    {
      platform: 'NODO',
      platformIcon: '🌐',
      recordId: person.id,
      status: person.current_status,
      lastUpdated: person.updated_at,
      verificationLevel: 'community',
    },
  ]

  for (const m of matches) {
    if (m.person.id === person.id) continue
    sources.push({
      platform: 'NODO',
      platformIcon: '🌐',
      recordId: m.person.id,
      status: m.person.current_status,
      lastUpdated: m.person.updated_at,
      verificationLevel: 'community',
    })
  }

  const bestScore = matches.length > 0 ? matches[0].score : 100

  return {
    primaryId: person.id,
    firstName: person.first_name,
    lastName: person.last_name,
    age: person.approximate_age,
    currentStatus: person.current_status,
    lastUpdated: person.updated_at,
    photoUrl: images[0] || person.photo_url || null,
    city: person.city,
    lastLocation: person.last_known_address || [person.sector, person.city].filter(Boolean).join(', ') || null,
    sources,
    matchCount: sources.length - 1,
    confidence: bestScore,
    timeline,
  }
}

// --- Status priority for choosing "most current" ---

const STATUS_PRIORITY: Record<string, number> = {
  safe: 1,
  reunited: 1,
  found: 2,
  hospitalized: 3,
  missing: 4,
  unknown: 5,
  deceased: 0,
}

export function getMostRecentStatus(sources: PersonSource[]): string {
  if (sources.length === 0) return 'unknown'
  const sorted = [...sources].sort((a, b) => {
    const timeDiff = new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
    if (timeDiff !== 0) return timeDiff
    return (STATUS_PRIORITY[a.status] ?? 5) - (STATUS_PRIORITY[b.status] ?? 5)
  })
  return sorted[0].status
}

// Future: merge profiles from multiple providers
// export function mergeProfiles(profiles: UnifiedProfile[]): UnifiedProfile { ... }
// Future: AI-powered profile consolidation
// export function consolidateWithAI(profiles: UnifiedProfile[]): Promise<UnifiedProfile> { ... }
// Future: photo-based matching
// export function matchByPhoto(photoUrl: string, candidates: UnifiedProfile[]): Promise<MatchCandidate[]> { ... }
