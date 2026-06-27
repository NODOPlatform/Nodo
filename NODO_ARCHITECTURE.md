# NODO — Arquitectura Tecnica

**Version:** 2.0 (Fase 3)
**Ultima actualizacion:** 2026-06-27
**Stack:** Preact + Supabase + Leaflet + Tailwind CSS v4

---

## Filosofia del Proyecto

NODO es una plataforma permanente de coordinacion ciudadana para emergencias. No fue creada para un evento especifico — esta disenada para operar durante cualquier emergencia en Venezuela y potencialmente en otros paises.

Cada linea de codigo debe priorizar:

1. **Funcionar offline** — La conectividad falla durante emergencias.
2. **Ser rapido** — Las personas en crisis no esperan.
3. **Ser simple** — Lo usa gente que nunca instalo una app.
4. **Ser confiable** — Los datos deben ser reales. La IA nunca publica automaticamente.
5. **Ser reutilizable** — Ningun componente debe servir solo para un caso.

---

## Arquitectura General

```
                    ┌──────────────┐
                    │   Usuario    │
                    └──────┬───────┘
                           │
               ┌───────────▼───────────┐
               │     Preact PWA        │
               │  (preact-iso router)  │
               └───────────┬───────────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
    ┌─────▼─────┐   ┌─────▼─────┐   ┌─────▼─────┐
    │   Pages   │   │  Stores   │   │    Lib    │
    │  (Views)  │   │ (Signals) │   │ (Logica)  │
    └─────┬─────┘   └─────┬─────┘   └─────┬─────┘
          │                │                │
          │          ┌─────▼─────┐          │
          └─────────►│ Supabase  │◄─────────┘
                     │ (Postgres)│
                     └─────┬─────┘
                           │
                    ┌──────▼───────┐
                    │  IndexedDB   │
                    │  (Offline Q) │
                    └──────────────┘
```

### Capas

| Capa | Directorio | Responsabilidad |
|------|-----------|-----------------|
| **Pages** | `src/pages/` | Vistas de ruta. Solo renderizan datos de stores/signals. |
| **Components** | `src/components/` | UI reutilizable. No contienen logica de negocio. |
| **Stores** | `src/store/` | Estado reactivo via `@preact/signals`. Unica fuente de verdad del lado cliente. |
| **Lib** | `src/lib/` | Logica pura: clasificacion, busqueda, compresion, sync, config admin. |
| **Hooks** | `src/hooks/` | Efectos reutilizables: geolocation, online status, offline queue. |
| **Types** | `src/types/` | Definiciones TypeScript compartidas. |

---

## Stack Tecnologico

| Tecnologia | Version | Proposito |
|-----------|---------|-----------|
| Preact | 10.29.2 | Framework UI (6KB vs 40KB de React) |
| @preact/signals | 2.9.2 | Estado reactivo global y local |
| preact-iso | 2.12.0 | Router + lazy loading |
| Supabase | 2.108.2 | Base de datos, auth (anon), storage |
| Leaflet | 1.9.4 | Mapas interactivos |
| Dexie | 4.4.4 | IndexedDB para cola offline |
| Tailwind CSS | 4.3.1 | Estilos utility-first |
| Vite | 8.1.0 | Build tool + HMR |
| vite-plugin-pwa | 1.3.0 | Service Worker + precaching |
| TypeScript | 6.0.2 | Tipado estricto (`tsc -b`) |

---

## Supabase

### Configuracion

- **URL:** Definido en `VITE_SUPABASE_URL` (archivo `.env.local`)
- **Key:** Solo `VITE_SUPABASE_ANON_KEY` — nunca service_role
- **Auth:** RLS permite operaciones anonimas (SELECT/INSERT/UPDATE publicos)
- **Storage:** No utilizado actualmente (fotos via photo_url externo o base64)

### Tablas

| Tabla | Proposito | Campos clave |
|-------|-----------|-------------|
| `emergencies` | Contexto de emergencia activa | name, region, center_lat/lng, zoom, is_active |
| `help_requests` | Solicitudes de ayuda ciudadana | help_types[], urgency, status, people_count, contact_method/value, photo_url, device_id, offline_id |
| `help_offers` | Ofertas de ayuda voluntaria | offer_types[], available_hours, contact_name/info, status |
| `persons` | Personas desaparecidas/encontradas | name, photo_url, current_status, is_found, found_at, last_known_lat/lng |
| `person_status_history` | Historial de estado de personas | person_id (FK), status, lat/lng, notes |
| `shelters` | Refugios temporales | capacity, current_occupancy, amenities (7 booleans), accepts (4 booleans), status |
| `verified_info` | Informacion oficial verificada | category, content, source, is_pinned, expires_at |
| `points_of_interest` | Ubicaciones flexibles por tipo | poi_type, metadata (JSONB), verified, is_active |
| `official_campaigns` | Campanas oficiales de ayuda | campaign_type, locations (JSONB[]), requirements[], verification_level, status |

