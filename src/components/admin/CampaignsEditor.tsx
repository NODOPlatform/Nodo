import { useSignal } from '@preact/signals'
import { useEffect } from 'preact/hooks'
import { Button } from '../ui/Button'
import { supabase } from '../../lib/supabase'
import { getEmergencyId } from '../../store/emergency'
import { getDeviceId } from '../../lib/device'
import { CAMPAIGN_TYPES, VERIFICATION_LEVELS } from '../../lib/constants'
import { extractCampaignFromText, extractCampaignFromImage, type ExtractedCampaign } from '../../lib/campaign-extract'
import type { OfficialCampaign, CampaignType, VerificationLevel, CampaignLocation } from '../../types'

const INPUT = 'w-full bg-nodo-dark border border-nodo-border rounded-xl p-3.5 text-white text-base min-h-[48px]'
const LABEL = 'block text-sm text-nodo-muted mb-1.5 font-medium'

type EditorMode = 'list' | 'manual' | 'image' | 'review'

function ConfidenceBadge({ value }: { value: number }) {
  const color = value >= 85 ? '#22c55e' : value >= 65 ? '#eab308' : '#dc2626'
  const emoji = value >= 85 ? '🟢' : value >= 65 ? '🟡' : '🔴'
  const text = value >= 85 ? 'Informacion detectada correctamente' : value >= 65 ? 'Revisar algunos campos' : 'Revisar manualmente'
  return (
    <div class="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold" style={{ background: `${color}15`, border: `1px solid ${color}40` }}>
      <span>{emoji}</span>
      <span style={{ color }}>{value}%</span>
      <span class="text-nodo-muted text-xs font-normal">{text}</span>
    </div>
  )
}

function FieldConfidence({ value }: { value: number }) {
  if (value >= 0.85) return null
  const pct = Math.round(value * 100)
  const color = pct >= 65 ? '#eab308' : '#dc2626'
  return (
    <span class="text-[9px] font-bold px-1.5 py-0.5 rounded ml-1" style={{ color, background: `${color}18` }}>
      {pct}%
    </span>
  )
}

