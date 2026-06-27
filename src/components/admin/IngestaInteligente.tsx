import { useSignal } from '@preact/signals'
import { classifyContent, classifyImage, CONTENT_CLASS_LABELS, type ClassificationResult, type ContentClass, type OcrProgressCallback } from '../../lib/universal-classifier'
import { supabase } from '../../lib/supabase'
import { getEmergencyId } from '../../store/emergency'
import { getDeviceId } from '../../lib/device'
import { saveCampaign } from '../../store/campaigns'
import type { CampaignLocation } from '../../types'

type IngestaMode = 'idle' | 'processing' | 'review' | 'published'

function ConfidenceBadge({ value }: { value: number }) {
  const color = value >= 85 ? '#22c55e' : value >= 65 ? '#eab308' : '#ef4444'
  const emoji = value >= 85 ? '🟢' : value >= 65 ? '🟡' : '🔴'
  return (
    <span class="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${color}18`, color }}>
      {emoji} {value}%
    </span>
  )
}

const INPUT = 'w-full bg-nodo-dark border border-nodo-border rounded-xl p-3.5 text-white text-base min-h-[48px]'

export function IngestaInteligente() {
  const mode = useSignal<IngestaMode>('idle')
  const textInput = useSignal('')
  const result = useSignal<ClassificationResult | null>(null)
  const overrideClass = useSignal<ContentClass | null>(null)
  const publishing = useSignal(false)
  const publishResult = useSignal<string | null>(null)
  const error = useSignal<string | null>(null)
  const ocrProgress = useSignal(0)
  const ocrStatus = useSignal('')

  // Editable fields — populated once from AI, then user controls them
  const editTitle = useSignal('')
  const editDescription = useSignal('')
  const editPhone = useSignal('')
  const editWhatsapp = useSignal('')
  const editOrganization = useSignal('')
  const editHours = useSignal('')
  const editLocations = useSignal('')
  const editRequirements = useSignal('')

  const populateEditable = (r: ClassificationResult) => {
    editTitle.value = r.title || ''
    editDescription.value = (r.fields.description?.value as string) || r.description || ''
    editPhone.value = (r.fields.phone?.value as string) || ''
    editWhatsapp.value = (r.fields.whatsapp?.value as string) || ''
    editOrganization.value = (r.fields.organization?.value as string) || ''
    editHours.value = (r.fields.hours?.value as string) || ''
    editLocations.value = Array.isArray(r.fields.locations?.value) ? (r.fields.locations.value as string[]).join(', ') : ''
    editRequirements.value = Array.isArray(r.fields.requirements?.value) ? (r.fields.requirements.value as string[]).join('\n') : ''
  }

  const processText = async () => {
    if (!textInput.value.trim()) return
    mode.value = 'processing'
    error.value = null
    try {
      await new Promise(r => setTimeout(r, 100))
      result.value = classifyContent(textInput.value)
      overrideClass.value = null
      populateEditable(result.value)
      mode.value = 'review'
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Error al procesar'
      mode.value = 'idle'
    }
  }

  const processImage = async (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return
    mode.value = 'processing'
    error.value = null
    ocrProgress.value = 0
    ocrStatus.value = 'Cargando imagen...'
    try {
      const onProgress: OcrProgressCallback = (p, s) => {
        ocrProgress.value = p
        ocrStatus.value = s
      }
      result.value = await classifyImage(file, onProgress)
      overrideClass.value = null
      if (result.value.rawText) {
        textInput.value = result.value.rawText
        populateEditable(result.value)
        mode.value = 'review'
      } else {
        error.value = 'No se detecto texto en la imagen. Puede pegar el texto manualmente o publicar la imagen directamente.'
        textInput.value = ''
        mode.value = 'idle'
      }
    } catch (err) {
      console.error('[Ingesta] OCR error:', err)
      error.value = err instanceof Error ? err.message : 'Error al procesar imagen'
      mode.value = 'idle'
    }
  }

  const publish = async () => {
    if (!result.value || !supabase) return
    publishing.value = true
    publishResult.value = null
    error.value = null

    const r = result.value
    const cls = overrideClass.value || r.contentClass
    const emergencyId = getEmergencyId()
    const deviceId = getDeviceId()

    const t = editTitle.value.trim() || r.title
    const d = editDescription.value.trim() || r.description
    const ph = editPhone.value.trim() || null
    const wa = editWhatsapp.value.trim() || null
    const org = editOrganization.value.trim() || null
    const hrs = editHours.value.trim() || null
    const locsArr = editLocations.value.trim() ? editLocations.value.split(',').map(s => s.trim()).filter(Boolean) : (Array.isArray(r.fields.locations?.value) ? r.fields.locations.value as string[] : [])
    const reqsArr = editRequirements.value.trim() ? editRequirements.value.split('\n').map(s => s.trim()).filter(Boolean) : (Array.isArray(r.fields.requirements?.value) ? r.fields.requirements.value as string[] : [])

    try {
      if (cls === 'missing_person') {
        const parts = t.split(' ')
        const firstName = parts[0] || ''
        const lastName = parts.slice(1).join(' ') || ''
        const { error: err } = await supabase.from('persons').insert({
          emergency_id: emergencyId,
          first_name: firstName,
          last_name: lastName,
          approx_age: (r.fields.age?.value as number) || null,
          description: d,
          current_status: 'unknown',
          city: null,
          is_found: false,
          device_id: deviceId,
        })
        if (err) throw err
        publishResult.value = `Persona desaparecida "${firstName} ${lastName}" registrada correctamente.`

      } else if (cls === 'found_person') {
        const parts = t.split(' ')
        const { error: err } = await supabase.from('persons').insert({
          emergency_id: emergencyId,
          first_name: parts[0] || '',
          last_name: parts.slice(1).join(' ') || '',
          description: d,
          current_status: 'ok',
          is_found: true,
          found_at: new Date().toISOString(),
          device_id: deviceId,
        })
        if (err) throw err
        publishResult.value = 'Persona encontrada registrada correctamente.'

      } else if (cls === 'blood_request') {
        const { error: err } = await supabase.from('points_of_interest').insert({
          emergency_id: emergencyId,
          poi_type: 'health_request',
          name: t,
          description: d,
          latitude: 10.4806,
          longitude: -66.9036,
          is_active: true,
          verified: false,
          metadata: {
            health_type: 'blood_donors',
            blood_type: r.fields.bloodType?.value || 'not_applicable',
            donor_count: r.fields.donorCount?.value || null,
            donors_confirmed: 0,
            priority: r.fields.urgency?.value || 'high',
            contact_whatsapp: wa,
            hospital_name: locsArr[0] || null,
            status: 'active',
            source: 'ingesta_ia',
          },
          device_id: deviceId,
        })
        if (err) throw err
        publishResult.value = 'Solicitud de sangre publicada correctamente.'

      } else if (cls === 'help_request') {
        const helpTypes = (r.fields.helpTypes?.value as string[]) || ['other']
        const { error: err } = await supabase.from('help_requests').insert({
          emergency_id: emergencyId,
          latitude: 10.4806,
          longitude: -66.9036,
          help_types: helpTypes,
          urgency: r.fields.urgency?.value || 'medium',
          status: 'pending',
          description: d,
          device_id: deviceId,
        })
        if (err) throw err
        publishResult.value = 'Solicitud de ayuda publicada correctamente.'

      } else if (cls === 'help_offer') {
        const offerTypes = (r.fields.helpTypes?.value as string[]) || ['other']
        const { error: err } = await supabase.from('help_offers').insert({
          emergency_id: emergencyId,
          latitude: 10.4806,
          longitude: -66.9036,
          offer_types: offerTypes,
          status: 'available',
          description: d,
          device_id: deviceId,
        })
        if (err) throw err
        publishResult.value = 'Oferta de ayuda publicada correctamente.'

      } else if (cls === 'campaign' || cls === 'community_kitchen') {
        const locs: CampaignLocation[] = locsArr.map(name => ({ name }))
        await saveCampaign({
          title: t,
          description: d,
          campaign_type: cls === 'community_kitchen' ? 'community_kitchen' : 'general',
          organization: org,
          start_date: (r.fields.startDate?.value as string) || null,
          end_date: (r.fields.endDate?.value as string) || null,
          opening_hours: hrs,
          locations: locs,
          requirements: reqsArr,
          contact_phone: ph,
          whatsapp: wa,
          status: 'active',
          verification_level: 'nodo',
        } as Record<string, unknown>)
        publishResult.value = 'Campana publicada correctamente.'

      } else if (cls === 'incident') {
        const { error: err } = await supabase.from('points_of_interest').insert({
          emergency_id: emergencyId,
          poi_type: 'incident',
          name: t,
          description: d,
          latitude: 10.4806,
          longitude: -66.9036,
          is_active: true,
          verified: false,
          metadata: { source: 'ingesta_ia' },
          device_id: deviceId,
        })
        if (err) throw err
        publishResult.value = 'Incidente registrado correctamente.'

      } else if (cls === 'shelter') {
        const { error: err } = await supabase.from('shelters').insert({
          emergency_id: emergencyId,
          name: t,
          latitude: 10.4806,
          longitude: -66.9036,
          status: 'active',
          capacity: 0,
          current_occupancy: 0,
          notes: d,
          device_id: deviceId,
        })
        if (err) throw err
        publishResult.value = 'Refugio registrado correctamente.'

      } else if (cls === 'collection_center') {
        const { error: err } = await supabase.from('points_of_interest').insert({
          emergency_id: emergencyId,
          poi_type: 'collection_center',
          name: t,
          description: d,
          latitude: 10.4806,
          longitude: -66.9036,
          is_active: true,
          verified: false,
          metadata: { source: 'ingesta_ia', phone: ph },
          device_id: deviceId,
        })
        if (err) throw err
        publishResult.value = 'Centro de acopio registrado correctamente.'

      } else {
        publishResult.value = `Tipo "${CONTENT_CLASS_LABELS[cls]?.label}" guardado como nota interna.`
      }

      mode.value = 'published'
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Error al publicar'
    } finally {
      publishing.value = false
    }
  }

  const reset = () => {
    mode.value = 'idle'
    textInput.value = ''
    result.value = null
    overrideClass.value = null
    publishResult.value = null
    error.value = null
    editTitle.value = ''
    editDescription.value = ''
    editPhone.value = ''
    editWhatsapp.value = ''
    editOrganization.value = ''
    editHours.value = ''
    editLocations.value = ''
    editRequirements.value = ''
  }

  const currentClass = overrideClass.value || result.value?.contentClass || 'other'
  const classInfo = CONTENT_CLASS_LABELS[currentClass]

  // --- PUBLISHED ---
  if (mode.value === 'published') {
    return (
      <div class="space-y-4">
        <div class="bg-emerald-900/30 border border-emerald-700/40 rounded-2xl p-5 text-center">
          <div class="text-4xl mb-3">✅</div>
          <p class="text-sm font-semibold text-emerald-300">{publishResult.value}</p>
        </div>
        <button onClick={reset} class="w-full bg-nodo-card border border-nodo-border rounded-xl py-3.5 text-sm font-semibold active:scale-[0.97] transition-transform">
          Procesar otro contenido
        </button>
      </div>
    )
  }

  // --- REVIEW ---
  if (mode.value === 'review' && result.value) {
    const r = result.value
    return (
      <div class="space-y-4">
        {/* Classification header */}
        <div class="bg-nodo-card border border-nodo-border rounded-2xl p-4">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: `${classInfo.color}18` }}>
              {classInfo.icon}
            </div>
            <div class="flex-1">
              <p class="text-xs text-nodo-muted font-semibold uppercase tracking-wider">Clasificado como</p>
              <p class="text-base font-bold" style={{ color: classInfo.color }}>{classInfo.label}</p>
            </div>
            <ConfidenceBadge value={r.overallConfidence} />
          </div>

          {/* Override class */}
          <div>
            <p class="text-[11px] text-nodo-muted mb-1.5 font-medium">Cambiar tipo:</p>
            <div class="flex flex-wrap gap-1.5">
              {(Object.entries(CONTENT_CLASS_LABELS) as [ContentClass, { label: string; icon: string; color: string }][])
                .filter(([k]) => k !== 'other')
                .map(([key, info]) => (
                  <button
                    key={key}
                    onClick={() => { overrideClass.value = key === currentClass ? null : key }}
                    class={`text-[10px] font-semibold px-2 py-1 rounded-lg border transition-all ${
                      key === currentClass
                        ? 'bg-white/[0.10] border-white/20 text-white'
                        : 'bg-nodo-dark border-nodo-border text-nodo-muted hover:bg-white/[0.04]'
                    }`}
                  >
                    {info.icon} {info.label}
                  </button>
                ))}
            </div>
          </div>
        </div>

        {/* AI notice */}
        <div class="bg-amber-900/25 border border-amber-700/40 rounded-xl p-3 text-center">
          <span class="text-xs font-semibold text-amber-300">La IA realizo una propuesta. Revisa y corrige los datos antes de publicar.</span>
        </div>

        {/* Suggestions */}
        {r.suggestions.length > 0 && (
          <div class="bg-amber-900/20 border border-amber-700/30 rounded-xl p-3">
            <p class="text-[11px] font-bold text-amber-300 mb-1">Sugerencias:</p>
            {r.suggestions.map((s, i) => (
              <p key={i} class="text-[11px] text-amber-200/80">• {s}</p>
            ))}
          </div>
        )}

        {/* Editable fields */}
        <div class="space-y-3">
          <div>
            <label class="block text-xs text-nodo-muted font-semibold mb-1">Titulo</label>
            <input
              class="w-full bg-nodo-dark border border-nodo-border rounded-xl p-3 text-white text-sm"
              value={editTitle.value}
              onInput={(e) => { editTitle.value = (e.target as HTMLInputElement).value }}
              placeholder="Titulo del contenido"
            />
          </div>

          <div>
            <label class="block text-xs text-nodo-muted font-semibold mb-1">Descripcion</label>
            <textarea
              class="w-full bg-nodo-dark border border-nodo-border rounded-xl p-3 text-white text-sm min-h-[80px] resize-none"
              value={editDescription.value}
              onInput={(e) => { editDescription.value = (e.target as HTMLTextAreaElement).value }}
              placeholder="Descripcion o detalles"
            />
          </div>

          <div>
            <label class="block text-xs text-nodo-muted font-semibold mb-1">Organizacion</label>
            <input
              class="w-full bg-nodo-dark border border-nodo-border rounded-xl p-3 text-white text-sm"
              value={editOrganization.value}
              onInput={(e) => { editOrganization.value = (e.target as HTMLInputElement).value }}
              placeholder="Quien organiza (opcional)"
            />
          </div>

          <div>
            <label class="block text-xs text-nodo-muted font-semibold mb-1">Horario</label>
            <input
              class="w-full bg-nodo-dark border border-nodo-border rounded-xl p-3 text-white text-sm"
              value={editHours.value}
              onInput={(e) => { editHours.value = (e.target as HTMLInputElement).value }}
              placeholder="Ej: 7:00 AM a 4:00 PM"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs text-nodo-muted font-semibold mb-1">Telefono</label>
              <input
                class="w-full bg-nodo-dark border border-nodo-border rounded-xl p-3 text-white text-sm"
                type="tel"
                value={editPhone.value}
                onInput={(e) => { editPhone.value = (e.target as HTMLInputElement).value }}
                placeholder="0212..."
              />
            </div>
            <div>
              <label class="block text-xs text-nodo-muted font-semibold mb-1">WhatsApp</label>
              <input
                class="w-full bg-nodo-dark border border-nodo-border rounded-xl p-3 text-white text-sm"
                type="tel"
                value={editWhatsapp.value}
                onInput={(e) => { editWhatsapp.value = (e.target as HTMLInputElement).value }}
                placeholder="+58 412..."
              />
            </div>
          </div>

          <div>
            <label class="block text-xs text-nodo-muted font-semibold mb-1">Ubicaciones (separadas por coma)</label>
            <input
              class="w-full bg-nodo-dark border border-nodo-border rounded-xl p-3 text-white text-sm"
              value={editLocations.value}
              onInput={(e) => { editLocations.value = (e.target as HTMLInputElement).value }}
              placeholder="Hospital Central, Cruz Roja..."
            />
          </div>

          <div>
            <label class="block text-xs text-nodo-muted font-semibold mb-1">Requisitos (uno por linea)</label>
            <textarea
              class="w-full bg-nodo-dark border border-nodo-border rounded-xl p-3 text-white text-sm min-h-[60px] resize-none"
              value={editRequirements.value}
              onInput={(e) => { editRequirements.value = (e.target as HTMLTextAreaElement).value }}
              placeholder="Mayor de 18 anos&#10;Sin sintomas"
            />
          </div>
        </div>

        {/* Raw text preview */}
        <details class="bg-nodo-card border border-nodo-border rounded-2xl overflow-hidden">
          <summary class="px-4 py-3 text-xs text-nodo-muted font-semibold cursor-pointer hover:bg-white/[0.03]">Texto original</summary>
          <pre class="px-4 py-3 text-[11px] text-nodo-muted whitespace-pre-wrap border-t border-nodo-border max-h-40 overflow-y-auto">{r.rawText}</pre>
        </details>

        {error.value && (
          <div class="bg-red-900/30 border border-red-700/40 rounded-xl p-3 text-sm text-red-300">{error.value}</div>
        )}

        {/* Actions */}
        <div class="flex gap-3">
          <button onClick={reset} class="flex-1 bg-nodo-card border border-nodo-border rounded-xl py-3.5 text-sm font-semibold active:scale-[0.97] transition-transform">
            Cancelar
          </button>
          <button
            onClick={publish}
            disabled={publishing.value}
            class="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl py-3.5 text-sm active:scale-[0.95] transition-all disabled:opacity-50"
          >
            {publishing.value ? 'Publicando...' : '✅ Publicar'}
          </button>
        </div>
      </div>
    )
  }

  // --- PROCESSING ---
  if (mode.value === 'processing') {
    return (
      <div class="flex flex-col items-center justify-center py-12 gap-4">
        <div class="w-10 h-10 border-2 border-nodo-muted border-t-blue-400 rounded-full animate-spin" />
        <p class="text-sm text-nodo-muted">{ocrStatus.value || 'Analizando contenido...'}</p>
        {ocrProgress.value > 0 && (
          <div class="w-48">
            <div class="h-1.5 bg-nodo-border rounded-full overflow-hidden">
              <div class="h-full bg-blue-500 rounded-full transition-all duration-300" style={{ width: `${ocrProgress.value}%` }} />
            </div>
            <p class="text-[10px] text-nodo-muted text-center mt-1">{ocrProgress.value}%</p>
          </div>
        )}
      </div>
    )
  }

  // --- IDLE ---
  return (
    <div class="space-y-4">
      <div class="bg-nodo-card border border-nodo-border rounded-2xl p-4">
        <div class="text-center mb-4">
          <div class="text-3xl mb-2">🧠</div>
          <h3 class="text-sm font-bold">Ingesta Inteligente</h3>
          <p class="text-[11px] text-nodo-muted mt-1">
            Pegue texto o suba una imagen. La IA clasificara automaticamente el contenido y extraera la informacion relevante.
          </p>
        </div>

        {/* Image upload */}
        <div class="mb-3">
          <label class="block w-full bg-nodo-dark border-2 border-dashed border-nodo-border rounded-xl p-4 text-center cursor-pointer hover:bg-white/[0.03] transition-colors">
            <span class="text-2xl block mb-1">📷</span>
            <span class="text-xs text-nodo-muted font-medium">Subir imagen, flyer o captura</span>
            <input type="file" accept="image/*" class="hidden" onChange={processImage} />
          </label>
        </div>

        {/* Divider */}
        <div class="flex items-center gap-3 my-3">
          <div class="flex-1 h-px bg-nodo-border" />
          <span class="text-[10px] text-nodo-muted font-semibold">O PEGAR TEXTO</span>
          <div class="flex-1 h-px bg-nodo-border" />
        </div>

        {/* Text input */}
        <textarea
          class={`${INPUT} min-h-[140px] resize-none`}
          placeholder="Pegue aqui texto de WhatsApp, Instagram, Facebook, X, o cualquier fuente..."
          value={textInput.value}
          onInput={(e) => { textInput.value = (e.target as HTMLTextAreaElement).value }}
        />
      </div>

      {error.value && (
        <div class="bg-red-900/30 border border-red-700/40 rounded-xl p-3 text-sm text-red-300">{error.value}</div>
      )}

      <button
        onClick={processText}
        disabled={!textInput.value.trim()}
        class="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl py-3.5 text-sm active:scale-[0.95] transition-all disabled:opacity-40"
      >
        🧠 Clasificar contenido
      </button>

      {/* Supported types */}
      <div class="bg-nodo-card border border-nodo-border rounded-2xl p-4">
        <p class="text-[11px] text-nodo-muted font-semibold mb-2">Tipos que detecta automaticamente:</p>
        <div class="flex flex-wrap gap-1.5">
          {(Object.entries(CONTENT_CLASS_LABELS) as [ContentClass, { label: string; icon: string }][])
            .filter(([k]) => k !== 'other')
            .map(([, info]) => (
              <span key={info.label} class="text-[10px] bg-nodo-dark border border-nodo-border rounded-lg px-2 py-1">
                {info.icon} {info.label}
              </span>
            ))}
        </div>
      </div>
    </div>
  )
}
