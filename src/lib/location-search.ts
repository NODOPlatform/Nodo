import { supabase } from './supabase'

export interface SearchResult {
  id: string
  title: string
  subtitle: string
  icon: string
  lat: number
  lng: number
  source: 'nodo' | 'nominatim'
  type?: string
}

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

const TYPE_ICONS: Record<string, string> = {
  shelter: '🏠',
  help_request: '🆘',
  help_offer: '🤝',
  person: '👤',
  incident: '⚠️',
  protection: '🛡️',
  poi: '📍',
  hospital: '🏥',
  collection_center: '📦',
  health_request: '❤️',
}

let cachedNodoData: SearchResult[] = []
let cacheTime = 0
const CACHE_TTL = 30000

async function loadNodoData(): Promise<SearchResult[]> {
  if (Date.now() - cacheTime < CACHE_TTL && cachedNodoData.length > 0) return cachedNodoData

  const results: SearchResult[] = []

  if (supabase) {
    try {
      const cutoff24h = new Date(Date.now() - 24 * 3600000).toISOString()
      const cutoff72h = new Date(Date.now() - 72 * 3600000).toISOString()

      const [sheltersRes, poiRes, poiVerifiedRes, helpRes, offersRes, personsRes] = await Promise.all([
        supabase.from('shelters').select('id,name,address_text,city,latitude,longitude,status').eq('status', 'active').limit(200),
        supabase.from('points_of_interest').select('id,name,poi_type,city,sector,latitude,longitude').eq('is_active', true).eq('verified', false).gte('created_at', cutoff24h).limit(200),
        supabase.from('points_of_interest').select('id,name,poi_type,city,sector,latitude,longitude').eq('is_active', true).eq('verified', true).limit(200),
        supabase.from('help_requests').select('id,city,sector,latitude,longitude,help_types,description').neq('status', 'closed').gte('created_at', cutoff24h).limit(200),
        supabase.from('help_offers').select('id,city,sector,latitude,longitude,offer_types,description').neq('status', 'closed').gte('created_at', cutoff24h).limit(200),
        supabase.from('persons').select('id,first_name,last_name,city,sector,last_known_lat,last_known_lng').gte('created_at', cutoff72h).limit(200),
      ])

      sheltersRes.data?.forEach((s: Record<string, unknown>) => {
        if (s.latitude && s.longitude) {
          results.push({
            id: s.id as string, title: s.name as string,
            subtitle: [s.address_text, s.city].filter(Boolean).join(' · ') as string,
            icon: '🏠', lat: s.latitude as number, lng: s.longitude as number,
            source: 'nodo', type: 'shelter',
          })
        }
      })

      const allPois = [...(poiRes.data || []), ...(poiVerifiedRes.data || [])] as Record<string, unknown>[]
      const seenIds = new Set<string>()
      allPois.forEach((p) => {
        const pid = p.id as string
        if (seenIds.has(pid)) return
        seenIds.add(pid)
        if (p.latitude && p.longitude) {
          const t = p.poi_type as string
          results.push({
            id: pid, title: p.name as string,
            subtitle: [p.sector, p.city].filter(Boolean).join(' · ') as string,
            icon: TYPE_ICONS[t] || '📍', lat: p.latitude as number, lng: p.longitude as number,
            source: 'nodo', type: t,
          })
        }
      })

      helpRes.data?.forEach((r: Record<string, unknown>) => {
        if (r.latitude && r.longitude) {
          const desc = (r.description as string) || (r.help_types as string[] || []).join(', ') || 'Solicitud de ayuda'
          results.push({
            id: r.id as string, title: desc.slice(0, 60),
            subtitle: [r.sector, r.city].filter(Boolean).join(' · ') as string,
            icon: '🆘', lat: r.latitude as number, lng: r.longitude as number,
            source: 'nodo', type: 'help_request',
          })
        }
      })

      offersRes.data?.forEach((r: Record<string, unknown>) => {
        if (r.latitude && r.longitude) {
          const desc = (r.description as string) || (r.offer_types as string[] || []).join(', ') || 'Oferta de ayuda'
          results.push({
            id: r.id as string, title: desc.slice(0, 60),
            subtitle: [r.sector, r.city].filter(Boolean).join(' · ') as string,
            icon: '🤝', lat: r.latitude as number, lng: r.longitude as number,
            source: 'nodo', type: 'help_offer',
          })
        }
      })

      personsRes.data?.forEach((p: Record<string, unknown>) => {
        if (p.last_known_lat && p.last_known_lng) {
          const name = `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Persona'
          results.push({
            id: p.id as string, title: name,
            subtitle: [p.sector, p.city].filter(Boolean).join(' · ') as string,
            icon: '👤', lat: p.last_known_lat as number, lng: p.last_known_lng as number,
            source: 'nodo', type: 'person',
          })
        }
      })

      try {
        const campRes = await supabase.from('official_campaigns').select('id,title,campaign_type,locations').eq('status', 'active').limit(50)
        campRes.data?.forEach((c: Record<string, unknown>) => {
          const locs = (c.locations as Array<{ name: string; lat?: number; lng?: number }>) || []
          for (const loc of locs) {
            if (loc.lat && loc.lng) {
              results.push({
                id: c.id as string, title: c.title as string,
                subtitle: loc.name,
                icon: '📢', lat: loc.lat, lng: loc.lng,
                source: 'nodo', type: 'campaign',
              })
            }
          }
        })
      } catch {}
    } catch {}
  }

  cachedNodoData = results
  cacheTime = Date.now()
  return results
}

export async function searchNodo(query: string): Promise<SearchResult[]> {
  const q = normalize(query)
  if (q.length < 2) return []
  const data = await loadNodoData()
  return data
    .filter(r => normalize([r.title, r.subtitle].join(' ')).includes(q))
    .slice(0, 6)
}

export async function searchNominatim(query: string): Promise<SearchResult[]> {
  try {
    const q = encodeURIComponent(query + ' Venezuela')
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=5&countrycodes=ve&accept-language=es`,
      { headers: { 'User-Agent': 'NODO-Venezuela/1.0' } }
    )
    if (!res.ok) return []
    const data = await res.json() as Array<{ place_id: number; display_name: string; lat: string; lon: string }>
    return data.map(r => ({
      id: `nom-${r.place_id}`,
      title: r.display_name.split(',')[0],
      subtitle: r.display_name.split(',').slice(1, 3).join(',').trim(),
      icon: '🌐',
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lon),
      source: 'nominatim' as const,
    }))
  } catch {
    return []
  }
}

export async function searchAll(query: string): Promise<SearchResult[]> {
  const q = query.trim()
  if (q.length < 2) return []

  const nodoResults = await searchNodo(q)
  const extResults = await searchNominatim(q)

  const dedupedExt = extResults.filter(e =>
    !nodoResults.some(n => Math.abs(n.lat - e.lat) < 0.001 && Math.abs(n.lng - e.lng) < 0.001)
  )

  return [...nodoResults, ...dedupedExt]
}

export function invalidateCache() {
  cacheTime = 0
}
