import type { EmergencyContact, ExternalSearchLink } from './emergency-contacts'

const CONFIG_KEY = 'nodo_admin_config'
const PASSWORD_KEY = 'nodo_admin_pwd'
const DEFAULT_PASSWORD = (import.meta.env.VITE_ADMIN_DEFAULT_PASSWORD as string) || 'changeme'

const OWNER_PASSWORD_KEY = 'nodo_owner_pwd'
const DEFAULT_OWNER_PASSWORD = (import.meta.env.VITE_OWNER_DEFAULT_PASSWORD as string) || 'changeme'

export type ShelterStatus = 'available' | 'almost_full' | 'full'

export interface AdminShelter {
  id: string
  name: string
  address: string
  phone: string
  lat: number | null
  lng: number | null
  status: ShelterStatus
}

export interface AdminCollectionCenter {
  id: string
  name: string
  address: string
  schedule: string
  needs: string
  phone: string
  lat: number | null
  lng: number | null
}

export interface BannerConfig {
  title: string
  subtitle: string
  bullets: string[]
}

export type BannerLevel = 'emergency_national' | 'emergency_regional' | 'alert_yellow' | 'info_official' | 'drill' | 'ended'

export const BANNER_LEVEL_PRESETS: { value: BannerLevel; label: string; icon: string; color: string }[] = [
  { value: 'emergency_national', label: 'Emergencia Nacional', icon: '🚨', color: '#dc2626' },
  { value: 'emergency_regional', label: 'Emergencia Regional', icon: '🟠', color: '#f97316' },
  { value: 'alert_yellow', label: 'Alerta Amarilla', icon: '🟡', color: '#eab308' },
  { value: 'info_official', label: 'Informacion Oficial', icon: '🔵', color: '#3b82f6' },
  { value: 'drill', label: 'Simulacro', icon: '🟣', color: '#8b5cf6' },
  { value: 'ended', label: 'Emergencia Finalizada', icon: '🟢', color: '#22c55e' },
]

export interface NationalBannerConfig {
  active: boolean
  level: BannerLevel
  icon: string
  text: string
  subtitle: string
  country: string
  startDate: string
  endDate: string
}

export interface AdminConfig {
  emergencyContacts: EmergencyContact[]
  externalLinks: ExternalSearchLink[]
  banner: BannerConfig
  nationalBanner: NationalBannerConfig
  cities: string[]
  emergencyName: string
  emergencyRegion: string
  emergencyActive: boolean
  shelters: AdminShelter[]
  collectionCenters: AdminCollectionCenter[]
}

export const DEFAULT_CONFIG: AdminConfig = {
  emergencyContacts: [
    { name: 'Emergencias (911)', icon: '🚨', phone: '911', description: 'Linea unica nacional' },
    { name: 'Movistar (*1)', icon: '📱', phone: '*1', description: 'Emergencias desde celular Movistar' },
    { name: 'Digitel (*112)', icon: '📱', phone: '*112', description: 'Emergencias desde celular Digitel' },
    { name: 'Ambulancias Caracas', icon: '🚑', phone: '0800-2422201', description: 'CIACA - Centro Integrado' },
    { name: 'Ambulancias La Guaira', icon: '🚑', phone: '0212-3519966', description: 'Catia La Mar' },
    { name: 'Bomberos Caracas', icon: '🚒', phone: '0212-5454545', description: 'Central principal' },
    { name: 'Bomberos La Guaira', icon: '🚒', phone: '0212-3327620', description: 'Central La Guaira' },
    { name: 'Bomberos Aeronauticos', icon: '🚒', phone: '0212-3031405', description: 'Aeropuerto Maiquetia' },
    { name: 'Proteccion Civil Nacional', icon: '🛟', phone: '0800-558842', description: 'Reporte de lluvias (0800-LLUVIA)' },
    { name: 'Proteccion Civil Caracas', icon: '🛟', phone: '0212-5753332', description: 'Distrito Capital' },
    { name: 'Proteccion Civil La Guaira', icon: '🛟', phone: '0424-2075335', description: 'Sede antigua peaje' },
    { name: 'Policia La Guaira', icon: '👮', phone: '0212-3525046', description: 'Policia municipal' },
    { name: 'Policia Chacao', icon: '👮', phone: '0212-2641784', description: 'Caracas - Chacao' },
    { name: 'Policia Baruta', icon: '👮', phone: '0212-9432855', description: 'Caracas - Baruta' },
    { name: 'Cruz Roja', icon: '❤️', phone: '0212-5714713', description: 'Socorristas Caracas' },
    { name: 'Hospital Pariata', icon: '🏥', phone: '0212-3323051', description: 'Periferico de Pariata, La Guaira' },
  ],
  externalLinks: [
    {
      name: 'Personas reportadas durante el terremoto',
      url: 'https://desaparecidosterremotovenezuela.com',
      description: 'Consulta personas reportadas por familiares y voluntarios',
    },
    {
      name: 'Personas registradas en hospitales',
      url: 'https://hospitalesenvenezuela.com',
      description: 'Consulta personas registradas en hospitales de Venezuela',
    },
  ],
  banner: {
    title: '🇻🇪 Centro de Coordinacion Ciudadana',
    subtitle: 'Conectamos a las personas que necesitan ayuda con quienes pueden brindarla durante esta emergencia.',
    bullets: [
      'solicitar ayuda',
      'ofrecer ayuda',
      'buscar personas',
      'reportar personas',
      'consultar informacion verificada',
      'acceder rapidamente a telefonos de emergencia.',
    ],
  },
  nationalBanner: {
    active: true,
    level: 'emergency_national',
    icon: '🚨',
    text: 'Estado de Emergencia Nacional',
    subtitle: 'Coordinacion ciudadana activa. Mantente informado y ayuda de forma segura.',
    country: 'Venezuela',
    startDate: '',
    endDate: '',
  },
  cities: ['Caracas', 'La Guaira', 'Guarenas', 'Guatire', 'Los Teques'],
  emergencyName: 'Emergencia Sismica',
  emergencyRegion: 'Caracas — La Guaira',
  emergencyActive: true,
  shelters: [],
  collectionCenters: [],
}

