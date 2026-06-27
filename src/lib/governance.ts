export type GovernanceRole = 'owner' | 'super_admin' | 'admin' | 'moderator' | 'editor'

export type Permission =
  | 'manage_users'
  | 'manage_roles'
  | 'manage_campaigns'
  | 'manage_shelters'
  | 'manage_collection_centers'
  | 'manage_health'
  | 'manage_incidents'
  | 'manage_verified_info'
  | 'manage_statistics'
  | 'manage_settings'
  | 'manage_integrations'
  | 'view_audit_log'
  | 'restore_backups'

export const ALL_PERMISSIONS: Permission[] = [
  'manage_users', 'manage_roles', 'manage_campaigns', 'manage_shelters',
  'manage_collection_centers', 'manage_health', 'manage_incidents',
  'manage_verified_info', 'manage_statistics', 'manage_settings',
  'manage_integrations', 'view_audit_log', 'restore_backups',
]

export const PERMISSION_LABELS: Record<Permission, string> = {
  manage_users: 'Gestionar usuarios',
  manage_roles: 'Gestionar roles',
  manage_campaigns: 'Gestionar campanas',
  manage_shelters: 'Gestionar refugios',
  manage_collection_centers: 'Gestionar centros de acopio',
  manage_health: 'Gestionar salud',
  manage_incidents: 'Gestionar incidentes',
  manage_verified_info: 'Gestionar info verificada',
  manage_statistics: 'Ver estadisticas',
  manage_settings: 'Configuracion general',
  manage_integrations: 'Integraciones',
  view_audit_log: 'Ver auditoria',
  restore_backups: 'Restaurar backups',
}

export const PERMISSION_ICONS: Record<Permission, string> = {
  manage_users: '👥',
  manage_roles: '🛡️',
  manage_campaigns: '📢',
  manage_shelters: '🏠',
  manage_collection_centers: '📦',
  manage_health: '❤️',
  manage_incidents: '🚨',
  manage_verified_info: '📰',
  manage_statistics: '📊',
  manage_settings: '⚙️',
  manage_integrations: '🔌',
  view_audit_log: '📋',
  restore_backups: '💾',
}

export const ROLE_HIERARCHY: Record<GovernanceRole, number> = {
  owner: 100,
  super_admin: 80,
  admin: 60,
  moderator: 40,
  editor: 20,
}

export const ROLE_LABELS: Record<GovernanceRole, string> = {
  owner: 'Owner',
  super_admin: 'Super Admin',
  admin: 'Admin',
  moderator: 'Moderador',
  editor: 'Editor',
}

export const ROLE_COLORS: Record<GovernanceRole, string> = {
  owner: '#eab308',
  super_admin: '#f97316',
  admin: '#3b82f6',
  moderator: '#8b5cf6',
  editor: '#22c55e',
}

export const ROLE_ICONS: Record<GovernanceRole, string> = {
  owner: '👑',
  super_admin: '⭐',
  admin: '🔵',
  moderator: '🟣',
  editor: '🟢',
}

export const DEFAULT_ROLE_PERMISSIONS: Record<GovernanceRole, Permission[]> = {
  owner: [...ALL_PERMISSIONS],
  super_admin: [
    'manage_users', 'manage_campaigns', 'manage_shelters', 'manage_collection_centers',
    'manage_health', 'manage_incidents', 'manage_verified_info', 'manage_statistics',
    'manage_settings', 'view_audit_log',
  ],
  admin: [
    'manage_campaigns', 'manage_shelters', 'manage_collection_centers',
    'manage_health', 'manage_incidents', 'manage_verified_info', 'manage_statistics',
  ],
  moderator: [
    'manage_campaigns', 'manage_shelters', 'manage_collection_centers',
    'manage_verified_info',
  ],
  editor: [
    'manage_shelters', 'manage_collection_centers', 'manage_campaigns', 'manage_verified_info',
  ],
}

export interface GovernanceUser {
  id: string
  email: string
  role: GovernanceRole
  display_name: string
  permissions: Permission[]
  is_active: boolean
  last_login: string | null
  created_at: string
  created_by: string | null
  totp_enabled: boolean
}

