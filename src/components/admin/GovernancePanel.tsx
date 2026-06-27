import { useSignal } from '@preact/signals'
import { useEffect } from 'preact/hooks'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { SectionHeader } from '../ui/SectionHeader'
import { Divider } from '../ui/Divider'
import { EmptyState } from '../ui/EmptyState'
import { LoadingState } from '../ui/LoadingState'
import {
  govUsers, govUsersLoaded, govUsersLoading, loadGovernanceUsers,
  createGovernanceUser, updateGovernanceUser, deleteGovernanceUser,
  getOwnerCount, getSuperAdminCount,
  auditLogs, auditLogsLoaded, auditLogsLoading, auditTotal, loadAuditLogs,
  activeSessions, sessionsLoaded, loadActiveSessions, revokeSession, revokeAllSessions,
  emergencyMode, backupConfig, loadGovernanceConfig,
  setEmergencyMode, updateBackupConfig,
} from '../../store/governance'
import {
  type GovernanceRole, type Permission, type GovernanceUser,
  ROLE_LABELS, ROLE_COLORS, ROLE_ICONS, ALL_PERMISSIONS,
  PERMISSION_LABELS, PERMISSION_ICONS, DEFAULT_ROLE_PERMISSIONS,
  canDeleteUser, canChangeRole, isEmergencyModeBlocked,
} from '../../lib/governance'
import { adminUserName, adminRole } from '../../store/admin-session'

type GovView = 'overview' | 'users' | 'user-form' | 'audit' | 'sessions' | 'emergency' | 'backups'

const AUDIT_ACTIONS = [
  { value: '', label: 'Todas' },
  { value: 'create_user', label: 'Crear usuario' },
  { value: 'delete_user', label: 'Eliminar usuario' },
  { value: 'change_role', label: 'Cambiar rol' },
  { value: 'change_permissions', label: 'Cambiar permisos' },
  { value: 'activate_emergency_mode', label: 'Activar emergencia' },
  { value: 'deactivate_emergency_mode', label: 'Desactivar emergencia' },
  { value: 'update_backup_config', label: 'Config backups' },
]

function timeAgo(ts: string): string {
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 60000)
  if (diff < 1) return 'ahora'
  if (diff < 60) return `hace ${diff}m`
  const h = Math.floor(diff / 60)
  if (h < 24) return `hace ${h}h`
  const d = Math.floor(h / 24)
  return `hace ${d}d`
}

