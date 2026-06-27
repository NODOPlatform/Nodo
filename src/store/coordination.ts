import { signal } from '@preact/signals'
import { supabase } from '../lib/supabase'
import { LABEL_ES, TYPE_ICONS, HEALTH_REQUEST_TYPES, CAMPAIGN_TYPES } from '../lib/constants'

export interface NearbyNeed {
  id: string
  icon: string
  title: string
  location: string
  distance: number
  distanceText: string
  urgency: 'critical' | 'high' | 'medium' | 'low'
  urgencyLabel: string
  urgencyColor: string
  type: string
  lat: number
  lng: number
  createdAt: string
  score: number
  contact_whatsapp?: string | null
  blood_type?: string | null
  donor_count?: number | null
  donors_confirmed?: number | null
}

export const nearbyNeeds = signal<NearbyNeed[]>([])
export const coordinationLoading = signal(false)
export const coordinationLoaded = signal(false)
export const userLocation = signal<{ lat: number; lng: number } | null>(null)

const URGENCY_MAP: Record<string, { label: string; color: string; weight: number }> = {
  critical: { label: 'Critica', color: '#dc2626', weight: 4 },
  high: { label: 'Alta', color: '#f97316', weight: 3 },
  medium: { label: 'Media', color: '#eab308', weight: 2 },
  low: { label: 'Baja', color: '#22c55e', weight: 1 },
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`
  return `${km.toFixed(1)} km`
}

function computeScore(distKm: number, urgencyWeight: number, ageMinutes: number): number {
  const distScore = Math.max(0, 1 - distKm / 50)
  const urgScore = urgencyWeight / 4
  const ageScore = Math.max(0, 1 - ageMinutes / (24 * 60))
  return distScore * 0.4 + urgScore * 0.35 + ageScore * 0.25
}

export async function loadNearbyNeeds(lat: number, lng: number) {
  if (!supabase || coordinationLoading.value) return
  userLocation.value = { lat, lng }
  coordinationLoading.value = true

  try {
    const cutoff = new Date(Date.now() - 48 * 3600000).toISOString()
    const now = Date.now()

    const [helpRes, healthRes, offerRes, campRes] = await Promise.all([
      supabase.from('help_requests').select('id, latitude, longitude, help_types, urgency, status, city, sector, description, created_at')
        .in('status', ['pending', 'in_process']).gte('created_at', cutoff),
      supabase.from('points_of_interest').select('id, name, latitude, longitude, city, sector, description, metadata, created_at')
        .eq('poi_type', 'health_request').eq('is_active', true).gte('created_at', cutoff),
      supabase.from('help_offers').select('id, latitude, longitude, offer_types, city, sector, description, created_at')
        .eq('status', 'available').gte('created_at', cutoff),
      supabase.from('official_campaigns').select('id, title, campaign_type, organization, locations, opening_hours, end_date, created_at')
        .eq('status', 'active'),
    ])

    const needs: NearbyNeed[] = []

    if (helpRes.data) {
      for (const r of helpRes.data) {
        const dist = haversine(lat, lng, r.latitude, r.longitude)
        if (dist > 50) continue
        const urg = r.urgency as string || 'medium'
        const urgCfg = URGENCY_MAP[urg] || URGENCY_MAP.medium
        const ageMin = (now - new Date(r.created_at).getTime()) / 60000
        const types = (r.help_types as string[]) || []
        const mainType = types[0] || 'other'
        const icon = TYPE_ICONS[mainType] || '🆘'
        const label = types.map(t => LABEL_ES[t] || t).join(', ')

        needs.push({
          id: r.id,
          icon,
          title: `Se necesita: ${label}`,
          location: [r.sector, r.city].filter(Boolean).join(', ') || 'Ubicacion no especificada',
          distance: dist,
          distanceText: formatDistance(dist),
          urgency: urg as NearbyNeed['urgency'],
          urgencyLabel: urgCfg.label,
          urgencyColor: urgCfg.color,
          type: 'help_request',
          lat: r.latitude,
          lng: r.longitude,
          createdAt: r.created_at,
          score: computeScore(dist, urgCfg.weight, ageMin),
        })
      }
    }

    if (healthRes.data) {
      for (const r of healthRes.data) {
        const dist = haversine(lat, lng, r.latitude, r.longitude)
        if (dist > 50) continue
        const meta = (r.metadata || {}) as Record<string, unknown>
        const hType = meta.health_type as string || 'other'
        const ht = HEALTH_REQUEST_TYPES.find(t => t.value === hType)
        const status = meta.status as string
        if (status === 'resolved' || status === 'closed') continue
        const ageMin = (now - new Date(r.created_at).getTime()) / 60000
        const urgCfg = URGENCY_MAP[meta.priority as string || 'high']

        needs.push({
          id: r.id,
          icon: ht?.icon || '❤️',
          title: ht?.label || 'Solicitud de salud',
          location: (meta.hospital_name as string) || [r.sector, r.city].filter(Boolean).join(', ') || 'Sin ubicacion',
          distance: dist,
          distanceText: formatDistance(dist),
          urgency: (meta.priority as NearbyNeed['urgency']) || 'high',
          urgencyLabel: urgCfg.label,
          urgencyColor: urgCfg.color,
          type: 'health_request',
          lat: r.latitude,
          lng: r.longitude,
          createdAt: r.created_at,
          score: computeScore(dist, urgCfg.weight, ageMin),
          contact_whatsapp: meta.contact_whatsapp as string | null,
          blood_type: meta.blood_type as string | null,
          donor_count: meta.donor_count as number | null,
          donors_confirmed: meta.donors_confirmed as number | null,
        })
      }
    }

    if (offerRes.data) {
      for (const r of offerRes.data) {
        const dist = haversine(lat, lng, r.latitude, r.longitude)
        if (dist > 30) continue
        const ageMin = (now - new Date(r.created_at).getTime()) / 60000
        const types = (r.offer_types as string[]) || []
        const mainType = types[0] || 'other'
        const icon = TYPE_ICONS[mainType] || '🤝'
        const label = types.map(t => LABEL_ES[t] || t).join(', ')

        needs.push({
          id: r.id,
          icon,
          title: `Ofrecen: ${label}`,
          location: [r.sector, r.city].filter(Boolean).join(', ') || 'Ubicacion no especificada',
          distance: dist,
          distanceText: formatDistance(dist),
          urgency: 'low',
          urgencyLabel: 'Oferta',
          urgencyColor: '#22c55e',
          type: 'help_offer',
          lat: r.latitude,
          lng: r.longitude,
          createdAt: r.created_at,
          score: computeScore(dist, 1, ageMin) * 0.7,
        })
      }
    }

    const campData = (campRes?.data || []) as Array<Record<string, unknown>>
    for (const c of campData) {
      const locs = (c.locations as Array<{ name: string; lat?: number; lng?: number }>) || []
      const ct = CAMPAIGN_TYPES.find(t => t.value === c.campaign_type)
      const ageMin = (now - new Date(c.created_at as string).getTime()) / 60000
      const endDate = c.end_date as string | null
      const hoursText = c.opening_hours as string | null
      const isActive = !endDate || new Date(endDate + 'T23:59:59') >= new Date()
      if (!isActive) continue

      for (const loc of locs) {
        if (!loc.lat || !loc.lng) continue
        const dist = haversine(lat, lng, loc.lat, loc.lng)
        if (dist > 50) continue

        needs.push({
          id: c.id as string,
          icon: ct?.icon || '📢',
          title: c.title as string,
          location: `${loc.name}${hoursText ? ` · ${hoursText}` : ''}`,
          distance: dist,
          distanceText: formatDistance(dist),
          urgency: 'medium',
          urgencyLabel: 'Campana',
          urgencyColor: '#8b5cf6',
          type: 'campaign',
          lat: loc.lat,
          lng: loc.lng,
          createdAt: c.created_at as string,
          score: computeScore(dist, 2.5, ageMin) * 0.85,
        })
      }
    }

    needs.sort((a, b) => b.score - a.score)
    nearbyNeeds.value = needs.slice(0, 20)
    coordinationLoaded.value = true
  } catch (e) {
    console.error('[Coordination]', e)
  } finally {
    coordinationLoading.value = false
  }
}
