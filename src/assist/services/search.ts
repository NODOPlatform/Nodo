import { getSupabase } from './supabase'
import { ASSIST_CONFIG } from '../config'

export interface SearchItem {
  id: string
  title: string
  subtitle: string
  icon: string
  lat?: number
  lng?: number
  distance?: number
  extra?: Record<string, unknown>
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function sortByDistance(items: SearchItem[], userLat?: number, userLng?: number): SearchItem[] {
  if (!userLat || !userLng) return items
  return items
    .map(item => ({
      ...item,
      distance: item.lat && item.lng ? haversine(userLat, userLng, item.lat, item.lng) : undefined,
    }))
    .filter(item => !item.distance || item.distance <= ASSIST_CONFIG.searchRadius)
    .sort((a, b) => (a.distance ?? 999) - (b.distance ?? 999))
}

export async function searchPersons(query: string): Promise<SearchItem[]> {
  const sb = getSupabase()
  if (!sb) return []

  const q = query.toLowerCase().trim()
  const res = await sb.from('persons').select('id,first_name,last_name,city,sector,current_status,is_found,last_known_lat,last_known_lng').limit(20)

  if (!res.data) return []

  return res.data
    .filter(p => {
      const name = `${p.first_name || ''} ${p.last_name || ''}`.toLowerCase()
      return name.includes(q) || q.split(' ').some((w: string) => name.includes(w))
    })
    .slice(0, ASSIST_CONFIG.maxResults)
    .map(p => ({
      id: p.id,
      title: `${p.first_name || ''} ${p.last_name || ''}`.trim(),
      subtitle: [p.is_found ? 'Encontrada' : 'Desaparecida', p.city].filter(Boolean).join(' · '),
      icon: p.is_found ? '✅' : '🔍',
      lat: p.last_known_lat,
      lng: p.last_known_lng,
      extra: { status: p.current_status, is_found: p.is_found },
    }))
}

export async function searchShelters(userLat?: number, userLng?: number): Promise<SearchItem[]> {
  const sb = getSupabase()
  if (!sb) return []

  const res = await sb.from('shelters').select('id,name,address_text,city,latitude,longitude,capacity,current_occupancy,status,phone').eq('status', 'active').limit(50)

  if (!res.data) return []

  const items: SearchItem[] = res.data.map(s => ({
    id: s.id,
    title: s.name,
    subtitle: [s.address_text, s.city].filter(Boolean).join(' · '),
    icon: '🏠',
    lat: s.latitude,
    lng: s.longitude,
    extra: { capacity: s.capacity, occupancy: s.current_occupancy, phone: s.phone },
  }))

  return sortByDistance(items, userLat, userLng).slice(0, ASSIST_CONFIG.maxResults)
}

export async function searchHospitals(userLat?: number, userLng?: number): Promise<SearchItem[]> {
  const sb = getSupabase()
  if (!sb) return []

  const res = await sb.from('points_of_interest').select('id,name,city,latitude,longitude,metadata').in('poi_type', ['hospital', 'medical_center']).eq('is_active', true).limit(50)

  if (!res.data) return []

  const items: SearchItem[] = res.data.map(h => ({
    id: h.id,
    title: h.name,
    subtitle: h.city || '',
    icon: '🏥',
    lat: h.latitude,
    lng: h.longitude,
    extra: h.metadata as Record<string, unknown>,
  }))

  return sortByDistance(items, userLat, userLng).slice(0, ASSIST_CONFIG.maxResults)
}

export async function searchCollectionCenters(userLat?: number, userLng?: number): Promise<SearchItem[]> {
  const sb = getSupabase()
  if (!sb) return []

  const res = await sb.from('points_of_interest').select('id,name,city,latitude,longitude,metadata').eq('poi_type', 'collection_center').eq('is_active', true).limit(50)

  if (!res.data) return []

  const items: SearchItem[] = res.data.map(c => ({
    id: c.id,
    title: c.name,
    subtitle: c.city || '',
    icon: '📦',
    lat: c.latitude,
    lng: c.longitude,
  }))

  return sortByDistance(items, userLat, userLng).slice(0, ASSIST_CONFIG.maxResults)
}

export async function searchCampaigns(): Promise<SearchItem[]> {
  const sb = getSupabase()
  if (!sb) return []

  const res = await sb.from('official_campaigns').select('id,title,campaign_type,organization,locations,start_date,end_date').eq('status', 'active').limit(20)

  if (!res.data) return []

  return res.data.slice(0, ASSIST_CONFIG.maxResults).map(c => {
    const locs = (c.locations as Array<{ name: string; lat?: number; lng?: number }>) || []
    const firstLoc = locs[0]
    return {
      id: c.id,
      title: c.title,
      subtitle: [c.organization, firstLoc?.name].filter(Boolean).join(' · '),
      icon: '📢',
      lat: firstLoc?.lat,
      lng: firstLoc?.lng,
      extra: { type: c.campaign_type, start: c.start_date, end: c.end_date },
    }
  })
}

export async function searchHealthRequests(bloodType?: string, userLat?: number, userLng?: number): Promise<SearchItem[]> {
  const sb = getSupabase()
  if (!sb) return []

  const cutoff = new Date(Date.now() - 48 * 3600000).toISOString()
  const res = await sb.from('points_of_interest').select('id,name,city,latitude,longitude,metadata').eq('poi_type', 'health_request').eq('is_active', true).gte('created_at', cutoff).limit(50)

  if (!res.data) return []

  let filtered = res.data
  if (bloodType) {
    filtered = filtered.filter(h => {
      const meta = h.metadata as Record<string, unknown>
      return meta?.blood_type === bloodType
    })
  }

  const items: SearchItem[] = filtered.map(h => {
    const meta = (h.metadata || {}) as Record<string, unknown>
    const bt = meta.blood_type as string || ''
    const donors = meta.donor_count as number || 0
    const hospital = meta.hospital_name as string || ''
    return {
      id: h.id,
      title: hospital || h.name || 'Solicitud de sangre',
      subtitle: [bt ? `Tipo ${bt}` : '', donors ? `${donors} donantes` : '', h.city].filter(Boolean).join(' · '),
      icon: '🩸',
      lat: h.latitude,
      lng: h.longitude,
      extra: meta,
    }
  })

  return sortByDistance(items, userLat, userLng).slice(0, ASSIST_CONFIG.maxResults)
}

export async function searchVerifiedInfo(): Promise<SearchItem[]> {
  const sb = getSupabase()
  if (!sb) return []

  const res = await sb.from('verified_info').select('id,title,content,category,source,is_pinned').eq('is_active', true).order('is_pinned', { ascending: false }).order('created_at', { ascending: false }).limit(ASSIST_CONFIG.maxResults)

  if (!res.data) return []

  return res.data.map(v => ({
    id: v.id,
    title: v.title,
    subtitle: [v.source, v.category].filter(Boolean).join(' · '),
    icon: v.is_pinned ? '📌' : '📰',
    extra: { content: v.content },
  }))
}
