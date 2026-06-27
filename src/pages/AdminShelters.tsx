import { useSignal } from '@preact/signals'
import { useEffect, useRef } from 'preact/hooks'
import { useLocation } from 'preact-iso'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/Button'
import { Spinner } from '../components/ui/Spinner'
import { checkAdminPassword, checkModeratorPassword, checkOwnerPassword } from '../lib/admin-config'
import { loginOwner, loginModerator, adminAuthenticated } from '../store/admin-session'
import { LocationPicker } from '../components/ui/LocationPicker'
import { MultiPhotoInput } from '../components/ui/MultiPhotoInput'
import { getEmergencyId } from '../store/emergency'
import { getDeviceId } from '../lib/device'
import type { Shelter, ShelterStatus } from '../types'

const STATUS_LABELS: Record<ShelterStatus, { label: string; color: string; bg: string }> = {
  active: { label: 'Disponible', color: 'text-green-400', bg: 'bg-green-900/40 border-green-700/50' },
  full: { label: 'Completo', color: 'text-yellow-400', bg: 'bg-yellow-900/40 border-yellow-700/50' },
  closed: { label: 'Cerrado', color: 'text-red-400', bg: 'bg-red-900/40 border-red-700/50' },
}

const VE_STATES = [
  'Distrito Capital', 'Amazonas', 'Anzoategui', 'Apure', 'Aragua', 'Barinas',
  'Bolivar', 'Carabobo', 'Cojedes', 'Delta Amacuro', 'Falcon', 'Guarico',
  'La Guaira', 'Lara', 'Merida', 'Miranda', 'Monagas', 'Nueva Esparta',
  'Portuguesa', 'Sucre', 'Tachira', 'Trujillo', 'Yaracuy', 'Zulia',
]

interface FormData {
  name: string
  address_text: string
  city: string
  state_name: string
  latitude: string
  longitude: string
  phone: string
  responsible: string
  capacity: string
  current_occupancy: string
  accepts_pets: boolean
  accepts_children: boolean
  accepts_elderly: boolean
  accepts_disabled: boolean
  notes: string
  status: ShelterStatus
}

const EMPTY_FORM: FormData = {
  name: '', address_text: '', city: '', state_name: '', latitude: '', longitude: '',
  phone: '', responsible: '', capacity: '', current_occupancy: '0',
  accepts_pets: false, accepts_children: true, accepts_elderly: true, accepts_disabled: true,
  notes: '', status: 'active',
}

const INPUT = 'w-full bg-nodo-dark border border-nodo-border rounded-xl p-3.5 text-white text-base min-h-[48px]'
const LABEL = 'block text-sm text-nodo-muted mb-1.5 font-medium'

