import { useSignal } from '@preact/signals'
import { useLocation } from 'preact-iso'
import { Button } from '../components/ui/Button'
import { LocationPicker } from '../components/ui/LocationPicker'
import { ContactPicker, type ContactMethod } from '../components/ui/ContactPicker'
import { PhotoInput } from '../components/ui/PhotoInput'
import { INCIDENT_TYPES, URGENCY_LEVELS, PROTECTION_TYPES, OBSERVED_STATES } from '../lib/constants'
import { supabase } from '../lib/supabase'
import { enqueue } from '../lib/sync'
import { getDeviceId } from '../lib/device'
import { getEmergency } from '../store/emergency'
import { emergencyLoaded } from '../store/emergency'
import { refreshPendingCount } from '../hooks/useOfflineQueue'
import { triggerMapRefresh } from '../store/map-refresh'
import type { IncidentType, UrgencyLevel, ProtectionType } from '../types'

type ReportCategory = '' | 'infrastructure' | 'protection'

interface NearbyReport {
  id: string
  name: string
  description: string | null
  metadata: Record<string, unknown>
  created_at: string
}

export function ReportIncident() {
  const { route } = useLocation()
  const submitting = useSignal(false)
  const submitted = useSignal(false)
  const submitError = useSignal<string | null>(null)

  const category = useSignal<ReportCategory>('')
  const incidentType = useSignal<IncidentType | ''>('')
  const protectionType = useSignal<ProtectionType | ''>('')
  const urgency = useSignal<UrgencyLevel>('high')
  const description = useSignal('')
  const reporterName = useSignal('')
  const location = useSignal<{ lat: number | null; lng: number | null; city: string; sector: string } | null>(null)
  const contact = useSignal<{ method: ContactMethod; value: string } | null>(null)

  const subjectName = useSignal('')
  const approximateAge = useSignal('')
  const subjectCount = useSignal('1')
  const observedState = useSignal('unknown')
  const photoBlob = useSignal<Blob | null>(null)

  const duplicateReport = useSignal<NearbyReport | null>(null)
  const showDuplicateModal = useSignal(false)
  const addingToExisting = useSignal(false)
  const addedToExisting = useSignal(false)

  const hasType = category.value === 'infrastructure' ? !!incidentType.value : !!protectionType.value

  async function checkForDuplicates(): Promise<NearbyReport | null> {
    if (!supabase || !location.value?.lat || !location.value?.lng || !protectionType.value) return null
    try {
      const lat = location.value.lat
      const lng = location.value.lng
      const delta = 0.001
      const cutoff = new Date(Date.now() - 24 * 3600000).toISOString()

      const { data } = await supabase
        .from('points_of_interest')
        .select('id,name,description,metadata,created_at')
        .eq('poi_type', 'protection')
        .eq('is_active', true)
        .gte('created_at', cutoff)
        .gte('latitude', lat - delta)
        .lte('latitude', lat + delta)
        .gte('longitude', lng - delta)
        .lte('longitude', lng + delta)
        .limit(5)

      if (!data || data.length === 0) return null

      const match = data.find((r: Record<string, unknown>) => {
        const meta = (r.metadata || {}) as Record<string, unknown>
        return meta.protection_type === protectionType.value && meta.status !== 'closed' && meta.status !== 'resolved'
      })

      return match ? match as unknown as NearbyReport : null
    } catch {
      return null
    }
  }

  async function addUpdateToExisting(poiId: string) {
    if (!supabase) return
    addingToExisting.value = true
    try {
      const { data: poi } = await supabase.from('points_of_interest').select('metadata').eq('id', poiId).single()
      const meta = (poi?.metadata || {}) as Record<string, unknown>
      const updates = (meta.updates || []) as Array<Record<string, unknown>>
      const text = description.value.trim() || 'Un usuario confirmo la situacion'
      updates.push({ text, timestamp: new Date().toISOString(), device_id: getDeviceId() })
      await supabase.from('points_of_interest').update({ metadata: { ...meta, updates } }).eq('id', poiId)
      triggerMapRefresh()
      addedToExisting.value = true
      showDuplicateModal.value = false
    } catch {
      submitError.value = 'Error al agregar informacion.'
    } finally {
      addingToExisting.value = false
    }
  }

  const handleSubmit = async (e: Event) => {
    e.preventDefault()
    if (!hasType || !location.value || submitting.value) return

    if (category.value === 'protection') {
      submitting.value = true
      const nearby = await checkForDuplicates()
      submitting.value = false
      if (nearby) {
        duplicateReport.value = nearby
        showDuplicateModal.value = true
        return
      }
    }

    await doSubmit()
  }

  const doSubmit = async () => {
    if (!hasType || !location.value || submitting.value) return
    submitting.value = true
    submitError.value = null

    try {
      const emergency = getEmergency()

      if (category.value === 'protection') {
        const typeInfo = PROTECTION_TYPES.find(t => t.value === protectionType.value)
        await enqueue('points_of_interest', {
          emergency_id: emergency.id,
          poi_type: 'protection',
          name: typeInfo?.label ?? 'Proteccion',
          latitude: location.value!.lat ?? 0,
          longitude: location.value!.lng ?? 0,
          city: location.value!.city,
          sector: location.value!.sector,
          description: description.value || null,
          is_active: true,
          verified: false,
          metadata: {
            protection_type: protectionType.value,
            urgency: urgency.value,
            status: 'active',
            icon: typeInfo?.icon ?? '🛡️',
            reporter_name: reporterName.value.trim() || null,
            contact_method: contact.value?.method ?? null,
            contact_value: contact.value?.value ?? null,
            subject_name: subjectName.value.trim() || null,
            approximate_age: approximateAge.value ? parseInt(approximateAge.value) : null,
            subject_count: parseInt(subjectCount.value) || 1,
            observed_state: observedState.value,
            updates: [],
          },
          device_id: getDeviceId(),
        })
      } else {
        const typeInfo = INCIDENT_TYPES.find(t => t.value === incidentType.value)
        await enqueue('points_of_interest', {
          emergency_id: emergency.id,
          poi_type: 'incident',
          name: typeInfo?.label ?? 'Incidente',
          latitude: location.value!.lat ?? 0,
          longitude: location.value!.lng ?? 0,
          city: location.value!.city,
          sector: location.value!.sector,
          description: description.value || null,
          is_active: true,
          verified: false,
          metadata: {
            incident_type: incidentType.value,
            urgency: urgency.value,
            status: 'active',
            icon: typeInfo?.icon ?? '⚠️',
            reporter_name: reporterName.value.trim() || null,
            contact_method: contact.value?.method ?? null,
            contact_value: contact.value?.value ?? null,
          },
          device_id: getDeviceId(),
        })
      }

      await refreshPendingCount()
      triggerMapRefresh()
      submitted.value = true
    } catch {
      submitError.value = 'Error al enviar. El reporte sera enviado cuando haya conexion.'
    } finally {
      submitting.value = false
    }
  }

  const resetForm = () => {
    submitted.value = false
    addedToExisting.value = false
    category.value = ''
    incidentType.value = ''
    protectionType.value = ''
    description.value = ''
    location.value = null
    subjectName.value = ''
    approximateAge.value = ''
    subjectCount.value = '1'
    observedState.value = 'unknown'
    photoBlob.value = null
    duplicateReport.value = null
    showDuplicateModal.value = false
  }

  if (addedToExisting.value) {
    return (
      <div class="p-4 pb-20 text-center max-w-lg mx-auto">
        <div class="mt-12 mb-6">
          <div class="text-6xl mb-4">✅</div>
          <h2 class="text-xl font-bold mb-2">Informacion agregada</h2>
          <p class="text-nodo-muted">Tu actualizacion se agrego al reporte existente.</p>
        </div>
        <div class="space-y-3">
          <Button fullWidth onClick={resetForm}>Reportar otro</Button>
          <Button fullWidth variant="secondary" onClick={() => route('/mapa')}>Ver en el mapa</Button>
          <Button fullWidth variant="ghost" onClick={() => route('/')}>Volver al inicio</Button>
        </div>
      </div>
    )
  }

  if (submitted.value) {
    const isProtection = category.value === 'protection'
    return (
      <div class="p-4 pb-20 text-center max-w-lg mx-auto">
        <div class="mt-12 mb-6">
          <div class="text-6xl mb-4">{isProtection ? '🛡️' : '⚠️'}</div>
          <h2 class="text-xl font-bold mb-2">{isProtection ? 'Alerta registrada' : 'Incidente reportado'}</h2>
          <p class="text-nodo-muted">Tu reporte ha sido registrado y aparecera en el mapa.</p>
          {isProtection && (
            <div class="bg-amber-900/30 border border-amber-700/40 rounded-xl p-3 mt-4 text-left">
              <p class="text-amber-300 text-sm">⚠️ Reporte ciudadano — Pendiente de verificacion.</p>
            </div>
          )}
        </div>
        <div class="space-y-3">
          <Button fullWidth onClick={resetForm}>Reportar otro</Button>
          <Button fullWidth variant="secondary" onClick={() => route('/mapa')}>Ver en el mapa</Button>
          <Button fullWidth variant="ghost" onClick={() => route('/')}>Volver al inicio</Button>
        </div>
      </div>
    )
  }

  return (
    <div class="p-4 pb-20 max-w-lg mx-auto">
      <div class="flex items-center gap-3 mb-6">
        <button class="w-9 h-9 flex items-center justify-center rounded-xl bg-nodo-card border border-nodo-border hover:bg-white/[0.06] transition-colors" aria-label="Volver" onClick={() => category.value ? (category.value = '') : route('/')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <h2 class="text-xl font-bold">
          {!category.value ? 'Reportar incidente' : category.value === 'protection' ? '🛡️ Proteccion y rescate' : '⚠️ Incidente de infraestructura'}
        </h2>
      </div>

      {!emergencyLoaded.value && (
        <div class="bg-yellow-900/40 border border-yellow-700/50 rounded-xl p-3 mb-4">
          <p class="text-yellow-200 text-sm text-center">Conectando con el servidor...</p>
        </div>
      )}

      {/* Step 1: Category selection */}
      {!category.value && (
        <div class="space-y-4">
          <p class="text-nodo-muted text-sm">Selecciona el tipo de reporte:</p>
          <div class="grid grid-cols-1 gap-3">
            <button
              type="button"
              class="p-5 rounded-xl text-left border-2 border-orange-600/40 bg-orange-900/20 hover:bg-orange-900/40 transition-colors"
              onClick={() => { category.value = 'infrastructure' }}
            >
              <div class="flex items-center gap-4">
                <span class="text-4xl">⚠️</span>
                <div>
                  <div class="text-base font-bold text-white">Infraestructura y entorno</div>
                  <div class="text-sm text-nodo-muted mt-0.5">Derrumbes, inundaciones, incendios, vias bloqueadas, fallas de servicios</div>
                </div>
              </div>
            </button>

            <button
              type="button"
              class="p-5 rounded-xl text-left border-2 border-purple-600/40 bg-purple-900/20 hover:bg-purple-900/40 transition-colors"
              onClick={() => { category.value = 'protection' }}
            >
              <div class="flex items-center gap-4">
                <span class="text-4xl">🛡️</span>
                <div>
                  <div class="text-base font-bold text-white">Proteccion y rescate</div>
                  <div class="text-sm text-nodo-muted mt-0.5">Personas vulnerables, menores, adultos mayores, mascotas perdidas o en riesgo</div>
                </div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Form */}
      {category.value && (
        <form class="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label class="block text-sm text-nodo-muted mb-1">Tu nombre o apodo <span class="opacity-50">(opcional)</span></label>
            <input
              type="text"
              class="w-full bg-nodo-dark border border-nodo-border rounded-lg p-3 text-white"
              placeholder="Ej: Carlos, Ana, Bomberos Chacao..."
              value={reporterName.value}
              onInput={(e) => { reporterName.value = (e.target as HTMLInputElement).value }}
            />
          </div>

          {/* Infrastructure sub-types */}
          {category.value === 'infrastructure' && (
            <div>
              <label class="block text-sm text-nodo-muted mb-2">Tipo de incidente</label>
              <div class="grid grid-cols-3 gap-2">
                {INCIDENT_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    class={`p-3 rounded-lg text-sm font-medium border transition-colors text-center ${
                      incidentType.value === type.value
                        ? 'bg-orange-700 border-orange-500 text-white'
                        : 'bg-nodo-card border-nodo-border text-nodo-muted hover:text-white'
                    }`}
                    onClick={() => { incidentType.value = type.value }}
                  >
                    <span class="block text-lg mb-0.5" aria-hidden="true">{type.icon}</span>
                    <span class="block text-[11px] leading-tight">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Protection sub-types */}
          {category.value === 'protection' && (
            <div>
              <label class="block text-sm text-nodo-muted mb-2">Tipo de alerta</label>
              <div class="grid grid-cols-2 gap-2">
                {PROTECTION_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    class={`p-3 rounded-xl text-sm font-medium border transition-colors text-left min-h-[56px] ${
                      protectionType.value === type.value
                        ? 'bg-purple-700 border-purple-500 text-white'
                        : 'bg-nodo-card border-nodo-border text-nodo-muted hover:text-white'
                    }`}
                    onClick={() => { protectionType.value = type.value }}
                  >
                    <span class="text-xl mr-2" aria-hidden="true">{type.icon}</span>
                    <span class="text-[12px] leading-tight">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Urgency level */}
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

          {/* Protection-specific fields */}
          {category.value === 'protection' && (
            <>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-sm text-nodo-muted mb-1">Nombre <span class="opacity-50">(opcional)</span></label>
                  <input
                    type="text"
                    class="w-full bg-nodo-dark border border-nodo-border rounded-lg p-3 text-white"
                    placeholder="De la persona o mascota"
                    value={subjectName.value}
                    onInput={(e) => { subjectName.value = (e.target as HTMLInputElement).value }}
                  />
                </div>
                <div>
                  <label class="block text-sm text-nodo-muted mb-1">Edad aprox. <span class="opacity-50">(opcional)</span></label>
                  <input
                    type="number"
                    inputMode="numeric"
                    class="w-full bg-nodo-dark border border-nodo-border rounded-lg p-3 text-white"
                    placeholder="Ej: 5"
                    value={approximateAge.value}
                    onInput={(e) => { approximateAge.value = (e.target as HTMLInputElement).value }}
                    min="0"
                    max="150"
                  />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-sm text-nodo-muted mb-1">Cantidad</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    class="w-full bg-nodo-dark border border-nodo-border rounded-lg p-3 text-white"
                    value={subjectCount.value}
                    onInput={(e) => { subjectCount.value = (e.target as HTMLInputElement).value }}
                    min="1"
                    max="100"
                  />
                </div>
                <div>
                  <label class="block text-sm text-nodo-muted mb-1">Estado observado</label>
                  <select
                    class="w-full bg-nodo-dark border border-nodo-border rounded-lg p-3 text-white min-h-[44px]"
                    value={observedState.value}
                    onChange={(e) => { observedState.value = (e.target as HTMLSelectElement).value }}
                  >
                    {OBSERVED_STATES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <PhotoInput onPhoto={(blob) => { photoBlob.value = blob }} label="Fotografia (opcional)" />
            </>
          )}

          <LocationPicker onLocationChange={(loc) => { location.value = loc }} />

          <div>
            <label class="block text-sm text-nodo-muted mb-1">Descripcion</label>
            <textarea
              class="w-full bg-nodo-dark border border-nodo-border rounded-lg p-3 text-white min-h-[80px] resize-none"
              placeholder={category.value === 'protection'
                ? 'Describe lo que observas: aspecto, vestimenta, comportamiento, raza de la mascota...'
                : 'Describe la situacion...'}
              value={description.value}
              onInput={(e) => { description.value = (e.target as HTMLTextAreaElement).value }}
            />
          </div>

          <ContactPicker onContactChange={(c) => { contact.value = c }} />

          {category.value === 'protection' && (
            <div class="bg-amber-900/20 border border-amber-700/30 rounded-xl p-3">
              <p class="text-amber-300/80 text-xs leading-relaxed">
                ⚠️ Este es un reporte ciudadano. La informacion no esta confirmada. NODO no se hace responsable de la veracidad de los datos.
              </p>
            </div>
          )}

          {submitError.value && (
            <p class="text-amber-400 text-sm text-center">{submitError.value}</p>
          )}

          <Button
            type="submit"
            variant="primary"
            size="xl"
            fullWidth
            loading={submitting.value}
            disabled={!hasType || !location.value}
            class={category.value === 'protection' ? '!bg-purple-600 hover:!bg-purple-500' : '!bg-orange-600 hover:!bg-orange-500'}
          >
            {category.value === 'protection' ? '🛡️ Publicar alerta' : '⚠️ Reportar incidente'}
          </Button>
        </form>
      )}

      {/* Duplicate detection modal */}
      {showDuplicateModal.value && duplicateReport.value && (
        <div class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4" onClick={(e) => { if (e.target === e.currentTarget) showDuplicateModal.value = false }}>
          <div class="bg-nodo-card border border-nodo-border rounded-2xl p-5 max-w-sm w-full space-y-4">
            <div class="text-center">
              <div class="text-4xl mb-2">📍</div>
              <h3 class="text-lg font-bold text-white">Reporte similar cercano</h3>
              <p class="text-nodo-muted text-sm mt-1">Ya existe un reporte de este tipo a menos de 100 metros.</p>
            </div>

            <div class="bg-purple-900/30 border border-purple-700/40 rounded-xl p-3">
              <div class="font-semibold text-white text-sm">{duplicateReport.value.name}</div>
              {duplicateReport.value.description && (
                <p class="text-nodo-muted text-xs mt-1">{duplicateReport.value.description}</p>
              )}
              <p class="text-purple-400 text-xs mt-1">
                {(() => {
                  const meta = duplicateReport.value!.metadata
                  const ps = PROTECTION_TYPES.find(t => t.value === meta.protection_type)
                  return ps ? `${ps.icon} ${ps.label}` : '🛡️ Proteccion'
                })()}
              </p>
            </div>

            <div class="space-y-2">
              <Button
                fullWidth
                variant="primary"
                class="!bg-purple-600"
                loading={addingToExisting.value}
                onClick={() => addUpdateToExisting(duplicateReport.value!.id)}
              >
                ✅ Agregar informacion al reporte existente
              </Button>
              <Button
                fullWidth
                variant="secondary"
                onClick={() => route('/mapa')}
              >
                📍 Ver en el mapa
              </Button>
              <Button
                fullWidth
                variant="ghost"
                onClick={() => { showDuplicateModal.value = false; doSubmit() }}
              >
                Crear reporte nuevo de todas formas
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