export interface AuditEntry {
  id: string
  user_id: string | null
  user_name: string | null
  user_role: string | null
  action: string
  entity_type: string | null
  entity_id: string | null
  old_state: Record<string, unknown> | null
  new_state: Record<string, unknown> | null
  metadata: Record<string, unknown>
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

export interface ActiveSession {
  id: string
  user_id: string
  user_name: string | null
  device_info: string | null
  browser: string | null
  os: string | null
  ip_address: string | null
  is_current: boolean
  last_active: string
  created_at: string
  expires_at: string
}

export interface EmergencyModeConfig {
  active: boolean
  activated_by: string | null
  activated_at: string | null
}

export interface BackupConfig {
  auto_daily: boolean
  last_backup: string | null
  retention_days: number
}

export function canManageRole(actorRole: GovernanceRole, targetRole: GovernanceRole): boolean {
  return ROLE_HIERARCHY[actorRole] > ROLE_HIERARCHY[targetRole]
}

export function canDeleteUser(actorRole: GovernanceRole, targetRole: GovernanceRole, isLastOwner: boolean, isLastSuperAdmin: boolean): { allowed: boolean; reason?: string } {
  if (targetRole === 'owner' && isLastOwner) {
    return { allowed: false, reason: 'No se puede eliminar el ultimo Owner.' }
  }
  if (targetRole === 'super_admin' && isLastSuperAdmin) {
    return { allowed: false, reason: 'No se puede eliminar el ultimo Super Admin.' }
  }
  if (targetRole === 'owner' && actorRole !== 'owner') {
    return { allowed: false, reason: 'Solo un Owner puede modificar a otro Owner.' }
  }
  if (!canManageRole(actorRole, targetRole) && actorRole !== targetRole) {
    return { allowed: false, reason: 'No tienes permisos para gestionar este rol.' }
  }
  return { allowed: true }
}

export function canChangeRole(actorRole: GovernanceRole, currentRole: GovernanceRole, newRole: GovernanceRole): { allowed: boolean; reason?: string } {
  if (currentRole === 'owner' && actorRole !== 'owner') {
    return { allowed: false, reason: 'Solo un Owner puede modificar a otro Owner.' }
  }
  if (newRole === 'owner' && actorRole !== 'owner') {
    return { allowed: false, reason: 'Solo un Owner puede crear Owners.' }
  }
  if (ROLE_HIERARCHY[newRole] >= ROLE_HIERARCHY[actorRole] && actorRole !== 'owner') {
    return { allowed: false, reason: 'No puedes asignar un rol igual o superior al tuyo.' }
  }
  return { allowed: true }
}

export function isEmergencyModeBlocked(action: string, userRole: GovernanceRole, emergencyMode: boolean): boolean {
  if (!emergencyMode) return false
  if (userRole === 'owner') return false
  const blockedActions = ['create_user', 'delete_user', 'change_role', 'change_permissions', 'change_settings']
  return blockedActions.includes(action)
}

export function hasPermission(userPermissions: Permission[], required: Permission): boolean {
  return userPermissions.includes(required)
}

export function parseUserAgent(ua: string): { browser: string; os: string; device: string } {
  let browser = 'Desconocido'
  let os = 'Desconocido'
  let device = 'Desconocido'

  if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome'
  else if (ua.includes('Firefox')) browser = 'Firefox'
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari'
  else if (ua.includes('Edg')) browser = 'Edge'

  if (ua.includes('Windows')) os = 'Windows'
  else if (ua.includes('Mac OS')) os = 'macOS'
  else if (ua.includes('Android')) os = 'Android'
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS'
  else if (ua.includes('Linux')) os = 'Linux'

  if (ua.includes('Mobile') || ua.includes('Android')) device = 'Movil'
  else if (ua.includes('Tablet') || ua.includes('iPad')) device = 'Tablet'
  else device = 'Desktop'

  return { browser, os, device }
}
