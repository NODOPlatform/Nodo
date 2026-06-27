# NODO_CONTEXT — Memoria Permanente del Proyecto

**Generado desde el codigo fuente el 2026-06-27.**
**Este documento debe actualizarse cada vez que el proyecto evolucione.**

---

## 1. Que es NODO

NODO es un Centro Nacional de Coordinacion Ciudadana Inteligente para emergencias en Venezuela.

No es una app de noticias. No es una red social. No es un sistema gubernamental.

NODO conecta a personas que necesitan ayuda con personas que pueden ayudar. Convierte informacion fragmentada en acciones coordinadas que salvan vidas.

La plataforma nacio tras el terremoto de magnitud 6.9 que sacudio Caracas y La Guaira el 28 de marzo de 2025. En las horas siguientes, miles de personas necesitaban agua, refugio, medicinas y sangre. Habia voluntarios disponibles, pero no existia forma de conectarlos. NODO fue construido para que eso no vuelva a pasar.

NODO no fue creado para un evento especifico. Es una plataforma permanente de coordinacion ciudadana disenada para operar durante cualquier emergencia — sismica, climatica, sanitaria o social.

**URL de produccion:** https://www.nodoayuda.com

---

## 2. Filosofia

Estos son los principios fundamentales que guian cada decision tecnica y de producto:

**NODO es un Centro de Coordinacion, no una base de datos.**
El objetivo no es almacenar informacion. Es entenderla, relacionarla y convertirla en acciones utiles. Cada dato que entra al sistema debe generar oportunidades de ayuda.

**El mapa es el corazon del sistema.**
Toda informacion importante debe poder representarse geograficamente. Las solicitudes, ofertas, campanas, refugios, incidentes y personas desaparecidas son puntos en un mapa. La proximidad es la clave de la coordinacion.

**La IA ayuda pero nunca toma decisiones finales.**
El clasificador universal sugiere, el motor de inteligencia analiza, el matching conecta — pero ningun dato se publica automaticamente. Siempre hay un humano que revisa y aprueba antes de que cualquier contenido generado por IA llegue al sistema.

**Supabase es la unica fuente de verdad.**
No hay duplicacion de datos en localStorage, variables globales ni archivos. La cola offline (IndexedDB) es temporal y se sincroniza. Todo lo demas consulta Supabase.

**La coordinacion esta por encima de la visualizacion.**
Mostrar datos es necesario, pero no suficiente. NODO debe responder preguntas: quien puede ayudar? que recurso esta cerca? que campaña esta relacionada? que solicitud deberia priorizarse?

**Funcionar offline no es opcional.**
La conectividad falla durante emergencias. Toda accion de escritura pasa por una cola offline que sincroniza cuando hay conexion. La app debe ser util incluso sin internet.

**Ser rapido no es un nice-to-have.**
Las personas en crisis no esperan. Preact (6KB) en lugar de React (40KB). Signals en lugar de Redux. Cache de tiles para 7 dias. Precaching de assets.

**Ser simple no es ser limitado.**
Lo usa gente que nunca instalo una app. La PWA se instala desde el navegador, no desde una tienda. No requiere cuenta de usuario, ni email, ni numero de telefono.

---

## 3. Estado Actual del Proyecto

### 3.1 Paginas y Rutas (18 rutas activas)

