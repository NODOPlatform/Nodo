import type { EntityType, FederatedResult } from './connector-types'

function clean(s: string | null | undefined): string | null {
  if (!s) return null
  const trimmed = s.trim()
  return trimmed.length > 0 ? trimmed : null
}

function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null
  const digits = raw.replace(/\D/g, '')
  return digits.length >= 7 ? digits : null
}

function normalizeName(raw: string | null | undefined): string {
  if (!raw) return ''
  return raw.trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\p{L}\s'-]/gu, '')
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}

function normalizeStatus(raw: string | null | undefined): string {
  if (!raw) return 'unknown'
  const s = raw.toLowerCase().trim()
  const map: Record<string, string> = {
    'encontrado': 'found', 'found': 'found', 'localizado': 'found',
    'desaparecido': 'missing', 'missing': 'missing', 'perdido': 'missing',
    'hospitalizado': 'hospitalized', 'hospitalized': 'hospitalized', 'internado': 'hospitalized',
    'seguro': 'safe', 'safe': 'safe', 'a salvo': 'safe',
    'fallecido': 'deceased', 'deceased': 'deceased',
    'reunido': 'reunited', 'reunited': 'reunited',
  }
  return map[s] || 'unknown'
}

function parseAge(raw: unknown): number | null {
  if (raw === null || raw === undefined) return null
  const n = typeof raw === 'number' ? raw : parseInt(String(raw), 10)
  return !isNaN(n) && n > 0 && n < 150 ? n : null
}

export interface RawExternalRecord {
  id?: string
  name?: string
  firstName?: string
  first_name?: string
  nombre?: string
  lastName?: string
  last_name?: string
  apellido?: string
  age?: unknown
  edad?: unknown
  status?: string
  estado?: string
  city?: string
  ciudad?: string
  location?: string
  ubicacion?: string
  lastLocation?: string
  ultima_ubicacion?: string
  photo?: string
  photoUrl?: string
  foto?: string
  phone?: string
  telefono?: string
  description?: string
  descripcion?: string
  url?: string
  sourceUrl?: string
  [key: string]: unknown
}

export function normalizeRecord(raw: RawExternalRecord, providerId: string, providerName: string, entityType: EntityType = 'person'): FederatedResult {
  let firstName = raw.firstName || raw.first_name || raw.nombre || ''
  let lastName = raw.lastName || raw.last_name || raw.apellido || ''

  if (!firstName && raw.name) {
    const parts = raw.name.trim().split(/\s+/)
    firstName = parts[0] || ''
    lastName = parts.slice(1).join(' ')
  }

  return {
    id: raw.id || `${providerId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    providerId,
    providerName,
    entityType,
    firstName: normalizeName(firstName),
    lastName: normalizeName(lastName),
    age: parseAge(raw.age ?? raw.edad),
    status: normalizeStatus(raw.status || raw.estado),
    city: clean(raw.city || raw.ciudad) ,
    lastLocation: clean(raw.location || raw.ubicacion || raw.lastLocation || raw.ultima_ubicacion),
    photoUrl: clean(raw.photo || raw.photoUrl || raw.foto),
    phone: normalizePhone(raw.phone || raw.telefono),
    description: clean(raw.description || raw.descripcion),
    sourceUrl: clean(raw.url || raw.sourceUrl),
    retrievedAt: new Date().toISOString(),
    metadata: raw.metadata as Record<string, unknown> | undefined,
    raw,
  }
}

export function normalizeMany(records: RawExternalRecord[], providerId: string, providerName: string, entityType: EntityType = 'person'): FederatedResult[] {
  return records.map(r => normalizeRecord(r, providerId, providerName, entityType))
}

export function deduplicateResults(results: FederatedResult[]): FederatedResult[] {
  const seen = new Map<string, FederatedResult>()

  for (const r of results) {
    const key = `${r.firstName.toLowerCase()}::${r.lastName.toLowerCase()}::${r.providerId}`
    const existing = seen.get(key)
    if (!existing || new Date(r.retrievedAt) > new Date(existing.retrievedAt)) {
      seen.set(key, r)
    }
  }

  return Array.from(seen.values())
}
