// NODO Connect — Connector 001: Hospitales en Venezuela
// Type: manual (curated dataset, upgradeable to json/api when official integration exists)
// Source: hospitalesenvenezuela.com — dynamic app without public API
// Strategy: embedded dataset with fuzzy search, ready for external endpoint swap

import type { Connector, FederatedResult } from '../connector-types'
import { registerConnector } from '../connector-manager'

interface Hospital {
  id: string
  name: string
  type: string
  address: string
  city: string
  state: string
  phone: string[]
  coordinates: { lat: number; lng: number } | null
  services: string[]
  schedule: string
  sourceUrl: string
}

export const HOSPITALS: Hospital[] = [
  {
    id: 'huc',
    name: 'Hospital Universitario de Caracas',
    type: 'Publico - Nivel IV',
    address: 'Los Chaguaramos, Ciudad Universitaria',
    city: 'Caracas',
    state: 'Distrito Capital',
    phone: ['0212-6052111'],
    coordinates: { lat: 10.4916, lng: -66.8919 },
    services: ['Emergencias', 'Cirugia', 'Traumatologia', 'Medicina Interna', 'Pediatria', 'Maternidad', 'UCI'],
    schedule: '24 horas',
    sourceUrl: 'https://hospitalesenvenezuela.com',
  },
  {
    id: 'hcsc',
    name: 'Hospital de Clinicas Caracas',
    type: 'Privado',
    address: 'Av. Panteon, San Bernardino',
    city: 'Caracas',
    state: 'Distrito Capital',
    phone: ['0212-5084111'],
    coordinates: { lat: 10.5086, lng: -66.8987 },
    services: ['Emergencias', 'Cirugia', 'Cardiologia', 'Oncologia', 'Traumatologia', 'UCI'],
    schedule: '24 horas',
    sourceUrl: 'https://hospitalesenvenezuela.com',
  },
  {
    id: 'hdm',
    name: 'Hospital Dr. Domingo Luciani (El Llanito)',
    type: 'Publico - IVSS',
    address: 'El Llanito',
    city: 'Caracas',
    state: 'Distrito Capital',
    phone: ['0212-2523311'],
    coordinates: { lat: 10.4791, lng: -66.8106 },
    services: ['Emergencias', 'Cirugia', 'Medicina Interna', 'Pediatria', 'Traumatologia'],
    schedule: '24 horas',
    sourceUrl: 'https://hospitalesenvenezuela.com',
  },
  {
    id: 'hmp',
    name: 'Hospital Militar Dr. Carlos Arvelo',
    type: 'Militar',
    address: 'San Martin',
    city: 'Caracas',
    state: 'Distrito Capital',
    phone: ['0212-4515555'],
    coordinates: { lat: 10.5053, lng: -66.9228 },
    services: ['Emergencias', 'Cirugia', 'Traumatologia', 'Medicina Interna', 'UCI'],
    schedule: '24 horas',
    sourceUrl: 'https://hospitalesenvenezuela.com',
  },
  {
    id: 'hjmv',
    name: 'Hospital Jose Maria Vargas',
    type: 'Publico',
    address: 'San Jose, Esquina de Pirineos',
    city: 'Caracas',
    state: 'Distrito Capital',
    phone: ['0212-8625111'],
    coordinates: { lat: 10.5069, lng: -66.9138 },
    services: ['Emergencias', 'Cirugia', 'Medicina Interna', 'Traumatologia'],
    schedule: '24 horas',
    sourceUrl: 'https://hospitalesenvenezuela.com',
  },
  {
    id: 'hcula',
    name: 'Hospital Universitario de Los Andes',
    type: 'Publico - Nivel IV',
    address: 'Av. 16 de Septiembre',
    city: 'Merida',
    state: 'Merida',
    phone: ['0274-2403011'],
    coordinates: { lat: 8.5897, lng: -71.1561 },
    services: ['Emergencias', 'Cirugia', 'Traumatologia', 'Medicina Interna', 'Pediatria', 'Maternidad', 'UCI'],
    schedule: '24 horas',
    sourceUrl: 'https://hospitalesenvenezuela.com',
  },
  {
    id: 'hcm',
    name: 'Hospital Central de Maracay',
    type: 'Publico - Nivel IV',
    address: 'Av. Bolivar',
    city: 'Maracay',
    state: 'Aragua',
    phone: ['0243-2461111'],
    coordinates: { lat: 10.2470, lng: -67.5966 },
    services: ['Emergencias', 'Cirugia', 'Traumatologia', 'Medicina Interna', 'Pediatria', 'UCI'],
    schedule: '24 horas',
    sourceUrl: 'https://hospitalesenvenezuela.com',
  },
  {
    id: 'hcv',
    name: 'Hospital Central de Valencia Dr. Enrique Tejera',
    type: 'Publico - Nivel IV',
    address: 'Av. Bolivar Norte',
    city: 'Valencia',
    state: 'Carabobo',
    phone: ['0241-8576300'],
    coordinates: { lat: 10.1837, lng: -68.0038 },
    services: ['Emergencias', 'Cirugia', 'Traumatologia', 'Medicina Interna', 'Pediatria', 'Maternidad', 'UCI'],
    schedule: '24 horas',
    sourceUrl: 'https://hospitalesenvenezuela.com',
  },
  {
    id: 'hum',
    name: 'Hospital Universitario de Maracaibo',
    type: 'Publico - Nivel IV',
    address: 'Av. Goajira',
    city: 'Maracaibo',
    state: 'Zulia',
    phone: ['0261-2004100'],
    coordinates: { lat: 10.6821, lng: -71.6318 },
    services: ['Emergencias', 'Cirugia', 'Traumatologia', 'Medicina Interna', 'Pediatria', 'UCI'],
    schedule: '24 horas',
    sourceUrl: 'https://hospitalesenvenezuela.com',
  },
  {
    id: 'hcb',
    name: 'Hospital Central de Barquisimeto Dr. Antonio Maria Pineda',
    type: 'Publico - Nivel IV',
    address: 'Av. Libertador con Av. Vargas',
    city: 'Barquisimeto',
    state: 'Lara',
    phone: ['0251-2529111'],
    coordinates: { lat: 10.0647, lng: -69.3218 },
    services: ['Emergencias', 'Cirugia', 'Traumatologia', 'Medicina Interna', 'Pediatria', 'Maternidad', 'UCI'],
    schedule: '24 horas',
    sourceUrl: 'https://hospitalesenvenezuela.com',
  },
  {
    id: 'hcsc2',
    name: 'Hospital Central de San Cristobal Dr. Jose Maria Vargas',
    type: 'Publico - Nivel IV',
    address: 'Av. Lucio Oquendo',
    city: 'San Cristobal',
    state: 'Tachira',
    phone: ['0276-3563211'],
    coordinates: { lat: 7.7704, lng: -72.2257 },
    services: ['Emergencias', 'Cirugia', 'Traumatologia', 'Medicina Interna', 'Pediatria', 'UCI'],
    schedule: '24 horas',
    sourceUrl: 'https://hospitalesenvenezuela.com',
  },
  {
    id: 'hlr',
    name: 'Hospital Luis Razetti',
    type: 'Publico',
    address: 'Av. Bermudez',
    city: 'Barcelona',
    state: 'Anzoategui',
    phone: ['0281-2774511'],
    coordinates: { lat: 10.1246, lng: -64.6921 },
    services: ['Emergencias', 'Cirugia', 'Traumatologia', 'Medicina Interna', 'Pediatria'],
    schedule: '24 horas',
    sourceUrl: 'https://hospitalesenvenezuela.com',
  },
  {
    id: 'hcpd',
    name: 'Complejo Hospitalario Dr. Luis Ortega',
    type: 'Publico',
    address: 'Porlamar',
    city: 'Porlamar',
    state: 'Nueva Esparta',
    phone: ['0295-2636591'],
    coordinates: { lat: 11.0017, lng: -63.8598 },
    services: ['Emergencias', 'Cirugia', 'Medicina Interna', 'Pediatria', 'Maternidad'],
    schedule: '24 horas',
    sourceUrl: 'https://hospitalesenvenezuela.com',
  },
  {
    id: 'hcb2',
    name: 'Hospital Ruiz y Paez',
    type: 'Publico - Nivel IV',
    address: 'Av. Germania',
    city: 'Ciudad Bolivar',
    state: 'Bolivar',
    phone: ['0285-6324511'],
    coordinates: { lat: 8.1204, lng: -63.5495 },
    services: ['Emergencias', 'Cirugia', 'Traumatologia', 'Medicina Interna', 'Pediatria', 'UCI'],
    schedule: '24 horas',
    sourceUrl: 'https://hospitalesenvenezuela.com',
  },
  {
    id: 'hjq',
    name: 'Hospital de Ninos J.M. de los Rios',
    type: 'Publico - Pediatrico',
    address: 'Av. Vollmer, San Bernardino',
    city: 'Caracas',
    state: 'Distrito Capital',
    phone: ['0212-5745411'],
    coordinates: { lat: 10.5117, lng: -66.8997 },
    services: ['Emergencias Pediatricas', 'Cirugia Pediatrica', 'Oncologia Pediatrica', 'UCI Pediatrica'],
    schedule: '24 horas',
    sourceUrl: 'https://hospitalesenvenezuela.com',
  },
  {
    id: 'hmc',
    name: 'Maternidad Concepcion Palacios',
    type: 'Publico - Maternidad',
    address: 'Av. San Martin',
    city: 'Caracas',
    state: 'Distrito Capital',
    phone: ['0212-4621011'],
    coordinates: { lat: 10.5052, lng: -66.9311 },
    services: ['Emergencias Obstetricas', 'Ginecologia', 'Neonatologia', 'UCI Neonatal'],
    schedule: '24 horas',
    sourceUrl: 'https://hospitalesenvenezuela.com',
  },
  {
    id: 'hpe',
    name: 'Hospital Perez de Leon',
    type: 'Publico - IVSS',
    address: 'Petare',
    city: 'Caracas',
    state: 'Miranda',
    phone: ['0212-2711522'],
    coordinates: { lat: 10.4794, lng: -66.8098 },
    services: ['Emergencias', 'Cirugia', 'Medicina Interna', 'Traumatologia'],
    schedule: '24 horas',
    sourceUrl: 'https://hospitalesenvenezuela.com',
  },
  {
    id: 'hcmc',
    name: 'Hospital Central de Maturin Dr. Manuel Nunez Tovar',
    type: 'Publico - Nivel IV',
    address: 'Av. Raul Leoni',
    city: 'Maturin',
    state: 'Monagas',
    phone: ['0291-6413611'],
    coordinates: { lat: 9.7450, lng: -63.1767 },
    services: ['Emergencias', 'Cirugia', 'Traumatologia', 'Medicina Interna', 'Pediatria', 'UCI'],
    schedule: '24 horas',
    sourceUrl: 'https://hospitalesenvenezuela.com',
  },
  {
    id: 'hgdc',
    name: 'Hospital General de Cumana Dr. Antonio Patricio de Alcala',
    type: 'Publico',
    address: 'Av. Carupano',
    city: 'Cumana',
    state: 'Sucre',
    phone: ['0293-4311142'],
    coordinates: { lat: 10.4528, lng: -64.1710 },
    services: ['Emergencias', 'Cirugia', 'Medicina Interna', 'Pediatria', 'Traumatologia'],
    schedule: '24 horas',
    sourceUrl: 'https://hospitalesenvenezuela.com',
  },
  {
    id: 'hcsa',
    name: 'Hospital Central de San Felipe Dr. Placido Daniel Rodriguez Rivero',
    type: 'Publico',
    address: 'Av. 7 con Calle 11',
    city: 'San Felipe',
    state: 'Yaracuy',
    phone: ['0254-2311144'],
    coordinates: { lat: 10.3395, lng: -68.7471 },
    services: ['Emergencias', 'Cirugia', 'Medicina Interna', 'Pediatria'],
    schedule: '24 horas',
    sourceUrl: 'https://hospitalesenvenezuela.com',
  },
]

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
}

