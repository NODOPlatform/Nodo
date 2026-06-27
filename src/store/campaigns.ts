import { signal } from '@preact/signals'
import { supabase } from '../lib/supabase'
import type { OfficialCampaign } from '../types'

export const campaigns = signal<OfficialCampaign[]>([])
export const campaignsLoading = signal(false)
export const campaignsLoaded = signal(false)

export async function loadCampaigns() {
  if (!supabase || campaignsLoading.value) return
  campaignsLoading.value = true

  try {
    const { data, error } = await supabase
      .from('official_campaigns')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw error
    campaigns.value = (data || []) as OfficialCampaign[]
    campaignsLoaded.value = true
  } catch (e) {
    console.error('[Campaigns] load:', e)
  } finally {
    campaignsLoading.value = false
  }
}

export async function loadAllCampaigns() {
  if (!supabase) return []
  try {
    const { data, error } = await supabase
      .from('official_campaigns')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)
    if (error) throw error
    return (data || []) as OfficialCampaign[]
  } catch (e) {
    console.error('[Campaigns] loadAll:', e)
    return []
  }
}

export async function saveCampaign(campaign: Partial<OfficialCampaign>): Promise<OfficialCampaign | null> {
  if (!supabase) return null
  try {
    if (campaign.id) {
      const { data, error } = await supabase
        .from('official_campaigns')
        .update({ ...campaign, updated_at: new Date().toISOString() })
        .eq('id', campaign.id)
        .select()
      if (error) throw error
      return (data?.[0] as OfficialCampaign) || null
    } else {
      const { data, error } = await supabase
        .from('official_campaigns')
        .insert(campaign)
        .select()
      if (error) throw error
      return (data?.[0] as OfficialCampaign) || null
    }
  } catch (e) {
    console.error('[Campaigns] save:', e)
    throw e
  }
}

export async function deleteCampaign(id: string): Promise<void> {
  if (!supabase) return
  const { error } = await supabase
    .from('official_campaigns')
    .update({ status: 'cancelled' })
    .eq('id', id)
  if (error) throw error
}