| Ruta | Pagina | Funcion |
|------|--------|---------|
| `/` | Home.tsx | Dashboard operacional en tiempo real |
| `/necesito-ayuda` | NeedHelp.tsx | Formulario de solicitud de ayuda |
| `/quiero-ayudar` | OfferHelp.tsx | Formulario de oferta de ayuda |
| `/buscar-persona` | SearchPerson.tsx | Buscar personas desaparecidas |
| `/reportar-persona` | ReportFound.tsx | Reportar persona encontrada |
| `/reportar-incidente` | ReportIncident.tsx | Reportar incidente |
| `/mapa` | MapView.tsx | Mapa interactivo con 11+ capas |
| `/info` | VerifiedInfo.tsx | Informacion verificada por categorias |
| `/emergencias` | Emergencies.tsx | Contactos de emergencia |
| `/refugios` | Shelters.tsx | Listado de refugios activos |
| `/centros-acopio` | CollectionCenters.tsx | Centros de acopio |
| `/solicitud-salud` | HealthRequest.tsx | Solicitud de salud (sangre, medicinas, oxigeno) |
| `/campanas` | Campaigns.tsx | Campanas oficiales de ayuda |
| `/campana/:id` | CampaignDetail.tsx | Detalle de campana |
| `/admin` | Admin.tsx | Panel de administracion (13 vistas) |
| `/admin/refugios` | AdminShelters.tsx | CRUD de refugios |
| `/acerca` | About.tsx | Acerca del proyecto |
| `/detalle/:type/:id` | Detail.tsx | Detalle de cualquier registro |

### 3.2 Stores (12 modulos, 40+ signals)

| Store | Signals principales | Funcion |
|-------|--------------------|---------|
| `coordination.ts` | nearbyNeeds, userLocation | 20 necesidades cercanas con scoring |
| `intelligence.ts` | insights, matchSuggestions, missionOfTheDay, trends | Motor de inteligencia operacional |
| `national-feed.ts` | nationalFeed, nationalFeedFilter | Timeline unificado de 7 fuentes |
| `live-stats.ts` | liveStats, statsLoaded | 9 contadores en tiempo real |
| `seismic.ts` | seismicEvents, seismicLastChecked | Datos sismicos USGS |
| `campaigns.ts` | campaigns | Campanas oficiales (CRUD) |
| `emergency.ts` | currentEmergency | Emergencia activa |
| `filters.ts` | activeFilters | Filtros de mapa (11 capas) |
| `priorities.ts` | priorityNeeds | Necesidades por nivel de prioridad |
| `live-feed.ts` | feedItems | 6 items recientes |
| `admin-session.ts` | adminAuthenticated, adminRole, adminUserName | Sesion admin (3h) |
| `map-refresh.ts` | mapVersion | Trigger de refresco de mapa |

### 3.3 Componentes (28 componentes)

**Dashboard (8):**
NationalBanner, SeismicTicker, MissionOfTheDay, CoordinationCenter, NationalIntelligence, HomeMiniMap, NationalFeed, PriorityNeeds

**Admin (3):**
BannerNacionalEditor, CampaignsEditor, IngestaInteligente

**Layout (5):**
Header, BottomNav, InstallBanner, OfflineBanner, UpdateBanner

**UI base (10):**
Badge, Button, Card, ContactPicker, Icons, LocationPicker, Modal, PhotoInput, Spinner, StatusBadge

### 3.4 Librerias (13 archivos en src/lib/)

| Archivo | Funcion |
|---------|---------|
| `universal-classifier.ts` | Clasificador de 15 tipos de contenido + 12 extractores de campos |
| `admin-config.ts` | Config admin, moderadores, permisos, banner, centros, refugios |
| `campaign-extract.ts` | Extractor de campos especifico para campanas |
| `constants.ts` | 75+ traducciones, 35+ iconos, 23 hospitales, tipos, colores |
| `db.ts` | Schema IndexedDB (Dexie): offlineQueue, cache |
| `device.ts` | UUID persistente por dispositivo |
| `emergency-contacts.ts` | Telefonos de emergencia configurables |
| `geolocation.ts` | Wrapper de geolocation API con timeout 10s |
| `location-search.ts` | Busqueda en datos NODO + cache 30s |
| `photo.ts` | Compresion de imagenes (800px, 60% JPEG) |
| `supabase.ts` | Cliente Supabase (solo anon key) |
| `sw-update.ts` | Signals de actualizacion del Service Worker |
| `sync.ts` | Cola offline: enqueue, processQueue, deduplicacion |