### POI Types (points_of_interest.poi_type)

| Tipo | Uso |
|------|-----|
| `shelter` | Refugio mapeado |
| `hospital` | Hospital/clinica |
| `medical_center` | Centro medico |
| `community_kitchen` | Olla comunitaria |
| `collection_center` | Centro de acopio |
| `danger_zone` | Zona peligrosa |
| `blocked_road` | Via bloqueada |
| `incident` | Incidente reportado |
| `protection` | Persona vulnerable |
| `health_request` | Solicitud de salud (sangre, medicinas, etc.) |

### Migraciones

| Archivo | Contenido |
|---------|-----------|
| `001_extensions.sql` | Extensiones PostgreSQL (uuid, postgis) |
| `002_tables.sql` | 8 tablas core |
| `003_indexes.sql` | 22 indices para queries frecuentes |
| `004_rls.sql` | Row Level Security (lectura anonima) |
| `005_seed.sql` | Datos semilla (emergencia default) |
| `006_shelter_admin.sql` | Campos admin para refugios + tabla user_roles |
| `007_contact_fields.sql` | contact_method/contact_value en requests/offers/persons |
| `008_reporter_name.sql` | reporter_name en help_requests |
| `009_campaigns.sql` | Tabla official_campaigns con indices y RLS |

---

## Sistema de Stores (Signals)

Toda la logica de estado vive en `src/store/`. Los componentes solo consumen signals — nunca hacen queries directos a Supabase.

### Stores y sus Signals

#### `coordination.ts` — Centro de Coordinacion
```
nearbyNeeds: signal<NearbyNeed[]>       // 20 items mas relevantes
coordinationLoading: signal<boolean>
coordinationLoaded: signal<boolean>
userLocation: signal<{lat,lng} | null>
```
- `loadNearbyNeeds(lat, lng)` — Busca help_requests, help_offers, campaigns, health_requests en radio de 50km
- **Scoring:** `distance * 0.4 + urgency * 0.35 + age * 0.25`

#### `intelligence.ts` — Motor de Inteligencia Operacional
```
insights: signal<Insight[]>             // Conclusiones automaticas
matchSuggestions: signal<MatchSuggestion[]>  // Matching necesidad ↔ recurso
missionOfTheDay: signal<MissionData | null>  // Prioridad nacional
trends: signal<TrendData[]>             // Tendencias por tipo de ayuda
intelligenceLoaded: signal<boolean>
intelligenceLoading: signal<boolean>
```
- `loadIntelligence()` — Consulta 7 tablas, genera insights, trends, matches, mision
- Se refresca cada 5 minutos

#### `national-feed.ts` — Feed Nacional
```
nationalFeed: signal<NationalFeedItem[]>    // Timeline unificado (30 items)
nationalFeedLoaded: signal<boolean>
nationalFeedFilter: signal<string>          // Filtro por tipo
```
- `loadNationalFeed()` — Agrega 7 fuentes + eventos sismicos
- Se refresca cada 45 segundos

#### `live-stats.ts` — Estadisticas en Vivo
```
liveStats: signal<LiveStatData>   // 9 contadores
statsLoaded: signal<boolean>
```
- `loadLiveStats()` — Conteos de ultimas 24h
- Se refresca cada 30 segundos

#### `seismic.ts` — Datos Sismicos
```
seismicEvents: signal<SeismicEvent[]>
seismicLoading: signal<boolean>
seismicError: signal<string>
seismicLastChecked: signal<number>
```
- `loadSeismicData()` — USGS API, ultimos 7 dias, radio 800km, magnitud >= 2.5

#### `campaigns.ts` — Campanas Oficiales
```
campaigns: signal<OfficialCampaign[]>
campaignsLoading: signal<boolean>
campaignsLoaded: signal<boolean>
```
- `loadCampaigns()`, `saveCampaign()`, `deleteCampaign()`

#### `emergency.ts` — Emergencia Activa
```
currentEmergency: signal<Emergency | null>
emergencyLoaded: signal<boolean>
```
- `getEmergency()` — Retorna emergencia activa o default (Caracas)

