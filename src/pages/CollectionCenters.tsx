import { useSignal } from '@preact/signals'
import { useEffect } from 'preact/hooks'
import { useLocation } from 'preact-iso'
import { supabase } from '../lib/supabase'
import { Spinner } from '../components/ui/Spinner'

interface CenterData {
  id: string
  name: string
  address_text: string | null
  city: string | null
  sector: string | null
  description: string | null
  latitude: number
  longitude: number
  metadata: Record<string, unknown>
}

export function CollectionCenters() {
  const { route } = useLocation()
  const centers = useSignal<CenterData[]>([])
  const loading = useSignal(true)
  const error = useSignal<string | null>(null)

  useEffect(() => {
    async function load() {
      if (!supabase) { loading.value = false; return }
      try {
        const { data, error: err } = await supabase
          .from('points_of_interest')
          .select('id,name,address_text,city,sector,description,latitude,longitude,metadata')
          .eq('poi_type', 'collection_center')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(100)
        if (err) throw err
        centers.value = (data || []) as CenterData[]
      } catch (e) {
        error.value = e instanceof Error ? e.message : 'Error al cargar centros'
        console.error('[CollectionCenters] load error:', e)
      } finally {
        loading.value = false
      }
    }
    load()
  }, [])

  return (
    <div class="p-4 pb-20 max-w-lg mx-auto">
      <div class="flex items-center gap-3 mb-6">
        <button class="w-9 h-9 flex items-center justify-center rounded-xl bg-nodo-card border border-nodo-border hover:bg-white/[0.06] transition-colors" aria-label="Volver" onClick={() => route('/')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <h2 class="text-xl font-bold">Centros de Acopio</h2>
      </div>

      <p class="text-nodo-muted text-sm mb-6">
        Puntos de recepcion y distribucion de ayuda. Consulta horarios y necesidades antes de acudir.
      </p>

      {loading.value && (
        <div class="flex justify-center py-12"><Spinner /></div>
      )}

      {error.value && (
        <div class="bg-red-900/40 border border-red-700/40 rounded-2xl p-4 text-center mb-4">
          <p class="text-red-300 text-sm">{error.value}</p>
        </div>
      )}

      {!loading.value && centers.value.length === 0 && (
        <div class="bg-nodo-card border border-nodo-border rounded-2xl p-8 text-center">
          <div class="text-3xl mb-3" aria-hidden="true">📦</div>
          <p class="text-nodo-muted text-sm font-medium">No hay centros de acopio registrados todavia.</p>
          <p class="text-nodo-muted text-xs mt-1.5">Se agregaran proximamente.</p>
        </div>
      )}

      <div class="space-y-3 stagger">
        {centers.value.map((center) => {
          const meta = center.metadata || {}
          const phone = meta.phone as string | undefined
          const schedule = meta.schedule as string | undefined
          const needs = meta.needs as string | undefined
          return (
            <div key={center.id} class="bg-nodo-card border border-nodo-border rounded-2xl p-4">
              <h3 class="font-semibold text-base mb-1">{center.name}</h3>
              <p class="text-nodo-muted text-sm">{center.address_text || [center.sector, center.city].filter(Boolean).join(', ')}</p>

              {schedule && (
                <div class="flex items-center gap-2 mt-2">
                  <span class="text-xs" aria-hidden="true">🕐</span>
                  <span class="text-sm text-nodo-muted">{schedule}</span>
                </div>
              )}

              {(needs || center.description) && (
                <div class="mt-2 bg-amber-900/30 border border-amber-700/40 rounded-xl p-2.5">
                  <p class="text-xs text-amber-300 font-medium mb-0.5">Necesitan:</p>
                  <p class="text-sm text-amber-200">{needs || center.description}</p>
                </div>
              )}

              <div class="flex gap-2 mt-3">
                {phone && (
                  <a
                    href={`tel:${phone.replace(/[^+0-9]/g, '')}`}
                    class="flex-1 bg-blue-800 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl py-2.5 text-center transition-colors active:scale-[0.97]"
                  >
                    Llamar
                  </a>
                )}
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${center.latitude},${center.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="flex-1 bg-nodo-dark hover:bg-white/[0.08] text-white text-sm font-semibold rounded-xl py-2.5 text-center border border-nodo-border transition-colors active:scale-[0.97]"
                >
                  Como llegar
                </a>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
