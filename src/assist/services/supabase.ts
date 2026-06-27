import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | null = null

function getEnv(key: string): string | undefined {
  try {
    // Vite browser context
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      return import.meta.env[key] as string | undefined
    }
  } catch { /* not in Vite */ }
  return undefined
}

export function getSupabase(): SupabaseClient | null {
  if (client) return client

  const url = getEnv('VITE_SUPABASE_URL')
  const key = getEnv('VITE_SUPABASE_ANON_KEY')

  if (!url || !key) return null
  client = createClient(url, key)
  return client
}