#### `filters.ts` — Filtros de Mapa
```
activeFilters: signal<{ layers: Set<string>; city: string; urgency: string; status: string }>
```
- 11 capas visibles por defecto

#### `priorities.ts` — Necesidades Prioritarias
```
priorityNeeds: signal<PriorityNeed[]>
prioritiesLoading: signal<boolean>
```
- Niveles: critico (>=40), alto (>=15), medio (>=5), bajo (<5)

#### `live-feed.ts` — Feed de Actividad Reciente
```
feedItems: signal<FeedItem[]>   // 6 items mas recientes
feedLoaded: signal<boolean>
```

#### `admin-session.ts` — Sesion de Admin
```
adminAuthenticated: signal<boolean>
adminRole: signal<'admin' | 'moderator'>
adminUserName: signal<string>
```
- Sesion de 3 horas en localStorage

#### `map-refresh.ts` — Trigger de Refresco de Mapa
```
mapVersion: signal<number>
```
- `triggerMapRefresh()` — Incrementa para forzar re-render

---

## Componentes Principales

### Dashboard (Home.tsx)

El Home es un dashboard en tiempo real con 12 secciones verticales:

1. **NationalBanner** — Alerta nacional configurable (6 niveles)
2. **SeismicTicker** — Ticker horizontal de sismos USGS
3. **MissionOfTheDay** — Prioridad nacional del dia (calculada por IA)
4. **Centro de Situacion** — Grid 4x2 de KPIs clickables
5. **CoordinationCenter** — 20 necesidades mas cercanas con scoring
6. **NationalIntelligence** — Insights + matching automatico
7. **HomeMiniMap** — Vista previa de mapa Leaflet (220px)
8. **NationalFeed** — Timeline nacional con 7 filtros
9. **Acciones Rapidas** — 5 botones principales (pedir/ofrecer/buscar/reportar/salud)
10. **Quick Links** — Scroll horizontal de accesos directos
11. **Compartir NODO** — CTA con Web Share API
12. **PriorityNeeds** — Necesidades por tipo con nivel de prioridad

### Mapa (MapView.tsx)

984 lineas. Mapa interactivo Leaflet con:
- 11+ tipos de marcadores con iconos emoji personalizados
- Popups con detalle completo + acciones de contacto
- Filtros por capa, ciudad, urgencia, estado
- Busqueda (datos NODO + Nominatim)
- Geolocalizacion del usuario
- Export GeoJSON
- Tiles OpenStreetMap con cache Workbox de 7 dias

### Panel de Administracion (Admin.tsx)

13 vistas de gestion:
- Contactos de emergencia
- Links externos
- Banner de pagina
- Banner nacional (6 niveles)
- Ciudades
- Emergencia activa
- Centros de acopio
- Refugios (CRUD completo)
- Campanas oficiales
- Ingesta Inteligente (IA)
- Contrasena
- Moderadores

---

## Sistema de IA

### Clasificador Universal (`src/lib/universal-classifier.ts`)

Clasifica texto libre en 15 tipos de contenido:

| Tipo | Descripcion |
|------|-------------|
| `help_request` | Solicitud de ayuda |
| `help_offer` | Oferta de ayuda |
| `missing_person` | Persona desaparecida |
| `found_person` | Persona encontrada |
| `campaign` | Campana organizada |
| `blood_request` | Solicitud de sangre |
| `community_kitchen` | Olla comunitaria |
| `shelter` | Refugio |
| `collection_center` | Centro de acopio |
| `incident` | Incidente/derrumbe/incendio |
| `verified_info` | Informacion oficial |
| `alert` | Alerta |
| `hospital` | Hospital/clinica |
| `lost_pet` | Mascota perdida |
| `other` | No clasificado |

**Algoritmo:** Scoring basado en keywords ponderados por longitud y peso de regla. Confianza = (mejor_score/60) * 0.6 + separacion_entre_top_2 * 0.4

**API publica:** `classifyContent(text)` — Clasifica + extrae todos los campos relevantes.

### Extractores de Campos

| Extractor | Que detecta |
|-----------|-------------|
| `extractPersonName` | Nombres propios tras "se busca a", "desaparecido:" |
| `extractAge` | Edad en el texto |
| `extractBloodType` | Grupo sanguineo (A+, O-, etc.) |
| `extractDonorCount` | Cantidad de donantes requeridos |
| `extractPhones` | Telefonos VE (+58, 0xxx) y WhatsApp |
| `extractDates` | Fechas en espanol |
| `extractHours` | Horarios |
| `extractLocations` | Hospitales, clinicas, refugios |
| `extractUrgency` | Nivel (critical/high/medium) |
| `extractHelpTypes` | Tipos de ayuda (water, food, medicine...) |
| `extractOrganization` | Organizacion responsable |
| `extractRequirements` | Requisitos (listas con bullets) |

