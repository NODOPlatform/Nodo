import { useSignal } from '@preact/signals'
import { useLocation } from 'preact-iso'
import { Button } from '../components/ui/Button'
import { LocationPicker } from '../components/ui/LocationPicker'
import { MultiPhotoInput } from '../components/ui/MultiPhotoInput'
import { ContactPicker, type ContactMethod } from '../components/ui/ContactPicker'
import { OFFER_TYPES } from '../lib/constants'
import { PriorityNeeds } from '../components/PriorityNeeds'
import { enqueue } from '../lib/sync'
import { getDeviceId } from '../lib/device'
import { getEmergency } from '../store/emergency'
import { refreshPendingCount } from '../hooks/useOfflineQueue'
import { triggerMapRefresh } from '../store/map-refresh'
import type { OfferType } from '../types'

export function OfferHelp() {
  const { route } = useLocation()
  const submitting = useSignal(false)
  const submitted = useSignal(false)
  const submitError = useSignal<string | null>(null)
  const selectedTypes = useSignal<Set<OfferType>>(new Set())
  const availableHours = useSignal('')
  const description = useSignal('')
  const reporterName = useSignal('')
  const location = useSignal<{ lat: number | null; lng: number | null; city: string; sector: string } | null>(null)
  const photos = useSignal<string[]>([])
  const contact = useSignal<{ method: ContactMethod; value: string } | null>(null)

  const toggleType = (type: OfferType) => {
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

      await enqueue('help_offers', {
        emergency_id: emergency.id,
        latitude: location.value.lat,
        longitude: location.value.lng,
        city: location.value.city,
        sector: location.value.sector,
        offer_types: Array.from(selectedTypes.value),
        description: description.value || null,
        available_hours: availableHours.value || null,
        status: 'available',
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
      submitError.value = 'Error al enviar. Tu oferta sera enviada cuando haya conexion.'
    } finally {
      submitting.value = false
    }
  }

  if (submitted.value) {
    return (
      <div class="p-4 pb-20 text-center max-w-lg mx-auto">
        <div class="mt-12 mb-6">
          <div class="text-6xl mb-4">🤝</div>
          <h2 class="text-xl font-bold mb-2">Oferta registrada</h2>
          <p class="text-nodo-muted">Tu ayuda ha sido registrada. Gracias por tu solidaridad.</p>
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
        <h2 class="text-xl font-bold">Quiero ayudar</h2>
      </div>

      <PriorityNeeds compact />

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

        <div>
          <label class="block text-sm text-nodo-muted mb-2">Que puedes ofrecer?</label>
          <div class="grid grid-cols-2 gap-2">
            {OFFER_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                class={`p-3 rounded-lg text-sm font-medium border text-left transition-colors ${
                  selectedTypes.value.has(type.value)
                    ? 'bg-emerald-800 border-emerald-500 text-white'
                    : 'bg-nodo-card border-nodo-border text-nodo-muted hover:text-white'
                }`}
                onClick={() => toggleType(type.value)}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        <LocationPicker onLocationChange={(loc) => { location.value = loc }} />

        <div>
          <label class="block text-sm text-nodo-muted mb-1">Horario disponible</label>
          <input
            type="text"
            class="w-full bg-nodo-dark border border-nodo-border rounded-lg p-3 text-white"
            placeholder="Ej: Lunes a viernes, 8am - 5pm"
            value={availableHours.value}
            onInput={(e) => { availableHours.value = (e.target as HTMLInputElement).value }}
          />
        </div>

        <div>
          <label class="block text-sm text-nodo-muted mb-1">Observaciones</label>
          <textarea
            class="w-full bg-nodo-dark border border-nodo-border rounded-lg p-3 text-white min-h-[80px] resize-none"
            placeholder="Informacion adicional..."
            value={description.value}
            onInput={(e) => { description.value = (e.target as HTMLTextAreaElement).value }}
          />
        </div>

        <MultiPhotoInput
          images={photos.value}
          onAdd={(url) => { photos.value = [...photos.value, url] }}
          onRemove={(idx) => { photos.value = photos.value.filter((_, i) => i !== idx) }}
        />

        <ContactPicker onContactChange={(c) => { contact.value = c }} />

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
          class="!bg-emerald-700 hover:!bg-emerald-600"
        >
          Registrar mi ayuda
        </Button>
      </form>
    </div>
  )
}