### 3.5 Hooks (4)

| Hook | Funcion |
|------|---------|
| `useGeolocation.ts` | Posicion GPS con error handling |
| `useOfflineQueue.ts` | Monitor de cola offline (sync cada 15s) |
| `useOnlineStatus.ts` | Deteccion online/offline + sync al reconectar |
| `useSupabaseQuery.ts` | Queries reactivos a Supabase |

### 3.6 Tablas Supabase (9)

| Tabla | Registros | Campos clave |
|-------|-----------|-------------|
| `emergencies` | Contexto de emergencia | name, region, center_lat/lng, is_active |
| `help_requests` | Solicitudes de ayuda | help_types[], urgency, status, people_count, contact, photo, device_id, offline_id |
| `help_offers` | Ofertas de ayuda | offer_types[], available_hours, contact, status |
| `persons` | Personas desaparecidas/encontradas | name, photo, current_status, is_found, last_known_lat/lng |
| `person_status_history` | Historial de personas | person_id FK, status, lat/lng, notes |
| `shelters` | Refugios | capacity, occupancy, 7 amenidades, 4 aceptaciones, status |
| `verified_info` | Informacion oficial | category, content, source, is_pinned, expires_at |
| `points_of_interest` | Ubicaciones flexibles | poi_type (10 tipos), metadata JSONB, verified |
| `official_campaigns` | Campanas oficiales | campaign_type (11 tipos), locations JSONB[], requirements[], verification_level |

### 3.7 Integraciones Externas

| Servicio | Uso | Archivo |
|----------|-----|---------|
| USGS Earthquake API | Sismos cerca de Venezuela (7 dias, mag >= 2.5, radio 800km) | `seismic.ts` |
| OpenStreetMap | Tiles del mapa interactivo y mini mapa | `MapView.tsx`, `HomeMiniMap.tsx` |
| CartoDB | Tiles dark mode para el mini mapa | `HomeMiniMap.tsx` |
| Nominatim | Geocodificacion inversa (coordenadas → direccion) | `LocationPicker.tsx` |
| WhatsApp | Links wa.me para contacto directo | Multiples componentes |
| Telegram | Links t.me para contacto | `MapView.tsx` |

---

## 4. Arquitectura

### 4.1 Stack

| Tecnologia | Version | Por que |
|-----------|---------|---------|
| Preact | 10.29.2 | 6KB vs 40KB de React. Critico para 2G/3G en Venezuela |
| @preact/signals | 2.9.2 | Estado reactivo sin boilerplate. Mas eficiente que useState/useReducer |
| preact-iso | 2.12.0 | Router + SSR-ready |
| Supabase | 2.108.2 | Base de datos + API REST + RLS. Sin backend propio |
| Leaflet | 1.9.4 | Mapas sin dependencia de Google |
| Dexie | 4.4.4 | IndexedDB simplificado para cola offline |
| Tailwind CSS | 4.3.1 | Estilos utility-first, tema dark personalizado |
| Vite | 8.1.0 | Build rapido + HMR |
| vite-plugin-pwa | 1.3.0 | Service Worker + precaching automatico |
| TypeScript | 6.0.2 | Tipado estricto (`tsc -b`) |

### 4.2 Capas del sistema

```
┌──────────────────────────────────────┐
│           CAPA DE VISTA              │
│  Pages (18) → renderizan signals     │
│  Components (28) → UI pura           │
└──────────────┬───────────────────────┘
               │ consume signals
┌──────────────▼───────────────────────┐
│           CAPA DE ESTADO             │
│  Stores (12) → signals reactivos    │
│  40+ signals globales               │
└──────────────┬───────────────────────┘
               │ usa lib para logica
┌──────────────▼───────────────────────┐
│           CAPA DE LOGICA             │
│  Lib (13) → funciones puras         │
│  Clasificador, sync, search, photo  │
└──────────────┬───────────────────────┘
               │ lee/escribe
┌──────────────▼───────────────────────┐
│           CAPA DE DATOS              │
│  Supabase (9 tablas) → verdad       │
│  IndexedDB (2 tablas) → temporal    │
└──────────────────────────────────────┘
```

