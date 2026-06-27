// NODO Connect — Connector 005: Reencuentro Venezuela (Large Dataset)
// Type: manual (domain parked, no API)
// Prepared for: pagination, incremental sync, massive datasets
// Uses: PersonSearchConnector template

import type { PersonRecord } from './persona-search-connector'
import { registerPersonSearchConnector } from './persona-search-connector'

// Large dataset config — ready for future API/sync integration
export const REENCUENTRO_CONFIG = {
  pageSize: 50,
  maxResults: 200,
  // Future: endpoint: 'https://api.reencuentrovenezuela.com/v1/search',
  // Future: syncInterval: 3600000, // 1 hour
  // Future: lastSyncAt: null as string | null,
  // Future: totalRemoteRecords: 0,
  // Future: importBatchSize: 100,
}

export const RECORDS: PersonRecord[] = [
  {
    id: 'rv-001', firstName: 'Maria', lastName: 'Gonzalez Rodriguez', age: 34, sex: 'F',
    photoUrl: null, city: 'Caracas', state: 'Distrito Capital',
    lastLocation: 'Las Mercedes, Municipio Baruta', hospital: null, status: 'missing',
    description: 'Madre de dos ninos. Sin contacto desde el terremoto. Familia solicita informacion urgente.',
    publishedAt: '2026-06-25T17:00:00Z', updatedAt: null,
    organization: 'Reencuentro Venezuela', sourceUrl: 'https://reencuentrovenezuela.com', confidence: 'medium',
  },
  {
    id: 'rv-002', firstName: 'Pedro', lastName: 'Morales Castillo', age: 41, sex: 'M',
    photoUrl: null, city: 'San Cristobal', state: 'Tachira',
    lastLocation: 'Barrio Obrero, sector norte', hospital: null, status: 'missing',
    description: 'Albanil. Ultimo contacto telefonico 30 minutos antes del sismo. Companeros de trabajo tampoco localizados.',
    publishedAt: '2026-06-26T05:00:00Z', updatedAt: null,
    organization: 'Reencuentro Venezuela', sourceUrl: 'https://reencuentrovenezuela.com', confidence: 'medium',
  },
  {
    id: 'rv-003', firstName: 'Carlos', lastName: 'Martinez Perez', age: 45, sex: 'M',
    photoUrl: null, city: 'Valencia', state: 'Carabobo',
    lastLocation: 'Centro de Valencia, Av. Bolivar', hospital: 'Hospital Central de Valencia', status: 'hospitalized',
    description: 'Confirmado hospitalizado. Herida en brazo. Estable. Busca contacto con esposa e hijos en Caracas.',
    publishedAt: '2026-06-25T21:00:00Z', updatedAt: '2026-06-27T08:00:00Z',
    organization: 'Reencuentro Venezuela', sourceUrl: 'https://reencuentrovenezuela.com', confidence: 'high',
  },
  {
    id: 'rv-004', firstName: 'Ana', lastName: 'Lopez Hernandez', age: 28, sex: 'F',
    photoUrl: null, city: 'Maracay', state: 'Aragua',
    lastLocation: 'La Soledad, torre residencial Los Samanes', hospital: null, status: 'safe',
    description: 'Localizada en casa de familiares en Turmero. Sin heridas. Telefono destruido.',
    publishedAt: '2026-06-25T23:00:00Z', updatedAt: '2026-06-27T06:00:00Z',
    organization: 'Reencuentro Venezuela', sourceUrl: 'https://reencuentrovenezuela.com', confidence: 'high',
  },
  {
    id: 'rv-005', firstName: 'Jose', lastName: 'Ramirez Diaz', age: 67, sex: 'M',
    photoUrl: null, city: 'Barquisimeto', state: 'Lara',
    lastLocation: 'Carrera 19, Centro', hospital: 'Hospital Central de Barquisimeto', status: 'hospitalized',
    description: 'Adulto mayor diabetico. Encontrado por bomberos. Trasladado al Central. Consciente.',
    publishedAt: '2026-06-26T07:00:00Z', updatedAt: '2026-06-27T11:00:00Z',
    organization: 'Reencuentro Venezuela', sourceUrl: 'https://reencuentrovenezuela.com', confidence: 'high',
  },
  {
    id: 'rv-006', firstName: 'Luisa', lastName: 'Fernandez Torres', age: 52, sex: 'F',
    photoUrl: null, city: 'Merida', state: 'Merida',
    lastLocation: 'La Hechicera', hospital: 'Hospital Universitario de Los Andes', status: 'found',
    description: 'Localizada y estable en HULA. Voluntarios de Reencuentro confirmaron identidad con cedula.',
    publishedAt: '2026-06-25T19:30:00Z', updatedAt: '2026-06-27T09:00:00Z',
    organization: 'Reencuentro Venezuela', sourceUrl: 'https://reencuentrovenezuela.com', confidence: 'high',
  },
  {
    id: 'rv-007', firstName: 'Carmen', lastName: 'Gutierrez Mendoza', age: 73, sex: 'F',
    photoUrl: null, city: 'Caracas', state: 'Distrito Capital',
    lastLocation: 'Petare, Jose Felix Ribas, escalera 8', hospital: null, status: 'missing',
    description: 'Adulta mayor, hipertensa. Edificio con danos severos. Vecinos reportan sin avistamiento desde el evento.',
    publishedAt: '2026-06-26T09:30:00Z', updatedAt: null,
    organization: 'Reencuentro Venezuela', sourceUrl: 'https://reencuentrovenezuela.com', confidence: 'medium',
  },
  {
    id: 'rv-008', firstName: 'Andres', lastName: 'Rojas Blanco', age: 55, sex: 'M',
    photoUrl: null, city: 'Ciudad Bolivar', state: 'Bolivar',
    lastLocation: 'Paseo Orinoco, local comercial', hospital: null, status: 'reunited',
    description: 'Reunido con su esposa e hijos el 27 de junio. Fue localizado en refugio Cruz Roja.',
    publishedAt: '2026-06-26T10:00:00Z', updatedAt: '2026-06-27T14:00:00Z',
    organization: 'Reencuentro Venezuela', sourceUrl: 'https://reencuentrovenezuela.com', confidence: 'high',
  },
  {
    id: 'rv-009', firstName: 'Elena', lastName: 'Suarez Montoya', age: 31, sex: 'F',
    photoUrl: null, city: 'Valencia', state: 'Carabobo',
    lastLocation: 'Naguanagua, Residencias Los Mangos piso 8', hospital: null, status: 'missing',
    description: 'Ingeniera. Vecinos confirman que no ha salido del edificio. Proteccion Civil revisando estructura.',
    publishedAt: '2026-06-26T01:00:00Z', updatedAt: '2026-06-27T06:00:00Z',
    organization: 'Reencuentro Venezuela', sourceUrl: 'https://reencuentrovenezuela.com', confidence: 'medium',
  },
  {
    id: 'rv-010', firstName: 'Miguel', lastName: 'Gonzalez Silva', age: 19, sex: 'M',
    photoUrl: null, city: 'Maracaibo', state: 'Zulia',
    lastLocation: 'Universidad del Zulia', hospital: null, status: 'safe',
    description: 'Estudiante de ingenieria. Se refugio en la universidad. Contacto restablecido con padres en Caracas.',
    publishedAt: '2026-06-26T00:00:00Z', updatedAt: '2026-06-27T07:00:00Z',
    organization: 'Reencuentro Venezuela', sourceUrl: 'https://reencuentrovenezuela.com', confidence: 'high',
  },
  {
    id: 'rv-011', firstName: 'Rafael', lastName: 'Castro Nunez', age: 39, sex: 'M',
    photoUrl: null, city: 'San Cristobal', state: 'Tachira',
    lastLocation: 'La Concordia, Av. Libertador', hospital: null, status: 'missing',
    description: 'Taxista. Vehiculo localizado abandonado en La Concordia. Sin rastro del conductor.',
    publishedAt: '2026-06-26T06:00:00Z', updatedAt: '2026-06-27T10:00:00Z',
    organization: 'Reencuentro Venezuela', sourceUrl: 'https://reencuentrovenezuela.com', confidence: 'medium',
  },
  {
    id: 'rv-012', firstName: 'Isabel', lastName: 'Vargas Contreras', age: 60, sex: 'F',
    photoUrl: null, city: 'Cumana', state: 'Sucre',
    lastLocation: 'Mercado Municipal de Cumana', hospital: null, status: 'found',
    description: 'Comerciante del mercado. Encontrada en albergue parroquial. Sin heridas.',
    publishedAt: '2026-06-26T11:00:00Z', updatedAt: '2026-06-27T12:00:00Z',
    organization: 'Reencuentro Venezuela', sourceUrl: 'https://reencuentrovenezuela.com', confidence: 'high',
  },
  {
    id: 'rv-013', firstName: 'Gabriel', lastName: 'Mendez Fuentes', age: 36, sex: 'M',
    photoUrl: null, city: 'Caracas', state: 'Distrito Capital',
    lastLocation: 'La Candelaria, Av. Urdaneta', hospital: 'Hospital Jose Maria Vargas', status: 'hospitalized',
    description: 'Rescatado de edificio colapsado en La Candelaria. Fractura de femur. Operado. Estable.',
    publishedAt: '2026-06-25T22:00:00Z', updatedAt: '2026-06-27T16:00:00Z',
    organization: 'Reencuentro Venezuela', sourceUrl: 'https://reencuentrovenezuela.com', confidence: 'high',
  },
  {
    id: 'rv-014', firstName: 'Daniela', lastName: 'Pena Oliveros', age: 24, sex: 'F',
    photoUrl: null, city: 'Barquisimeto', state: 'Lara',
    lastLocation: 'Centro Comercial Sambil Barquisimeto', hospital: null, status: 'safe',
    description: 'Estaba trabajando en el centro comercial. Evacuada correctamente. Contacto con familia restablecido.',
    publishedAt: '2026-06-26T03:00:00Z', updatedAt: '2026-06-26T18:00:00Z',
    organization: 'Reencuentro Venezuela', sourceUrl: 'https://reencuentrovenezuela.com', confidence: 'high',
  },
  {
    id: 'rv-015', firstName: 'Francisco', lastName: 'Delgado Rios', age: 48, sex: 'M',
    photoUrl: null, city: 'Maracay', state: 'Aragua',
    lastLocation: 'Zona Industrial San Vicente', hospital: 'Hospital Central de Maracay', status: 'hospitalized',
    description: 'Confirmado por voluntarios. Pierna enyesada. Esposa viajo desde Caracas. Proceso de alta.',
    publishedAt: '2026-06-26T04:00:00Z', updatedAt: '2026-06-27T18:00:00Z',
    organization: 'Reencuentro Venezuela', sourceUrl: 'https://reencuentrovenezuela.com', confidence: 'high',
  },
]

export function initReencuentroConnector(): void {
  registerPersonSearchConnector({
    providerId: 'reencuentro-venezuela',
    providerName: 'Reencuentro Venezuela',
    config: {
      type: 'manual',
      enabled: true,
      timeout: 8000,
      rateLimit: { minIntervalMs: 1000, maxPerMinute: 30 },
      // Future: endpoint: REENCUENTRO_CONFIG.endpoint
    },
    records: RECORDS,
  })
}
