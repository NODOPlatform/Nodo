export type ProviderStatus = 'online' | 'maintenance' | 'offline'
export type ProviderBadge = 'verified' | 'recommended' | 'collaborator'

export type ProviderCategory =
  | 'personas'
  | 'ayuda_humanitaria'
  | 'reportes'
  | 'salud'
  | 'sismica'
  | 'recursos'
  | 'mascotas'

export interface SearchProvider {
  id: string
  name: string
  category: ProviderCategory
  description: string
  icon: string
  url: string
  color: string
  badge: ProviderBadge
  status: ProviderStatus
  enabled: boolean
  order: number
  coverage: string
  supportsDirectSearch: boolean
  supportsAPI: boolean
  searchUrl: string
  verified: boolean
  // Future: searchPerson?(query: string): Promise<SearchResult[]>
  // Future: apiEndpoint?: string
  // Future: apiKey?: string
}

export const CATEGORIES: Record<ProviderCategory, { icon: string; label: string }> = {
  personas: { icon: '👤', label: 'Personas' },
  ayuda_humanitaria: { icon: '📦', label: 'Ayuda Humanitaria' },
  reportes: { icon: '📢', label: 'Reportes Ciudadanos' },
  salud: { icon: '🏥', label: 'Salud' },
  sismica: { icon: '🌎', label: 'Informacion Sismica' },
  recursos: { icon: '📍', label: 'Recursos Comunitarios' },
  mascotas: { icon: '🐾', label: 'Mascotas' },
}

export const CATEGORY_ORDER: ProviderCategory[] = [
  'personas',
  'ayuda_humanitaria',
  'reportes',
  'salud',
  'sismica',
  'recursos',
  'mascotas',
]

export function buildSearchUrl(provider: SearchProvider, query: string): string {
  if (provider.supportsDirectSearch && provider.searchUrl) {
    return provider.searchUrl.replace('{query}', encodeURIComponent(query))
  }
  return provider.url
}

const STATUS_LABELS: Record<ProviderStatus, { dot: string; label: string }> = {
  online: { dot: '#22c55e', label: 'Disponible' },
  maintenance: { dot: '#eab308', label: 'Temporalmente no disponible' },
  offline: { dot: '#ef4444', label: 'No disponible' },
}

export function getStatusInfo(provider: SearchProvider): { dot: string; label: string } {
  if (provider.status !== 'online') return STATUS_LABELS[provider.status]
  if (!provider.supportsDirectSearch) return { dot: '#eab308', label: 'Sin busqueda directa' }
  return STATUS_LABELS.online
}