**Regla absoluta:** La informacion fluye en una sola direccion. Las pages consumen signals de los stores. Los stores usan funciones de lib. Lib habla con Supabase. Nunca al reves. Nunca un componente hace un query directo a Supabase.

### 4.3 Dashboard (Home.tsx)

El Home es un Centro de Situacion con 12 secciones verticales, renderizadas en este orden:

1. **NationalBanner** — Alerta nacional configurable (6 niveles de severidad)
2. **SeismicTicker** — Datos sismicos USGS en tiempo real
3. **Centro de Situacion** — Grid 4x2 de KPIs clickables (8 metricas)
4. **MissionOfTheDay** — Prioridad nacional calculada por IA
5. **CoordinationCenter** — 20 necesidades cercanas con scoring por distancia/urgencia/edad
6. **NationalIntelligence** — Insights automaticos + matching necesidad ↔ recurso
7. **HomeMiniMap** — Vista previa del mapa Leaflet (220px)
8. **NationalFeed** — Timeline nacional de 7 fuentes con filtros
9. **Acciones Rapidas** — 5 botones principales
10. **Quick Links** — Scroll horizontal de accesos directos
11. **Compartir NODO** — CTA con Web Share API
12. **PriorityNeeds** — Necesidades agregadas por tipo y nivel

### 4.4 Mapa (MapView.tsx — 984 lineas)

El mapa interactivo es el componente mas complejo del sistema:
- Leaflet con tiles OpenStreetMap
- 11+ tipos de marcadores con iconos emoji y colores por tipo
- Popups con detalle completo + botones de contacto (WhatsApp, telefono, Telegram, email)
- Filtros por capa, ciudad, urgencia, estado
- Busqueda en datos NODO + geocodificacion Nominatim
- Geolocalizacion del usuario
- Export GeoJSON
- Cache de tiles 7 dias via Workbox

### 4.5 Admin (Admin.tsx — 775 lineas)

13 vistas de gestion con autenticacion local:
- Contactos de emergencia, links externos, banner de pagina
- Banner nacional (6 niveles), ciudades, emergencia activa
- Centros de acopio, refugios (CRUD), campanas oficiales
- **Ingesta Inteligente** — Primer card del dashboard (clasificacion IA + revision humana)
- Contrasena, moderadores (permisos granulares: 9 tipos)

**Autenticacion:** Contrasena en localStorage. Sesion de 3 horas. Roles: admin (total) y moderator (permisos granulares). Default: `nodo2025`.

---

## 5. Flujo de Datos

### 5.1 Flujo general

```
Usuario crea un reporte
       │
       ├── Online → Supabase INSERT directo
       │
       └── Offline → IndexedDB (Dexie) → processQueue() cada 15s → Supabase INSERT
                                                                         │
       ┌─────────────────────────────────────────────────────────────────┘
       │
       ▼
  Store detecta nuevos datos (polling)
       │
       ├── live-stats.ts      → contadores (cada 30s)
       ├── national-feed.ts   → timeline (cada 45s)
       ├── intelligence.ts    → insights + matching + trends + mision (cada 5 min)
       ├── coordination.ts    → necesidades cercanas (manual, con GPS)
       └── priorities.ts      → prioridades (al navegar)
       │
       ▼
  Componentes renderizan signals
       │
       ├── Dashboard (Home.tsx) → KPIs, feed, inteligencia, mision
       ├── Mapa (MapView.tsx)  → marcadores geolocalizados
       └── Feed (NationalFeed) → timeline unificado
```

### 5.2 Flujo por tipo

