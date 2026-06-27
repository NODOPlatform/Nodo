import { signal } from '@preact/signals'
import { supabase } from '../lib/supabase'

export interface FeedItem {
  id: string
  icon: string
  text: string
  time: string
  created_at: string
}

export const feedItems = signal<FeedItem[]>([])
export const feedLoaded = signal(false)

function timeAgo(date: string): string {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 60000)
  if (diff < 1) return 'Ahora'
  if (diff < 60) return `Hace ${diff} min`
  const h = Math.floor(diff / 60)
  if (h < 24) return `Hace ${h}h`
  return `Hace ${Math.floor(h / 24)}d`
}

export async function loadFeed() {
  if (!supabase) return
  try {
    const cutoff = new Date(Date.now() - 6 * 3600000).toISOString()
    const [requests, offers, persons, incidents] = await Promise.all([
      supabase.from('help_requests').select('id, description, help_types, city, sector, created_at').gte('created_at', cutoff).order('created_at', { ascending: false }).limit(5),
      supabase.from('help_offers').select('id, offer_types, city, sector, created_at').gte('created_at', cutoff).order('created_at', { ascending: false }).limit(5),
      supabase.from('persons').select('id, first_name, is_found, city, created_at, updated_at').gte('updated_at', cutoff).order('updated_at', { ascending: false }).limit(3),
      supabase.from('points_of_interest').select('id, name, city, sector, created_at').eq('poi_type', 'incident').eq('is_active', true).gte('created_at', cutoff).order('created_at', { ascending: false }).limit(5),
    ])

    const items: FeedItem[] = []

    for (const r of requests.data ?? []) {
      const loc = [r.sector, r.city].filter(Boolean).join(', ')
      items.push({ id: `req-${r.id}`, icon: '🆘', text: `Solicitud de ayuda${loc ? ` en ${loc}` : ''}.`, time: timeAgo(r.created_at), created_at: r.created_at })
    }
    for (const o of offers.data ?? []) {
      const loc = [o.sector, o.city].filter(Boolean).join(', ')
      items.push({ id: `off-${o.id}`, icon: '❤️', text: `Oferta de ayuda publicada${loc ? ` en ${loc}` : ''}.`, time: timeAgo(o.created_at), created_at: o.created_at })
    }
    for (const p of persons.data ?? []) {
      if (p.is_found) {
        items.push({ id: `per-${p.id}`, icon: '👥', text: `Persona localizada${p.city ? ` en ${p.city}` : ''}.`, time: timeAgo(p.updated_at), created_at: p.updated_at })
      } else {
        items.push({ id: `per-${p.id}`, icon: '🔍', text: `Busqueda registrada: ${p.first_name}${p.city ? ` en ${p.city}` : ''}.`, time: timeAgo(p.created_at), created_at: p.created_at })
      }
    }
    for (const i of incidents.data ?? []) {
      const loc = [i.sector, i.city].filter(Boolean).join(', ')
      const name = i.name ? `${i.name}` : 'Incidente reportado'
      items.push({ id: `inc-${i.id}`, icon: '🚨', text: `${name}${loc ? ` en ${loc}` : ''}.`, time: timeAgo(i.created_at), created_at: i.created_at })
    }

    items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    feedItems.value = items.slice(0, 6)
    feedLoaded.value = true
  } catch { /* silent */ }
}
