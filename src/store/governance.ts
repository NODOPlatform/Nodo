import { signal } from '@preact/signals'
import { supabase } from '../lib/supabase'
import {
  type GovernanceUser, type AuditEntry, type ActiveSession,
  type GovernanceRole, type Permission, type EmergencyModeConfig, type BackupConfig,
  DEFAULT_ROLE_PERMISSIONS, parseUserAgent,
} from '../lib/governance'

// --- Signals ---
export const govUsers = signal<GovernanceUser[]>([])
export const govUsersLoaded = signal(false)
export const govUsersLoading = signal(false)

export const auditLogs = signal<AuditEntry[]>([])
export const auditLogsLoaded = signal(false)
export const auditLogsLoading = signal(false)
export const auditTotal = signal(0)

export const activeSessions = signal<ActiveSession[]>([])
export const sessionsLoaded = signal(false)

export const emergencyMode = signal<EmergencyModeConfig>({ active: false, activated_by: null, activated_at: null })
export const backupConfig = signal<BackupConfig>({ auto_daily: false, last_backup: null, retention_days: 30 })
export const govConfigLoaded = signal(false)

// --- Users ---

export async function loadGovernanceUsers(): Promise<void> {
  if (!supabase) return
  govUsersLoading.value = true
  const { data } = await supabase.from('user_roles').select('*').order('created_at', { ascending: true })
  if (data) {
    govUsers.value = data.map(u => ({
      id: u.id,
      email: u.email,
      role: u.role as GovernanceRole,
      display_name: u.display_name || u.email,
      permissions: (u.permissions as Permission[]) || [],
      is_active: u.is_active ?? true,
      last_login: u.last_login,
      created_at: u.created_at,
      created_by: u.created_by,
      totp_enabled: u.totp_enabled ?? false,
    }))
  }
  govUsersLoaded.value = true
  govUsersLoading.value = false
}

export async function createGovernanceUser(
  email: string, displayName: string, role: GovernanceRole, permissions: Permission[], createdBy: string
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Supabase no disponible' }

  const perms = permissions.length > 0 ? permissions : DEFAULT_ROLE_PERMISSIONS[role]

  const { error } = await supabase.from('user_roles').insert({
    email: email.toLowerCase().trim(),
    role,
    display_name: displayName.trim(),
    permissions: perms,
    is_active: true,
    created_by: createdBy,
  })

  if (error) {
    if (error.code === '23505') return { success: false, error: 'Este email ya esta registrado.' }
    return { success: false, error: error.message }
  }

  await logAudit(createdBy, 'create_user', 'user_roles', email, null, { email, role, displayName })
  await loadGovernanceUsers()
  return { success: true }
}

export async function updateGovernanceUser(
  userId: string, updates: Partial<{ role: GovernanceRole; permissions: Permission[]; display_name: string; is_active: boolean }>, updatedBy: string
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Supabase no disponible' }

  const current = govUsers.value.find(u => u.id === userId)
  if (!current) return { success: false, error: 'Usuario no encontrado' }

  const { error } = await supabase.from('user_roles').update({
    ...updates,
    updated_at: new Date().toISOString(),
  }).eq('id', userId)

  if (error) return { success: false, error: error.message }

  const action = updates.role && updates.role !== current.role ? 'change_role'
    : updates.is_active !== undefined && updates.is_active !== current.is_active ? (updates.is_active ? 'activate_user' : 'deactivate_user')
    : updates.permissions ? 'change_permissions'
    : 'update_user'

  await logAudit(updatedBy, action, 'user_roles', userId,
    { role: current.role, permissions: current.permissions, is_active: current.is_active },
    updates
  )
  await loadGovernanceUsers()
  return { success: true }
}

export async function deleteGovernanceUser(userId: string, deletedBy: string): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Supabase no disponible' }

  const user = govUsers.value.find(u => u.id === userId)
  if (!user) return { success: false, error: 'Usuario no encontrado' }

  const { error } = await supabase.from('user_roles').delete().eq('id', userId)
  if (error) return { success: false, error: error.message }

  await logAudit(deletedBy, 'delete_user', 'user_roles', userId, { email: user.email, role: user.role }, null)
  await loadGovernanceUsers()
  return { success: true }
}

export function getOwnerCount(): number {
  return govUsers.value.filter(u => u.role === 'owner' && u.is_active).length
}

export function getSuperAdminCount(): number {
  return govUsers.value.filter(u => u.role === 'super_admin' && u.is_active).length
}

// --- Audit Log ---