function matchesQuery(hospital: Hospital, terms: string[]): boolean {
  const searchable = normalize([
    hospital.name,
    hospital.type,
    hospital.city,
    hospital.state,
    hospital.address,
    ...hospital.services,
  ].join(' '))

  return terms.every(t => searchable.includes(t))
}

function hospitalToResult(h: Hospital): FederatedResult {
  return {
    id: `hospitales-ve-${h.id}`,
    providerId: 'hospitales-venezuela',
    providerName: 'Hospitales en Venezuela',
    entityType: 'hospital',
    firstName: h.name,
    lastName: '',
    age: null,
    status: 'active',
    city: h.city,
    lastLocation: h.address,
    photoUrl: null,
    phone: h.phone[0] || null,
    description: `${h.type} — ${h.services.join(', ')} — ${h.schedule}`,
    sourceUrl: h.sourceUrl,
    retrievedAt: new Date().toISOString(),
    metadata: {
      hospitalType: h.type,
      state: h.state,
      phones: h.phone,
      coordinates: h.coordinates,
      services: h.services,
      schedule: h.schedule,
    },
  }
}

async function search(query: string): Promise<FederatedResult[]> {
  const terms = normalize(query).split(/\s+/).filter(Boolean)
  if (terms.length === 0) return []

  // Future: if endpoint configured, fetch from external API instead
  // const config = connectors.get('hospitales-venezuela')?.config
  // if (config?.endpoint) { return fetchFromAPI(config.endpoint, query) }

  return HOSPITALS.filter(h => matchesQuery(h, terms)).map(hospitalToResult)
}

export const hospitalesConnector: Connector = {
  config: {
    providerId: 'hospitales-venezuela',
    type: 'manual',
    enabled: true,
    timeout: 5000,
    rateLimit: { minIntervalMs: 500, maxPerMinute: 60 },
  },
  search,
}

export function initHospitalesConnector(): void {
  registerConnector(hospitalesConnector)
}