export function GovernancePanel() {
  const view = useSignal<GovView>('overview')
  const editingUser = useSignal<GovernanceUser | null>(null)

  // Form
  const formEmail = useSignal('')
  const formName = useSignal('')
  const formRole = useSignal<GovernanceRole>('editor')
  const formPermissions = useSignal<Set<Permission>>(new Set())
  const formError = useSignal('')
  const formSaving = useSignal(false)

  // Audit filters
  const auditAction = useSignal('')
  const auditSearch = useSignal('')
  const auditPage = useSignal(0)

  const currentRole = adminRole.value as GovernanceRole
  const currentName = adminUserName.value || 'Admin'

  useEffect(() => {
    loadGovernanceUsers()
    loadGovernanceConfig()
  }, [])

  const openUserForm = (user?: GovernanceUser) => {
    if (user) {
      editingUser.value = user
      formEmail.value = user.email
      formName.value = user.display_name
      formRole.value = user.role
      formPermissions.value = new Set(user.permissions)
    } else {
      editingUser.value = null
      formEmail.value = ''
      formName.value = ''
      formRole.value = 'editor'
      formPermissions.value = new Set(DEFAULT_ROLE_PERMISSIONS.editor)
    }
    formError.value = ''
    view.value = 'user-form'
  }

  const handleRoleChange = (role: GovernanceRole) => {
    formRole.value = role
    formPermissions.value = new Set(DEFAULT_ROLE_PERMISSIONS[role])
  }

  const togglePermission = (p: Permission) => {
    const s = new Set(formPermissions.value)
    if (s.has(p)) s.delete(p)
    else s.add(p)
    formPermissions.value = s
  }

  const saveUser = async () => {
    formError.value = ''
    formSaving.value = true

    if (isEmergencyModeBlocked(editingUser.value ? 'change_role' : 'create_user', currentRole, emergencyMode.value.active)) {
      formError.value = 'Modo emergencia activo. Solo Owner puede realizar esta accion.'
      formSaving.value = false
      return
    }

    if (editingUser.value) {
      const check = canChangeRole(currentRole, editingUser.value.role, formRole.value)
      if (!check.allowed) { formError.value = check.reason!; formSaving.value = false; return }

      const res = await updateGovernanceUser(editingUser.value.id, {
        role: formRole.value,
        display_name: formName.value.trim(),
        permissions: Array.from(formPermissions.value),
      }, currentName)

      if (!res.success) formError.value = res.error!
      else view.value = 'users'
    } else {
      if (!formEmail.value.trim() || !formName.value.trim()) {
        formError.value = 'Email y nombre son obligatorios.'
        formSaving.value = false
        return
      }

      const res = await createGovernanceUser(
        formEmail.value, formName.value, formRole.value,
        Array.from(formPermissions.value), currentName
      )
      if (!res.success) formError.value = res.error!
      else view.value = 'users'
    }
    formSaving.value = false
  }

  const handleDelete = async (user: GovernanceUser) => {
    const check = canDeleteUser(currentRole, user.role, getOwnerCount() <= 1 && user.role === 'owner', getSuperAdminCount() <= 1 && user.role === 'super_admin')
    if (!check.allowed) { alert(check.reason); return }
    if (!confirm(`Eliminar a ${user.display_name}?`)) return
    await deleteGovernanceUser(user.id, currentName)
  }

  const loadAudit = (page: number = 0) => {
    auditPage.value = page
    loadAuditLogs({
      action: auditAction.value || undefined,
      userName: auditSearch.value || undefined,
      limit: 30,
      offset: page * 30,
    })
  }

  // --- Views ---

  if (view.value === 'user-form') {
    return (
      <div class="space-y-4 animate-fade-in">
        <div class="flex items-center gap-3 mb-4">
          <button onClick={() => { view.value = 'users' }} class="w-9 h-9 flex items-center justify-center rounded-lg bg-nodo-card border border-nodo-border">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </button>
          <h3 class="text-base font-bold">{editingUser.value ? 'Editar usuario' : 'Nuevo usuario'}</h3>
        </div>

        {!editingUser.value && (
          <div>
            <label class="text-xs text-nodo-muted block mb-1">Email</label>
            <input class="w-full bg-nodo-dark border border-nodo-border rounded-xl p-3 text-white" type="email" placeholder="email@ejemplo.com" value={formEmail.value} onInput={e => { formEmail.value = (e.target as HTMLInputElement).value }} />
          </div>
        )}

        <div>
          <label class="text-xs text-nodo-muted block mb-1">Nombre</label>
          <input class="w-full bg-nodo-dark border border-nodo-border rounded-xl p-3 text-white" placeholder="Nombre completo" value={formName.value} onInput={e => { formName.value = (e.target as HTMLInputElement).value }} />
        </div>

        <div>
          <label class="text-xs text-nodo-muted block mb-1">Rol</label>
          <div class="flex flex-wrap gap-2">
            {(['owner', 'super_admin', 'admin', 'moderator', 'editor'] as GovernanceRole[]).map(r => {
              const canAssign = canChangeRole(currentRole, editingUser.value?.role || 'editor', r)
              return (
                <button
                  key={r}
                  onClick={() => canAssign.allowed && handleRoleChange(r)}
                  disabled={!canAssign.allowed}
                  class={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    formRole.value === r ? 'border-white/30 text-white' : 'border-nodo-border text-nodo-muted'
                  } ${!canAssign.allowed ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white/[0.04]'}`}
                  style={formRole.value === r ? { background: `${ROLE_COLORS[r]}25` } : {}}
                >
                  {ROLE_ICONS[r]} {ROLE_LABELS[r]}
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <label class="text-xs text-nodo-muted block mb-1">Permisos</label>
          <div class="grid grid-cols-1 gap-1.5">
            {ALL_PERMISSIONS.map(p => (
              <button
                key={p}
                type="button"
                onClick={() => togglePermission(p)}
                class={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs border transition-all text-left ${
                  formPermissions.value.has(p) ? 'bg-blue-500/10 border-blue-500/30 text-blue-300' : 'bg-nodo-card border-nodo-border text-nodo-muted'
                }`}
              >
                <span>{PERMISSION_ICONS[p]}</span>
                <span class="flex-1">{PERMISSION_LABELS[p]}</span>
                {formPermissions.value.has(p) && <span class="text-blue-400">✓</span>}
              </button>
            ))}
          </div>
        </div>

        {formError.value && <p class="text-red-400 text-sm">{formError.value}</p>}

        <Button fullWidth size="lg" loading={formSaving.value} onClick={saveUser}>
          {editingUser.value ? 'Guardar cambios' : 'Crear usuario'}
        </Button>
      </div>
    )
  }

  if (view.value === 'users') {
    return (
      <div class="space-y-4 animate-fade-in">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <button onClick={() => { view.value = 'overview' }} class="w-9 h-9 flex items-center justify-center rounded-lg bg-nodo-card border border-nodo-border">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            </button>
            <h3 class="text-base font-bold">Usuarios</h3>
          </div>
          <Button size="sm" onClick={() => openUserForm()}>+ Nuevo</Button>
        </div>

        {govUsersLoading.value && !govUsersLoaded.value && <LoadingState />}

        {govUsersLoaded.value && govUsers.value.length === 0 && (
          <EmptyState icon="👥" title="Sin usuarios" description="Aun no hay usuarios registrados." />
        )}

        <div class="space-y-2">
          {govUsers.value.map(u => (
            <Card key={u.id} padding="sm">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ background: `${ROLE_COLORS[u.role]}20` }}>
                  {ROLE_ICONS[u.role]}
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-semibold truncate">{u.display_name}</span>
                    {!u.is_active && <Badge color="#ef4444" size="sm">Inactivo</Badge>}
                  </div>
                  <div class="flex items-center gap-2 mt-0.5">
                    <Badge color={ROLE_COLORS[u.role]} size="sm">{ROLE_LABELS[u.role]}</Badge>
                    <span class="text-[10px] text-nodo-muted truncate">{u.email}</span>
                  </div>
                </div>
                <div class="flex gap-1 flex-shrink-0">
                  <button onClick={() => openUserForm(u)} class="w-8 h-8 flex items-center justify-center rounded-lg text-nodo-muted hover:text-white hover:bg-white/[0.06] transition-colors" aria-label="Editar">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  {u.role !== 'owner' && (
                    <button onClick={() => handleDelete(u)} class="w-8 h-8 flex items-center justify-center rounded-lg text-nodo-muted hover:text-red-400 hover:bg-red-500/10 transition-colors" aria-label="Eliminar">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                    </button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (view.value === 'audit') {
    if (!auditLogsLoaded.value) loadAudit()

    return (
      <div class="space-y-4 animate-fade-in">
        <div class="flex items-center gap-3">
          <button onClick={() => { view.value = 'overview' }} class="w-9 h-9 flex items-center justify-center rounded-lg bg-nodo-card border border-nodo-border">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </button>
          <h3 class="text-base font-bold">Auditoria</h3>
          <span class="text-[10px] text-nodo-muted ml-auto">{auditTotal.value} registros</span>
        </div>

        <div class="flex gap-2">
          <select
            class="flex-1 bg-nodo-dark border border-nodo-border rounded-xl p-2.5 text-sm text-white"
            value={auditAction.value}
            onChange={e => { auditAction.value = (e.target as HTMLSelectElement).value; loadAudit(0) }}
          >
            {AUDIT_ACTIONS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
          </select>
          <input
            class="flex-1 bg-nodo-dark border border-nodo-border rounded-xl p-2.5 text-sm text-white"
            placeholder="Buscar usuario..."
            value={auditSearch.value}
            onInput={e => { auditSearch.value = (e.target as HTMLInputElement).value }}
            onKeyDown={e => { if (e.key === 'Enter') loadAudit(0) }}
          />
        </div>

        {auditLogsLoading.value && <LoadingState />}

        {auditLogsLoaded.value && auditLogs.value.length === 0 && (
          <EmptyState icon="📋" title="Sin registros" description="No hay actividad registrada con estos filtros." />
        )}

        <div class="space-y-1.5">
          {auditLogs.value.map(entry => (
            <Card key={entry.id} padding="sm">
              <div class="flex items-start gap-3">
                <div class="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center text-sm flex-shrink-0">
                  {entry.action.includes('delete') ? '🗑️' : entry.action.includes('create') ? '➕' : entry.action.includes('emergency') ? '🚨' : '📝'}
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-xs font-semibold">{entry.action.replace(/_/g, ' ')}</p>
                  <p class="text-[10px] text-nodo-muted mt-0.5">
                    {entry.user_name || 'Sistema'} · {entry.entity_type || ''} · {timeAgo(entry.created_at)}
                  </p>
                  {entry.entity_id && <p class="text-[10px] text-nodo-muted/60 truncate">{entry.entity_id}</p>}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {auditTotal.value > 30 && (
          <div class="flex justify-center gap-2">
            <Button size="sm" variant="ghost" disabled={auditPage.value === 0} onClick={() => loadAudit(auditPage.value - 1)}>Anterior</Button>
            <span class="text-xs text-nodo-muted py-2">Pagina {auditPage.value + 1}</span>
            <Button size="sm" variant="ghost" disabled={(auditPage.value + 1) * 30 >= auditTotal.value} onClick={() => loadAudit(auditPage.value + 1)}>Siguiente</Button>
          </div>
        )}
      </div>
    )
  }

  if (view.value === 'sessions') {
    if (!sessionsLoaded.value) loadActiveSessions(currentName)

    return (
      <div class="space-y-4 animate-fade-in">
        <div class="flex items-center gap-3">
          <button onClick={() => { view.value = 'overview' }} class="w-9 h-9 flex items-center justify-center rounded-lg bg-nodo-card border border-nodo-border">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </button>
          <h3 class="text-base font-bold">Sesiones activas</h3>
        </div>

        {activeSessions.value.length === 0 ? (
          <EmptyState icon="🔒" title="Sin sesiones" description="No hay sesiones activas registradas." />
        ) : (
          <>
            <div class="space-y-2">
              {activeSessions.value.map(s => (
                <Card key={s.id} padding="sm">
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-lg bg-white/[0.06] flex items-center justify-center text-sm">
                      {s.device_info === 'Movil' ? '📱' : s.device_info === 'Tablet' ? '📱' : '💻'}
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-xs font-semibold">{s.browser} · {s.os}</p>
                      <p class="text-[10px] text-nodo-muted">{s.device_info} · Ultima actividad: {timeAgo(s.last_active)}</p>
                    </div>
                    <button
                      onClick={async () => { await revokeSession(s.id); loadActiveSessions(currentName) }}
                      class="text-[10px] text-red-400 hover:text-red-300 font-semibold"
                    >
                      Cerrar
                    </button>
                  </div>
                </Card>
              ))}
            </div>
            <Button variant="danger" size="sm" fullWidth onClick={async () => { await revokeAllSessions(currentName); loadActiveSessions(currentName) }}>
              Cerrar todas las sesiones
            </Button>
          </>
        )}
      </div>
    )
  }

  if (view.value === 'emergency') {
    const isActive = emergencyMode.value.active

    return (
      <div class="space-y-4 animate-fade-in">
        <div class="flex items-center gap-3">
          <button onClick={() => { view.value = 'overview' }} class="w-9 h-9 flex items-center justify-center rounded-lg bg-nodo-card border border-nodo-border">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </button>
          <h3 class="text-base font-bold">Modo Emergencia</h3>
        </div>

        <Card variant={isActive ? 'emergency' : 'default'} padding="lg">
          <div class="text-center">
            <span class="text-4xl block mb-3">{isActive ? '🔴' : '🟢'}</span>
            <h4 class="text-lg font-bold mb-1">{isActive ? 'MODO EMERGENCIA ACTIVO' : 'Sistema operando normalmente'}</h4>
            <p class="text-xs text-nodo-muted mb-4">
              {isActive
                ? `Activado por ${emergencyMode.value.activated_by} · ${emergencyMode.value.activated_at ? timeAgo(emergencyMode.value.activated_at) : ''}`
                : 'Cuando se activa, se bloquean cambios criticos. Solo Owner puede operar.'}
            </p>

            {isActive && (
              <div class="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4 text-left">
                <p class="text-[11px] text-red-300 font-semibold mb-1">Acciones bloqueadas:</p>
                <ul class="text-[11px] text-red-300/70 space-y-0.5">
                  <li>• Crear usuarios</li>
                  <li>• Eliminar usuarios</li>
                  <li>• Cambiar roles</li>
                  <li>• Cambiar permisos</li>
                  <li>• Cambiar configuracion</li>
                </ul>
              </div>
            )}

            <Button
              variant={isActive ? 'secondary' : 'danger'}
              fullWidth
              size="lg"
              onClick={async () => {
                if (currentRole !== 'owner') { alert('Solo Owner puede controlar el modo emergencia.'); return }
                await setEmergencyMode(!isActive, currentName)
              }}
            >
              {isActive ? 'Desactivar modo emergencia' : 'Activar modo emergencia'}
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  if (view.value === 'backups') {
    const bc = backupConfig.value

    return (
      <div class="space-y-4 animate-fade-in">
        <div class="flex items-center gap-3">
          <button onClick={() => { view.value = 'overview' }} class="w-9 h-9 flex items-center justify-center rounded-lg bg-nodo-card border border-nodo-border">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </button>
          <h3 class="text-base font-bold">Backups</h3>
        </div>

        <Card padding="lg">
          <div class="text-center mb-4">
            <span class="text-3xl block mb-2">💾</span>
            <p class="text-xs text-nodo-muted">Arquitectura preparada para backups automaticos.</p>
          </div>

          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-sm">Backup diario automatico</span>
              <button
                onClick={async () => {
                  if (currentRole !== 'owner') { alert('Solo Owner puede configurar backups.'); return }
                  await updateBackupConfig({ auto_daily: !bc.auto_daily }, currentName)
                }}
                class={`w-11 h-6 rounded-full transition-colors relative ${bc.auto_daily ? 'bg-emerald-500' : 'bg-nodo-border'}`}
              >
                <span class={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${bc.auto_daily ? 'left-[22px]' : 'left-0.5'}`} />
              </button>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm">Retencion</span>
              <span class="text-sm text-nodo-muted">{bc.retention_days} dias</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm">Ultimo backup</span>
              <span class="text-sm text-nodo-muted">{bc.last_backup ? timeAgo(bc.last_backup) : 'Nunca'}</span>
            </div>
          </div>

          <Divider />

          <div class="text-center">
            <p class="text-[11px] text-nodo-muted mb-3">Solo Owner puede crear y restaurar backups.</p>
            <div class="flex gap-2">
              <Button variant="secondary" size="sm" fullWidth disabled>Crear backup manual</Button>
              <Button variant="outline" size="sm" fullWidth disabled>Restaurar</Button>
            </div>
            <p class="text-[10px] text-nodo-muted/60 mt-2">Motor de backups pendiente de configuracion del proveedor.</p>
          </div>
        </Card>
      </div>
    )
  }

  // --- Overview ---

  const ownerCount = getOwnerCount()
  const saCount = getSuperAdminCount()
  const totalUsers = govUsers.value.length
  const isEmergency = emergencyMode.value.active

  return (
    <div class="space-y-4 animate-fade-in">
      <SectionHeader icon="🛡️" title="Seguridad y Gobernanza" />

      {isEmergency && (
        <Card variant="emergency" padding="sm">
          <div class="flex items-center gap-2">
            <span>🔴</span>
            <span class="text-xs font-bold text-red-300">MODO EMERGENCIA ACTIVO</span>
            <button onClick={() => { view.value = 'emergency' }} class="ml-auto text-[10px] text-red-300 underline">Gestionar</button>
          </div>
        </Card>
      )}

      {/* Stats */}
      <div class="grid grid-cols-3 gap-2">
        <Card padding="sm">
          <p class="text-xl font-bold text-center">{totalUsers}</p>
          <p class="text-[10px] text-nodo-muted text-center">Usuarios</p>
        </Card>
        <Card padding="sm">
          <p class="text-xl font-bold text-center" style={{ color: ROLE_COLORS.owner }}>{ownerCount}</p>
          <p class="text-[10px] text-nodo-muted text-center">Owners</p>
        </Card>
        <Card padding="sm">
          <p class="text-xl font-bold text-center" style={{ color: ROLE_COLORS.super_admin }}>{saCount}</p>
          <p class="text-[10px] text-nodo-muted text-center">Super Admins</p>
        </Card>
      </div>

      {/* Navigation cards */}
      {[
        { icon: '👥', label: 'Usuarios y roles', desc: 'Gestionar usuarios, roles y permisos', view: 'users' as GovView },
        { icon: '📋', label: 'Auditoria', desc: 'Historial completo de acciones', view: 'audit' as GovView },
        { icon: '🔐', label: 'Sesiones activas', desc: 'Dispositivos conectados', view: 'sessions' as GovView },
        { icon: '🚨', label: 'Modo Emergencia', desc: isEmergency ? 'ACTIVO — Bloqueo critico' : 'Inactivo', view: 'emergency' as GovView },
        { icon: '💾', label: 'Backups', desc: 'Copias de seguridad', view: 'backups' as GovView },
      ].map(item => (
        <Card key={item.label} variant="interactive" padding="sm" onClick={() => { view.value = item.view }}>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center text-lg flex-shrink-0">{item.icon}</div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold">{item.label}</p>
              <p class="text-[11px] text-nodo-muted">{item.desc}</p>
            </div>
            <svg class="w-4 h-4 text-nodo-muted flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
          </div>
        </Card>
      ))}

      <Divider label="2FA" />

      <Card padding="sm">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-lg flex-shrink-0">🔑</div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold">Autenticacion en dos pasos</p>
            <p class="text-[11px] text-nodo-muted">Arquitectura preparada para TOTP (Google Authenticator/Authy).</p>
          </div>
          <Badge color="#eab308" size="sm">Pendiente</Badge>
        </div>
      </Card>

      {/* Security rules */}
      <Divider label="Reglas de seguridad" />

      <div class="space-y-1.5">
        {[
          { icon: '✅', text: `Minimo 1 Owner activo (actual: ${ownerCount})`, ok: ownerCount >= 1 },
          { icon: '✅', text: `Minimo 1 Super Admin activo (actual: ${saCount})`, ok: saCount >= 1 || ownerCount >= 1 },
          { icon: '✅', text: 'Owner no puede ser eliminado ni degradado', ok: true },
          { icon: '✅', text: 'Modo emergencia bloquea cambios criticos', ok: true },
          { icon: '✅', text: 'Toda accion critica queda en auditoria', ok: true },
        ].map((rule, i) => (
          <div key={i} class="flex items-center gap-2 px-2 py-1.5">
            <span class="text-sm">{rule.ok ? '✅' : '⚠️'}</span>
            <span class={`text-xs ${rule.ok ? 'text-nodo-muted' : 'text-amber-400'}`}>{rule.text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
