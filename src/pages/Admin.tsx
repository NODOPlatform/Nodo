import { useSignal } from '@preact/signals'
import { useEffect } from 'preact/hooks'
import { useLocation } from 'preact-iso'
import { Button } from '../components/ui/Button'
import {
  getConfig, saveConfig, checkAdminPassword, generateId,
  type AdminConfig,
  getModerators, saveModerators, checkModeratorPassword,
  type Moderator, type ModeratorPermission, ALL_PERMISSIONS, PERMISSION_LABELS,
  checkOwnerPassword, setOwnerPassword, TEMP_MODERATOR_PERMISSIONS,
} from '../lib/admin-config'
import type { EmergencyContact, ExternalSearchLink } from '../lib/emergency-contacts'
import { loginOwner, loginModerator, logoutAdmin, adminAuthenticated, adminRole, adminUserName } from '../store/admin-session'
import { logAudit } from '../store/governance'
import { LocationPicker } from '../components/ui/LocationPicker'
import { PhotoInput } from '../components/ui/PhotoInput'
import { supabase } from '../lib/supabase'
import { getEmergencyId } from '../store/emergency'

import { CampaignsEditor } from '../components/admin/CampaignsEditor'
import { BannerNacionalEditor } from '../components/admin/BannerNacionalEditor'
import { IngestaInteligente } from '../components/admin/IngestaInteligente'
import { GovernancePanel } from '../components/admin/GovernancePanel'

type View = 'dashboard' | 'contacts' | 'links' | 'banner' | 'national_banner' | 'cities' | 'emergency' | 'centers' | 'password' | 'moderators' | 'campaigns' | 'ingesta' | 'governance'

interface DashboardCard {
  icon: string
  label: string
  description: string
  action: () => void
  color: string
  permission?: ModeratorPermission
}

