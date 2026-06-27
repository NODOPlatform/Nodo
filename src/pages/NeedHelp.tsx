import { useSignal } from '@preact/signals'
import { useLocation } from 'preact-iso'
import { Button } from '../components/ui/Button'
import { LocationPicker } from '../components/ui/LocationPicker'
import { MultiPhotoInput } from '../components/ui/MultiPhotoInput'
import { ContactPicker, type ContactMethod } from '../components/ui/ContactPicker'
import { HELP_TYPES, URGENCY_LEVELS } from '../lib/constants'
import { enqueue } from '../lib/sync'
import { getDeviceId } from '../lib/device'
import { getEmergency } from '../store/emergency'
import { refreshPendingCount } from '../hooks/useOfflineQueue'
import { triggerMapRefresh } from '../store/map-refresh'
import type { HelpType, UrgencyLevel } from '../types'

export function NeedHelp() {
  const { route } = useLocation()
  const submitting = useSignal(false)
  const submitted = useSignal(false)
  const submitError = useSignal<string | null>(null)
  const selectedTypes = useSignal<Set<HelpType>>(new Set())
  const urgency = useSignal<UrgencyLevel>('medium')
  const peopleCount = useSignal(1)
  const description = useSignal('')
  const reporterName = useSignal('')

  const params = new URLSearchParams(window.location.search)
  const prefillLat = parseFloat(params.get('lat') || '')
  const prefillLng = parseFloat(params.get('lng') || '')
  const hasPrefill = !Number.isNaN(prefillLat) && !Number.isNaN(prefillLng)

  const location = useSignal<{ lat: number | null; lng: number | null; city: string; sector: string } | null>(
    hasPrefill ? { lat: prefillLat, lng: prefillLng, city: '', sector: '' } : null
  )
  const photos = useSignal<string[]>([])
  const contact = useSignal<{ method: ContactMethod; value: string } | null>(null)

  const toggleType = (type: HelpType) => {
    const s = new Set(selectedTypes.value)
    if (s.has(type)) s.delete(type)
    else s.add(type)
    selectedTypes.value = s
  }

  const handleSubmit = async (e: Event) => {
    e.preventDefault()
    if (!location.value || selectedTypes.value.size === 0 || submitting.value) return

    submitting.value = true
    submitError.value = null

    try {
      const emergency = getEmergency()

      await enqueue('help_requests', {
        emergency_id: emergency.id,
        latitude: location.value.lat,
        longitude: location.value.lng,
        city: location.value.city,
        sector: location.value.sector,
        people_count: Math.min(Math.max(peopleCount.value, 1), 999),
        help_types: Array.from(selectedTypes.value),
        urgency: urgency.value,
        description: description.value || null,
        status: 'pending',
        reporter_name: reporterName.value.trim() || null,
        contact_method: contact.value?.method ?? null,
        contact_value: contact.value?.value ?? null,
        metadata: photos.value.length > 0 ? { images: photos.value } : {},
        device_id: getDeviceId(),
      })

      await refreshPendingCount()
      triggerMapRefresh()
      submitted.value = true
    } catch {
      submitError.value = 'Error al enviar. Tu solicitud sera enviada cuando haya conexion.'
    } finally {
      submitting.value = false
    }
  }

  if (submitted.value) {
    return (
      <div class="p-4 pb-20 text-center max-w-lg mx-auto">
        <div class="mt-12 mb-6">
          <div class="text-6xl mb-4">✅</div>
          <h2 class="text-xl font-bold mb-2">Solicitud enviada</h2>
          <p class="text-nodo-muted">Tu solicitud de ayuda ha sido registrada. Alguien la vera pronto.</p>
        </div>
        <Button fullWidth onClick={() => route('/')}>Volver al inicio</Button>
      </div>
    )
  }

  return (
    <div class="p-4 pb-20 max-w-lg mx-auto">
      <div class="flex items-center gap-3 mb-6">
        <button class="w-9 h-9 flex items-center justify-center rounded-xl bg-nodo-card border border-nodo-border hover:bg-white/[0.06] transition-colors" aria-label="Volver" onClick={() => route('/')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <h2 class="text-xl font-bold">Necesito ayuda</h2>
      </div>

      <form class="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label class="block text-sm text-nodo-muted mb-1">Nombre o apodo <span class="opacity-50">(opcional)</span></label>
          <input
            type="text"
            class="w-full bg-nodo-dark border border-nodo-border rounded-lg p-3 text-white"
            placeholder="Ej: Carlos, Ana, Bomberos Chacao..."
            value={reporterName.value}
            onInput={(e) => { reporterName.value = (e.target as HTMLInputElement).value }}
          />
        </div>

        <LocationPicker
          onLocationChange={(loc) => { location.value = loc }}
          initialLat={hasPrefill ? prefillLat : undefined}
          initialLng={hasPrefill ? prefillLng : undefined}
        />

        <div>
          <label class="block text-sm text-nodo-muted mb-2">Cantidad de personas</label>
          <input
            type="number"
            min="1"
            max="999"
            class="w-full bg-nodo-dark border border-nodo-border rounded-lg p-3 text-white"
            value={peopleCount.value}
            onInput={(e) => {
              const v = parseInt((e.target as HTMLInputElement).value)
              peopleCount.value = Number.isNaN(v) ? 1 : Math.min(Math.max(v, 1), 999)
            }}
          />
        </div>

        <div>
          <label class="block text-sm text-nodo-muted mb-2">Tipo de ayuda necesaria</label>
          <div class="grid grid-cols-3 gap-2">
            {HELP_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                class={`p-3 rounded-lg text-sm font-medium border transition-colors ${
                  selectedTypes.value.has(type.value)
                    ? 'bg-nodo-red border-red-500 text-white'
                    : 'bg-nodo-card border-nodo-border text-nodo-muted hover:text-white'
                }`}
                onClick={() => toggleType(type.value)}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label class="block text-sm text-nodo-muted mb-2">Nivel de urgencia</label>
          <div class="grid grid-cols-4 gap-2">
            {URGENCY_LEVELS.map((level) => (
              <button
                key={level.value}
                type="button"
                class={`p-3 rounded-lg text-sm font-medium border transition-colors ${
                  urgency.value === level.value
                    ? 'text-white'
                    : 'bg-nodo-card border-nodo-border text-nodo-muted'
                }`}
                style={urgency.value === level.value ? { backgroundColor: level.color, borderColor: level.color } : {}}
                onClick={() => { urgency.value = level.value }}
              >
                {level.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label class="block text-sm text-nodo-muted mb-1">Descripcion breve</label>
          <textarea
            class="w-full bg-nodo-dark border border-nodo-border rounded-lg p-3 text-white min-h-[80px] resize-none"
            placeholder="Describe brevemente tu situacion..."
            value={description.value}
            onInput={(e) => { description.value = (e.target as HTMLTextAreaElement).value }}
          />
        </div>

        <ContactPicker onContactChange={(c) => { contact.value = c }} />

        <MultiPhotoInput
          images={photos.value}
          onAdd={(url) => { photos.value = [...photos.value, url] }}
          onRemove={(idx) => { photos.value = photos.value.filter((_, i) => i !== idx) }}
        />

        {submitError.value && (
          <p class="text-amber-400 text-sm text-center">{submitError.value}</p>
        )}

        <Button
          type="submit"
          variant="primary"
          size="xl"
          fullWidth
          loading={submitting.value}
          disabled={!location.value || selectedTypes.value.size === 0}
        >
          Enviar solicitud de ayuda
        </Button>
      </form>
    </div>
  )
}
