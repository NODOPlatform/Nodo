import { useSignal } from '@preact/signals'
import { useRoute, useLocation } from 'preact-iso'
import { useEffect } from 'preact/hooks'
import { Card } from '../components/ui/Card'
import { PersonStatusBadge, RequestStatusBadge, UrgencyBadge } from '../components/ui/StatusBadge'
import { Spinner } from '../components/ui/Spinner'
import { supabase } from '../lib/supabase'
import { CoverImage, PhotoGallery } from '../components/ui/MultiPhotoInput'
import type { Person, HelpRequest, PersonStatusHistory } from '../types'
import { HELP_TYPES } from '../lib/constants'

export function Detail() {
  const { params } = useRoute()
  const { route } = useLocation()
  const data = useSignal<Person | HelpRequest | null>(null)
  const history = useSignal<PersonStatusHistory[]>([])
  const loading = useSignal(true)

  const type = params.type
  const id = params.id

  useEffect(() => {
    async function load() {
      if (!supabase || !id) return
      loading.value = true

      if (type === 'person') {
        const { data: person } = await supabase.from('persons').select('*').eq('id', id).single()
        data.value = person as Person
        const { data: hist } = await supabase
          .from('person_status_history')
          .select('*')
          .eq('person_id', id)
          .order('created_at', { ascending: false })
        history.value = (hist ?? []) as PersonStatusHistory[]
      } else if (type === 'help_request') {
        const { data: req } = await supabase.from('help_requests').select('*').eq('id', id).single()
        data.value = req as HelpRequest
      }

      loading.value = false
    }
    load()
  }, [type, id])

  if (loading.value) {
    return <div class="flex justify-center py-16"><Spinner size={32} /></div>
  }

  if (!data.value) {
    return (
      <div class="p-4 pb-20 text-center py-16">
        <p class="text-nodo-muted">No se encontro el registro</p>
      </div>
    )
  }

  const isPerson = type === 'person'
  const d = data.value

  const formatDate = (date: string) =>
    new Date(date).toLocaleString('es', { dateStyle: 'medium', timeStyle: 'short' })

  return (
    <div class="p-4 pb-20 max-w-lg mx-auto">
      <div class="flex items-center gap-3 mb-6">
        <button class="w-9 h-9 flex items-center justify-center rounded-xl bg-nodo-card border border-nodo-border hover:bg-white/[0.06] transition-colors" aria-label="Volver" onClick={() => window.history.length > 1 ? window.history.back() : route('/')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <h2 class="text-xl font-bold">Detalle</h2>
      </div>

      {isPerson && (
        <Card class="mb-4 !p-0 overflow-hidden">
          <CoverImage images={((d as Person).metadata?.images as string[]) || undefined} name={`${(d as Person).first_name} ${(d as Person).last_name}`} />
          <div class="p-4">
          <div class="flex items-start justify-between mb-3">
            <h3 class="text-xl font-bold">
              {(d as Person).first_name} {(d as Person).last_name}
            </h3>
            <PersonStatusBadge status={(d as Person).current_status} />
          </div>

          {(d as Person).approximate_age && (
            <p class="text-nodo-muted text-sm">Edad aproximada: ~{(d as Person).approximate_age} anos</p>
          )}
          {(d as Person).last_known_address && (
            <p class="text-nodo-muted text-sm mt-1">Ultima ubicacion: {(d as Person).last_known_address}</p>
          )}
          {((d as Person).city || (d as Person).sector) && (
            <p class="text-nodo-muted text-sm">
              {[(d as Person).sector, (d as Person).city].filter(Boolean).join(', ')}
            </p>
          )}
          <PhotoGallery images={((d as Person).metadata?.images as string[]) || undefined} />
          {(d as Person).description && (
            <p class="text-sm mt-3">{(d as Person).description}</p>
          )}
          <p class="text-xs text-nodo-muted mt-3">
            Ultimo reporte: {formatDate(d.updated_at)}
          </p>
          </div>
        </Card>
      )}

      {!isPerson && (
        <Card class="mb-4 !p-0 overflow-hidden">
          <CoverImage images={((d as HelpRequest).metadata?.images as string[]) || undefined} />
          <div class="p-4">
          <div class="flex items-start justify-between mb-3">
            <h3 class="text-lg font-bold">Solicitud de ayuda</h3>
            <div class="flex gap-2">
              <UrgencyBadge urgency={(d as HelpRequest).urgency} />
              <RequestStatusBadge status={(d as HelpRequest).status} />
            </div>
          </div>
          <p class="text-sm">{(d as HelpRequest).description}</p>
          <p class="text-nodo-muted text-sm mt-2">
            Personas: {(d as HelpRequest).people_count}
          </p>
          <PhotoGallery images={((d as HelpRequest).metadata?.images as string[]) || undefined} />
          {(d as HelpRequest).help_types && (
            <div class="flex flex-wrap gap-1 mt-2">
              {(d as HelpRequest).help_types.map((t) => (
                <span key={t} class="bg-nodo-dark px-2 py-0.5 rounded text-xs">
                  {HELP_TYPES.find(h => h.value === t)?.label ?? t}
                </span>
              ))}
            </div>
          )}
          <p class="text-xs text-nodo-muted mt-3">{formatDate(d.created_at)}</p>
          </div>
        </Card>
      )}

      {isPerson && history.value.length > 0 && (
        <div>
          <h4 class="font-semibold mb-3">Historial de cambios</h4>
          <div class="space-y-2">
            {history.value.map((h) => (
              <Card key={h.id} class="!p-3">
                <div class="flex items-center justify-between">
                  <PersonStatusBadge status={h.status} />
                  <span class="text-xs text-nodo-muted">{formatDate(h.created_at)}</span>
                </div>
                {h.address_text && <p class="text-sm text-nodo-muted mt-1">{h.address_text}</p>}
                {h.notes && <p class="text-sm mt-1">{h.notes}</p>}
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