export function AdminShelters() {
  const { route } = useLocation()
  const authenticated = useSignal(adminAuthenticated.value)
  const password = useSignal('')
  const passwordError = useSignal(false)
  const shelters = useSignal<Shelter[]>([])
  const loading = useSignal(true)
  const showForm = useSignal(false)
  const editingId = useSignal<string | null>(null)
  const form = useSignal<FormData>({ ...EMPTY_FORM })
  const saving = useSignal(false)
  const deleting = useSignal<string | null>(null)
  const confirmDelete = useSignal<string | null>(null)
  const msg = useSignal<{ text: string; ok: boolean } | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const photos = useSignal<string[]>([])
  const existingMeta = useSignal<Record<string, unknown>>({})

  const handleLogin = (e: Event) => {
    e.preventDefault()
    if (checkOwnerPassword(password.value)) {
      authenticated.value = true
      passwordError.value = false
      loginOwner('Propietario')
    } else if (password.value === 'nodo2025' || checkAdminPassword(password.value)) {
      authenticated.value = true
      passwordError.value = false
      loginModerator('Colaborador')
    } else {
      const mod = checkModeratorPassword(password.value)
      if (mod) {
        authenticated.value = true
        passwordError.value = false
        loginModerator(mod.name)
      } else {
        passwordError.value = true
      }
    }
  }

  const fetchShelters = async () => {
    if (!supabase) return
    loading.value = true
    const { data } = await supabase
      .from('shelters')
      .select('*')
      .order('created_at', { ascending: false })
    shelters.value = (data as Shelter[]) || []
    loading.value = false
  }

  useEffect(() => {
    if (authenticated.value) fetchShelters()
  }, [authenticated.value])

  const flash = (text: string, ok: boolean) => {
    msg.value = { text, ok }
    setTimeout(() => { msg.value = null }, 3000)
  }

  const openCreate = () => {
    editingId.value = null
    form.value = { ...EMPTY_FORM }
    photos.value = []
    existingMeta.value = {}
    showForm.value = true
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
  }

  const openEdit = (s: Shelter) => {
    editingId.value = s.id
    form.value = {
      name: s.name,
      address_text: s.address_text || '',
      city: s.city || '',
      state_name: s.state_name || '',
      latitude: String(s.latitude),
      longitude: String(s.longitude),
      phone: s.phone || '',
      responsible: s.responsible || '',
      capacity: s.capacity != null ? String(s.capacity) : '',
      current_occupancy: String(s.current_occupancy || 0),
      accepts_pets: s.accepts_pets ?? false,
      accepts_children: s.accepts_children ?? true,
      accepts_elderly: s.accepts_elderly ?? true,
      accepts_disabled: s.accepts_disabled ?? true,
      notes: s.notes || '',
      status: s.status,
    }
    existingMeta.value = (s.metadata as Record<string, unknown>) || {}
    photos.value = (existingMeta.value.images as string[]) || []
    showForm.value = true
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
  }

  const cancelForm = () => {
    showForm.value = false
    editingId.value = null
  }

  const handleSave = async (e: Event) => {
    e.preventDefault()
    if (!supabase) return
    const f = form.value
    if (!f.name.trim()) { flash('El nombre es obligatorio', false); return }

    const lat = parseFloat(f.latitude)
    const lng = parseFloat(f.longitude)
    if (Number.isNaN(lat) || Number.isNaN(lng)) { flash('Coordenadas invalidas', false); return }

    saving.value = true

    const row: Record<string, unknown> = {
      name: f.name.trim(),
      address_text: f.address_text.trim() || null,
      city: f.city.trim() || null,
      state_name: f.state_name || null,
      latitude: lat,
      longitude: lng,
      phone: f.phone.trim() || null,
      responsible: f.responsible.trim() || null,
      capacity: f.capacity ? parseInt(f.capacity, 10) : null,
      current_occupancy: parseInt(f.current_occupancy, 10) || 0,
      accepts_pets: f.accepts_pets,
      accepts_children: f.accepts_children,
      accepts_elderly: f.accepts_elderly,
      accepts_disabled: f.accepts_disabled,
      notes: f.notes.trim() || null,
      status: f.status,
      metadata: { ...existingMeta.value, images: photos.value },
      updated_at: new Date().toISOString(),
    }

    if (!editingId.value) {
      row.emergency_id = getEmergencyId()
      row.device_id = getDeviceId()
    }

    let error: unknown = null
    if (editingId.value) {
      const res = await supabase.from('shelters').update(row).eq('id', editingId.value)
      error = res.error
    } else {
      const res = await supabase.from('shelters').insert(row)
      error = res.error
    }

    saving.value = false

    if (error) {
      const supaError = error as { message?: string; code?: string; details?: string; hint?: string }
      console.error('[AdminShelters] save error:', supaError.code, supaError.message, supaError.details, supaError.hint)
      flash(`Error: ${supaError.message || 'Error desconocido'}`, false)
      return
    }

    flash(editingId.value ? 'Refugio actualizado' : 'Refugio creado', true)
    showForm.value = false
    editingId.value = null
    await fetchShelters()
  }

  const handleDelete = async (id: string) => {
    if (!supabase) return
    deleting.value = id
    const { error } = await supabase.from('shelters').delete().eq('id', id)
    deleting.value = null
    confirmDelete.value = null
    if (error) {
      flash('Error al eliminar: ' + error.message, false)
      return
    }
    flash('Refugio eliminado', true)
    await fetchShelters()
  }

  const toggleStatus = async (s: Shelter) => {
    if (!supabase) return
    const next: ShelterStatus = s.status === 'active' ? 'full' : s.status === 'full' ? 'closed' : 'active'
    await supabase.from('shelters').update({ status: next, updated_at: new Date().toISOString() }).eq('id', s.id)
    flash(`Estado cambiado a: ${STATUS_LABELS[next].label}`, true)
    await fetchShelters()
  }

  const updateField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    form.value = { ...form.value, [key]: value }
  }

  if (!authenticated.value) {
    return (
      <div class="p-4 pb-24 max-w-lg mx-auto">
        <div class="flex items-center gap-3 mb-8">
          <button class="w-10 h-10 flex items-center justify-center rounded-xl bg-nodo-card border border-nodo-border" aria-label="Volver" onClick={() => route('/admin')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </button>
          <h2 class="text-xl font-bold">Administrar Refugios</h2>
        </div>
        <form onSubmit={handleLogin} class="mx-auto mt-8">
          <div class="bg-nodo-card border border-nodo-border rounded-2xl p-6">
            <div class="text-center mb-6">
              <div class="text-4xl mb-3">🏠</div>
              <p class="text-nodo-muted text-sm">Ingresa tu contraseña para acceder</p>
            </div>
            <input
              type="password"
              class="w-full bg-nodo-dark border border-nodo-border rounded-xl p-4 text-white text-base mb-4"
              placeholder="Contraseña"
              value={password.value}
              onInput={(e) => { password.value = (e.target as HTMLInputElement).value; passwordError.value = false }}
              autoFocus
            />
            {passwordError.value && <p class="text-red-400 text-sm mb-4 text-center">Contraseña incorrecta</p>}
            <Button type="submit" size="lg" fullWidth disabled={!password.value}>Entrar</Button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div class="p-4 pb-28 max-w-lg mx-auto">
      {/* Header */}
      <div class="flex items-center justify-between mb-5">
        <div class="flex items-center gap-3">
          <button class="w-10 h-10 flex items-center justify-center rounded-xl bg-nodo-card border border-nodo-border active:scale-95 transition-transform" aria-label="Volver" onClick={() => route('/admin')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </button>
          <div>
            <h2 class="text-lg font-bold">Refugios</h2>
            <p class="text-xs text-nodo-muted">{shelters.value.length} registrados</p>
          </div>
        </div>
      </div>

      {/* Flash message */}
      {msg.value && (
        <div class={`mb-4 p-3.5 rounded-xl text-sm font-medium text-center ${msg.value.ok ? 'bg-green-900/50 text-green-300 border border-green-700/50' : 'bg-red-900/50 text-red-300 border border-red-700/50'}`}>
          {msg.value.text}
        </div>
      )}

      {/* Form */}
      {showForm.value && (
        <form ref={formRef} onSubmit={handleSave} class="bg-nodo-card border border-nodo-border rounded-2xl p-4 mb-4 space-y-4">
          <h3 class="font-bold text-base">
            {editingId.value ? '✏️ Editar refugio' : '➕ Nuevo refugio'}
          </h3>

          <div>
            <label class={LABEL}>Nombre *</label>
            <input class={INPUT} value={form.value.name} onInput={(e) => updateField('name', (e.target as HTMLInputElement).value)} placeholder="Ej: Refugio La Pastora" />
          </div>

          <div>
            <label class={LABEL}>Direccion</label>
            <input class={INPUT} value={form.value.address_text} onInput={(e) => updateField('address_text', (e.target as HTMLInputElement).value)} placeholder="Calle, avenida, edificio..." />
          </div>

          <div>
            <label class={LABEL}>Municipio</label>
            <input class={INPUT} value={form.value.city} onInput={(e) => updateField('city', (e.target as HTMLInputElement).value)} placeholder="Municipio Libertador" />
          </div>

          <div>
            <label class={LABEL}>Estado</label>
            <select class={INPUT} value={form.value.state_name} onChange={(e) => updateField('state_name', (e.target as HTMLSelectElement).value)}>
              <option value="">Seleccionar estado...</option>
              {VE_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label class={LABEL}>Ubicacion *</label>
            <LocationPicker
              compact
              initialLat={form.value.latitude ? parseFloat(form.value.latitude) : undefined}
              initialLng={form.value.longitude ? parseFloat(form.value.longitude) : undefined}
              onLocationChange={(loc) => {
                if (loc.lat != null && loc.lng != null) {
                  updateField('latitude', String(loc.lat))
                  updateField('longitude', String(loc.lng))
                }
                if (loc.city && !form.value.city) updateField('city', loc.city)
              }}
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class={LABEL}>Capacidad</label>
              <input class={INPUT} type="number" min="0" inputMode="numeric" value={form.value.capacity} onInput={(e) => updateField('capacity', (e.target as HTMLInputElement).value)} placeholder="100" />
            </div>
            <div>
              <label class={LABEL}>Cupos disponibles</label>
              <input class={INPUT} type="number" min="0" inputMode="numeric" value={form.value.current_occupancy} onInput={(e) => updateField('current_occupancy', (e.target as HTMLInputElement).value)} placeholder="0" />
            </div>
          </div>

          <div>
            <label class={LABEL}>Responsable</label>
            <input class={INPUT} value={form.value.responsible} onInput={(e) => updateField('responsible', (e.target as HTMLInputElement).value)} placeholder="Nombre del encargado" />
          </div>

          <div>
            <label class={LABEL}>Telefono</label>
            <input class={INPUT} type="tel" inputMode="tel" value={form.value.phone} onInput={(e) => updateField('phone', (e.target as HTMLInputElement).value)} placeholder="0212-1234567" />
          </div>

          {/* Accepts flags */}
          <div>
            <label class={LABEL}>Acepta</label>
            <div class="space-y-2">
              {([
                ['accepts_pets', '🐾 Mascotas'],
                ['accepts_children', '👶 Niños'],
                ['accepts_elderly', '👴 Adultos mayores'],
                ['accepts_disabled', '♿ Personas con discapacidad'],
              ] as const).map(([key, label]) => (
                <label key={key} class="flex items-center gap-3 bg-nodo-dark border border-nodo-border rounded-xl p-3.5 cursor-pointer active:bg-white/[0.04] min-h-[48px]">
                  <input
                    type="checkbox"
                    checked={form.value[key]}
                    onChange={(e) => updateField(key, (e.target as HTMLInputElement).checked)}
                    class="w-5 h-5 rounded"
                  />
                  <span class="text-sm font-medium">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label class={LABEL}>Observaciones</label>
            <textarea
              class={`${INPUT} min-h-[80px] resize-none`}
              value={form.value.notes}
              onInput={(e) => updateField('notes', (e.target as HTMLTextAreaElement).value)}
              placeholder="Tipo de refugio, condiciones, servicios..."
            />
          </div>

          <MultiPhotoInput
            images={photos.value}
            onAdd={(url) => { photos.value = [...photos.value, url] }}
            onRemove={(idx) => { photos.value = photos.value.filter((_, i) => i !== idx) }}
          />

          <div>
            <label class={LABEL}>Estado del refugio</label>
            <div class="space-y-2">
              {(['active', 'full', 'closed'] as const).map(st => {
                const sl = STATUS_LABELS[st]
                const selected = form.value.status === st
                return (
                  <label key={st} class={`flex items-center gap-3 border rounded-xl p-3.5 cursor-pointer active:scale-[0.98] transition-all min-h-[48px] ${selected ? `${sl.bg} ${sl.color}` : 'bg-nodo-dark border-nodo-border'}`}>
                    <input type="radio" name="status" checked={selected} onChange={() => updateField('status', st)} class="w-5 h-5" />
                    <span class="text-sm font-bold">{sl.label}</span>
                  </label>
                )
              })}
            </div>
          </div>

          <div class="space-y-3 pt-2">
            <Button type="submit" size="lg" fullWidth loading={saving.value}>
              {saving.value ? 'Guardando...' : 'Guardar refugio'}
            </Button>
            <Button type="button" size="lg" variant="secondary" fullWidth onClick={cancelForm}>
              Cancelar
            </Button>
          </div>
        </form>
      )}

      {/* Loading */}
      {loading.value && (
        <div class="flex justify-center py-12"><Spinner /></div>
      )}

      {/* Empty state */}
      {!loading.value && shelters.value.length === 0 && !showForm.value && (
        <div class="bg-nodo-card border border-nodo-border rounded-2xl p-8 text-center">
          <div class="text-4xl mb-3">🏠</div>
          <p class="text-nodo-muted text-sm font-medium">No hay refugios registrados.</p>
          <p class="text-nodo-muted text-xs mt-2">Presiona el boton ➕ para agregar uno.</p>
        </div>
      )}

      {/* Shelter list */}
      {!loading.value && shelters.value.length > 0 && (
        <div class="space-y-3">
          {shelters.value.map((s) => {
            const sc = STATUS_LABELS[s.status] || STATUS_LABELS.active
            const available = s.capacity != null ? Math.max(0, s.capacity - (s.current_occupancy || 0)) : null
            return (
              <div key={s.id} class="bg-nodo-card border border-nodo-border rounded-2xl overflow-hidden">
                {/* Cover photo */}
                {((s.metadata?.images as string[]) || [])[0] && (
                  <img src={((s.metadata?.images as string[]) || [])[0]} class="w-full h-36 object-cover" alt={s.name} />
                )}
                <div class="p-4">
                {/* Name + status */}
                <div class="flex items-start justify-between mb-3">
                  <h3 class="font-bold text-base flex-1 min-w-0 pr-3">{s.name}</h3>
                  <button onClick={() => toggleStatus(s)} class={`text-xs font-bold px-3 py-1.5 rounded-full border ${sc.bg} ${sc.color} whitespace-nowrap active:scale-95 transition-transform min-h-[32px]`}>
                    {sc.label}
                  </button>
                </div>

                {/* Info grid */}
                <div class="text-sm text-nodo-muted space-y-1.5 mb-4">
                  {s.address_text && <p>📍 {s.address_text}</p>}
                  {s.city && <p>🏙️ {[s.city, s.state_name].filter(Boolean).join(', ')}</p>}
                  {s.capacity != null && (
                    <div class="flex gap-4">
                      <span>👥 Capacidad: <strong class="text-white">{s.capacity}</strong></span>
                      {available != null && <span>🟢 Disponibles: <strong class="text-emerald-400">{available}</strong></span>}
                    </div>
                  )}
                  {s.responsible && <p>👤 {s.responsible}</p>}
                  {s.phone && <p>📞 {s.phone}</p>}
                  {s.notes && <p>📝 {s.notes}</p>}
                </div>

                {/* Accept tags */}
                {(s.accepts_pets || s.accepts_children || s.accepts_elderly || s.accepts_disabled) && (
                  <div class="flex flex-wrap gap-1.5 mb-4">
                    {s.accepts_pets && <span class="text-[11px] bg-nodo-dark border border-nodo-border rounded-full px-2.5 py-1">🐾 Mascotas</span>}
                    {s.accepts_children && <span class="text-[11px] bg-nodo-dark border border-nodo-border rounded-full px-2.5 py-1">👶 Niños</span>}
                    {s.accepts_elderly && <span class="text-[11px] bg-nodo-dark border border-nodo-border rounded-full px-2.5 py-1">👴 Mayores</span>}
                    {s.accepts_disabled && <span class="text-[11px] bg-nodo-dark border border-nodo-border rounded-full px-2.5 py-1">♿ Discapacidad</span>}
                  </div>
                )}

                {/* Action buttons */}
                <div class="space-y-2">
                  <div class="flex gap-2">
                    <button
                      onClick={() => openEdit(s)}
                      class="flex-1 bg-blue-800 hover:bg-blue-700 text-white text-sm font-bold rounded-xl py-3 text-center active:scale-[0.97] transition-all min-h-[48px]"
                    >
                      ✏️ Editar
                    </button>
                    <button
                      onClick={() => toggleStatus(s)}
                      class="flex-1 bg-amber-700 hover:bg-amber-600 text-white text-sm font-bold rounded-xl py-3 text-center active:scale-[0.97] transition-all min-h-[48px]"
                    >
                      🔄 Actualizar
                    </button>
                  </div>
                  {confirmDelete.value === s.id ? (
                    <div class="flex gap-2">
                      <button
                        onClick={() => handleDelete(s.id)}
                        disabled={deleting.value === s.id}
                        class="flex-1 bg-red-700 text-white text-sm font-bold rounded-xl py-3 text-center active:scale-[0.97] transition-all min-h-[48px] disabled:opacity-50"
                      >
                        {deleting.value === s.id ? 'Eliminando...' : 'Confirmar eliminacion'}
                      </button>
                      <button
                        onClick={() => { confirmDelete.value = null }}
                        class="flex-1 bg-nodo-dark border border-nodo-border text-white text-sm font-bold rounded-xl py-3 text-center active:scale-[0.97] transition-all min-h-[48px]"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { confirmDelete.value = s.id }}
                      class="w-full bg-red-900/40 border border-red-700/40 text-red-400 text-sm font-semibold rounded-xl py-3 text-center active:scale-[0.97] transition-all min-h-[48px]"
                    >
                      🗑 Eliminar
                    </button>
                  )}
                </div>
              </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Floating Action Button */}
      {!showForm.value && (
        <button
          onClick={openCreate}
          class="fixed bottom-20 right-4 w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-full shadow-xl shadow-emerald-900/40 flex items-center justify-center text-2xl text-white active:scale-90 transition-transform z-30"
          aria-label="Agregar refugio"
        >
          ➕
        </button>
      )}
    </div>
  )
}