**Solicitud de ayuda:** Usuario → NeedHelp.tsx → help_requests → aparece en mapa, feed, coordination, intelligence, stats, priorities.

**Oferta de ayuda:** Usuario → OfferHelp.tsx → help_offers → aparece en mapa, feed, coordination, intelligence (como match para solicitudes).

**Persona desaparecida:** Usuario → SearchPerson/ReportFound → persons → aparece en mapa, feed, busqueda. Links a bases externas (desaparecidosterremotovenezuela.com, hospitalesenvenezuela.com).

**Solicitud de salud:** Usuario → HealthRequest.tsx → points_of_interest (poi_type='health_request', metadata JSONB con blood_type, donor_count, priority, hospital) → aparece en mapa, feed, intelligence (insights de sangre sin atender, mision del dia).

**Campana oficial:** Admin → CampaignsEditor o IngestaInteligente → official_campaigns → aparece en mapa, feed, coordination, intelligence (matching), busqueda.

**Incidente:** Usuario → ReportIncident.tsx → points_of_interest (poi_type='incident') → aparece en mapa, feed, stats.

**Refugio:** Admin → AdminShelters.tsx → shelters → aparece en mapa, mini mapa, intelligence (capacidad disponible, matching), busqueda, lista publica.

### 5.3 Flujo de la Ingesta Inteligente

```
Admin sube imagen o pega texto
  → OCR (si imagen) via Canvas API / Tesseract.js
  → classify(): scoring de keywords ponderados → 1 de 15 tipos
  → extractores: 12 funciones regex extraen campos estructurados
  → sugerencias: campos faltantes detectados automaticamente
  → REVISION HUMANA: admin ve tipo, confianza, campos, puede cambiar tipo
  → publish(): INSERT a la tabla Supabase correcta segun tipo
```

### 5.4 Cola offline

```
Sin conexion → enqueue() → IndexedDB (offlineQueue)
  → OfflineBanner muestra "X pendientes"
  → Conexion restaurada → processQueue() cada 15s
  → INSERT en Supabase → si error 23505 (duplicado) → marcar como synced
  → Exito → eliminar de IndexedDB → triggerMapRefresh()
```

---

## 6. Inteligencia Artificial

NODO tiene tres capas de IA. Ninguna publica datos automaticamente.

### 6.1 Clasificador Universal (`universal-classifier.ts`)

Clasifica texto libre en 15 tipos de contenido:

| Tipo | Ejemplo de deteccion |
|------|---------------------|
| `help_request` | "Necesitamos agua urgente" |
| `help_offer` | "Ofrezco transporte disponible" |
| `missing_person` | "Se busca a Maria Lopez, desaparecida desde..." |
| `found_person` | "Fue encontrada en el Hospital Vargas" |
| `blood_request` | "Se necesitan 5 donantes tipo O+" |
| `campaign` | "Jornada de vacunacion el sabado" |
| `community_kitchen` | "Olla comunitaria manana a las 10am" |
| `shelter` | "Refugio con 20 camas disponibles" |
| `collection_center` | "Centro de acopio recibe donaciones" |
| `incident` | "Derrumbe en la autopista, via cerrada" |
| `verified_info` | "Comunicado oficial del gobierno" |
| `alert` | "Alerta de evacuacion inmediata" |
| `hospital` | "Hospital Vargas atendiendo emergencias" |
| `lost_pet` | "Se perdio perro labrador en Chacao" |
| `other` | (no clasificado) |

**Algoritmo:** Cada tipo tiene keywords con peso. Score = sum(keyword_length * rule_weight). Confianza = (best_score / 60) * 0.6 + separacion_entre_top_2 * 0.4.

**12 extractores de campos:** Nombre de persona, edad, grupo sanguineo, cantidad de donantes, telefonos (+58/0xxx), fechas en espanol, horarios, ubicaciones (hospitales/clinicas), urgencia, tipos de ayuda, organizacion, requisitos. Cada campo tiene su propio score de confianza.

