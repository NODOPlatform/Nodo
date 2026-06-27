import { useSignal } from '@preact/signals'
import { supabase } from '../lib/supabase'

export function useSupabaseQuery<T>(tableName: string) {
  const data = useSignal<T[]>([])
  const loading = useSignal(false)
  const error = useSignal<string | null>(null)

  const fetch = async (query?: {
    column?: string
    value?: string
    orderBy?: string
    ascending?: boolean
    limit?: number
    filters?: Record<string, unknown>
  }) => {
    loading.value = true
    error.value = null

    if (!supabase) {
      error.value = 'Supabase no configurado'
      loading.value = false
      return
    }

    try {
      let q = supabase.from(tableName).select('*')

      if (query?.column && query?.value) {
        q = q.ilike(query.column, `%${query.value}%`)
      }

      if (query?.filters) {
        for (const [key, val] of Object.entries(query.filters)) {
          if (val !== undefined && val !== null && val !== '') {
            q = q.eq(key, val)
          }
        }
      }

      if (query?.orderBy) {
        q = q.order(query.orderBy, { ascending: query.ascending ?? false })
      } else {
        q = q.order('created_at', { ascending: false })
      }

      if (query?.limit) {
        q = q.limit(query.limit)
      }

      const { data: result, error: err } = await q

      if (err) throw err
      data.value = (result ?? []) as T[]
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error cargando datos'
    } finally {
      loading.value = false
    }
  }

  return { data, loading, error, fetch }
}