### OCR (`ocrImage`)

- Usa Canvas API para renderizar imagen
- Tesseract.js (si disponible) para OCR real
- Fallback: extrae texto visible del canvas

### Motor de Inteligencia (`src/store/intelligence.ts`)

El motor analiza continuamente toda la informacion existente sin crear datos nuevos.

**Funciones principales:**

1. `computeTrends()` — Compara solicitudes 24h vs 48h por tipo y ciudad
2. `generateInsights()` — Genera conclusiones automaticas (sangre sin atender, ofertas disponibles, capacidad refugios, campanas activas, solicitudes criticas)
3. `computeMatching()` — Para cada solicitud reciente, busca ofertas/refugios/campanas/centros dentro de 15-30km
4. `computeMission()` — Calcula prioridad nacional: sangre > trend ascendente > tipo mas frecuente > solidaridad

**Nunca publica datos. Solo analiza.**

### Ingesta Inteligente (`src/components/admin/IngestaInteligente.tsx`)

Flujo: `texto/imagen → OCR → clasificacion → extraccion → revision humana → publicacion`

El admin siempre revisa antes de publicar. Puede cambiar el tipo detectado manualmente.

---

## Sistema de Coordinacion

### CoordinationCenter

Muestra las 20 necesidades mas relevantes cerca del usuario:

1. Obtiene ubicacion del usuario (GPS)
2. Consulta help_requests, help_offers, campaigns, health_requests
3. Calcula distancia Haversine
4. Aplica scoring: `distance * 0.4 + urgency * 0.35 + age * 0.25`
5. Ordena por score descendente
6. Muestra tarjetas con icono, titulo, distancia, urgencia, boton de accion

### Matching Inteligente

Cuando una solicitud entra:
1. Identifica los tipos de ayuda solicitados
2. Busca ofertas con tipos coincidentes en radio de 30km
3. Busca refugios en radio de 20km (si solicita shelter)
4. Busca campanas activas con ubicacion en radio de 30km
5. Busca centros de acopio en radio de 15km (si solicita food/water/medicine)
6. Ordena por distancia, muestra los 4 mas cercanos

---

## Permisos de Admin

### Roles

| Rol | Acceso |
|-----|--------|
| `admin` | Acceso total. Puede crear moderadores, cambiar contrasena. |
| `moderator` | Acceso granular segun permisos asignados. |

### Permisos Granulares

| Permiso | Descripcion |
|---------|-------------|
| `shelters` | Gestionar refugios |
| `centers` | Gestionar centros de acopio |
| `contacts` | Gestionar telefonos de emergencia |
| `links` | Gestionar enlaces externos |
| `banner` | Editar banner de pagina |
| `national_banner` | Editar banner nacional |
| `cities` | Configurar lista de ciudades |
| `emergency` | Editar contexto de emergencia |
| `campaigns` | Gestionar campanas verificadas |

### Autenticacion

- Contrasena almacenada en localStorage (`nodo_admin_pwd`)
- Contrasena default: `nodo2025`
- Sesion de 3 horas (`nodo_admin_session`)
- Sin Supabase Auth — autenticacion local unicamente

---

## Integraciones Externas

### USGS Earthquake API

- **Endpoint:** `https://earthquake.usgs.gov/fdsnws/event/1/query`
- **Parametros:** GeoJSON, 7 dias, centro Venezuela (8N, 66W), radio 800km, magnitud >= 2.5
- **Filtrado:** Coordenadas dentro de Venezuela (0.5-16N, -74--59E)
- **Store:** `seismic.ts`

### WhatsApp

- Deteccion de `contact_method === 'whatsapp'`
- URL: `https://wa.me/{telefono_limpio}`
- Soportado en: solicitudes, ofertas, personas, salud

### Telegram

- URL: `https://t.me/{username_o_telefono}`

### OpenStreetMap

- Tiles: `https://tile.openstreetmap.org/{z}/{x}/{y}.png` (MapView)
- Dark tiles: `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png` (HomeMiniMap)
- Nominatim: Reverse geocoding en LocationPicker

### Google Maps

- No integracion directa. Solo link `https://maps.google.com/?q={lat},{lng}` para navegacion

---

## Arquitectura PWA

### Service Worker (Workbox)