export const RED_NODO: SearchProvider[] = [
  // --- Personas ---
  {
    id: 'desaparecidos-terremoto',
    name: 'Desaparecidos Terremoto Venezuela',
    category: 'personas',
    description: 'Reportar y buscar personas desaparecidas tras el terremoto.',
    icon: '🔴',
    url: 'https://desaparecidosterremotovenezuela.com',
    color: '#dc2626',
    badge: 'recommended',
    status: 'online',
    enabled: true,
    order: 1,
    coverage: 'Nacional',
    supportsDirectSearch: false,
    supportsAPI: false,
    searchUrl: '',
    verified: true,
  },
  {
    id: 'venezuela-te-busca',
    name: 'Venezuela Te Busca',
    category: 'personas',
    description: 'Plataforma de busqueda y reencuentro de personas desaparecidas.',
    icon: '🔍',
    url: 'https://venezuelatebusca.com',
    color: '#2563eb',
    badge: 'verified',
    status: 'online',
    enabled: true,
    order: 2,
    coverage: 'Nacional',
    supportsDirectSearch: false,
    supportsAPI: false,
    searchUrl: '',
    verified: true,
  },
  {
    id: 'encuentra-venezuela',
    name: 'Encuentra Venezuela',
    category: 'personas',
    description: 'Sistema de localizacion y reporte de personas.',
    icon: '📍',
    url: 'https://encuentravenezuela.com',
    color: '#059669',
    badge: 'collaborator',
    status: 'online',
    enabled: true,
    order: 3,
    coverage: 'Nacional',
    supportsDirectSearch: false,
    supportsAPI: false,
    searchUrl: '',
    verified: false,
  },
  {
    id: 'reencuentro-venezuela',
    name: 'Reencuentro Venezuela',
    category: 'personas',
    description: 'Plataforma para reunir familias separadas por la emergencia.',
    icon: '❤️',
    url: 'https://reencuentrovenezuela.com',
    color: '#e11d48',
    badge: 'collaborator',
    status: 'online',
    enabled: true,
    order: 4,
    coverage: 'Nacional',
    supportsDirectSearch: false,
    supportsAPI: false,
    searchUrl: '',
    verified: false,
  },
  // --- Ayuda Humanitaria ---
  {
    id: 'red-ayuda-venezuela',
    name: 'Red Ayuda Venezuela',
    category: 'ayuda_humanitaria',
    description: 'Red ciudadana de ayuda, informacion y coordinacion de apoyo.',
    icon: '🟢',
    url: 'https://redayudavenezuela.com',
    color: '#2E7D32',
    badge: 'recommended',
    status: 'online',
    enabled: true,
    order: 1,
    coverage: 'Nacional',
    supportsDirectSearch: false,
    supportsAPI: false,
    searchUrl: '',
    verified: true,
  },
  {
    id: 'red-solidaria-venezuela',
    name: 'Red Solidaria Venezuela',
    category: 'ayuda_humanitaria',
    description: 'Coordinacion de donaciones, voluntariado y ayuda comunitaria.',
    icon: '🤝',
    url: 'https://redsolidariavenezuela.com',
    color: '#0d9488',
    badge: 'collaborator',
    status: 'online',
    enabled: true,
    order: 2,
    coverage: 'Nacional',
    supportsDirectSearch: false,
    supportsAPI: false,
    searchUrl: '',
    verified: false,
  },
  {
    id: 'vzla-ayuda',
    name: 'VzlaAyuda',
    category: 'ayuda_humanitaria',
    description: 'Plataforma de ayuda humanitaria y coordinacion de recursos.',
    icon: '🇻🇪',
    url: 'https://vzlaayuda.com',
    color: '#d97706',
    badge: 'collaborator',
    status: 'online',
    enabled: true,
    order: 3,
    coverage: 'Nacional',
    supportsDirectSearch: false,
    supportsAPI: false,
    searchUrl: '',
    verified: false,
  },
  {
    id: 'sismo-y-acopio',
    name: 'Sismo y Acopio Venezuela',
    category: 'ayuda_humanitaria',
    description: 'Centros de acopio y distribucion de insumos tras el sismo.',
    icon: '📦',
    url: 'https://sismoyacopio.com',
    color: '#92400e',
    badge: 'collaborator',
    status: 'online',
    enabled: true,
    order: 4,
    coverage: 'Nacional',
    supportsDirectSearch: false,
    supportsAPI: false,
    searchUrl: '',
    verified: false,
  },
  {
    id: 'apoyo-vzla',
    name: 'ApoyoVzla',
    category: 'ayuda_humanitaria',
    description: 'Coordinacion de ayuda y recursos para afectados.',
    icon: '💛',
    url: 'https://apoyovzla.com',
    color: '#ca8a04',
    badge: 'collaborator',
    status: 'online',
    enabled: true,
    order: 5,
    coverage: 'Nacional',
    supportsDirectSearch: false,
    supportsAPI: false,
    searchUrl: '',
    verified: false,
  },
  // --- Reportes Ciudadanos ---
  {
    id: 'venezuela-reporta',
    name: 'Venezuela Reporta',
    category: 'reportes',
    description: 'Reportes ciudadanos de situacion, danos e incidentes.',
    icon: '📢',
    url: 'https://venezuelareporta.com',
    color: '#ea580c',
    badge: 'collaborator',
    status: 'online',
    enabled: true,
    order: 1,
    coverage: 'Nacional',
    supportsDirectSearch: false,
    supportsAPI: false,
    searchUrl: '',
    verified: false,
  },
  // --- Salud ---
  {
    id: 'hospitales-venezuela',
    name: 'Hospitales Venezuela',
    category: 'salud',
    description: 'Consultar personas registradas en hospitales y centros de salud.',
    icon: '🏥',
    url: 'https://hospitalesenvenezuela.com',
    color: '#7c3aed',
    badge: 'recommended',
    status: 'online',
    enabled: true,
    order: 1,
    coverage: 'Nacional',
    supportsDirectSearch: false,
    supportsAPI: false,
    searchUrl: '',
    verified: true,
  },
  // --- Informacion Sismica ---
  {
    id: 'sismo-venezuela',
    name: 'Sismo Venezuela',
    category: 'sismica',
    description: 'Monitoreo sismico, replicas y alertas en tiempo real.',
    icon: '🌍',
    url: 'https://sismovenezuela.com',
    color: '#b91c1c',
    badge: 'collaborator',
    status: 'online',
    enabled: true,
    order: 1,
    coverage: 'Nacional',
    supportsDirectSearch: false,
    supportsAPI: false,
    searchUrl: '',
    verified: false,
  },
  {
    id: 'terremoto-venezuela',
    name: 'Terremoto Venezuela',
    category: 'sismica',
    description: 'Informacion sobre el terremoto, zonas afectadas y recursos.',
    icon: '🌎',
    url: 'https://terremotovenezuela.com',
    color: '#991b1b',
    badge: 'collaborator',
    status: 'online',
    enabled: true,
    order: 2,
    coverage: 'Nacional',
    supportsDirectSearch: false,
    supportsAPI: false,
    searchUrl: '',
    verified: false,
  },
  {
    id: 'terremoto-app',
    name: 'Terremoto Venezuela App',
    category: 'sismica',
    description: 'Aplicacion movil con alertas sismicas y mapa de danos.',
    icon: '📱',
    url: 'https://terremotovenezuelaapp.com',
    color: '#7f1d1d',
    badge: 'collaborator',
    status: 'online',
    enabled: true,
    order: 3,
    coverage: 'Nacional',
    supportsDirectSearch: false,
    supportsAPI: false,
    searchUrl: '',
    verified: false,
  },
  // --- Recursos Comunitarios ---
  {
    id: 'uniprocesador',
    name: 'UniProcesador',
    category: 'recursos',
    description: 'Procesamiento y coordinacion de informacion comunitaria.',
    icon: '⚙️',
    url: 'https://uniprocesador.com',
    color: '#4f46e5',
    badge: 'collaborator',
    status: 'online',
    enabled: true,
    order: 1,
    coverage: 'Nacional',
    supportsDirectSearch: false,
    supportsAPI: false,
    searchUrl: '',
    verified: false,
  },
  // --- Mascotas ---
  {
    id: 'patitas-a-salvo',
    name: 'Patitas a Salvo Venezuela',
    category: 'mascotas',
    description: 'Rescate, busqueda y reencuentro de mascotas afectadas por la emergencia.',
    icon: '🐾',
    url: 'https://patitasasalvo.com',
    color: '#a855f7',
    badge: 'collaborator',
    status: 'online',
    enabled: true,
    order: 1,
    coverage: 'Nacional',
    supportsDirectSearch: false,
    supportsAPI: false,
    searchUrl: '',
    verified: false,
  },
]

export function getActiveProviders(): SearchProvider[] {
  return RED_NODO
    .filter(p => p.enabled)
    .sort((a, b) => {
      if (a.verified !== b.verified) return a.verified ? -1 : 1
      return a.order - b.order
    })
}

export interface ProviderGroup {
  category: ProviderCategory
  icon: string
  label: string
  providers: SearchProvider[]
}

export function getGroupedProviders(): ProviderGroup[] {
  const active = getActiveProviders()
  const groups: ProviderGroup[] = []

  for (const cat of CATEGORY_ORDER) {
    const providers = active.filter(p => p.category === cat)
    if (providers.length > 0) {
      const cfg = CATEGORIES[cat]
      groups.push({ category: cat, icon: cfg.icon, label: cfg.label, providers })
    }
  }

  return groups
}
