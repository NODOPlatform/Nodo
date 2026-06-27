import { signal } from '@preact/signals'
import { supabase } from '../lib/supabase'
import { LABEL_ES, TYPE_ICONS, HEALTH_REQUEST_TYPES } from '../lib/constants'

// --- Types ---

export interface Insight {
  id: string
  icon: string
  text: string
  severity: 'info' | 'warning' | 'critical'
  category: 'trend' | 'gap' | 'match' | 'alert' | 'info'
  actionUrl?: string
}

export interface MatchSuggestion {
  needId: string
  needTitle: string
  needIcon: string
  needUrgency: string
  needLocation: string
  matches: MatchItem[]
  distance?: number
}

export interface MatchItem {
  type: 'offer' | 'shelter' | 'campaign' | 'center' | 'kitchen'
  icon: string
  title: string
  distance?: string
  actionUrl: string
}

export interface MissionData {
  icon: string
  title: string
  subtitle: string
  metric: string
  metricLabel: string
  color: string
  actionUrl: string
}

export interface TrendData {
  type: string
  label: string
  icon: string
  count: number
  prevCount: number
  changePercent: number
  direction: 'up' | 'down' | 'stable'
  city?: string
}

// --- Signals ---

export const insights = signal<Insight[]>([])
export const matchSuggestions = signal<MatchSuggestion[]>([])
export const missionOfTheDay = signal<MissionData | null>(null)
export const trends = signal<TrendData[]>([])
export const intelligenceLoaded = signal(false)
export const intelligenceLoading = signal(false)