### 6.2 Motor de Inteligencia (`intelligence.ts`)

Analiza continuamente toda la informacion existente. No crea datos. Solo genera conclusiones.

**computeTrends()** — Compara solicitudes de las ultimas 24h vs las 24h anteriores por tipo de ayuda y ciudad. Detecta incrementos/decrementos significativos. Genera frases como "Las solicitudes de agua aumentaron 38% en Miranda."

**generateInsights()** — Analiza 6 dimensiones:
- Solicitudes de sangre sin atender (por grupo sanguineo)
- Ofertas disponibles (por tipo)
- Capacidad de refugios (cupos disponibles)
- Campanas activas
- Solicitudes criticas pendientes
- Tendencias significativas

Cada insight tiene severidad (critical/warning/info) y un actionUrl para navegar al recurso.

**computeMatching()** — Para cada solicitud reciente (ultimas 12h), busca recursos compatibles:
- Ofertas con tipos coincidentes en radio de 30km
- Refugios en radio de 20km (si solicita shelter)
- Campanas activas con ubicacion en radio de 30km
- Centros de acopio en radio de 15km (si solicita food/water/medicine)
- Ordena por distancia, muestra los 4 mas cercanos

**computeMission()** — Calcula la prioridad nacional del dia con esta logica:
1. Si hay 5+ donantes de sangre necesarios → mision de donacion
2. Si hay un tipo de ayuda con tendencia al alza y 3+ solicitudes → mision de ese tipo
3. Si hay un tipo de ayuda dominante → mision de ese tipo
4. Default → mensaje de solidaridad activa

### 6.3 OCR (`ocrImage()` en `universal-classifier.ts`)

Extrae texto de imagenes (flyers de WhatsApp, capturas de pantalla) usando Canvas API con fallback a Tesseract.js. El texto extraido pasa por el clasificador universal.

### 6.4 Centro de Coordinacion (`coordination.ts`)

Muestra las 20 necesidades mas relevantes cerca del usuario:
- Obtiene GPS del usuario
- Consulta help_requests, help_offers, campaigns, health_requests
- Calcula distancia Haversine para cada item
- **Scoring:** `distance * 0.4 + urgency * 0.35 + age * 0.25`
- Ordena por score descendente

### 6.5 Regla de oro

**La IA nunca publica automaticamente.** En la Ingesta Inteligente, el admin siempre ve la clasificacion, puede cambiar el tipo, revisar los campos y presionar "Publicar" manualmente. En el motor de inteligencia, los insights son conclusiones visuales, no acciones automaticas.

---

## 7. Roadmap

### Completadas

**Fase 0 — Fundacion** — Formularios, mapa, cola offline, PWA, Supabase, admin basico, refugios, personas desaparecidas, informacion verificada.

**Fase 1 — Centro Nacional de Coordinacion** — Dashboard operacional: NationalBanner (6 niveles), SeismicTicker, Centro de Situacion (8 KPIs), CoordinationCenter (20 items con scoring), HomeMiniMap, NationalFeed (7 fuentes), acciones rapidas, quick links, share CTA, PriorityNeeds.

**Fase 2 — IA de Clasificacion Universal** — Clasificador de 15 tipos de contenido, 12 extractores de campos, OCR, IngestaInteligente (idle → processing → review → publish), revision humana obligatoria.

**Fase 3 — Motor de Inteligencia Operacional** — intelligence.ts (trends, insights, matching, mision del dia), NationalIntelligence, MissionOfTheDay, fix definitivo del mini mapa (import estatico de Leaflet).

### Planificadas

**Fase 4 — Division por Estado + Organizaciones** — Filtro por estado (24+DC), dashboard regional, directorio de organizaciones con verificacion.

**Fase 5 — Sistema de Reputacion y Verificacion** — Trust Score por publicacion, deteccion de duplicados, fusion sugerida (nunca automatica), indicadores visuales de confianza.

