import { getSupabase } from './supabase'

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export interface MatchResult {
  type: 'offer' | 'shelter' | 'campaign' | 'center'
  title: string
  distance: number
  lat: number
  lng: number
  details?: string
}

export async function findMatches(
  helpTypes: string[],
  lat: number,
  lng: number,
  radius: number = 30
): Promise<MatchResult[]> {
  const sb = getSupabase()
  if (!sb) return []

  const results: MatchResult[] = []
  const cutoff = new Date(Date.now() - 48 * 3600000).toISOString()

  const [offersRes, sheltersRes, centersRes] = await Promise.all([
    sb.from('help_offers').select('id,offer_types,city,latitude,longitude,contact_name').neq('status', 'closed').gte('created_at', cutoff).limit(100),
    helpTypes.includes('shelter')
      ? sb.from('shelters').select('id,name,latitude,longitude,capacity,current_occupancy').eq('status', 'active').limit(50)
      : Promise.resolve({ data: [] }),
    helpTypes.some(t => ['food', 'water', 'medicine'].includes(t))
      ? sb.from('points_of_interest').select('id,name,latitude,longitude').eq('poi_type', 'collection_center').eq('is_active', true).limit(50)
      : Promise.resolve({ data: [] }),
  ])

  offersRes.data?.forEach((o: Record<string, unknown>) => {
    if (!o.latitude || !o.longitude) return
    const dist = haversine(lat, lng, o.latitude as number, o.longitude as number)
    if (dist > radius) return
    const types = (o.offer_types as string[]) || []
    if (helpTypes.some(t => types.includes(t))) {
      results.push({
        type: 'offer',
        title: (o.contact_name as string) || 'Voluntario',
        distance: Math.round(dist * 10) / 10,
        lat: o.latitude as number,
        lng: o.longitude as number,
        details: types.join(', '),
      })
    }
  })

  const shelterData = sheltersRes.data as Record<string, unknown>[] | null
  shelterData?.forEach((s) => {
    if (!s.latitude || !s.longitude) return
    const dist = haversine(lat, lng, s.latitude as number, s.longitude as number)
    if (dist > radius) return
    const available = (s.capacity as number || 0) - (s.current_occupancy as number || 0)
    if (available > 0) {
      results.push({
        type: 'shelter',
        title: s.name as string,
        distance: Math.round(dist * 10) / 10,
        lat: s.latitude as number,
        lng: s.longitude as number,
        details: `${available} cupos disponibles`,
      })
    }
  })

  const centerData = centersRes.data as Record<string, unknown>[] | null
  centerData?.forEach((c) => {
    if (!c.latitude || !c.longitude) return
    const dist = haversine(lat, lng, c.latitude as number, c.longitude as number)
    if (dist > radius) return
    results.push({
      type: 'center',
      title: c.name as string,
      distance: Math.round(dist * 10) / 10,
      lat: c.latitude as number,
      lng: c.longitude as number,
    })
  })

  return results.sort((a, b) => a.distance - b.distance).slice(0, 5)
}
