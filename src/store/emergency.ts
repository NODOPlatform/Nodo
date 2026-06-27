import { signal } from '@preact/signals'
import type { Emergency } from '../types'
import { DEFAULT_CENTER, DEFAULT_ZOOM } from '../lib/constants'
import { supabase } from '../lib/supabase'

export const currentEmergency = signal<Emergency | null>(null)
export const emergencyLoaded = signal(false)

export const defaultEmergency: Emergency = {
  id: 'default',
  name: 'Emergencia Sismica',
  description: 'Terremoto en Caracas y La Guaira',
  country: 'VE',
  region: 'Caracas — La Guaira',
  center_lat: DEFAULT_CENTER.lat,
  center_lng: DEFAULT_CENTER.lng,
  default_zoom: DEFAULT_ZOOM,
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

export async function loadActiveEmergency(): Promise<void> {
  if (!supabase) {
    emergencyLoaded.value = true
    return
  }
  try {
    const { data } = await supabase
      .from('emergencies')
      .select('*')
      .eq('is_active', true)
      .limit(1)
      .maybeSingle()
    if (data) {
      currentEmergency.value = data as Emergency
    } else {
      // Self-heal: create emergency if none exists
      const { data: created } = await supabase
        .from('emergencies')
        .insert({
          name: 'Emergencia Sismica 2026',
          description: 'Terremoto en Caracas y La Guaira',
          country: 'VE',
          region: 'Caracas — La Guaira',
          center_lat: DEFAULT_CENTER.lat,
          center_lng: DEFAULT_CENTER.lng,
          default_zoom: DEFAULT_ZOOM,
          is_active: true,
        })
        .select()
        .maybeSingle()
      if (created) {
        currentEmergency.value = created as Emergency
      }
    }
  } catch {
    // keep default for display
  } finally {
    emergencyLoaded.value = true
  }
}

export function getEmergency(): Emergency {
  return currentEmergency.value ?? defaultEmergency
}

export function getEmergencyId(): string | null {
  return currentEmergency.value?.id ?? null
}