**Fase 6 — API Publica + Integraciones** — REST API, WhatsApp Business, Telegram Bot, webhooks, export CSV/GeoJSON, documentacion OpenAPI.

**Fase 7 — Expansion Regional** — Multi-tenancy por pais, internacionalizacion, APIs sismicas locales, guia de replicacion.

---

## 8. Decisiones Importantes

Estas son las decisiones arquitectonicas que definen como funciona NODO. Cada una tiene un motivo concreto.

**Preact, no React.** Bundle 6KB vs 40KB. Critico para conexiones 2G/3G en Venezuela. Consecuencia: no se puede usar el ecosistema React (react-router, react-query). Se usa preact-iso para routing y @preact/signals para estado.

**Solo anon key.** No hay backend propio. Toda la seguridad depende de Row Level Security en Supabase. Exponer service_role en frontend seria un riesgo critico.

**Autenticacion admin local.** No Supabase Auth. Contrasena en localStorage. Motivo: no hay infraestructura de email confiable en Venezuela para reset de contrasenas. El admin comparte la contrasena presencialmente.

**POIs con metadata JSONB.** Las solicitudes de salud usan points_of_interest con poi_type='health_request' y metadata JSONB para campos variables (blood_type, donor_count, hospital_name, priority). Evita crear una tabla nueva por cada tipo.

**Clasificador Universal.** Un solo `classifyContent(text)` en lugar de extractores separados por tipo. Motivo: escalabilidad — el sistema debe poder procesar miles de publicaciones diarias sin escribir un extractor por tipo.

**Signals como interfaz IA/UI.** Los stores exportan interfaces tipadas (Insight, MatchSuggestion, TrendData, MissionData) y signals. Los componentes solo consumen signals. Motivo: reemplazar el motor basado en reglas por un LLM en el futuro solo requiere cambiar las funciones internas. La UI no cambia.

**Leaflet con import estatico.** Nunca `await import('leaflet')`. El import dinamico no carga el CSS consistentemente, causando mapas negros. El MapView funciona porque siempre uso import estatico.

**Cola offline con deduplicacion.** Cada insert genera un offline_id UUID. Si Supabase devuelve error 23505 (unique constraint violation), el item se marca como synced — ya existia. Esto previene duplicados al sincronizar.

**Read-merge-write para metadata.** Cuando se actualiza un campo dentro de metadata JSONB, se lee el registro completo, se modifica en memoria y se escribe el objeto completo. No se hace UPDATE parcial de JSONB.

---

## 9. Convenciones

### Codigo

- **Preact, no React.** Imports de `preact/hooks`, `@preact/signals`, `preact-iso`. Nunca `react` ni `react-dom`.
- **`useSignal()`** para estado local. **`signal()`** a nivel de modulo para estado global. Nunca `useState` para datos compartidos.
- **TypeScript estricto.** `tsc -b` debe pasar sin errores. Vercel lo ejecuta como parte del build.
- **Tailwind CSS v4** con `@theme` directive para tokens de diseno. Tema dark: `nodo-dark`, `nodo-card`, `nodo-border`, `nodo-text`, `nodo-muted`.
- **Sin comentarios** excepto cuando el WHY no es obvio.
- **Archivos en ingles,** labels en espanol.
- **Import estatico de Leaflet** siempre: `import L from 'leaflet'` + `import 'leaflet/dist/leaflet.css'`.
- **Haversine** para distancias entre coordenadas. No APIs externas.

### Estructura

```
src/
  pages/            # Una por ruta. Solo renderizan signals. 0 logica de negocio.
  components/
    admin/          # Componentes exclusivos del panel admin
    layout/         # Header, BottomNav, banners de sistema
    ui/             # Componentes base reutilizables (Badge, Button, Card, Modal, etc.)
  store/            # Un archivo por dominio. Exporta: signals + funciones load/save.
  lib/              # Logica pura. Sin dependencia de UI. Sin imports de preact.
  hooks/            # Efectos reutilizables (geolocation, online status, offline queue)
  types/            # Definiciones TypeScript compartidas (index.ts)
```