// --- Haversine (shared logic, same as coordination.ts) ---

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function fmtDist(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`
  return `${km.toFixed(1)} km`
}

// --- Raw data types ---

interface RawRequest {
  id: string; latitude: number; longitude: number; help_types: string[]; urgency: string; city: string | null; sector: string | null; people_count: number | null; status: string; created_at: string
}
interface RawOffer {
  id: string; latitude: number; longitude: number; offer_types: string[]; city: string | null; sector: string | null; created_at: string
}
interface RawHealth {
  id: string; latitude: number; longitude: number; city: string | null; metadata: Record<string, unknown>; created_at: string
}
interface RawShelter {
  id: string; name: string; latitude: number; longitude: number; city: string | null; capacity: number; current_occupancy: number; status: string
}
interface RawCampaign {
  id: string; title: string; campaign_type: string; locations: Array<{ name: string; lat?: number; lng?: number }>; created_at: string
}

// --- Main load function ---

export async function loadIntelligence() {
  if (!supabase || intelligenceLoading.value) return
  intelligenceLoading.value = true

  try {
    const now = Date.now()
    const cutoff24h = new Date(now - 24 * 3600000).toISOString()
    const cutoff48h = new Date(now - 48 * 3600000).toISOString()
    const cutoff12h = new Date(now - 12 * 3600000).toISOString()

    const [reqRes, offerRes, healthRes, shelterRes, campRes, reqPrevRes, centerRes] = await Promise.all([
      supabase.from('help_requests').select('id,latitude,longitude,help_types,urgency,city,sector,people_count,status,created_at').in('status', ['pending', 'in_process']).gte('created_at', cutoff24h).limit(200),
      supabase.from('help_offers').select('id,latitude,longitude,offer_types,city,sector,created_at').eq('status', 'available').gte('created_at', cutoff24h).limit(200),
      supabase.from('points_of_interest').select('id,latitude,longitude,city,metadata,created_at').eq('poi_type', 'health_request').eq('is_active', true).gte('created_at', cutoff24h).limit(100),
      supabase.from('shelters').select('id,name,latitude,longitude,city,capacity,current_occupancy,status').eq('status', 'active').limit(100),
      supabase.from('official_campaigns').select('id,title,campaign_type,locations,created_at').eq('status', 'active').limit(50),
      supabase.from('help_requests').select('help_types,city').in('status', ['pending', 'in_process', 'attended']).gte('created_at', cutoff48h).lt('created_at', cutoff24h).limit(200),
      supabase.from('points_of_interest').select('id,latitude,longitude,city').eq('poi_type', 'collection_center').eq('is_active', true).limit(50),
    ])

    const requests = (reqRes.data || []) as RawRequest[]
    const offers = (offerRes.data || []) as RawOffer[]
    const healthReqs = (healthRes.data || []) as RawHealth[]
    const shelters = (shelterRes.data || []) as RawShelter[]
    const campaigns = (campRes.data || []) as RawCampaign[]
    const prevRequests = (reqPrevRes.data || []) as Array<{ help_types: string[]; city: string | null }>
    const centers = (centerRes.data || []) as Array<{ id: string; latitude: number; longitude: number; city: string | null }>

    // --- Compute trends ---
    const currentTrends = computeTrends(requests, prevRequests)
    trends.value = currentTrends

    // --- Compute insights ---
    const generatedInsights = generateInsights(requests, offers, healthReqs, shelters, campaigns, currentTrends)
    insights.value = generatedInsights

    // --- Compute matching ---
    const recentRequests = requests.filter(r => new Date(r.created_at).getTime() > new Date(cutoff12h).getTime())
    const generatedMatches = computeMatching(recentRequests, offers, shelters, campaigns, centers)
    matchSuggestions.value = generatedMatches.slice(0, 5)

    // --- Compute mission of the day ---
    missionOfTheDay.value = computeMission(requests, healthReqs, shelters, currentTrends)

    intelligenceLoaded.value = true
  } catch (e) {
    console.error('[Intelligence]', e)
  } finally {
    intelligenceLoading.value = false
  }
}

// --- Trends ---

function computeTrends(current: RawRequest[], prev: Array<{ help_types: string[]; city: string | null }>): TrendData[] {
  const currentCounts: Record<string, number> = {}
  const prevCounts: Record<string, number> = {}
  const cityCounts: Record<string, Record<string, number>> = {}

  for (const r of current) {
    for (const t of r.help_types || []) {
      currentCounts[t] = (currentCounts[t] || 0) + 1
      if (r.city) {
        if (!cityCounts[t]) cityCounts[t] = {}
        cityCounts[t][r.city] = (cityCounts[t][r.city] || 0) + 1
      }
    }
  }
  for (const r of prev) {
    for (const t of r.help_types || []) {
      prevCounts[t] = (prevCounts[t] || 0) + 1
    }
  }

  const allTypes = new Set([...Object.keys(currentCounts), ...Object.keys(prevCounts)])
  const trendList: TrendData[] = []

  for (const type of allTypes) {
    const count = currentCounts[type] || 0
    const prevCount = prevCounts[type] || 0
    if (count === 0 && prevCount === 0) continue

    const change = prevCount > 0 ? Math.round(((count - prevCount) / prevCount) * 100) : (count > 0 ? 100 : 0)
    const direction = change > 10 ? 'up' : change < -10 ? 'down' : 'stable'

    let topCity: string | undefined
    if (cityCounts[type]) {
      const cityEntries = Object.entries(cityCounts[type]).sort((a, b) => b[1] - a[1])
      if (cityEntries[0]) topCity = cityEntries[0][0]
    }

    trendList.push({
      type,
      label: LABEL_ES[type] || type,
      icon: TYPE_ICONS[type] || '📋',
      count,
      prevCount,
      changePercent: change,
      direction,
      city: topCity,
    })
  }

  return trendList.sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
}

// --- Insights ---

function generateInsights(
  requests: RawRequest[],
  offers: RawOffer[],
  health: RawHealth[],
  shelters: RawShelter[],
  campaigns: RawCampaign[],
  trendData: TrendData[],
): Insight[] {
  const list: Insight[] = []
  let id = 0

  // Trend-based insights
  for (const t of trendData.slice(0, 3)) {
    if (t.direction === 'up' && t.changePercent > 20) {
      list.push({
        id: `trend-${id++}`,
        icon: '📈',
        text: `Las solicitudes de ${t.label.toLowerCase()} aumentaron ${t.changePercent}%${t.city ? ` en ${t.city}` : ''}.`,
        severity: t.changePercent > 50 ? 'critical' : 'warning',
        category: 'trend',
        actionUrl: `/mapa?helpType=${t.type}`,
      })
    } else if (t.direction === 'down' && t.changePercent < -20) {
      list.push({
        id: `trend-${id++}`,
        icon: '📉',
        text: `Las solicitudes de ${t.label.toLowerCase()} disminuyeron ${Math.abs(t.changePercent)}%${t.city ? ` en ${t.city}` : ''}.`,
        severity: 'info',
        category: 'trend',
      })
    }
  }

  // Unattended blood requests
  const bloodUnattended = health.filter(h => {
    const meta = h.metadata || {}
    return meta.health_type === 'blood_donors' && meta.status !== 'resolved' && meta.status !== 'closed'
  })
  if (bloodUnattended.length > 0) {
    const byType: Record<string, number> = {}
    for (const h of bloodUnattended) {
      const bt = (h.metadata?.blood_type as string) || 'sin especificar'
      byType[bt] = (byType[bt] || 0) + 1
    }
    const topType = Object.entries(byType).sort((a, b) => b[1] - a[1])[0]
    list.push({
      id: `blood-${id++}`,
      icon: '🩸',
      text: `Hay ${bloodUnattended.length} solicitud${bloodUnattended.length > 1 ? 'es' : ''} de sangre${topType ? ` (${topType[1]} tipo ${topType[0]})` : ''} sin atender.`,
      severity: bloodUnattended.length >= 3 ? 'critical' : 'warning',
      category: 'gap',
      actionUrl: '/mapa?helpType=health_request',
    })
  }

  // Offers available
  const offerTypes: Record<string, number> = {}
  for (const o of offers) {
    for (const t of o.offer_types || []) {
      offerTypes[t] = (offerTypes[t] || 0) + 1
    }
  }
  const topOffers = Object.entries(offerTypes).sort((a, b) => b[1] - a[1]).slice(0, 2)
  if (topOffers.length > 0) {
    list.push({
      id: `offers-${id++}`,
      icon: '🤝',
      text: `Hay ${offers.length} persona${offers.length > 1 ? 's' : ''} ofreciendo ayuda: ${topOffers.map(([t, c]) => `${c} ${LABEL_ES[t] || t}`).join(', ')}.`,
      severity: 'info',
      category: 'match',
      actionUrl: '/mapa?helpType=help_offer',
    })
  }

  // Shelter capacity
  const totalCapacity = shelters.reduce((s, sh) => s + sh.capacity, 0)
  const totalOccupancy = shelters.reduce((s, sh) => s + sh.current_occupancy, 0)
  const availableSpots = totalCapacity - totalOccupancy
  if (shelters.length > 0) {
    list.push({
      id: `shelter-${id++}`,
      icon: '🏠',
      text: `Hay ${shelters.length} refugio${shelters.length > 1 ? 's' : ''} activo${shelters.length > 1 ? 's' : ''}${availableSpots > 0 ? ` con ${availableSpots} cupos disponibles` : ''}.`,
      severity: availableSpots < 10 ? 'warning' : 'info',
      category: 'info',
      actionUrl: '/refugios',
    })
  }

  // Active campaigns
  if (campaigns.length > 0) {
    list.push({
      id: `camp-${id++}`,
      icon: '📢',
      text: `${campaigns.length} campana${campaigns.length > 1 ? 's' : ''} activa${campaigns.length > 1 ? 's' : ''}: ${campaigns.slice(0, 2).map(c => c.title).join(', ')}${campaigns.length > 2 ? '...' : ''}.`,
      severity: 'info',
      category: 'match',
      actionUrl: '/campanas',
    })
  }

  // High urgency requests without attention
  const criticalRequests = requests.filter(r => r.urgency === 'critical' && r.status === 'pending')
  if (criticalRequests.length > 0) {
    list.push({
      id: `critical-${id++}`,
      icon: '🔴',
      text: `${criticalRequests.length} solicitud${criticalRequests.length > 1 ? 'es' : ''} critica${criticalRequests.length > 1 ? 's' : ''} pendiente${criticalRequests.length > 1 ? 's' : ''} de atencion.`,
      severity: 'critical',
      category: 'gap',
      actionUrl: '/mapa?helpType=help_request',
    })
  }

  return list.sort((a, b) => {
    const sev = { critical: 3, warning: 2, info: 1 }
    return (sev[b.severity] || 0) - (sev[a.severity] || 0)
  })
}

// --- Matching ---

function computeMatching(
  requests: RawRequest[],
  offers: RawOffer[],
  shelters: RawShelter[],
  campaigns: RawCampaign[],
  centers: Array<{ id: string; latitude: number; longitude: number; city: string | null }>,
): MatchSuggestion[] {
  const results: MatchSuggestion[] = []

  const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 }
  const sorted = [...requests].sort((a, b) => (urgencyOrder[a.urgency as keyof typeof urgencyOrder] ?? 2) - (urgencyOrder[b.urgency as keyof typeof urgencyOrder] ?? 2))

  for (const req of sorted.slice(0, 10)) {
    const reqTypes = new Set(req.help_types || [])
    const matchItems: MatchItem[] = []

    // Match offers
    for (const off of offers) {
      const offTypes = off.offer_types || []
      const overlap = offTypes.some(t => reqTypes.has(t))
      if (!overlap) continue
      const dist = haversine(req.latitude, req.longitude, off.latitude, off.longitude)
      if (dist > 30) continue
      matchItems.push({
        type: 'offer',
        icon: '🤝',
        title: `Voluntario ofrece ${offTypes.map(t => LABEL_ES[t] || t).join(', ')}`,
        distance: fmtDist(dist),
        actionUrl: `/mapa?lat=${off.latitude}&lng=${off.longitude}&zoom=16`,
      })
    }

    // Match shelters
    if (reqTypes.has('shelter')) {
      for (const sh of shelters) {
        const dist = haversine(req.latitude, req.longitude, sh.latitude, sh.longitude)
        if (dist > 20) continue
        matchItems.push({
          type: 'shelter',
          icon: '🏠',
          title: sh.name,
          distance: fmtDist(dist),
          actionUrl: `/refugios`,
        })
      }
    }

    // Match campaigns
    for (const camp of campaigns) {
      for (const loc of camp.locations || []) {
        if (!loc.lat || !loc.lng) continue
        const dist = haversine(req.latitude, req.longitude, loc.lat, loc.lng)
        if (dist > 30) continue
        matchItems.push({
          type: 'campaign',
          icon: '📢',
          title: camp.title,
          distance: fmtDist(dist),
          actionUrl: `/campana/${camp.id}`,
        })
      }
    }

    // Match collection centers
    if (reqTypes.has('food') || reqTypes.has('water') || reqTypes.has('medicine')) {
      for (const c of centers) {
        const dist = haversine(req.latitude, req.longitude, c.latitude, c.longitude)
        if (dist > 15) continue
        matchItems.push({
          type: 'center',
          icon: '📦',
          title: 'Centro de acopio',
          distance: fmtDist(dist),
          actionUrl: `/centros-acopio`,
        })
      }
    }

    if (matchItems.length > 0) {
      const typesLabel = (req.help_types || []).map(t => LABEL_ES[t] || t).join(', ')
      results.push({
        needId: req.id,
        needTitle: `Se necesita: ${typesLabel}`,
        needIcon: TYPE_ICONS[(req.help_types || [])[0]] || '🆘',
        needUrgency: req.urgency,
        needLocation: [req.sector, req.city].filter(Boolean).join(', ') || 'Sin ubicacion',
        matches: matchItems.sort((a, b) => {
          const dA = parseFloat(a.distance?.replace(/[^\d.]/g, '') || '999')
          const dB = parseFloat(b.distance?.replace(/[^\d.]/g, '') || '999')
          return dA - dB
        }).slice(0, 4),
      })
    }
  }

  return results
}

// --- Mission of the Day ---

function computeMission(
  requests: RawRequest[],
  health: RawHealth[],
  _shelters: RawShelter[],
  trendData: TrendData[],
): MissionData {
  // Check blood requests first (highest impact)
  const bloodReqs = health.filter(h => {
    const meta = h.metadata || {}
    return meta.health_type === 'blood_donors' && meta.status !== 'resolved' && meta.status !== 'closed'
  })
  const totalDonorsNeeded = bloodReqs.reduce((s, h) => {
    const meta = h.metadata || {}
    const needed = (meta.donor_count as number) || 0
    const confirmed = (meta.donors_confirmed as number) || 0
    return s + Math.max(0, needed - confirmed)
  }, 0)

  if (totalDonorsNeeded >= 5) {
    return {
      icon: '🩸',
      title: 'Donacion de sangre',
      subtitle: `Se necesitan ${totalDonorsNeeded} donantes urgentemente.`,
      metric: String(totalDonorsNeeded),
      metricLabel: 'donantes necesarios',
      color: '#dc2626',
      actionUrl: '/mapa?helpType=health_request',
    }
  }

  // Check top trending need
  const topTrend = trendData.find(t => t.direction === 'up' && t.count >= 3)
  if (topTrend) {
    return {
      icon: topTrend.icon,
      title: topTrend.label,
      subtitle: `${topTrend.count} solicitudes activas${topTrend.city ? ` en ${topTrend.city}` : ''}.${topTrend.changePercent > 0 ? ` Aumento del ${topTrend.changePercent}%.` : ''}`,
      metric: String(topTrend.count),
      metricLabel: 'solicitudes activas',
      color: '#f59e0b',
      actionUrl: `/mapa?helpType=${topTrend.type}`,
    }
  }

  // Check people count
  const totalPeople = requests.reduce((s, r) => s + (r.people_count || 1), 0)
  const topType = requests.length > 0
    ? (() => {
        const counts: Record<string, number> = {}
        for (const r of requests) { for (const t of r.help_types || []) { counts[t] = (counts[t] || 0) + 1 } }
        return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
      })()
    : null

  if (topType && topType[1] >= 2) {
    const ht = HEALTH_REQUEST_TYPES.find(h => h.value === topType[0])
    return {
      icon: TYPE_ICONS[topType[0]] || '🆘',
      title: LABEL_ES[topType[0]] || topType[0],
      subtitle: `${topType[1]} solicitudes activas que afectan a ${totalPeople} persona${totalPeople > 1 ? 's' : ''}.`,
      metric: String(topType[1]),
      metricLabel: 'solicitudes',
      color: ht ? '#e11d48' : '#f59e0b',
      actionUrl: `/mapa?helpType=${topType[0]}`,
    }
  }

  return {
    icon: '🤝',
    title: 'Solidaridad activa',
    subtitle: 'La comunidad esta coordinandose para ayudar.',
    metric: String(requests.length),
    metricLabel: 'solicitudes activas',
    color: '#10b981',
    actionUrl: '/mapa',
  }
}
