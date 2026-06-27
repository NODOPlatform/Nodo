import { signal } from '@preact/signals'
import { supabase } from '../lib/supabase'
import { LABEL_ES, TYPE_ICONS, HEALTH_REQUEST_TYPES, CAMPAIGN_TYPES } from '../lib/constants'
import { seismicEvents } from './seismic'

export interface NationalFeedItem {
  id: string
  icon: string
  type: string
  typeLabel: string
  text: string
  location: string
  time: string
  created_at: string
  urgency?: string
  actionUrl?: string
  lat?: number
  lng?: number
  shareText?: string
}

export const nationalFeed = signal<NationalFeedItem[]>([])
export const nationalFeedLoaded = signal(false)
export const nationalFeedFilter = signal<string>('all')

function timeAgo(date: string): string {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 60000)
  if (diff < 1) return 'Ahora'
  if (diff < 60) return `Hace ${diff} min`
  const h = Math.floor(diff / 60)
  if (h < 24) return `Hace ${h}h`
  return `Hace ${Math.floor(h / 24)}d`
}

export async function loadNationalFeed() {
  if (!supabase) return
  try {
    const cutoff = new Date(Date.now() - 12 * 3600000).toISOString()
    const items: NationalFeedItem[] = []

    const [reqRes, offRes, perRes, incRes, healthRes, campRes, infoRes] = await Promise.all([
      supabase.from('help_requests').select('id,description,help_types,urgency,city,sector,latitude,longitude,created_at').gte('created_at', cutoff).order('created_at', { ascending: false }).limit(8),
      supabase.from('help_offers').select('id,offer_types,city,sector,latitude,longitude,created_at').gte('created_at', cutoff).order('created_at', { ascending: false }).limit(8),
      supabase.from('persons').select('id,first_name,last_name,is_found,city,sector,last_known_lat,last_known_lng,created_at,updated_at').gte('updated_at', cutoff).order('updated_at', { ascending: false }).limit(5),
      supabase.from('points_of_interest').select('id,name,poi_type,city,sector,latitude,longitude,created_at').eq('poi_type', 'incident').eq('is_active', true).gte('created_at', cutoff).order('created_at', { ascending: false }).limit(5),
      supabase.from('points_of_interest').select('id,name,poi_type,city,sector,latitude,longitude,metadata,created_at').eq('poi_type', 'health_request').eq('is_active', true).gte('created_at', cutoff).order('created_at', { ascending: false }).limit(5),
      supabase.from('official_campaigns').select('id,title,campaign_type,organization,locations,created_at').eq('status', 'active').order('created_at', { ascending: false }).limit(5),
      supabase.from('verified_info').select('id,title,category,source,created_at').eq('is_active', true).gte('created_at', cutoff).order('created_at', { ascending: false }).limit(5),
    ])

    for (const r of reqRes.data ?? []) {
      const types = (r.help_types as string[]) || []
      const loc = [r.sector, r.city].filter(Boolean).join(', ')
      items.push({
        id: `req-${r.id}`, icon: TYPE_ICONS[types[0]] || '🆘', type: 'help_request', typeLabel: 'Solicitud',
        text: `Se necesita: ${types.map(t => LABEL_ES[t] || t).join(', ')}`,
        location: loc || 'Sin ubicacion', time: timeAgo(r.created_at), created_at: r.created_at,
        urgency: r.urgency as string, actionUrl: `/mapa?lat=${r.latitude}&lng=${r.longitude}&zoom=16`,
        lat: r.latitude as number, lng: r.longitude as number,
        shareText: `🆘 Se necesita ayuda${loc ? ` en ${loc}` : ''}: ${types.map(t => LABEL_ES[t] || t).join(', ')}. Entra a nodoayuda.com para ayudar.`,
      })
    }

    for (const o of offRes.data ?? []) {
      const types = (o.offer_types as string[]) || []
      const loc = [o.sector, o.city].filter(Boolean).join(', ')
      items.push({
        id: `off-${o.id}`, icon: TYPE_ICONS[types[0]] || '🤝', type: 'help_offer', typeLabel: 'Oferta',
        text: `Ofrecen: ${types.map(t => LABEL_ES[t] || t).join(', ')}`,
        location: loc || 'Sin ubicacion', time: timeAgo(o.created_at), created_at: o.created_at,
        actionUrl: `/mapa?lat=${o.latitude}&lng=${o.longitude}&zoom=16`,
        lat: o.latitude as number, lng: o.longitude as number,
      })
    }

    for (const p of perRes.data ?? []) {
      const name = `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Persona'
      const loc = [p.sector, p.city].filter(Boolean).join(', ')
      if (p.is_found) {
        items.push({
          id: `pfound-${p.id}`, icon: '✅', type: 'person_found', typeLabel: 'Localizada',
          text: `${name} ha sido localizada`,
          location: loc || '', time: timeAgo(p.updated_at), created_at: p.updated_at,
          actionUrl: `/detalle/person/${p.id}`,
        })
      } else {
        items.push({
          id: `psearch-${p.id}`, icon: '🔍', type: 'person_search', typeLabel: 'Busqueda',
          text: `Se busca a ${name}`,
          location: loc || '', time: timeAgo(p.created_at), created_at: p.created_at,
          actionUrl: `/detalle/person/${p.id}`,
          shareText: `🔍 Se busca a ${name}${loc ? ` en ${loc}` : ''}. Si tienes informacion entra a nodoayuda.com`,
        })
      }
    }

    for (const i of incRes.data ?? []) {
      const loc = [i.sector, i.city].filter(Boolean).join(', ')
      items.push({
        id: `inc-${i.id}`, icon: '🚨', type: 'incident', typeLabel: 'Incidente',
        text: i.name as string || 'Incidente reportado',
        location: loc || '', time: timeAgo(i.created_at as string), created_at: i.created_at as string,
        actionUrl: `/mapa?lat=${i.latitude}&lng=${i.longitude}&zoom=16`,
        lat: i.latitude as number, lng: i.longitude as number,
      })
    }

    for (const h of healthRes.data ?? []) {
      const meta = (h.metadata || {}) as Record<string, unknown>
      const hType = meta.health_type as string || 'other'
      const ht = HEALTH_REQUEST_TYPES.find(t => t.value === hType)
      const loc = (meta.hospital_name as string) || [h.sector, h.city].filter(Boolean).join(', ')
      items.push({
        id: `health-${h.id}`, icon: ht?.icon || '❤️', type: 'health_request', typeLabel: 'Salud',
        text: ht?.label || 'Solicitud de salud',
        location: loc || '', time: timeAgo(h.created_at as string), created_at: h.created_at as string,
        urgency: meta.priority as string,
        actionUrl: `/mapa?lat=${h.latitude}&lng=${h.longitude}&zoom=16`,
        lat: h.latitude as number, lng: h.longitude as number,
        shareText: `❤️ ${ht?.label || 'Se necesita ayuda medica'}${loc ? ` en ${loc}` : ''}. Entra a nodoayuda.com`,
      })
    }

    for (const c of campRes.data ?? []) {
      const ct = CAMPAIGN_TYPES.find(t => t.value === c.campaign_type)
      const locs = (c.locations as Array<{ name: string }>) || []
      const locText = locs[0]?.name || ''
      items.push({
        id: `camp-${c.id}`, icon: ct?.icon || '📢', type: 'campaign', typeLabel: 'Campana',
        text: c.title as string,
        location: locText, time: timeAgo(c.created_at as string), created_at: c.created_at as string,
        actionUrl: `/campana/${c.id}`,
        shareText: `📢 ${c.title}${c.organization ? ` por ${c.organization}` : ''}${locText ? ` en ${locText}` : ''}. Detalles en nodoayuda.com`,
      })
    }

    for (const v of infoRes.data ?? []) {
      items.push({
        id: `info-${v.id}`, icon: '📋', type: 'verified_info', typeLabel: 'Info oficial',
        text: v.title as string,
        location: v.source as string || '', time: timeAgo(v.created_at as string), created_at: v.created_at as string,
        actionUrl: '/info',
      })
    }

    // Add seismic events
    for (const ev of seismicEvents.value.slice(0, 3)) {
      const ts = new Date(ev.time).toISOString()
      items.push({
        id: `seis-${ev.id}`, icon: '🌎', type: 'seismic', typeLabel: 'Sismo',
        text: `Sismo M${ev.magnitude.toFixed(1)}`,
        location: ev.place || 'Zona cercana', time: timeAgo(ts), created_at: ts,
      })
    }

    items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    nationalFeed.value = items.slice(0, 30)
    nationalFeedLoaded.value = true
  } catch (e) {
    console.error('[NationalFeed]', e)
  }
}
