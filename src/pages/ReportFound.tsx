import { useSignal } from '@preact/signals'
import { useLocation } from 'preact-iso'
import { Button } from '../components/ui/Button'
import { LocationPicker } from '../components/ui/LocationPicker'
import { MultiPhotoInput } from '../components/ui/MultiPhotoInput'
import { ContactPicker, type ContactMethod } from '../components/ui/ContactPicker'
import { PERSON_STATUSES } from '../lib/constants'
import { enqueue } from '../lib/sync'
import { getDeviceId } from '../lib/device'
import { getEmergency } from '../store/emergency'
import { refreshPendingCount } from '../hooks/useOfflineQueue'
import { triggerMapRefresh } from '../store/map-refresh'
import type { PersonStatus } from '../types'

export function ReportFound() {
  const { route } = useLocation()
  const submitting = useSignal(false)
  const submitted = useSignal(false)
  const submitError = useSignal<string | null>(null)

  const firstName = useSignal('')
  const lastName = useSignal('')
  const age = useSignal('')
  const status = useSignal<PersonStatus>('ok')
  const notes = useSignal('')
  const location = useSignal<{ lat: number | null; lng: number | null; city: string; sector: string } | null>(null)
  const photos = useSignal<string[]>([])
  const contact = useSignal<{ method: ContactMethod; value: string } | null>(null)

  const handleSubmit = async (e: Event) => {
    e.preventDefault()
    if (!firstName.value.trim() || !lastName.value.trim() || submitting.value) return

    submitting.value = true
    submitError.value = null

    try {
      const emergency = getEmergency()
      const deviceId = getDeviceId()
      const parsedAge = age.value ? parseInt(age.value) : null

      await enqueue('persons', {
        emergency_id: emergency.id,
        first_name: firstName.value.trim(),
        last_name: lastName.value.trim(),
        approximate_age: parsedAge !== null && !Number.isNaN(parsedAge) ? Math.min(Math.max(parsedAge, 0), 150) : null,
        current_status: status.value,
        is_found: status.value !== 'unknown',
        found_at: status.value !== 'unknown' ? new Date().toISOString() : null,
        last_known_lat: location.value?.lat ?? null,
        last_known_lng: location.value?.lng ?? null,
        last_known_address: location.value ? `${location.value.sector}, ${location.value.city}` : null,
        city: location.value?.city ?? null,
        sector: location.value?.sector ?? null,
        description: notes.value || null,
        contact_method: contact.value?.method ?? null,
        contact_value: contact.value?.value ?? null,
        metadata: photos.value.length > 0 ? { images: photos.value } : {},
        device_id: deviceId,
      })

      await refreshPendingCount()
      triggerMapRefresh()
      submitted.value = true
    } catch {
      submitError.value = 'Error al enviar. El reporte sera enviado cuando haya conexion.'
    } finally {
      submitting.value = false
    }
  }

  if (submitted.value) {
    return (
      <div class="p-4 pb-20 text-center max-w-lg mx-auto">
        <div class="mt-12 mb-6">
          <div class="text-6xl mb-4">✅</div>
          <h2 class="text-xl font-bold mb-2">Reporte enviado</h2>
          <p class="text-nodo-muted">El reporte de persona localizada ha sido registrado.</p>
        </div>
        <div class="space-y-3">
          <Button fullWidth onClick={() => { submitted.value = false; firstName.value = ''; lastName.value = ''; age.value = ''; status.value = 'ok'; notes.value = ''; location.value = null; photos.value = []; submitError.value = null }}>
            Reportar otra persona
          </Button>
          <Button fullWidth variant="secondary" onClick={() => route('/')}>
            Volver al inicio
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div class="p-4 pb-20 max-w-lg mx-auto">
      <div class="flex items-center gap-3 mb-6">
        <button class="w-9 h-9 flex items-center justify-center rounded-xl bg-nodo-card border border-nodo-border hover:bg-white/[0.06] transition-colors" aria-label="Volver" onClick={() => route('/')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <h2 class="text-xl font-bold">Reportar persona localizada</h2>
      </div>

      <form class="space-y-5" onSubmit={handleSubmit}>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm text-nodo-muted mb-1">Nombre *</label>
            <input
              type="text"
              required
              class="w-full bg-nodo-dark border border-nodo-border rounded-lg p-3 text-white"
              placeholder="Nombre"
              value={firstName.value}
              onInput={(e) => { firstName.value = (e.target as HTMLInputElement).value }}
            />
          </div>
          <div>
            <label class="block text-sm text-nodo-muted mb-1">Apellido *</label>
            <input
              type="text"
              required
              class="w-full bg-nodo-dark border border-nodo-border rounded-lg p-3 text-white"
              placeholder="Apellido"
              value={lastName.value}
              onInput={(e) => { lastName.value = (e.target as HTMLInputElement).value }}
            />
          </div>
        </div>

        <div>
          <label class="block text-sm text-nodo-muted mb-1">Edad aproximada</label>
          <input
            type="number"
            min="0"
            max="150"
            class="w-full bg-nodo-dark border border-nodo-border rounded-lg p-3 text-white"
            placeholder="Edad"
            value={age.value}
            onInput={(e) => { age.value = (e.target as HTMLInputElement).value }}
          />
        </div>

        <div>
          <label class="block text-sm text-nodo-muted mb-2">Estado de la persona</label>
          <div class="grid grid-cols-2 gap-2">
            {PERSON_STATUSES.filter(s => s.value !== 'unknown').map((s) => (
              <button
                key={s.value}
                type="button"
                class={`p-3 rounded-lg text-sm font-medium border transition-colors text-left ${
                  status.value === s.value
                    ? 'text-white'
                    : 'bg-nodo-card border-nodo-border text-nodo-muted'
                }`}
                style={status.value === s.value ? { backgroundColor: s.color, borderColor: s.color } : {}}
                onClick={() => { status.value = s.value }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <LocationPicker onLocationChange={(loc) => { location.value = loc }} />

        <ContactPicker onContactChange={(c) => { contact.value = c }} />

        <MultiPhotoInput
          images={photos.value}
          onAdd={(url) => { photos.value = [...photos.value, url] }}
          onRemove={(idx) => { photos.value = photos.value.filter((_, i) => i !== idx) }}
          label="Foto (opcional y solo si es apropiado)"
        />

        <div>
          <label class="block text-sm text-nodo-muted mb-1">Observaciones</label>
          <textarea
            class="w-full bg-nodo-dark border border-nodo-border rounded-lg p-3 text-white min-h-[80px] resize-none"
            placeholder="Informacion adicional relevante..."
            value={notes.value}
            onInput={(e) => { notes.value = (e.target as HTMLTextAreaElement).value }}
          />
        </div>

        {submitError.value && (
          <p class="text-amber-400 text-sm text-center">{submitError.value}</p>
        )}

        <Button
          type="submit"
          variant="primary"
          size="xl"
          fullWidth
          loading={submitting.value}
          disabled={!firstName.value.trim() || !lastName.value.trim()}
          class="!bg-green-700 hover:!bg-green-600"
        >
          Enviar reporte
        </Button>
      </form>
    </div>
  )
}