export function getConfig(): AdminConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY)
    if (!raw) return DEFAULT_CONFIG
    const saved = JSON.parse(raw) as Partial<AdminConfig>
    return { ...DEFAULT_CONFIG, ...saved }
  } catch {
    return DEFAULT_CONFIG
  }
}

export function saveConfig(config: AdminConfig): void {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config))
}

export function checkAdminPassword(password: string): boolean {
  const saved = localStorage.getItem(PASSWORD_KEY)
  return password === (saved || DEFAULT_PASSWORD)
}

export function setAdminPassword(newPassword: string): void {
  localStorage.setItem(PASSWORD_KEY, newPassword)
}

export function checkOwnerPassword(password: string): boolean {
  const saved = localStorage.getItem(OWNER_PASSWORD_KEY)
  return password === (saved || DEFAULT_OWNER_PASSWORD)
}

export function setOwnerPassword(newPassword: string): void {
  localStorage.setItem(OWNER_PASSWORD_KEY, newPassword)
}

export const TEMP_MODERATOR_PERMISSIONS: ModeratorPermission[] = ['shelters', 'centers', 'campaigns']

export function generateId(): string {
  return crypto.randomUUID()
}

// --- Moderator system ---

export type ModeratorPermission = 'shelters' | 'centers' | 'contacts' | 'links' | 'banner' | 'national_banner' | 'cities' | 'emergency' | 'campaigns'

export const ALL_PERMISSIONS: ModeratorPermission[] = ['shelters', 'centers', 'contacts', 'links', 'banner', 'national_banner', 'cities', 'emergency', 'campaigns']

export const PERMISSION_LABELS: Record<ModeratorPermission, string> = {
  shelters: '🏠 Refugios',
  centers: '📦 Centros de acopio',
  contacts: '📞 Telefonos',
  links: '🔗 Enlaces',
  banner: '📢 Banner pagina',
  national_banner: '🚨 Banner nacional',
  cities: '🏙️ Ciudades',
  emergency: '⚠️ Emergencia',
  campaigns: '📢 Campanas verificadas',
}

export interface Moderator {
  id: string
  name: string
  password: string
  permissions: ModeratorPermission[]
}

const MODERATORS_KEY = 'nodo_moderators'

export function getModerators(): Moderator[] {
  try {
    const raw = localStorage.getItem(MODERATORS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveModerators(mods: Moderator[]): void {
  localStorage.setItem(MODERATORS_KEY, JSON.stringify(mods))
}

export function checkModeratorPassword(password: string): Moderator | null {
  const mods = getModerators()
  return mods.find(m => m.password === password) || null
}