export async function logAudit(
  userName: string, action: string, entityType?: string, entityId?: string,
  oldState?: Record<string, unknown> | null, newState?: Record<string, unknown> | null,
  extra?: Record<string, unknown>
): Promise<void> {
  if (!supabase) return

  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''
  const parsed = parseUserAgent(ua)

  await supabase.from('audit_logs').insert({
    user_name: userName,
    user_role: getCurrentUserRole(),
    action,
    entity_type: entityType || null,
    entity_id: entityId || null,
    old_state: oldState || null,
    new_state: newState || null,
    metadata: { ...extra, browser: parsed.browser, os: parsed.os, device: parsed.device },
    user_agent: ua.slice(0, 500),
  })
}

function getCurrentUserRole(): string {
  try {
    const raw = localStorage.getItem('nodo_admin_session')
    if (!raw) return 'unknown'
    const session = JSON.parse(raw)
    return session.role || 'unknown'
  } catch { return 'unknown' }
}

export async function loadAuditLogs(filters?: {
  action?: string; entityType?: string; userName?: string; limit?: number; offset?: number
}): Promise<void> {
  if (!supabase) return
  auditLogsLoading.value = true

  let query = supabase.from('audit_logs').select('*', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (filters?.action) query = query.eq('action', filters.action)
  if (filters?.entityType) query = query.eq('entity_type', filters.entityType)
  if (filters?.userName) query = query.ilike('user_name', `%${filters.userName}%`)

  const limit = filters?.limit || 50
  const offset = filters?.offset || 0
  query = query.range(offset, offset + limit - 1)

  const { data, count } = await query

  if (data) {
    auditLogs.value = data as AuditEntry[]
    auditTotal.value = count || 0
  }
  auditLogsLoaded.value = true
  auditLogsLoading.value = false
}

// --- Sessions ---

export async function createSession(userName: string): Promise<string | null> {
  if (!supabase) return null

  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''
  const parsed = parseUserAgent(ua)
  const expiresAt = new Date(Date.now() + 3 * 3600000).toISOString()

  const { data } = await supabase.from('active_sessions').insert({
    user_id: userName,
    user_name: userName,
    device_info: parsed.device,
    browser: parsed.browser,
    os: parsed.os,
    is_current: true,
    expires_at: expiresAt,
  }).select('id').single()

  return data?.id || null
}

export async function loadActiveSessions(userId: string): Promise<void> {
  if (!supabase) return

  const now = new Date().toISOString()
  const { data } = await supabase.from('active_sessions').select('*')
    .eq('user_id', userId)
    .gte('expires_at', now)
    .order('last_active', { ascending: false })

  if (data) activeSessions.value = data as ActiveSession[]
  sessionsLoaded.value = true
}

export async function revokeSession(sessionId: string): Promise<void> {
  if (!supabase) return
  await supabase.from('active_sessions').delete().eq('id', sessionId)
}

export async function revokeAllSessions(userId: string, exceptId?: string): Promise<void> {
  if (!supabase) return
  let query = supabase.from('active_sessions').delete().eq('user_id', userId)
  if (exceptId) query = query.neq('id', exceptId)
  await query
}

export async function touchSession(sessionId: string): Promise<void> {
  if (!supabase) return
  await supabase.from('active_sessions').update({ last_active: new Date().toISOString() }).eq('id', sessionId)
}

// --- Governance Config ---

export async function loadGovernanceConfig(): Promise<void> {
  if (!supabase) return

  const { data } = await supabase.from('governance_config').select('*')
  if (data) {
    for (const row of data) {
      if (row.key === 'emergency_mode') emergencyMode.value = row.value as unknown as EmergencyModeConfig
      if (row.key === 'backup_config') backupConfig.value = row.value as unknown as BackupConfig
    }
  }
  govConfigLoaded.value = true
}

export async function setEmergencyMode(active: boolean, userName: string): Promise<void> {
  if (!supabase) return

  const config: EmergencyModeConfig = {
    active,
    activated_by: active ? userName : null,
    activated_at: active ? new Date().toISOString() : null,
  }

  await supabase.from('governance_config').update({
    value: config as unknown as Record<string, unknown>,
    updated_at: new Date().toISOString(),
    updated_by: userName,
  }).eq('key', 'emergency_mode')

  emergencyMode.value = config
  await logAudit(userName, active ? 'activate_emergency_mode' : 'deactivate_emergency_mode', 'governance_config', 'emergency_mode', null, { active })
}

export async function updateBackupConfig(config: Partial<BackupConfig>, userName: string): Promise<void> {
  if (!supabase) return

  const updated = { ...backupConfig.value, ...config }

  await supabase.from('governance_config').update({
    value: updated as unknown as Record<string, unknown>,
    updated_at: new Date().toISOString(),
    updated_by: userName,
  }).eq('key', 'backup_config')

  backupConfig.value = updated
  await logAudit(userName, 'update_backup_config', 'governance_config', 'backup_config', null, config as Record<string, unknown>)
}
