// NODO Connect — Connector 004: VzlaAyuda (Multi-Entity)
// Type: manual (citizen platform, no public API)
// First multi-entity connector: persons, shelters, collection centers, campaigns, blood requests

import type { EntityRecord } from './multi-entity-connector'
import { registerMultiEntityConnector } from './multi-entity-connector'

export const RECORDS: EntityRecord[] = [
  // --- Personas ---
  {
    id: 'va-p01', entityType: 'person',
    name: 'Maria Gonzalez Rodriguez', age: 34, status: 'missing',
    city: 'Caracas', state: 'Distrito Capital', location: 'Chacao, cerca del CCCT',
    phone: null, photoUrl: null,
    description: 'Reportada por vecinos. Sin contacto desde el sismo. Vivia en Chacao.',
    sourceUrl: 'https://vzlayuda.com', publishedAt: '2026-06-25T19:00:00Z', updatedAt: null,
    organization: 'VzlaAyuda', confidence: 'medium',
  },
  {
    id: 'va-p02', entityType: 'person',
    name: 'Andres Rojas Blanco', age: 55, status: 'found',
    city: 'Ciudad Bolivar', state: 'Bolivar', location: 'Refugio Cruz Roja Paseo Orinoco',
    phone: null, photoUrl: null,
    description: 'Localizado en refugio. Confirmado por voluntarios de VzlaAyuda.',
    sourceUrl: 'https://vzlayuda.com', publishedAt: '2026-06-26T10:00:00Z', updatedAt: '2026-06-27T08:00:00Z',
    organization: 'VzlaAyuda', confidence: 'high',
  },
  {
    id: 'va-p03', entityType: 'person',
    name: 'Elena Suarez Montoya', age: 31, status: 'missing',
    city: 'Valencia', state: 'Carabobo', location: 'Naguanagua',
    phone: null, photoUrl: null,
    description: 'Sin contacto. Familiares solicitan ayuda para localizarla.',
    sourceUrl: 'https://vzlayuda.com', publishedAt: '2026-06-26T04:00:00Z', updatedAt: null,
    organization: 'VzlaAyuda', confidence: 'low',
  },
  // --- Refugios ---
  {
    id: 'va-r01', entityType: 'shelter',
    name: 'Refugio Polideportivo de Chacao', status: 'active',
    city: 'Caracas', state: 'Distrito Capital', location: 'Av. Francisco de Miranda, Chacao',
    phone: '0212-2657800', photoUrl: null,
    description: 'Capacidad 200 personas. Agua, comida, atencion medica basica. Acepta familias.',
    sourceUrl: 'https://vzlayuda.com', publishedAt: '2026-06-25T20:00:00Z', updatedAt: '2026-06-27T06:00:00Z',
    organization: 'VzlaAyuda', confidence: 'high',
    metadata: { capacity: 200, currentOccupancy: 143, services: ['Agua', 'Comida', 'Atencion medica'] },
  },
  {
    id: 'va-r02', entityType: 'shelter',
    name: 'Refugio Estadio Misael Delgado', status: 'active',
    city: 'Valencia', state: 'Carabobo', location: 'Av. Bolivar Norte',
    phone: '0241-8234500', photoUrl: null,
    description: 'Refugio principal de Valencia. Capacidad amplia. Coordinado por Proteccion Civil.',
    sourceUrl: 'https://vzlayuda.com', publishedAt: '2026-06-25T22:00:00Z', updatedAt: '2026-06-27T07:00:00Z',
    organization: 'VzlaAyuda', confidence: 'high',
    metadata: { capacity: 500, currentOccupancy: 312, services: ['Agua', 'Comida', 'Colchonetas', 'Atencion medica'] },
  },
  {
    id: 'va-r03', entityType: 'shelter',
    name: 'Refugio Iglesia San Jose', status: 'active',
    city: 'Barquisimeto', state: 'Lara', location: 'Calle 25, Centro',
    phone: '0251-2530011', photoUrl: null,
    description: 'Refugio comunitario en iglesia. Atencion prioritaria a adultos mayores y ninos.',
    sourceUrl: 'https://vzlayuda.com', publishedAt: '2026-06-26T06:00:00Z', updatedAt: '2026-06-27T05:00:00Z',
    organization: 'VzlaAyuda', confidence: 'medium',
    metadata: { capacity: 80, currentOccupancy: 65, services: ['Agua', 'Comida'] },
  },
  // --- Centros de acopio ---
  {
    id: 'va-c01', entityType: 'resource',
    name: 'Centro de Acopio UCAB', status: 'active',
    city: 'Caracas', state: 'Distrito Capital', location: 'Universidad Catolica Andres Bello, Montalbán',
    phone: '0212-4074000', photoUrl: null,
    description: 'Recibe: agua, alimentos no perecederos, medicinas, ropa, articulos de higiene.',
    sourceUrl: 'https://vzlayuda.com', publishedAt: '2026-06-25T23:00:00Z', updatedAt: '2026-06-27T08:00:00Z',
    organization: 'VzlaAyuda', confidence: 'high',
    metadata: { needs: ['Agua', 'Medicinas', 'Panales', 'Ropa infantil'], accepts: true },
  },
  {
    id: 'va-c02', entityType: 'resource',
    name: 'Centro de Acopio Plaza Bolivar Maracay', status: 'active',
    city: 'Maracay', state: 'Aragua', location: 'Plaza Bolivar de Maracay, Centro',
    phone: null, photoUrl: null,
    description: 'Punto de recoleccion coordinado por voluntarios. Necesita medicinas y agua.',
    sourceUrl: 'https://vzlayuda.com', publishedAt: '2026-06-26T08:00:00Z', updatedAt: '2026-06-26T20:00:00Z',
    organization: 'VzlaAyuda', confidence: 'medium',
    metadata: { needs: ['Agua', 'Medicinas', 'Alimentos enlatados'], accepts: true },
  },
  // --- Campañas ---
  {
    id: 'va-cam01', entityType: 'resource',
    name: 'Campana de donacion de sangre — Banco de Sangre Caracas', status: 'active',
    city: 'Caracas', state: 'Distrito Capital', location: 'Banco Municipal de Sangre, San Jose',
    phone: '0212-8623455', photoUrl: null,
    description: 'Urgente: Se necesitan donantes O- y A+. Horario extendido 6am-8pm.',
    sourceUrl: 'https://vzlayuda.com', publishedAt: '2026-06-26T06:00:00Z', updatedAt: '2026-06-27T06:00:00Z',
    organization: 'VzlaAyuda', confidence: 'high',
    metadata: { bloodTypes: ['O-', 'A+'], schedule: '6am-8pm' },
  },
  {
    id: 'va-cam02', entityType: 'resource',
    name: 'Jornada de atencion medica gratuita — Valencia', status: 'active',
    city: 'Valencia', state: 'Carabobo', location: 'Centro Comercial Metrópolis, Nivel PB',
    phone: null, photoUrl: null,
    description: 'Medicos voluntarios. Atencion general, pediatria y triage. Sabado y domingo.',
    sourceUrl: 'https://vzlayuda.com', publishedAt: '2026-06-27T04:00:00Z', updatedAt: null,
    organization: 'VzlaAyuda', confidence: 'medium',
    metadata: { services: ['Medicina general', 'Pediatria', 'Triage'], schedule: 'Sabado y Domingo 8am-4pm' },
  },
]

export function initVzlaAyudaConnector(): void {
  registerMultiEntityConnector({
    providerId: 'vzla-ayuda',
    providerName: 'VzlaAyuda',
    config: {
      type: 'manual',
      enabled: true,
      timeout: 5000,
      rateLimit: { minIntervalMs: 1000, maxPerMinute: 30 },
    },
    records: RECORDS,
  })
}