export function Admin() {
  const { route } = useLocation()
  const authenticated = useSignal(adminAuthenticated.value)
  const password = useSignal('')
  const passwordError = useSignal(false)
  const view = useSignal<View>('dashboard')
  const config = useSignal<AdminConfig>(getConfig())
  const saved = useSignal(false)
  const isOwner = useSignal(adminAuthenticated.value ? adminRole.value === 'owner' : false)
  const userPermissions = useSignal<ModeratorPermission[]>(
    adminAuthenticated.value
      ? (adminRole.value === 'owner' ? [...ALL_PERMISSIONS] :
         getModerators().find(m => m.name === adminUserName.value)?.permissions ?? TEMP_MODERATOR_PERMISSIONS)
      : [...ALL_PERMISSIONS]
  )
  const userName = useSignal(adminAuthenticated.value ? adminUserName.value : '')

  const handleLogin = (e: Event) => {
    e.preventDefault()
    if (checkOwnerPassword(password.value)) {
      authenticated.value = true
      isOwner.value = true
      userPermissions.value = [...ALL_PERMISSIONS]
      userName.value = 'Propietario'
      passwordError.value = false
      loginOwner('Propietario')
      logAudit('Propietario', 'login', 'admin_session', undefined, undefined, { role: 'owner' })
    } else if (password.value === 'nodo2025' || checkAdminPassword(password.value)) {
      authenticated.value = true
      isOwner.value = false
      userPermissions.value = [...TEMP_MODERATOR_PERMISSIONS]
      userName.value = 'Colaborador'
      passwordError.value = false
      loginModerator('Colaborador')
      logAudit('Colaborador', 'login', 'admin_session', undefined, undefined, { role: 'moderator_temp' })
    } else {
      const mod = checkModeratorPassword(password.value)
      if (mod) {
        authenticated.value = true
        isOwner.value = false
        userPermissions.value = mod.permissions
        userName.value = mod.name
        passwordError.value = false
        loginModerator(mod.name)
        logAudit(mod.name, 'login', 'admin_session', undefined, undefined, { role: 'moderator' })
      } else {
        passwordError.value = true
      }
    }
  }

  const hasPerm = (p: ModeratorPermission) => isOwner.value || userPermissions.value.includes(p)

  const persist = () => {
    saveConfig(config.value)
    saved.value = true
    setTimeout(() => { saved.value = false }, 2000)
  }

  const updateConfig = (partial: Partial<AdminConfig>) => {
    config.value = { ...config.value, ...partial }
  }

  if (!authenticated.value) {
    return (
      <div class="p-4 pb-24 max-w-lg mx-auto">
        <div class="flex items-center gap-3 mb-8">
          <button class="w-10 h-10 flex items-center justify-center rounded-xl bg-nodo-card border border-nodo-border" aria-label="Volver" onClick={() => route('/')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </button>
          <h2 class="text-xl font-bold">Panel de Administracion</h2>
        </div>
        <form onSubmit={handleLogin} class="mx-auto mt-8">
          <div class="bg-nodo-card border border-nodo-border rounded-2xl p-6">
            <div class="text-center mb-6">
              <div class="text-4xl mb-3">🔐</div>
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

  if (view.value !== 'dashboard') {
    return (
      <div class="p-4 pb-24 max-w-lg mx-auto">
        <div class="flex items-center justify-between mb-5">
          <div class="flex items-center gap-3">
            <button class="w-10 h-10 flex items-center justify-center rounded-xl bg-nodo-card border border-nodo-border active:scale-95 transition-transform" onClick={() => { view.value = 'dashboard' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            </button>
            <h2 class="text-lg font-bold">
              {view.value === 'contacts' && '📞 Telefonos'}
              {view.value === 'links' && '🔗 Enlaces'}
              {view.value === 'banner' && '📢 Banner'}
              {view.value === 'cities' && '🏙️ Ciudades'}
              {view.value === 'emergency' && '⚠️ Emergencia'}
              {view.value === 'centers' && '📦 Centros de acopio'}
              {view.value === 'campaigns' && '📢 Campanas verificadas'}
              {view.value === 'national_banner' && '🚨 Banner nacional'}
              {view.value === 'ingesta' && '🧠 Ingesta Inteligente'}
              {view.value === 'governance' && '🛡️ Seguridad y Gobernanza'}
              {view.value === 'password' && '🔑 Cambiar clave'}
              {view.value === 'moderators' && '👥 Moderadores'}
            </h2>
          </div>
          {view.value !== 'password' && view.value !== 'moderators' && view.value !== 'centers' && view.value !== 'campaigns' && view.value !== 'national_banner' && view.value !== 'ingesta' && view.value !== 'governance' && (
            <button
              onClick={persist}
              class="bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl px-5 py-2.5 text-sm active:scale-95 transition-all min-h-[44px]"
            >
              {saved.value ? '✓ Guardado' : 'Guardar'}
            </button>
          )}
        </div>

        {view.value === 'contacts' && <ContactsEditor config={config.value} onChange={updateConfig} />}
        {view.value === 'links' && <LinksEditor config={config.value} onChange={updateConfig} />}
        {view.value === 'banner' && <BannerEditor config={config.value} onChange={updateConfig} />}
        {view.value === 'cities' && <CitiesEditor config={config.value} onChange={updateConfig} />}
        {view.value === 'emergency' && <EmergencyEditor config={config.value} onChange={updateConfig} />}
        {view.value === 'centers' && <CentersEditor config={config.value} onChange={updateConfig} />}
        {view.value === 'campaigns' && <CampaignsEditor />}
        {view.value === 'national_banner' && <BannerNacionalEditor />}
        {view.value === 'ingesta' && <IngestaInteligente />}
        {view.value === 'governance' && <GovernancePanel />}
        {view.value === 'password' && <PasswordEditor />}
        {view.value === 'moderators' && <ModeratorsEditor />}
      </div>
    )
  }

  const cards: DashboardCard[] = [
    { icon: '🧠', label: 'Ingesta Inteligente', description: 'Clasificar imagen o texto con IA', action: () => { view.value = 'ingesta' }, color: 'from-sky-600 to-indigo-700' },
    { icon: '🏠', label: 'Refugios', description: 'Agregar, editar y gestionar', action: () => route('/admin/refugios'), color: 'from-purple-600 to-purple-700', permission: 'shelters' },
    { icon: '📦', label: 'Centros de acopio', description: 'Gestionar puntos de recoleccion', action: () => { view.value = 'centers' }, color: 'from-amber-600 to-amber-700', permission: 'centers' },
    { icon: '📢', label: 'Campanas verificadas', description: 'Crear y gestionar campanas', action: () => { view.value = 'campaigns' }, color: 'from-violet-600 to-violet-700', permission: 'campaigns' as ModeratorPermission },
  ]

  if (isOwner.value) {
    cards.push(
      { icon: '📞', label: 'Telefonos', description: 'Numeros de emergencia', action: () => { view.value = 'contacts' }, color: 'from-blue-600 to-blue-700', permission: 'contacts' },
      { icon: '🔗', label: 'Enlaces externos', description: 'Links de busqueda y ayuda', action: () => { view.value = 'links' }, color: 'from-cyan-600 to-cyan-700', permission: 'links' },
      { icon: '📢', label: 'Banner principal', description: 'Titulo y mensaje de inicio', action: () => { view.value = 'banner' }, color: 'from-pink-600 to-pink-700', permission: 'banner' },
      { icon: '🚨', label: 'Banner nacional', description: 'Nivel de alerta y texto del banner', action: () => { view.value = 'national_banner' }, color: 'from-red-600 to-red-800', permission: 'national_banner' as ModeratorPermission },
      { icon: '🏙️', label: 'Ciudades', description: 'Ciudades afectadas', action: () => { view.value = 'cities' }, color: 'from-teal-600 to-teal-700', permission: 'cities' },
      { icon: '⚠️', label: 'Emergencia', description: 'Estado de la emergencia activa', action: () => { view.value = 'emergency' }, color: 'from-red-600 to-red-700', permission: 'emergency' },
      { icon: '🔑', label: 'Cambiar clave', description: 'Actualizar contraseña del Owner', action: () => { view.value = 'password' }, color: 'from-gray-600 to-gray-700' },
      { icon: '🛡️', label: 'Seguridad y Gobernanza', description: 'Roles, permisos, auditoria', action: () => { view.value = 'governance' }, color: 'from-yellow-600 to-amber-700' },
      { icon: '👥', label: 'Moderadores', description: 'Crear y gestionar accesos', action: () => { view.value = 'moderators' }, color: 'from-indigo-600 to-indigo-700' },
    )
  }

  return (
    <div class="p-4 pb-24 max-w-lg mx-auto">
      {/* Header */}
      <div class="flex items-center justify-between mb-5">
        <div class="flex items-center gap-3">
          <button class="w-10 h-10 flex items-center justify-center rounded-xl bg-nodo-card border border-nodo-border active:scale-95 transition-transform" aria-label="Volver" onClick={() => route('/')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </button>
          <div>
            <h2 class="text-lg font-bold">{isOwner.value ? 'Panel Admin' : 'Panel de Colaborador'}</h2>
            <p class="text-xs text-nodo-muted">{isOwner.value ? '👑 Propietario (Owner)' : `🟢 ${userName.value} — Moderador temporal`}</p>
          </div>
        </div>
        <button
          onClick={() => { authenticated.value = false; password.value = ''; logoutAdmin() }}
          class="text-xs text-nodo-muted bg-nodo-card border border-nodo-border rounded-xl px-3 py-2 active:scale-95 transition-transform min-h-[36px]"
        >
          Salir
        </button>
      </div>

      {/* Dashboard cards */}
      <div class="space-y-3">
        {cards.map((card) => {
          if (card.permission && !hasPerm(card.permission)) return null
          return (
            <button
              key={card.label}
              onClick={card.action}
              class={`w-full bg-gradient-to-r ${card.color} rounded-2xl p-5 flex items-center gap-4 shadow-lg shadow-black/20 active:scale-[0.97] transition-all text-left`}
            >
              <div class="text-3xl flex-shrink-0 w-12 h-12 flex items-center justify-center bg-white/15 rounded-xl">
                {card.icon}
              </div>
              <div class="flex-1 min-w-0">
                <span class="text-white font-bold text-[15px] block">{card.label}</span>
                <span class="text-white/70 text-xs block mt-0.5">{card.description}</span>
              </div>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-white/50 flex-shrink-0"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// --- Section Editors (mobile-optimized) ---

const INPUT = 'w-full bg-nodo-dark border border-nodo-border rounded-xl p-3.5 text-white text-base min-h-[48px]'
const LABEL = 'block text-sm text-nodo-muted mb-1.5 font-medium'

function ContactsEditor({ config, onChange }: { config: AdminConfig; onChange: (p: Partial<AdminConfig>) => void }) {
  const update = (idx: number, field: keyof EmergencyContact, value: string) => {
    const contacts = [...config.emergencyContacts]
    contacts[idx] = { ...contacts[idx], [field]: value }
    onChange({ emergencyContacts: contacts })
  }
  const add = () => {
    onChange({ emergencyContacts: [...config.emergencyContacts, { name: '', icon: '📞', phone: '', description: '' }] })
  }
  const remove = (idx: number) => {
    onChange({ emergencyContacts: config.emergencyContacts.filter((_, i) => i !== idx) })
  }

  return (
    <div class="space-y-3">
      {config.emergencyContacts.map((c, i) => (
        <div key={i} class="bg-nodo-card border border-nodo-border rounded-2xl p-4 space-y-3">
          <div class="flex gap-3">
            <input class="w-14 bg-nodo-dark border border-nodo-border rounded-xl p-3 text-center text-white text-lg min-h-[48px]" value={c.icon} onInput={(e) => update(i, 'icon', (e.target as HTMLInputElement).value)} placeholder="🚑" />
            <input class={`flex-1 ${INPUT}`} value={c.name} onInput={(e) => update(i, 'name', (e.target as HTMLInputElement).value)} placeholder="Nombre" />
          </div>
          <input class={INPUT} value={c.phone} onInput={(e) => update(i, 'phone', (e.target as HTMLInputElement).value)} placeholder="Telefono" />
          <input class={INPUT} value={c.description} onInput={(e) => update(i, 'description', (e.target as HTMLInputElement).value)} placeholder="Descripcion" />
          <button class="w-full bg-red-900/40 border border-red-700/40 text-red-400 rounded-xl py-3 text-sm font-semibold active:scale-[0.97] transition-transform min-h-[44px]" onClick={() => remove(i)}>
            🗑 Eliminar contacto
          </button>
        </div>
      ))}
      <button onClick={add} class="w-full bg-nodo-card border-2 border-dashed border-nodo-border rounded-2xl p-4 text-nodo-muted font-semibold active:scale-[0.97] transition-transform min-h-[56px]">
        ➕ Agregar contacto
      </button>
    </div>
  )
}

function LinksEditor({ config, onChange }: { config: AdminConfig; onChange: (p: Partial<AdminConfig>) => void }) {
  const update = (idx: number, field: keyof ExternalSearchLink, value: string) => {
    const links = [...config.externalLinks]
    links[idx] = { ...links[idx], [field]: value }
    onChange({ externalLinks: links })
  }
  const add = () => {
    onChange({ externalLinks: [...config.externalLinks, { name: '', url: '', description: '' }] })
  }
  const remove = (idx: number) => {
    onChange({ externalLinks: config.externalLinks.filter((_, i) => i !== idx) })
  }

  return (
    <div class="space-y-3">
      {config.externalLinks.map((l, i) => (
        <div key={i} class="bg-nodo-card border border-nodo-border rounded-2xl p-4 space-y-3">
          <div>
            <label class={LABEL}>Nombre</label>
            <input class={INPUT} value={l.name} onInput={(e) => update(i, 'name', (e.target as HTMLInputElement).value)} placeholder="Nombre del enlace" />
          </div>
          <div>
            <label class={LABEL}>URL</label>
            <input class={INPUT} value={l.url} onInput={(e) => update(i, 'url', (e.target as HTMLInputElement).value)} placeholder="https://..." />
          </div>
          <div>
            <label class={LABEL}>Descripcion</label>
            <input class={INPUT} value={l.description} onInput={(e) => update(i, 'description', (e.target as HTMLInputElement).value)} placeholder="Breve descripcion" />
          </div>
          <button class="w-full bg-red-900/40 border border-red-700/40 text-red-400 rounded-xl py-3 text-sm font-semibold active:scale-[0.97] transition-transform min-h-[44px]" onClick={() => remove(i)}>
            🗑 Eliminar enlace
          </button>
        </div>
      ))}
      <button onClick={add} class="w-full bg-nodo-card border-2 border-dashed border-nodo-border rounded-2xl p-4 text-nodo-muted font-semibold active:scale-[0.97] transition-transform min-h-[56px]">
        ➕ Agregar enlace
      </button>
    </div>
  )
}

function BannerEditor({ config, onChange }: { config: AdminConfig; onChange: (p: Partial<AdminConfig>) => void }) {
  const updateBanner = (field: string, value: string | string[]) => {
    onChange({ banner: { ...config.banner, [field]: value } })
  }
  return (
    <div class="space-y-4">
      <div>
        <label class={LABEL}>Titulo</label>
        <input class={INPUT} value={config.banner.title} onInput={(e) => updateBanner('title', (e.target as HTMLInputElement).value)} />
      </div>
      <div>
        <label class={LABEL}>Subtitulo</label>
        <textarea class={`${INPUT} min-h-[80px] resize-none`} value={config.banner.subtitle} onInput={(e) => updateBanner('subtitle', (e.target as HTMLTextAreaElement).value)} />
      </div>
      <div>
        <label class={LABEL}>Puntos (uno por linea)</label>
        <textarea
          class={`${INPUT} min-h-[140px] resize-none`}
          value={config.banner.bullets.join('\n')}
          onInput={(e) => updateBanner('bullets', (e.target as HTMLTextAreaElement).value.split('\n'))}
        />
      </div>
    </div>
  )
}

function CitiesEditor({ config, onChange }: { config: AdminConfig; onChange: (p: Partial<AdminConfig>) => void }) {
  const citiesText = useSignal(config.cities.join('\n'))
  return (
    <div>
      <label class={LABEL}>Ciudades afectadas (una por linea)</label>
      <textarea
        class={`${INPUT} min-h-[240px] resize-none`}
        value={citiesText.value}
        onInput={(e) => {
          citiesText.value = (e.target as HTMLTextAreaElement).value
          onChange({ cities: citiesText.value.split('\n').map(c => c.trim()).filter(Boolean) })
        }}
      />
    </div>
  )
}

function EmergencyEditor({ config, onChange }: { config: AdminConfig; onChange: (p: Partial<AdminConfig>) => void }) {
  return (
    <div class="space-y-4">
      <div>
        <label class={LABEL}>Nombre de la emergencia</label>
        <input class={INPUT} value={config.emergencyName} onInput={(e) => onChange({ emergencyName: (e.target as HTMLInputElement).value })} />
      </div>
      <div>
        <label class={LABEL}>Region afectada</label>
        <input class={INPUT} value={config.emergencyRegion} onInput={(e) => onChange({ emergencyRegion: (e.target as HTMLInputElement).value })} />
      </div>
      <div class="bg-nodo-card border border-nodo-border rounded-2xl p-4">
        <label class="flex items-center gap-4 cursor-pointer">
          <input
            type="checkbox"
            checked={config.emergencyActive}
            onChange={(e) => onChange({ emergencyActive: (e.target as HTMLInputElement).checked })}
            class="w-5 h-5 rounded"
          />
          <span class="text-base font-medium">Emergencia activa</span>
        </label>
      </div>
    </div>
  )
}

interface SupabaseCenter {
  id: string
  name: string
  address_text: string | null
  city: string | null
  sector: string | null
  latitude: number | null
  longitude: number | null
  metadata: Record<string, unknown>
  verified: boolean
  is_active: boolean
}

function CentersEditor(_props: { config: AdminConfig; onChange: (p: Partial<AdminConfig>) => void }) {
  const centers = useSignal<SupabaseCenter[]>([])
  const loading = useSignal(true)
  const saving = useSignal<string | null>(null)
  const lastError = useSignal<string | null>(null)
  const lastSaved = useSignal<string | null>(null)

  const loadCenters = async () => {
    if (!supabase) { loading.value = false; return }
    try {
      const { data, error } = await supabase
        .from('points_of_interest')
        .select('id,name,address_text,city,sector,latitude,longitude,metadata,verified,is_active')
        .eq('poi_type', 'collection_center')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(100)
      if (error) throw error
      centers.value = (data || []) as SupabaseCenter[]
      lastError.value = null
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al cargar'
      lastError.value = msg
      console.error('[CentersEditor] load:', e)
    } finally {
      loading.value = false
    }
  }

  useEffect(() => { loadCenters() }, [])

  const saveCenter = async (center: SupabaseCenter) => {
    if (!supabase) return
    saving.value = center.id
    lastError.value = null
    try {
      const { error } = await supabase
        .from('points_of_interest')
        .update({
          name: center.name,
          address_text: center.address_text,
          city: center.city,
          sector: center.sector,
          latitude: center.latitude,
          longitude: center.longitude,
          metadata: center.metadata,
        })
        .eq('id', center.id)
      if (error) throw error
      lastSaved.value = `${center.name} guardado`
      setTimeout(() => { if (lastSaved.value?.includes(center.name)) lastSaved.value = null }, 3000)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al guardar'
      lastError.value = `${center.name}: ${msg}`
      console.error('[CentersEditor] save:', e)
    } finally {
      saving.value = null
    }
  }

  const addCenter = async () => {
    if (!supabase) return
    saving.value = 'new'
    lastError.value = null
    try {
      const emergencyId = getEmergencyId()
      if (!emergencyId) throw new Error('No hay emergencia activa')
      const { data, error } = await supabase
        .from('points_of_interest')
        .insert({
          emergency_id: emergencyId,
          poi_type: 'collection_center',
          name: 'Nuevo centro de acopio',
          latitude: 10.4806,
          longitude: -66.9036,
          is_active: true,
          verified: false,
          metadata: { status: 'available', source: 'admin' },
        })
        .select()
      if (error) throw error
      if (data && data.length > 0) {
        centers.value = [data[0] as SupabaseCenter, ...centers.value]
        lastSaved.value = 'Centro creado correctamente'
        setTimeout(() => { lastSaved.value = null }, 3000)
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al crear'
      lastError.value = msg
      console.error('[CentersEditor] add:', e)
    } finally {
      saving.value = null
    }
  }

  const removeCenter = async (id: string) => {
    if (!supabase) return
    saving.value = id
    lastError.value = null
    try {
      const { error } = await supabase
        .from('points_of_interest')
        .update({ is_active: false })
        .eq('id', id)
      if (error) throw error
      centers.value = centers.value.filter(c => c.id !== id)
      lastSaved.value = 'Centro eliminado'
      setTimeout(() => { lastSaved.value = null }, 3000)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al eliminar'
      lastError.value = msg
      console.error('[CentersEditor] remove:', e)
    } finally {
      saving.value = null
    }
  }

  const updateField = (id: string, field: string, value: string | number | null) => {
    centers.value = centers.value.map(c => {
      if (c.id !== id) return c
      if (field === 'phone' || field === 'schedule' || field === 'needs') {
        return { ...c, metadata: { ...c.metadata, [field]: value } }
      }
      return { ...c, [field]: value }
    })
  }

  const addPhoto = (id: string, blob: Blob) => {
    const reader = new FileReader()
    reader.onload = () => {
      centers.value = centers.value.map(c => {
        if (c.id !== id) return c
        const images = ((c.metadata?.images as string[]) || []).concat(reader.result as string)
        return { ...c, metadata: { ...c.metadata, images } }
      })
    }
    reader.readAsDataURL(blob)
  }

  const removePhoto = (id: string, idx: number) => {
    centers.value = centers.value.map(c => {
      if (c.id !== id) return c
      const images = ((c.metadata?.images as string[]) || []).filter((_, i) => i !== idx)
      return { ...c, metadata: { ...c.metadata, images } }
    })
  }

  if (loading.value) {
    return <div class="flex justify-center py-12"><div class="text-nodo-muted">Cargando centros...</div></div>
  }

  return (
    <div class="space-y-3">
      {/* Debug panel */}
      <div class="bg-gray-900 border border-gray-700 rounded-xl p-3 text-xs font-mono space-y-1">
        <div class="text-gray-400 font-bold mb-1">Panel de depuracion</div>
        <div>Centros encontrados: <span class="text-emerald-400">{centers.value.length}</span></div>
        <div>Centros renderizados: <span class="text-emerald-400">{centers.value.length}</span></div>
        <div>Ultimo guardado: <span class="text-blue-400">{lastSaved.value || 'ninguno'}</span></div>
        <div>Ultimo error: <span class={lastError.value ? 'text-red-400' : 'text-gray-500'}>{lastError.value || 'ninguno'}</span></div>
      </div>

      <button
        onClick={addCenter}
        disabled={saving.value === 'new'}
        class="w-full bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-2xl p-4 active:scale-[0.97] transition-all min-h-[56px] disabled:opacity-50"
      >
        {saving.value === 'new' ? 'Creando...' : '➕ Nuevo centro de acopio'}
      </button>

      {lastError.value && (
        <div class="bg-red-900/40 border border-red-700/40 text-red-300 text-sm rounded-xl p-3">
          {lastError.value}
        </div>
      )}
      {lastSaved.value && (
        <div class="bg-emerald-900/40 border border-emerald-700/40 text-emerald-300 text-sm rounded-xl p-3">
          {lastSaved.value}
        </div>
      )}

      {centers.value.map((c) => (
        <div key={c.id} class="bg-nodo-card border border-nodo-border rounded-2xl p-4 space-y-3">
          {c.verified && <span class="inline-block bg-emerald-900/50 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full">Verificado</span>}
          <div>
            <label class={LABEL}>Nombre</label>
            <input class={INPUT} value={c.name} onInput={(e) => updateField(c.id, 'name', (e.target as HTMLInputElement).value)} placeholder="Nombre del centro" />
          </div>
          <div>
            <label class={LABEL}>Direccion</label>
            <input class={INPUT} value={c.address_text || ''} onInput={(e) => updateField(c.id, 'address_text', (e.target as HTMLInputElement).value)} placeholder="Direccion" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class={LABEL}>Ciudad</label>
              <input class={INPUT} value={c.city || ''} onInput={(e) => updateField(c.id, 'city', (e.target as HTMLInputElement).value)} placeholder="Ciudad" />
            </div>
            <div>
              <label class={LABEL}>Sector</label>
              <input class={INPUT} value={c.sector || ''} onInput={(e) => updateField(c.id, 'sector', (e.target as HTMLInputElement).value)} placeholder="Sector" />
            </div>
          </div>
          <div>
            <label class={LABEL}>Telefono</label>
            <input class={INPUT} value={(c.metadata?.phone as string) || ''} onInput={(e) => updateField(c.id, 'phone', (e.target as HTMLInputElement).value)} placeholder="Telefono" />
          </div>
          <div>
            <label class={LABEL}>Horario</label>
            <input class={INPUT} value={(c.metadata?.schedule as string) || ''} onInput={(e) => updateField(c.id, 'schedule', (e.target as HTMLInputElement).value)} placeholder="Ej: 8am - 5pm" />
          </div>
          <div>
            <label class={LABEL}>Necesidades actuales</label>
            <input class={INPUT} value={(c.metadata?.needs as string) || ''} onInput={(e) => updateField(c.id, 'needs', (e.target as HTMLInputElement).value)} placeholder="Agua, alimentos, medicinas..." />
          </div>
          <div>
            <PhotoInput onPhoto={(blob) => addPhoto(c.id, blob)} label="Agregar foto" />
            {((c.metadata?.images as string[]) || []).length > 0 && (
              <div class="flex gap-2 mt-2 overflow-x-auto pb-1">
                {((c.metadata?.images as string[]) || []).map((img, idx) => (
                  <div key={idx} class="relative flex-shrink-0">
                    <img src={img} class="w-20 h-20 object-cover rounded-lg" alt={`Foto ${idx + 1}`} />
                    <button
                      type="button"
                      class="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                      onClick={() => removePhoto(c.id, idx)}
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <label class={LABEL}>Ubicacion</label>
            <LocationPicker
              compact
              initialLat={c.latitude}
              initialLng={c.longitude}
              onLocationChange={(loc) => {
                updateField(c.id, 'latitude', loc.lat)
                updateField(c.id, 'longitude', loc.lng)
                if (loc.city) updateField(c.id, 'city', loc.city)
                if (loc.sector) updateField(c.id, 'sector', loc.sector)
              }}
            />
          </div>
          <div class="flex gap-2">
            <button
              class="flex-1 bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-semibold rounded-xl py-3 text-center active:scale-[0.97] transition-all min-h-[44px] disabled:opacity-50"
              onClick={() => saveCenter(c)}
              disabled={saving.value === c.id}
            >
              {saving.value === c.id ? 'Guardando...' : 'Guardar cambios'}
            </button>
            <button
              class="bg-red-900/40 border border-red-700/40 text-red-400 rounded-xl px-4 py-3 text-sm font-semibold active:scale-[0.97] transition-transform min-h-[44px] disabled:opacity-50"
              onClick={() => removeCenter(c.id)}
              disabled={saving.value === c.id}
            >
              🗑
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

function PasswordEditor() {
  const newPwd = useSignal('')
  const confirm = useSignal('')
  const msg = useSignal<string | null>(null)

  const handleSave = () => {
    if (newPwd.value.length < 6) { msg.value = 'Minimo 6 caracteres'; return }
    if (newPwd.value === 'nodo2025') { msg.value = 'No puedes usar la contraseña compartida'; return }
    if (newPwd.value !== confirm.value) { msg.value = 'Las contraseñas no coinciden'; return }
    setOwnerPassword(newPwd.value)
    logAudit('Propietario', 'change_owner_password', 'admin_config')
    msg.value = 'Contraseña de Owner actualizada'
    newPwd.value = ''
    confirm.value = ''
  }

  return (
    <div class="space-y-4">
      <div>
        <label class={LABEL}>Nueva contraseña</label>
        <input type="password" class={INPUT} value={newPwd.value} onInput={(e) => { newPwd.value = (e.target as HTMLInputElement).value; msg.value = null }} />
      </div>
      <div>
        <label class={LABEL}>Confirmar contraseña</label>
        <input type="password" class={INPUT} value={confirm.value} onInput={(e) => { confirm.value = (e.target as HTMLInputElement).value; msg.value = null }} />
      </div>
      {msg.value && <p class={`text-sm font-medium text-center ${msg.value.includes('actualizada') ? 'text-green-400' : 'text-red-400'}`}>{msg.value}</p>}
      <Button size="lg" fullWidth onClick={handleSave}>Cambiar contraseña</Button>
    </div>
  )
}

function ModeratorsEditor() {
  const moderators = useSignal<Moderator[]>(getModerators())
  const showForm = useSignal(false)
  const editId = useSignal<string | null>(null)
  const name = useSignal('')
  const pwd = useSignal('')
  const perms = useSignal<ModeratorPermission[]>([])
  const msg = useSignal<string | null>(null)

  const flash = (t: string) => { msg.value = t; setTimeout(() => { msg.value = null }, 3000) }

  const openCreate = () => {
    editId.value = null
    name.value = ''
    pwd.value = ''
    perms.value = []
    showForm.value = true
  }

  const openEdit = (m: Moderator) => {
    editId.value = m.id
    name.value = m.name
    pwd.value = ''
    perms.value = [...m.permissions]
    showForm.value = true
  }

  const save = () => {
    if (!name.value.trim()) { flash('Nombre requerido'); return }
    if (!editId.value && !pwd.value) { flash('Contraseña requerida'); return }
    if (perms.value.length === 0) { flash('Selecciona al menos un permiso'); return }

    const list = [...moderators.value]
    if (editId.value) {
      const idx = list.findIndex(m => m.id === editId.value)
      if (idx >= 0) {
        list[idx] = { ...list[idx], name: name.value.trim(), permissions: perms.value }
        if (pwd.value) list[idx].password = pwd.value
      }
    } else {
      list.push({ id: generateId(), name: name.value.trim(), password: pwd.value, permissions: perms.value })
    }
    saveModerators(list)
    moderators.value = list
    showForm.value = false
    flash(editId.value ? 'Moderador actualizado' : 'Moderador creado')
  }

  const remove = (id: string) => {
    const list = moderators.value.filter(m => m.id !== id)
    saveModerators(list)
    moderators.value = list
    flash('Moderador eliminado')
  }

  const togglePerm = (p: ModeratorPermission) => {
    perms.value = perms.value.includes(p) ? perms.value.filter(x => x !== p) : [...perms.value, p]
  }

  return (
    <div class="space-y-3">
      {msg.value && <div class="bg-emerald-900/50 border border-emerald-700/50 text-emerald-300 text-sm font-medium rounded-xl p-3 text-center">{msg.value}</div>}

      {showForm.value && (
        <div class="bg-nodo-card border border-nodo-border rounded-2xl p-4 space-y-4">
          <h3 class="font-bold">{editId.value ? '✏️ Editar moderador' : '➕ Nuevo moderador'}</h3>
          <div>
            <label class={LABEL}>Nombre</label>
            <input class={INPUT} value={name.value} onInput={(e) => { name.value = (e.target as HTMLInputElement).value }} placeholder="Nombre del moderador" />
          </div>
          <div>
            <label class={LABEL}>{editId.value ? 'Nueva contraseña (dejar vacia para mantener)' : 'Contraseña'}</label>
            <input type="password" class={INPUT} value={pwd.value} onInput={(e) => { pwd.value = (e.target as HTMLInputElement).value }} placeholder="Contraseña" />
          </div>
          <div>
            <label class={LABEL}>Permisos</label>
            <div class="space-y-2">
              {ALL_PERMISSIONS.map(p => (
                <label key={p} class="flex items-center gap-3 bg-nodo-dark border border-nodo-border rounded-xl p-3.5 cursor-pointer active:bg-white/[0.04] min-h-[48px]">
                  <input type="checkbox" checked={perms.value.includes(p)} onChange={() => togglePerm(p)} class="w-5 h-5 rounded" />
                  <span class="text-sm font-medium">{PERMISSION_LABELS[p]}</span>
                </label>
              ))}
            </div>
          </div>
          <div class="flex gap-3 pt-1">
            <Button size="lg" fullWidth onClick={save}>Guardar</Button>
            <Button size="lg" variant="secondary" fullWidth onClick={() => { showForm.value = false }}>Cancelar</Button>
          </div>
        </div>
      )}

      {!showForm.value && (
        <button onClick={openCreate} class="w-full bg-nodo-card border-2 border-dashed border-nodo-border rounded-2xl p-4 text-nodo-muted font-semibold active:scale-[0.97] transition-transform min-h-[56px]">
          ➕ Agregar moderador
        </button>
      )}

      {moderators.value.map(m => (
        <div key={m.id} class="bg-nodo-card border border-nodo-border rounded-2xl p-4">
          <div class="flex items-start justify-between mb-3">
            <div>
              <h4 class="font-bold text-base">👤 {m.name}</h4>
              <p class="text-xs text-nodo-muted mt-1">{m.permissions.map(p => PERMISSION_LABELS[p]).join(' · ')}</p>
            </div>
          </div>
          <div class="flex gap-2">
            <button onClick={() => openEdit(m)} class="flex-1 bg-blue-800 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl py-3 text-center active:scale-[0.97] transition-all min-h-[48px]">
              ✏️ Editar
            </button>
            <button onClick={() => remove(m.id)} class="flex-1 bg-red-800 hover:bg-red-700 text-white text-sm font-semibold rounded-xl py-3 text-center active:scale-[0.97] transition-all min-h-[48px]">
              🗑 Eliminar
            </button>
          </div>
        </div>
      ))}

      {!showForm.value && moderators.value.length === 0 && (
        <div class="bg-nodo-card border border-nodo-border rounded-2xl p-6 text-center">
          <div class="text-3xl mb-2">👥</div>
          <p class="text-nodo-muted text-sm">No hay moderadores creados.</p>
          <p class="text-xs text-nodo-muted mt-1">Los moderadores pueden gestionar secciones del panel desde su telefono.</p>
        </div>
      )}
    </div>
  )
}