### Naming

| Tipo | Convencion | Ejemplo |
|------|-----------|---------|
| Componente | PascalCase.tsx | `NationalIntelligence.tsx` |
| Store | kebab-case.ts | `live-stats.ts` |
| Lib | kebab-case.ts | `universal-classifier.ts` |
| Signal global | camelCase | `nearbyNeeds`, `liveStats` |
| Funcion de carga | loadXxx() | `loadIntelligence()` |
| Tipo/Interface | PascalCase | `MatchSuggestion`, `NearbyNeed` |

### Supabase

- **Solo anon key.** Nunca service_role en frontend.
- **RLS abierto** para emergencias: SELECT/INSERT publicos en la mayoria de tablas.
- **Variables:** `.env.local` (no `.env`): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
- **Read-merge-write** para metadata JSONB.
- **offline_id** en todo INSERT para deduplicacion.

### Build y Deploy

```
tsc -b && vite build    # Build (TypeScript estricto + Vite)
vercel --prod --yes     # Deploy a produccion
```

**Siempre deploy despues de cada sesion de desarrollo.**

---

## 10. NO ROMPER

Estos son los pilares de la arquitectura. Romper cualquiera de estos pone en riesgo la estabilidad, coherencia y confiabilidad del sistema completo.

### Fuente de verdad

1. **Supabase es la unica fuente de verdad.** No duplicar datos en localStorage, variables globales, ni archivos. La cola offline es temporal.

2. **No duplicar fuentes de datos.** Si un dato ya vive en un store, no crear otro store ni otra variable para lo mismo.

### Separacion de responsabilidades

3. **Toda logica vive en stores y lib.** Los componentes solo renderizan. Nunca hacer queries a Supabase desde un componente. Nunca calcular scores en un componente. Nunca clasificar contenido en un componente.

4. **Toda IA esta desacoplada de la UI.** `universal-classifier.ts` e `intelligence.ts` no importan ningun componente ni signal de UI. Los componentes consumen signals, nada mas.

5. **Signals como interfaz.** La comunicacion entre la capa de logica y la capa de vista es exclusivamente via signals tipados. Esto permite reemplazar el motor interno sin tocar la UI.

### Seguridad y confiabilidad

6. **Nunca publicar automaticamente contenido generado por IA.** La Ingesta Inteligente sugiere, pero el humano decide. Sin excepciones.

7. **Solo anon key en frontend.** Nunca service_role. Toda la seguridad depende de RLS en Supabase.

8. **Cola offline con deduplicacion.** Todo INSERT debe incluir device_id y offline_id. El sistema debe funcionar sin internet.

### Tecnologia

9. **Preact, no React.** No importar react, react-dom, ni hooks de React. Usar preact/hooks, @preact/signals, preact-iso.

10. **Leaflet con import estatico.** Nunca `await import('leaflet')`. Siempre `import L from 'leaflet'` + CSS.

11. **TypeScript estricto.** `tsc -b` es la validacion final. Si no pasa, no se deploya. Sin `// @ts-ignore`, sin `any` sin justificacion.

12. **Signals, no useState para estado compartido.** `useSignal()` para local, `signal()` a nivel de modulo para global.

### Producto

13. **Reutilizar antes de crear.** Si Card, Button, Modal, Badge, Spinner, ContactPicker, LocationPicker existen, usarlos. No crear componentes nuevos para lo mismo.

14. **Deploy despues de cada cambio.** `vercel --prod --yes` al finalizar cada sesion de desarrollo. Siempre.

---

*Este documento es la memoria permanente de NODO. Debe leerse antes de modificar cualquier parte importante del sistema. Debe actualizarse cuando el proyecto evolucione.*
