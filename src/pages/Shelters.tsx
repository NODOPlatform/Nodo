import { useSignal } from '@preact/signals'
import { useEffect } from 'preact/hooks'
import { useLocation } from 'preact-iso'
import { supabase } from '../lib/supabase'
import { Spinner } from '../components/ui/Spinner'
import { CoverImage, PhotoGallery } from '../components/ui/MultiPhotoInput'
import type { Shelter, ShelterStatus } from '../types'

const STATUS_CONFIG: Record<ShelterStatus, { label: string; color: string; bg: string }> = {
  active: { label: 'Disponible', color: 'text-green-400', bg: 'bg-green-900/40 border-green-700/50' },
  full: { label: 'Completo', color: 'text-yellow-400', bg: 'bg-yellow-900/40 border-yellow-700/50' },
  closed: { label: 'Cerrado', color: 'text-red-400', bg: 'bg-red-900/40 border-red-700/50' },
}

export function Shelters() {
  const { route } = useLocation()
  const shelters = useSignal<Shelter[]>([])
  const loading = useSignal(true)

  useEffect(() => {
    if (!supabase) { loading.value = false; return }
    supabase
      .from('shelters')
      .select('*')
      .in('status', ['active', 'full'])
      .order('status', { ascending: true })
      .order('name', { ascending: true })
      .then(({ data }) => {
        shelters.value = (data as Shelter[]) || []
        loading.value = false
      })
  }, [])

  return (
    <div class="p-4 pb-20 max-w-lg mx-auto">
      <div class="flex items-center gap-3 mb-6">
        <button class="w-9 h-9 flex items-center justify-center rounded-xl bg-nodo-card border border-nodo-border hover:bg-white/[0.06] transition-colors" aria-label="Volver" onClick={() => route('/')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <h2 class="text-xl font-bold">Refugios</h2>
      </div>

      <p class="text-nodo-muted text-sm mb-6">
        Refugios temporales disponibles. Los administradores actualizan el estado en tiempo real.
      </p>

      {loading.value && (
        <div class="flex justify-center py-12"><Spinner /></div>
      )}

      {!loading.value && shelters.value.length === 0 && (
        <div class="bg-nodo-card border border-nodo-border rounded-2xl p-8 text-center">
          <div class="text-3xl mb-3" aria-hidden="true">🏠</div>
          <p class="text-nodo-muted text-sm font-medium">No hay refugios registrados todavia.</p>
          <p class="text-nodo-muted text-xs mt-1.5">Se agregaran proximamente.</p>
        </div>
      )}

      <div class="space-y-3 stagger">
        {shelters.value.map((shelter) => {
          const sc = STATUS_CONFIG[shelter.status] || STATUS_CONFIG.active
          const available = shelter.capacity != null ? Math.max(0, shelter.capacity - (shelter.current_occupancy || 0)) : null
          const images = (shelter.metadata?.images as string[]) || []
          return (
            <div key={shelter.id} class="bg-nodo-card border border-nodo-border rounded-2xl overflow-hidden">
              <CoverImage images={images} name={shelter.name} />
              <div class="p-4">
              <div class="flex items-start justify-between mb-2">
                <h3 class="font-semibold text-base">{shelter.name}</h3>
                <span class={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${sc.bg} ${sc.color}`}>
                  {sc.label}
                </span>
              </div>

              {shelter.address_text && <p class="text-nodo-muted text-sm mb-1">📍 {shelter.address_text}</p>}

              <div class="text-xs text-nodo-muted space-y-0.5 mb-3">
                {(shelter.city || shelter.state_name) && (
                  <p>🏙️ {[shelter.city, shelter.state_name].filter(Boolean).join(', ')}</p>
                )}
                {shelter.capacity != null && (
                  <p>👥 Capacidad: {shelter.capacity} — Cupos: {available != null ? available : '?'}</p>
                )}
                {shelter.responsible && <p>👤 Responsable: {shelter.responsible}</p>}
                {shelter.notes && <p>📝 {shelter.notes}</p>}
              </div>

              <PhotoGallery images={images} />

              {/* Accept tags */}
              <div class="flex flex-wrap gap-1.5 mb-3">
                {shelter.accepts_pets && <span class="text-[10px] bg-nodo-dark border border-nodo-border rounded-full px-2 py-0.5">🐾 Mascotas</span>}
                {shelter.accepts_children && <span class="text-[10px] bg-nodo-dark border border-nodo-border rounded-full px-2 py-0.5">👶 Niños</span>}
                {shelter.accepts_elderly && <span class="text-[10px] bg-nodo-dark border border-nodo-border rounded-full px-2 py-0.5">👴 Mayores</span>}
                {shelter.accepts_disabled && <span class="text-[10px] bg-nodo-dark border border-nodo-border rounded-full px-2 py-0.5">♿ Discapacidad</span>}
              </div>

              <div class="flex gap-2">
                {shelter.phone && (
                  <a
                    href={`tel:${shelter.phone.replace(/[^+0-9]/g, '')}`}
                    class="flex-1 bg-blue-800 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl py-2.5 text-center transition-colors active:scale-[0.97]"
                  >
                    Llamar
                  </a>
                )}
                {shelter.latitude != null && shelter.longitude != null && (
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${shelter.latitude},${shelter.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="flex-1 bg-nodo-dark hover:bg-white/[0.08] text-white text-sm font-semibold rounded-xl py-2.5 text-center border border-nodo-border transition-colors active:scale-[0.97]"
                  >
                    Como llegar
                  </a>
                )}
              </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
