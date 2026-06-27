import { useSignal, useComputed } from '@preact/signals'
import { useLocation } from 'preact-iso'
import { Button } from '../components/ui/Button'
import { LocationPicker } from '../components/ui/LocationPicker'
import { supabase } from '../lib/supabase'
import { getEmergencyId } from '../store/emergency'
import { getDeviceId } from '../lib/device'
import { HEALTH_REQUEST_TYPES, BLOOD_TYPES, HEALTH_PRIORITIES, KNOWN_HOSPITALS } from '../lib/constants'
import type { HealthRequestType, BloodType, HealthPriority } from '../types'

const INPUT = 'w-full bg-nodo-dark border border-nodo-border rounded-xl p-3.5 text-white text-base min-h-[48px]'
const LABEL = 'block text-sm text-nodo-muted mb-1.5 font-medium'

export function HealthRequest() {
  const { route } = useLocation()
  const healthType = useSignal<HealthRequestType | null>(null)
  const hospitalName = useSignal('')
  const hospitalFocused = useSignal(false)
  const patientName = useSignal('')
  const bloodType = useSignal<BloodType>('not_applicable')
  const donorCount = useSignal('')
  const priority = useSignal<HealthPriority>('high')
  const requestDate = useSignal(new Date().toISOString().split('T')[0])
  const requestTime = useSignal('')
  const description = useSignal('')
  const contactWhatsapp = useSignal('')
  const contactPhone = useSignal('')
  const lat = useSignal<number | null>(null)
  const lng = useSignal<number | null>(null)
  const city = useSignal('')
  const sector = useSignal('')
  const submitting = useSignal(false)
  const error = useSignal<string | null>(null)
  const success = useSignal(false)

  const hospitalSuggestions = useComputed(() => {
    const q = hospitalName.value.trim().toLowerCase()
    if (q.length < 2 || !hospitalFocused.value) return []
    return KNOWN_HOSPITALS.filter(h =>
      h.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
        .includes(q.normalize('NFD').replace(/[̀-ͯ]/g, ''))
    ).slice(0, 5)
  })

  const handleSubmit = async (e: Event) => {
    e.preventDefault()
    if (!healthType.value) { error.value = 'Selecciona el tipo de solicitud'; return }
    if (!hospitalName.value.trim()) { error.value = 'Indica el hospital o ubicacion'; return }
    if (!contactWhatsapp.value.trim() && !contactPhone.value.trim()) { error.value = 'Agrega al menos un contacto'; return }
    if (!lat.value || !lng.value) { error.value = 'Selecciona la ubicacion en el mapa'; return }
    if (!supabase) { error.value = 'Servicio no disponible'; return }

    const emergencyId = getEmergencyId()
    if (!emergencyId) { error.value = 'No hay emergencia activa'; return }

    submitting.value = true
    error.value = null

    try {
      const ht = HEALTH_REQUEST_TYPES.find(t => t.value === healthType.value)
      const title = `${ht?.icon || '❤️'} ${ht?.label || 'Solicitud de salud'} — ${hospitalName.value.trim()}`

      const { error: err } = await supabase.from('points_of_interest').insert({
        emergency_id: emergencyId,
        poi_type: 'health_request',
        name: title,
        latitude: lat.value,
        longitude: lng.value,
        city: city.value || null,
        sector: sector.value || null,
        description: description.value.trim() || null,
        is_active: true,
        verified: false,
        device_id: getDeviceId(),
        metadata: {
          status: 'searching',
          priority: priority.value,
          health_type: healthType.value,
          hospital_name: hospitalName.value.trim(),
          patient_name: patientName.value.trim() || null,
          blood_type: bloodType.value,
          donor_count: donorCount.value ? parseInt(donorCount.value) : null,
          donors_confirmed: 0,
          request_date: requestDate.value || null,
          request_time: requestTime.value || null,
          contact_whatsapp: contactWhatsapp.value.trim() || null,
          contact_phone: contactPhone.value.trim() || null,
          updates: [],
        },
      })

      if (err) throw err
      success.value = true
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Error al enviar'
      console.error('[HealthRequest] submit:', e)
    } finally {
      submitting.value = false
    }
  }

  if (success.value) {
    return (
      <div class="p-4 pb-20 max-w-lg mx-auto">
        <div class="bg-nodo-card border border-nodo-border rounded-2xl p-8 text-center mt-8">
          <div class="text-5xl mb-4">❤️</div>
          <h2 class="text-xl font-bold mb-2">Solicitud publicada</h2>
          <p class="text-nodo-muted text-sm mb-6">Tu solicitud ya esta visible en el mapa y en las busquedas. Esperamos que encuentres ayuda pronto.</p>
          <div class="flex gap-3">
            <Button fullWidth onClick={() => route('/mapa')}>Ver en el mapa</Button>
            <Button fullWidth variant="secondary" onClick={() => route('/')}>Volver al inicio</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div class="p-4 pb-20 max-w-lg mx-auto">
      <div class="flex items-center gap-3 mb-6">
        <button class="w-9 h-9 flex items-center justify-center rounded-xl bg-nodo-card border border-nodo-border" aria-label="Volver" onClick={() => route('/')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <div>
          <h2 class="text-xl font-bold">Solicitud de salud</h2>
          <p class="text-xs text-nodo-muted">Publica lo que necesitas y deja que otros te ayuden</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} class="space-y-5">
        {/* Health type selection */}
        <div>
          <label class={LABEL}>Tipo de solicitud</label>
          <div class="grid grid-cols-2 gap-2">
            {HEALTH_REQUEST_TYPES.map(t => (
              <button
                key={t.value}
                type="button"
                onClick={() => { healthType.value = t.value }}
                class="rounded-xl p-3 text-left transition-all active:scale-[0.97] border"
                style={{
                  background: healthType.value === t.value ? 'rgba(225,29,72,0.15)' : 'var(--nodo-card)',
                  borderColor: healthType.value === t.value ? '#e11d48' : 'var(--nodo-border)',
                }}
              >
                <span class="text-lg">{t.icon}</span>
                <span class="block text-xs font-medium mt-0.5">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Priority */}
        <div>
          <label class={LABEL}>Prioridad</label>
          <div class="flex gap-2">
            {HEALTH_PRIORITIES.map(p => (
              <button
                key={p.value}
                type="button"
                onClick={() => { priority.value = p.value }}
                class="flex-1 rounded-xl p-2.5 text-center transition-all active:scale-[0.97] border"
                style={{
                  background: priority.value === p.value ? `${p.color}20` : 'var(--nodo-card)',
                  borderColor: priority.value === p.value ? p.color : 'var(--nodo-border)',
                }}
              >
                <span class="text-base block">{p.emoji}</span>
                <span class="block text-[10px] font-semibold mt-0.5" style={{ color: priority.value === p.value ? p.color : 'inherit' }}>{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Hospital with autocomplete */}
        <div class="relative">
          <label class={LABEL}>Hospital o lugar donde se encuentra</label>
          <input
            class={INPUT}
            value={hospitalName.value}
            onInput={(e) => { hospitalName.value = (e.target as HTMLInputElement).value }}
            onFocus={() => { hospitalFocused.value = true }}
            onBlur={() => { setTimeout(() => { hospitalFocused.value = false }, 200) }}
            placeholder="Ej: Hospital Vargas de Caracas"
          />
          {hospitalSuggestions.value.length > 0 && (
            <div class="absolute z-50 left-0 right-0 mt-1 bg-nodo-card border border-nodo-border rounded-xl overflow-hidden shadow-lg shadow-black/40">
              {hospitalSuggestions.value.map(h => (
                <button
                  key={h}
                  type="button"
                  class="w-full text-left px-3 py-2.5 text-sm hover:bg-white/[0.06] transition-colors flex items-center gap-2"
                  onMouseDown={(e) => { e.preventDefault(); hospitalName.value = h; hospitalFocused.value = false }}
                >
                  <span class="text-nodo-muted">🏥</span>
                  <span>{h}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Patient info */}
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class={LABEL}>Nombre del paciente (opcional)</label>
            <input class={INPUT} value={patientName.value} onInput={(e) => { patientName.value = (e.target as HTMLInputElement).value }} placeholder="Nombre" />
          </div>
          <div>
            <label class={LABEL}>Donantes necesarios</label>
            <input class={INPUT} type="number" min="1" value={donorCount.value} onInput={(e) => { donorCount.value = (e.target as HTMLInputElement).value }} placeholder="Cantidad" />
          </div>
        </div>

        {/* Blood type */}
        <div>
          <label class={LABEL}>Grupo sanguineo</label>
          <div class="flex flex-wrap gap-2">
            {BLOOD_TYPES.map(bt => (
              <button
                key={bt.value}
                type="button"
                onClick={() => { bloodType.value = bt.value }}
                class="rounded-lg px-3 py-2 text-sm font-semibold transition-all border"
                style={{
                  background: bloodType.value === bt.value ? 'rgba(225,29,72,0.15)' : 'var(--nodo-card)',
                  borderColor: bloodType.value === bt.value ? '#e11d48' : 'var(--nodo-border)',
                  color: bloodType.value === bt.value ? '#e11d48' : 'inherit',
                }}
              >
                {bt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Date and time */}
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class={LABEL}>Fecha</label>
            <input class={INPUT} type="date" value={requestDate.value} onInput={(e) => { requestDate.value = (e.target as HTMLInputElement).value }} />
          </div>
          <div>
            <label class={LABEL}>Hora aproximada</label>
            <input class={INPUT} type="time" value={requestTime.value} onInput={(e) => { requestTime.value = (e.target as HTMLInputElement).value }} />
          </div>
        </div>

        {/* Description */}
        <div>
          <label class={LABEL}>Descripcion</label>
          <textarea class={`${INPUT} min-h-[80px] resize-none`} value={description.value} onInput={(e) => { description.value = (e.target as HTMLTextAreaElement).value }} placeholder='Ej: "Mi papa necesita dos donantes O+ para una cirugia."' />
        </div>

        {/* Contact */}
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class={LABEL}>WhatsApp</label>
            <input class={INPUT} type="tel" value={contactWhatsapp.value} onInput={(e) => { contactWhatsapp.value = (e.target as HTMLInputElement).value }} placeholder="+58 412..." />
          </div>
          <div>
            <label class={LABEL}>Telefono</label>
            <input class={INPUT} type="tel" value={contactPhone.value} onInput={(e) => { contactPhone.value = (e.target as HTMLInputElement).value }} placeholder="0212..." />
          </div>
        </div>

        {/* Location */}
        <div>
          <label class={LABEL}>Ubicacion del hospital</label>
          <LocationPicker
            compact
            onLocationChange={(loc) => {
              lat.value = loc.lat
              lng.value = loc.lng
              city.value = loc.city
              sector.value = loc.sector
            }}
          />
        </div>

        {error.value && (
          <div class="bg-red-900/40 border border-red-700/40 rounded-xl p-3 text-red-300 text-sm text-center">
            {error.value}
          </div>
        )}

        <Button type="submit" size="lg" fullWidth loading={submitting.value} disabled={submitting.value}>
          Publicar solicitud
        </Button>

        <p class="text-[10px] text-nodo-muted text-center leading-relaxed">
          Esta solicitud sera visible publicamente en el mapa de NODO. La comunicacion ocurre directamente entre las personas, sin intermediacion de NODO.
        </p>
      </form>
    </div>
  )
}
