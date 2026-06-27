# NODO — Changelog

Todas las versiones y cambios notables del proyecto.

El formato sigue [Keep a Changelog](https://keepachangelog.com/).

---

## [0.3.0] — 2025-06-27 — Fase 3: Motor de Inteligencia Operacional

### Added
- **intelligence.ts** — Motor de analisis que consulta 7 tablas y genera insights, trends, matching y mision del dia automaticamente.
- **NationalIntelligence.tsx** — Componente de inteligencia operacional: insights por severidad (critical/warning/info), matching automatico necesidad↔recurso con distancia.
- **MissionOfTheDay.tsx** — Tarjeta de prioridad nacional del dia, calculada por el motor de IA (sangre > trend > tipo mas frecuente).
- Integracion de NationalIntelligence y MissionOfTheDay en Home.tsx.

### Fixed
- **HomeMiniMap.tsx** — Reescrito completamente. Causa raiz del mapa negro: import dinamico de Leaflet no cargaba el CSS. Cambiado a import estatico (`import L from 'leaflet'` + `import 'leaflet/dist/leaflet.css'`). Eliminado ResizeObserver. Agregado tile error listener con fallback UI.

### Changed
- Home.tsx reorganizado: MissionOfTheDay entre SeismicTicker y CoordinationCenter, NationalIntelligence entre CoordinationCenter y HomeMiniMap.

---

## [0.2.0] — 2025-06-26 — Fase 2: IA de Clasificacion Universal

### Added
- **universal-classifier.ts** — Motor de clasificacion universal con 15 tipos de contenido. Scoring por keywords ponderados. 12 extractores de campos (persona, edad, sangre, telefono, fecha, horario, ubicacion, urgencia, tipos de ayuda, organizacion, requisitos, descripcion).
- **IngestaInteligente.tsx** — Panel admin de ingesta inteligente: upload texto/imagen → OCR → clasificacion → revision humana → publicacion a tabla correcta. Override de tipo, confidence badges, sugerencias de campos faltantes.
- OCR via Canvas API con fallback a Tesseract.js.
- Vista "Ingesta Inteligente" como primer card del dashboard admin.

### Fixed
- **HomeMiniMap.tsx** — Primer intento de fix del mapa negro con ResizeObserver y multiple invalidateSize(). Mejoro pero no resolvio completamente.
- **Home.tsx** — KPIs del Centro de Situacion ahora son clickables (`<button>` con navegacion). Cada indicador navega a su pagina correspondiente.

### Changed
- Admin.tsx — Agregadas vistas 'ingesta' y 'national_banner'.

---

## [0.1.1] — 2025-06-25 — Fase 1: Centro Nacional de Coordinacion

### Added
- **NationalBanner.tsx** — Banner institucional configurable con 6 niveles de alerta: emergency_national (rojo con scan-line), emergency_regional (naranja), alert_yellow, info_official (azul), drill (morado), ended (verde). Auto-hide cuando pasa endDate.
- **BannerNacionalEditor.tsx** — Editor admin para el banner nacional con presets de nivel, icono, pais, texto, subtitulo, fechas.
- **NationalFeed.tsx** — Feed nacional unificado. 7 filtros (todo, solicitudes, ofertas, salud, campanas, personas, incidentes). FeedCard con icono, tipo, urgencia, tiempo, ubicacion, accion, compartir. Auto-refresh 45s.
- **national-feed.ts** — Store del feed nacional. Consulta 7 tablas en paralelo + eventos sismicos. 30 items max.
- **HomeMiniMap.tsx** — Mini mapa Leaflet embebido en Home (220px). Muestra help_requests, health_requests, shelters.
- **NationalBannerConfig** — Tipo e interfaz para configuracion del banner.
- `banner-scan` keyframes en index.css para efecto scan-line.
- CoordinationCenter integra campanas (navegacion a `/campana/:id`, boton "Participar" morado).
- location-search.ts integra busqueda de campanas.
- constants.ts — Colores, labels e iconos para tipo `campaign` en mapa.
- filters.ts — Capa `campaign` activa por defecto.
- MapView.tsx — Marcadores de campanas despues de POIs.

### Changed
- **Home.tsx** — Reescrito como dashboard operacional: NationalBanner → SeismicTicker → Centro de Situacion (grid 4x2) → CoordinationCenter → HomeMiniMap → NationalFeed → Acciones rapidas → Quick links → Share CTA → PriorityNeeds.
- **Header.tsx** — Eliminado banner de emergencia viejo. Agregado subtitulo "Centro de coordinacion".
- live-stats.ts — Fix de `.catch()` (Postgrest no lo soporta), safe access `cp?.count`.
- coordination.ts — Integra campanas como NearbyNeed. Fix de `.catch()`.

### Removed
- Banner de emergencia estatico del Header (`⚠ Emergencia activa — region`).

---

## [0.1.0] — 2025-06 — Integracion de Campanas

### Added
- **official_campaigns** — Tabla Supabase para campanas oficiales (migracion 009).
- **campaigns.ts** — Store con signals y CRUD para campanas.
- **CampaignsEditor.tsx** — Editor admin de campanas con extraccion de campos, ubicaciones multiples con GPS, verificacion, contacto, requisitos.
- **campaign-extract.ts** — Extractor de campos especifico para campanas (previo al clasificador universal).
- **Campaigns.tsx** — Pagina publica de campanas con filtro por tipo y badge de verificacion.
- **CampaignDetail.tsx** — Pagina de detalle de campana con mapa, contacto, requisitos.
- 11 tipos de campana: blood_donation, medical_day, vaccination, food_collection, water_distribution, medicine_delivery, rescue, community_kitchen, government, ngo, general.
- 4 niveles de verificacion: unverified, community, nodo, official.

---

## [0.0.9] — 2025-05 — Solicitudes de Salud

### Added
- **HealthRequest.tsx** — Pagina de solicitud de salud con 9 tipos, prioridad, grupo sanguineo, autocompletado de 23 hospitales venezolanos.
- Health requests como POI (`poi_type = 'health_request'`) con metadata JSONB.
- KNOWN_HOSPITALS en constants.ts.
- HEALTH_REQUEST_TYPES, HEALTH_PRIORITIES, BLOOD_TYPES en constants.ts y types.

---

## [0.0.8] — 2025-05 — Refugios Admin

### Added
- **AdminShelters.tsx** — CRUD completo de refugios con capacidad, amenidades (7), aceptaciones (4), estado, export CSV.
- Migracion 006: campos admin para shelters, tabla user_roles.
- **Shelters.tsx** — Pagina publica con listado de refugios activos.

---

## [0.0.7] — 2025-05 — Incidentes y Proteccion

### Added
- **ReportIncident.tsx** — Formulario de reporte de incidente con 12 tipos, foto, ubicacion, estado observado, personas afectadas.
- Tipos de proteccion (8): child_at_risk, elderly_at_risk, disabled_at_risk, etc.
- Marcadores de incidente y proteccion en mapa.

---

## [0.0.6] — 2025-04 — Campos de Contacto

### Added
- Migracion 007: `contact_method` + `contact_value` en help_requests, help_offers, persons.
- Migracion 008: `reporter_name` en help_requests.
- ContactPicker.tsx — Modal de seleccion de metodo de contacto (WhatsApp, telefono, email, Telegram, Instagram).
- Soporte de WhatsApp, Telegram, Instagram, email, SMS en popups de mapa.

---

## [0.0.5] — 2025-04 — Cola Offline

### Added
- **db.ts** — Schema Dexie con tablas offlineQueue y cache.
- **sync.ts** — enqueue(), processQueue(), getPendingCount().
- **useOfflineQueue.ts** — Hook que monitorea cola y sincroniza cada 15s.
- **OfflineBanner.tsx** — Banner de "Sin conexion" con contador de pendientes.
- Deduplicacion por offline_id (error 23505).

---

## [0.0.4] — 2025-04 — Personas Desaparecidas

### Added
- **SearchPerson.tsx** — Busqueda en base de datos NODO + links externos.
- **ReportFound.tsx** — Reportar persona encontrada.
- person_status_history para tracking de ubicacion.
- Links a desaparecidosterremotovenezuela.com y hospitalesenvenezuela.com.

---

## [0.0.3] — 2025-04 — Mapa Interactivo

### Added
- **MapView.tsx** — Mapa Leaflet con 11+ capas, popups, filtros, busqueda, geolocalizacion, export GeoJSON.
- **filters.ts** — Store de filtros de mapa.
- **location-search.ts** — Busqueda en datos NODO con cache de 30s.
- **map-refresh.ts** — Signal para forzar re-render de mapa.
- Marcadores personalizados con DivIcon (emoji + color + sombra).

---

## [0.0.2] — 2025-03 — Datos Sismicos + PWA

### Added
- **seismic.ts** — Integracion USGS API para sismos cerca de Venezuela.
- **SeismicTicker.tsx** — Ticker horizontal de sismos recientes.
- **vite-plugin-pwa** configuracion con Workbox, precaching, cache strategies.
- **InstallBanner.tsx** — Prompt de instalacion PWA.
- **UpdateBanner.tsx** — Prompt de actualizacion.
- Manifest con icons, standalone display, portrait orientation.

---

## [0.0.1] — 2025-03 — Lanzamiento Inicial

### Added
- Formulario de solicitud de ayuda (NeedHelp.tsx).
- Formulario de oferta de ayuda (OfferHelp.tsx).
- Supabase con 8 tablas core (migraciones 001-005).
- Panel de administracion basico.
- Centros de acopio, refugios, informacion verificada.
- Contactos de emergencia configurables.
- Router preact-iso con 11 rutas.
- Tailwind CSS v4 con tema dark personalizado.
- TypeScript 6.0 estricto.
- Deploy en Vercel (nodoayuda.com).
