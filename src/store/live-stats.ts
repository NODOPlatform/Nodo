import { signal } from '@preact/signals'
import { supabase } from '../lib/supabase'

export interface LiveStatData {
  requests: number
  offers: number
  attended: number
  shelters: number
  incidents: number
  personsFound: number
  collectionCenters: number
  healthRequests: number
  campaigns: number
}

export const liveStats = signal<LiveStatData>({ requests: 0, offers: 0, attended: 0, shelters: 0, incidents: 0, personsFound: 0, collectionCenters: 0, healthRequests: 0, campaigns: 0 })
export const statsLoaded = signal(false)

export async function loadLiveStats() {
  if (!supabase) return
  const cutoff = new Date(Date.now() - 24 * 3600000).toISOString()
  try {
    const [r, o, a, inc, pf, sh, cc, hr, cp] = await Promise.all([
      supabase.from('help_requests').select('*', { count: 'exact', head: true }).in('status', ['pending', 'in_process']).gte('created_at', cutoff),
      supabase.from('help_offers').select('*', { count: 'exact', head: true }).eq('status', 'available').gte('created_at', cutoff),
      supabase.from('help_requests').select('*', { count: 'exact', head: true }).eq('status', 'attended').gte('created_at', cutoff),
      supabase.from('points_of_interest').select('*', { count: 'exact', head: true }).eq('poi_type', 'incident').eq('is_active', true).gte('created_at', cutoff),
      supabase.from('persons').select('*', { count: 'exact', head: true }).eq('is_found', true),
      supabase.from('shelters').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('points_of_interest').select('*', { count: 'exact', head: true }).eq('poi_type', 'collection_center').eq('is_active', true),
      supabase.from('points_of_interest').select('*', { count: 'exact', head: true }).eq('poi_type', 'health_request').eq('is_active', true).gte('created_at', cutoff),
      supabase.from('official_campaigns').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    ])
    liveStats.value = {
      requests: r.count ?? 0,
      offers: o.count ?? 0,
      attended: a.count ?? 0,
      shelters: sh.count ?? 0,
      incidents: inc.count ?? 0,
      personsFound: pf.count ?? 0,
      collectionCenters: cc.count ?? 0,
      healthRequests: hr.count ?? 0,
      campaigns: cp?.count ?? 0,
    }
    statsLoaded.value = true
  } catch { /* silent */ }
}