| Recurso | Estrategia | TTL | Max |
|---------|-----------|-----|-----|
| Assets (JS/CSS/HTML) | Precache | Permanente | ~20 archivos |
| Tiles OSM | CacheFirst | 7 dias | 500 entries |
| Supabase API | NetworkFirst (3s timeout) | 24 horas | 100 entries |
| Navegacion | Fallback a index.html | — | — |

### Cola Offline (Dexie/IndexedDB)

| Tabla | Proposito |
|-------|-----------|
| `offlineQueue` | Inserts pendientes (table, payload, status, retry_count) |
| `cache` | Cache opcional de registros |

**Flujo:**
1. Usuario crea solicitud sin conexion
2. `enqueue()` guarda en IndexedDB con `offline_id` UUID
3. `processQueue()` corre cada 15 segundos cuando online
4. Inserta en Supabase, maneja duplicados (error 23505)
5. Elimina registros sincronizados

### Manifest

- **Display:** standalone
- **Orientacion:** portrait
- **Idioma:** es
- **Icons:** 192px + 512px (+ maskable)
- **Tema:** `#172340` (dark blue)

---

## Convenciones del Proyecto

### Codigo

- **Preact, no React.** Usar `useSignal()` para estado local, `signal()` para global.
- **TypeScript estricto.** `tsc -b` debe pasar sin errores (Vercel lo ejecuta).
- **Tailwind v4** con directiva `@theme` para tokens de diseno.
- **Imports estaticos** para Leaflet (`import L from 'leaflet'`), nunca dinamicos.
- **Sin comentarios** excepto cuando el WHY no es obvio.
- **Archivos en ingles**, labels en espanol.
- **Read-merge-write** para actualizar metadata JSONB en Supabase.

### Estructura de archivos

```
src/
  pages/          # Una por ruta. Solo renderiza signals.
  components/
    admin/        # Componentes exclusivos del panel admin
    layout/       # Header, BottomNav, banners de sistema
    ui/           # Componentes base reutilizables
  store/          # Un archivo por dominio. Exports: signals + loaders
  lib/            # Logica pura. Sin dependencia de UI.
  hooks/          # Efectos reutilizables
  types/          # Definiciones TypeScript
```

### Naming

- Componentes: `PascalCase.tsx`
- Stores/Lib: `kebab-case.ts`
- Tipos: `PascalCase` en `types/index.ts`
- Signals: `camelCase`
- Funciones de carga: `loadXxx()`

### Deploy

- Build: `tsc -b && vite build`
- Deploy: `vercel --prod --yes`
- Hosting: Vercel
- Dominio: `nodoayuda.com`

---

## NO ROMPER

Estas son decisiones tecnicas fundamentales que **nunca** deben romperse:

1. **Supabase es la unica fuente de verdad.** No duplicar datos en localStorage, variables globales, ni archivos. La cola offline es temporal y se sincroniza.

2. **Toda la logica vive en stores y lib.** Los componentes solo renderizan. Nunca hacer queries a Supabase desde un componente.

3. **Toda IA esta desacoplada de la UI.** `universal-classifier.ts` e `intelligence.ts` no importan ningun componente. Los componentes consumen signals.

4. **Nunca publicar automaticamente contenido generado por IA.** Siempre revision humana antes de insertar en Supabase.

5. **No duplicar fuentes de datos.** Si un dato ya existe en un store, no crear otro store para lo mismo.

6. **Reutilizar componentes antes de crear nuevos.** Si Card, Button, Modal, Badge, Spinner existen, usarlos.

7. **No romper offline-first.** Toda accion de escritura debe pasar por la cola offline. Si no hay Supabase, el formulario debe funcionar igual.

8. **Preact, no React.** No importar `react`, `react-dom`, ni hooks de React. Usar `preact/hooks`, `@preact/signals`, `preact-iso`.

9. **Solo anon key.** Nunca usar service_role key en el frontend. Si necesitas permisos elevados, es backend.

10. **TypeScript estricto sin excepciones.** `tsc -b` es la validacion final. Si no pasa, no se deploya.

11. **Leaflet con import estatico.** No usar `await import('leaflet')`. Importar con `import L from 'leaflet'` + `import 'leaflet/dist/leaflet.css'`.

12. **Signals, no useState para estado compartido.** `useSignal()` para local, `signal()` a nivel de modulo para global. Nunca `useState` para datos que consumen multiples componentes.

13. **Haversine para distancias.** No usar APIs externas para calcular distancias entre coordenadas.

14. **Deploy despues de cada cambio.** Siempre ejecutar `vercel --prod --yes` al finalizar una sesion de desarrollo.
