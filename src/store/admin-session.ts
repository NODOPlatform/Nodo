import { signal } from '@preact/signals'

const SESSION_KEY = 'nodo_admin_session'
const SESSION_HOURS = 3

interface StoredSession {
  role: 'owner' | 'admin' | 'moderator'
  name: string
  expiresAt: number
}

export const adminAuthenticated = signal(false)
export const adminRole = signal<'owner' | 'admin' | 'moderator'>('moderator')
export const adminUserName = signal('')

function persistSession(role: 'owner' | 'admin' | 'moderator', name: string) {
  const session: StoredSession = {
    role,
    name,
    expiresAt: Date.now() + SESSION_HOURS * 3600000,
  }
  try { localStorage.setItem(SESSION_KEY, JSON.stringify(session)) } catch {}
}

function clearSession() {
  try { localStorage.removeItem(SESSION_KEY) } catch {}
}

export function restoreSession(): boolean {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return false
    const session: StoredSession = JSON.parse(raw)
    if (Date.now() > session.expiresAt) {
      clearSession()
      return false
    }
    adminAuthenticated.value = true
    adminRole.value = session.role === 'admin' ? 'moderator' : session.role
    adminUserName.value = session.name
    return true
  } catch {
    clearSession()
    return false
  }
}

export function loginOwner(name: string) {
  adminAuthenticated.value = true
  adminRole.value = 'owner'
  adminUserName.value = name
  persistSession('owner', name)
}

export function loginAdmin(name: string) {
  adminAuthenticated.value = true
  adminRole.value = 'admin'
  adminUserName.value = name
  persistSession('admin', name)
}

export function loginModerator(name: string) {
  adminAuthenticated.value = true
  adminRole.value = 'moderator'
  adminUserName.value = name
  persistSession('moderator', name)
}

export function logoutAdmin() {
  adminAuthenticated.value = false
  adminRole.value = 'moderator'
  adminUserName.value = ''
  clearSession()
}

restoreSession()