export function CampaignsEditor() {
  const mode = useSignal<EditorMode>('list')
  const allCampaigns = useSignal<OfficialCampaign[]>([])
  const loading = useSignal(true)
  const saving = useSignal(false)
  const lastMsg = useSignal<string | null>(null)
  const lastError = useSignal<string | null>(null)

  // Form state
  const title = useSignal('')
  const description = useSignal('')
  const campaignType = useSignal<CampaignType>('general')
  const organization = useSignal('')
  const startDate = useSignal('')
  const endDate = useSignal('')
  const openingHours = useSignal('')
  const verificationLevel = useSignal<VerificationLevel>('nodo')
  const locations = useSignal<CampaignLocation[]>([])
  const requirements = useSignal<string[]>([])
  const reqText = useSignal('')
  const contactPhone = useSignal('')
  const whatsapp = useSignal('')
  const website = useSignal('')
  const sourceUrl = useSignal('')
  const editId = useSignal<string | null>(null)

  // AI state
  const extracting = useSignal(false)
  const ocrText = useSignal('')
  const confidence = useSignal(0)
  const fieldConf = useSignal<Record<string, number>>({})

  const loadAll = async () => {
    if (!supabase) { loading.value = false; return }
    try {
      const { data, error } = await supabase
        .from('official_campaigns')
        .select('*')
        .neq('status', 'cancelled')
        .order('created_at', { ascending: false })
        .limit(100)
      if (error) {
        console.error('[CampaignsEditor] Supabase error:', error.code, error.message, error.details, error.hint)
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          console.warn('[CampaignsEditor] Tabla official_campaigns no existe. Ejecutar migracion 009_campaigns.sql en Supabase.')
        } else {
          lastError.value = `Error: ${error.message}`
        }
        return
      }
      allCampaigns.value = (data || []) as OfficialCampaign[]
    } catch (e) {
      console.error('[CampaignsEditor] load error:', e)
      lastError.value = e instanceof Error ? e.message : 'Error cargando campanas'
    } finally {
      loading.value = false
    }
  }

  useEffect(() => { loadAll() }, [])

  const resetForm = () => {
    title.value = ''
    description.value = ''
    campaignType.value = 'general'
    organization.value = ''
    startDate.value = ''
    endDate.value = ''
    openingHours.value = ''
    verificationLevel.value = 'nodo'
    locations.value = []
    requirements.value = []
    reqText.value = ''
    contactPhone.value = ''
    whatsapp.value = ''
    website.value = ''
    sourceUrl.value = ''
    editId.value = null
    confidence.value = 0
    fieldConf.value = {}
    ocrText.value = ''
  }

  const applyExtraction = (result: ExtractedCampaign) => {
    title.value = result.title
    description.value = result.description
    campaignType.value = result.campaignType
    organization.value = result.organization || ''
    startDate.value = result.startDate || ''
    endDate.value = result.endDate || ''
    openingHours.value = result.openingHours || ''
    locations.value = result.locations
    requirements.value = result.requirements
    reqText.value = result.requirements.join('\n')
    contactPhone.value = result.contactPhone || ''
    whatsapp.value = result.whatsapp || ''
    sourceUrl.value = result.sourceUrl || ''
    confidence.value = result.confidence
    fieldConf.value = result.fieldConfidence
    mode.value = 'review'
  }

  const handleImageUpload = async (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return
    extracting.value = true
    lastError.value = null
    try {
      const result = await extractCampaignFromImage(file)
      applyExtraction(result)
    } catch (err) {
      lastError.value = err instanceof Error ? err.message : 'Error procesando imagen'
    } finally {
      extracting.value = false
    }
  }

  const handleTextExtract = () => {
    if (!ocrText.value.trim()) return
    const result = extractCampaignFromText(ocrText.value)
    applyExtraction(result)
  }

  const openEdit = (c: OfficialCampaign) => {
    editId.value = c.id
    title.value = c.title
    description.value = c.description || ''
    campaignType.value = c.campaign_type
    organization.value = c.organization || ''
    startDate.value = c.start_date || ''
    endDate.value = c.end_date || ''
    openingHours.value = c.opening_hours || ''
    verificationLevel.value = c.verification_level
    locations.value = c.locations || []
    requirements.value = c.requirements || []
    reqText.value = (c.requirements || []).join('\n')
    contactPhone.value = c.contact_phone || ''
    whatsapp.value = c.whatsapp || ''
    website.value = c.website || ''
    sourceUrl.value = c.source_url || ''
    confidence.value = 0
    fieldConf.value = {}
    mode.value = 'manual'
  }

  const handleSave = async () => {
    if (!supabase || !title.value.trim()) { lastError.value = 'Titulo requerido'; return }
    saving.value = true
    lastError.value = null

    try {
      const emergencyId = getEmergencyId()
      if (!emergencyId) throw new Error('No hay emergencia activa')

      const payload: Record<string, unknown> = {
        emergency_id: emergencyId,
        title: title.value.trim(),
        description: description.value.trim() || null,
        campaign_type: campaignType.value,
        organization: organization.value.trim() || null,
        start_date: startDate.value || null,
        end_date: endDate.value || null,
        opening_hours: openingHours.value.trim() || null,
        verification_level: verificationLevel.value,
        status: 'active',
        locations: locations.value,
        requirements: requirements.value.length > 0 ? requirements.value : null,
        contact_phone: contactPhone.value.trim() || null,
        whatsapp: whatsapp.value.trim() || null,
        website: website.value.trim() || null,
        source_url: sourceUrl.value.trim() || null,
        device_id: getDeviceId(),
        metadata: {},
      }

      if (editId.value) {
        const { error } = await supabase
          .from('official_campaigns')
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq('id', editId.value)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('official_campaigns')
          .insert(payload)
        if (error) throw error
      }

      lastMsg.value = editId.value ? 'Campana actualizada' : 'Campana publicada'
      setTimeout(() => { lastMsg.value = null }, 3000)
      resetForm()
      mode.value = 'list'
      await loadAll()
    } catch (e) {
      lastError.value = e instanceof Error ? e.message : 'Error guardando'
    } finally {
      saving.value = false
    }
  }

  const handleDelete = async (id: string) => {
    if (!supabase) return
    try {
      const { error } = await supabase
        .from('official_campaigns')
        .update({ status: 'cancelled' })
        .eq('id', id)
      if (error) throw error
      allCampaigns.value = allCampaigns.value.filter(c => c.id !== id)
      lastMsg.value = 'Campana eliminada'
      setTimeout(() => { lastMsg.value = null }, 3000)
    } catch (e) {
      lastError.value = e instanceof Error ? e.message : 'Error eliminando'
    }
  }

  const addLocation = () => {
    locations.value = [...locations.value, { name: '' }]
  }
  const updateLocation = (idx: number, field: keyof CampaignLocation, value: string | number) => {
    const locs = [...locations.value]
    locs[idx] = { ...locs[idx], [field]: value }
    locations.value = locs
  }
  const removeLocation = (idx: number) => {
    locations.value = locations.value.filter((_, i) => i !== idx)
  }

  // --- Image upload / text extraction view ---
  if (mode.value === 'image') {
    return (
      <div class="space-y-4">
        <div class="bg-nodo-card border border-nodo-border rounded-2xl p-5 text-center">
          <div class="text-4xl mb-3">📷</div>
          <h3 class="font-bold mb-2">Crear desde imagen</h3>
          <p class="text-xs text-nodo-muted mb-4">Sube un flyer, afiche o captura de pantalla. La IA extraera la informacion automaticamente.</p>

          <label class="block cursor-pointer">
            <div class="bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl py-3 px-6 text-sm transition-colors inline-block">
              {extracting.value ? 'Procesando...' : '📤 Subir imagen'}
            </div>
            <input type="file" accept="image/*" class="hidden" onChange={handleImageUpload} disabled={extracting.value} />
          </label>

          {extracting.value && (
            <div class="mt-4 flex justify-center">
              <div class="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        <div class="text-center text-xs text-nodo-muted">o</div>

        <div class="bg-nodo-card border border-nodo-border rounded-2xl p-4">
          <label class={LABEL}>Pegar texto de la imagen</label>
          <textarea
            class={`${INPUT} min-h-[120px] resize-none`}
            value={ocrText.value}
            onInput={(e) => { ocrText.value = (e.target as HTMLTextAreaElement).value }}
            placeholder="Pega aqui el texto copiado del flyer, WhatsApp o red social..."
          />
          <Button
            fullWidth
            onClick={handleTextExtract}
            disabled={!ocrText.value.trim()}
            class="mt-3"
          >
            Extraer informacion
          </Button>
        </div>

        {lastError.value && (
          <div class="bg-red-900/40 border border-red-700/40 text-red-300 text-sm rounded-xl p-3">{lastError.value}</div>
        )}

        <button class="w-full text-sm text-nodo-muted font-medium py-2" onClick={() => { mode.value = 'list'; resetForm() }}>
          Cancelar
        </button>
      </div>
    )
  }

  // --- Form view (manual + review) ---
  if (mode.value === 'manual' || mode.value === 'review') {
    return (
      <div class="space-y-4">
        {mode.value === 'review' && confidence.value > 0 && (
          <div class="space-y-2">
            <div class="bg-amber-900/30 border border-amber-700/40 rounded-xl p-3 text-center">
              <span class="text-xs font-semibold text-amber-300">🟡 Revisar antes de publicar</span>
            </div>
            <ConfidenceBadge value={confidence.value} />
          </div>
        )}

        {/* Title */}
        <div>
          <label class={LABEL}>
            Titulo
            {fieldConf.value.title != null && <FieldConfidence value={fieldConf.value.title} />}
          </label>
          <input class={INPUT} value={title.value} onInput={(e) => { title.value = (e.target as HTMLInputElement).value }} placeholder="Nombre de la campana" />
        </div>

        {/* Type */}
        <div>
          <label class={LABEL}>
            Tipo de campana
            {fieldConf.value.campaignType != null && <FieldConfidence value={fieldConf.value.campaignType} />}
          </label>
          <div class="grid grid-cols-2 gap-2">
            {CAMPAIGN_TYPES.map(ct => (
              <button
                key={ct.value}
                type="button"
                onClick={() => { campaignType.value = ct.value }}
                class="rounded-xl p-2.5 text-left transition-all active:scale-[0.97] border text-xs"
                style={{
                  background: campaignType.value === ct.value ? 'rgba(37,99,235,0.15)' : 'var(--nodo-card)',
                  borderColor: campaignType.value === ct.value ? '#2563eb' : 'var(--nodo-border)',
                }}
              >
                <span class="text-base">{ct.icon}</span>
                <span class="block font-medium mt-0.5">{ct.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Organization */}
        <div>
          <label class={LABEL}>
            Organizacion
            {fieldConf.value.organization != null && <FieldConfidence value={fieldConf.value.organization} />}
          </label>
          <input class={INPUT} value={organization.value} onInput={(e) => { organization.value = (e.target as HTMLInputElement).value }} placeholder="Quien organiza" />
        </div>

        {/* Dates */}
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class={LABEL}>
              Fecha inicio
              {fieldConf.value.dates != null && <FieldConfidence value={fieldConf.value.dates} />}
            </label>
            <input class={INPUT} type="date" value={startDate.value} onInput={(e) => { startDate.value = (e.target as HTMLInputElement).value }} />
          </div>
          <div>
            <label class={LABEL}>Fecha fin</label>
            <input class={INPUT} type="date" value={endDate.value} onInput={(e) => { endDate.value = (e.target as HTMLInputElement).value }} />
          </div>
        </div>

        {/* Hours */}
        <div>
          <label class={LABEL}>
            Horario
            {fieldConf.value.hours != null && <FieldConfidence value={fieldConf.value.hours} />}
          </label>
          <input class={INPUT} value={openingHours.value} onInput={(e) => { openingHours.value = (e.target as HTMLInputElement).value }} placeholder="Ej: 7:00 AM a 4:00 PM" />
        </div>

        {/* Description */}
        <div>
          <label class={LABEL}>
            Descripcion
            {fieldConf.value.description != null && <FieldConfidence value={fieldConf.value.description} />}
          </label>
          <textarea class={`${INPUT} min-h-[100px] resize-none`} value={description.value} onInput={(e) => { description.value = (e.target as HTMLTextAreaElement).value }} placeholder="Detalles de la campana..." />
        </div>

        {/* Verification */}
        <div>
          <label class={LABEL}>Nivel de verificacion</label>
          <div class="grid grid-cols-2 gap-2">
            {VERIFICATION_LEVELS.map(vl => (
              <button
                key={vl.value}
                type="button"
                onClick={() => { verificationLevel.value = vl.value }}
                class="rounded-xl p-2.5 text-left transition-all active:scale-[0.97] border text-xs"
                style={{
                  background: verificationLevel.value === vl.value ? `${vl.color}15` : 'var(--nodo-card)',
                  borderColor: verificationLevel.value === vl.value ? vl.color : 'var(--nodo-border)',
                }}
              >
                <span>{vl.emoji}</span>
                <span class="block font-medium mt-0.5" style={{ color: verificationLevel.value === vl.value ? vl.color : 'inherit' }}>{vl.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Locations */}
        <div>
          <label class={LABEL}>
            Ubicaciones
            {fieldConf.value.locations != null && <FieldConfidence value={fieldConf.value.locations} />}
          </label>
          <div class="space-y-2">
            {locations.value.map((loc, i) => (
              <div key={i} class="bg-nodo-card border border-nodo-border rounded-xl p-3 space-y-2">
                <div class="flex gap-2">
                  <input
                    class={`flex-1 ${INPUT}`}
                    value={loc.name}
                    onInput={(e) => updateLocation(i, 'name', (e.target as HTMLInputElement).value)}
                    placeholder="Nombre del lugar"
                  />
                  <button class="text-red-400 text-sm px-2" onClick={() => removeLocation(i)}>✕</button>
                </div>
                <input
                  class={INPUT}
                  value={loc.address || ''}
                  onInput={(e) => updateLocation(i, 'address', (e.target as HTMLInputElement).value)}
                  placeholder="Direccion (opcional)"
                />
              </div>
            ))}
            <button onClick={addLocation} class="w-full bg-nodo-card border-2 border-dashed border-nodo-border rounded-xl p-3 text-nodo-muted text-sm font-semibold">
              ➕ Agregar ubicacion
            </button>
          </div>
        </div>

        {/* Requirements */}
        <div>
          <label class={LABEL}>
            Requisitos (uno por linea)
            {fieldConf.value.requirements != null && <FieldConfidence value={fieldConf.value.requirements} />}
          </label>
          <textarea
            class={`${INPUT} min-h-[80px] resize-none`}
            value={reqText.value}
            onInput={(e) => {
              reqText.value = (e.target as HTMLTextAreaElement).value
              requirements.value = reqText.value.split('\n').map(r => r.trim()).filter(Boolean)
            }}
            placeholder="Mayor de 18 años&#10;Más de 50 kg&#10;Sin síntomas"
          />
        </div>

        {/* Contact */}
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class={LABEL}>
              Telefono
              {fieldConf.value.contacts != null && <FieldConfidence value={fieldConf.value.contacts} />}
            </label>
            <input class={INPUT} type="tel" value={contactPhone.value} onInput={(e) => { contactPhone.value = (e.target as HTMLInputElement).value }} placeholder="0212..." />
          </div>
          <div>
            <label class={LABEL}>WhatsApp</label>
            <input class={INPUT} type="tel" value={whatsapp.value} onInput={(e) => { whatsapp.value = (e.target as HTMLInputElement).value }} placeholder="+58 412..." />
          </div>
        </div>

        <div>
          <label class={LABEL}>Sitio web</label>
          <input class={INPUT} value={website.value} onInput={(e) => { website.value = (e.target as HTMLInputElement).value }} placeholder="https://..." />
        </div>

        <div>
          <label class={LABEL}>URL fuente original</label>
          <input class={INPUT} value={sourceUrl.value} onInput={(e) => { sourceUrl.value = (e.target as HTMLInputElement).value }} placeholder="Enlace al flyer o publicacion original" />
        </div>

        {lastError.value && (
          <div class="bg-red-900/40 border border-red-700/40 text-red-300 text-sm rounded-xl p-3">{lastError.value}</div>
        )}

        <Button size="lg" fullWidth onClick={handleSave} loading={saving.value} disabled={saving.value || !title.value.trim()}>
          {mode.value === 'review' ? '✅ Publicar' : (editId.value ? 'Guardar cambios' : '✅ Publicar campana')}
        </Button>

        <button class="w-full text-sm text-nodo-muted font-medium py-2" onClick={() => { mode.value = 'list'; resetForm() }}>
          Cancelar
        </button>
      </div>
    )
  }

  // --- List view ---
  return (
    <div class="space-y-3">
      {lastMsg.value && (
        <div class="bg-emerald-900/40 border border-emerald-700/40 text-emerald-300 text-sm rounded-xl p-3">{lastMsg.value}</div>
      )}
      {lastError.value && (
        <div class="bg-red-900/40 border border-red-700/40 text-red-300 text-sm rounded-xl p-3">{lastError.value}</div>
      )}

      <div class="grid grid-cols-2 gap-3">
        <button
          onClick={() => { resetForm(); mode.value = 'manual' }}
          class="bg-nodo-card border-2 border-dashed border-nodo-border rounded-2xl p-5 text-center hover:bg-white/[0.04] transition-colors"
        >
          <span class="text-2xl block mb-1">➕</span>
          <span class="text-xs font-semibold block">Nueva campana manual</span>
        </button>
        <button
          onClick={() => { resetForm(); mode.value = 'image' }}
          class="bg-nodo-card border-2 border-dashed border-nodo-border rounded-2xl p-5 text-center hover:bg-white/[0.04] transition-colors"
        >
          <span class="text-2xl block mb-1">📷</span>
          <span class="text-xs font-semibold block">Crear desde imagen</span>
        </button>
      </div>

      {loading.value && (
        <div class="flex justify-center py-6">
          <div class="w-6 h-6 border-2 border-nodo-muted border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading.value && allCampaigns.value.length === 0 && (
        <div class="bg-nodo-card border border-nodo-border rounded-2xl p-6 text-center">
          <div class="text-3xl mb-2">📢</div>
          <p class="text-nodo-muted text-sm">No hay campanas creadas.</p>
        </div>
      )}

      {allCampaigns.value.map(c => {
        const ct = CAMPAIGN_TYPES.find(t => t.value === c.campaign_type)
        const vl = VERIFICATION_LEVELS.find(v => v.value === c.verification_level) || VERIFICATION_LEVELS[0]
        return (
          <div key={c.id} class="bg-nodo-card border border-nodo-border rounded-2xl p-4">
            <div class="flex items-start gap-3 mb-3">
              <span class="text-xl">{ct?.icon || '📢'}</span>
              <div class="flex-1 min-w-0">
                <span class="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ color: vl.color, background: `${vl.color}18` }}>
                  {vl.emoji} {vl.label}
                </span>
                <h4 class="text-sm font-bold mt-1 line-clamp-2">{c.title}</h4>
                {c.organization && <p class="text-[11px] text-nodo-muted">{c.organization}</p>}
                <p class="text-[10px] text-nodo-muted mt-1">
                  Estado: <span class="font-semibold">{c.status}</span>
                  {c.start_date && ` · ${c.start_date}`}
                  {c.locations?.length ? ` · ${c.locations.length} ubicaciones` : ''}
                </p>
              </div>
            </div>
            <div class="flex gap-2">
              <button onClick={() => openEdit(c)} class="flex-1 bg-blue-800 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl py-2.5 text-center transition-colors min-h-[40px]">
                ✏️ Editar
              </button>
              <button onClick={() => handleDelete(c.id)} class="bg-red-900/40 border border-red-700/40 text-red-400 rounded-xl px-4 py-2.5 text-xs font-semibold transition-colors min-h-[40px]">
                🗑
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
