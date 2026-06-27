import { signal } from '@preact/signals'
import { supabase } from '../lib/supabase'
import { LABEL_ES, TYPE_ICONS } from '../lib/constants'

export interface PriorityNeed {
  type: string
  label: string
  icon: string
  count: number
  level: 'critico' | 'alto' | 'medio' | 'bajo'
}

export const priorityNeeds = signal<PriorityNeed[]>([])
export const prioritiesLoading = signal(false)

function getLevel(count: number): PriorityNeed['level'] {
  if (count >= 40) return 'critico'
  if (count >= 15) return 'alto'
  if (count >= 5) return 'medio'
  return 'bajo'
}

export const LEVEL_CONFIG: Record<PriorityNeed['level'], { text: string; badge: string; color: string }> = {
  critico: { text: 'CRITICO', badge: '🔴', color: '#dc2626' },
  alto: { text: 'ALTO', badge: '🟠', color: '#f97316' },
  medio: { text: 'MEDIO', badge: '🟡', color: '#eab308' },
  bajo: { text: 'BAJO', badge: '🟢', color: '#22c55e' },
}

export async function loadPriorities() {
  if (!supabase || prioritiesLoading.value) return

  prioritiesLoading.value = true
  try {
    const cutoff = new Date(Date.now() - 24 * 3600000).toISOString()
    const { data } = await supabase
      .from('help_requests')
      .select('help_types')
      .in('status', ['pending', 'in_process'])
      .gte('created_at', cutoff)

    if (!data) return

    const counts: Record<string, number> = {}
    data.forEach((row: Record<string, unknown>) => {
      const types = (row.help_types as string[]) || []
      types.forEach(t => { counts[t] = (counts[t] || 0) + 1 })
    })

    priorityNeeds.value = Object.entries(counts)
      .map(([type, count]) => ({
        type,
        label: LABEL_ES[type] || type,
        icon: TYPE_ICONS[type] || '📋',
        count,
        level: getLevel(count),
      }))
      .sort((a, b) => b.count - a.count)
  } catch {
    // silent
  } finally {
    prioritiesLoading.value = false
  }
}
