# NODO — Roadmap

---

## Fases Completadas

### Fase 0 — Fundacion

**Estado:** Completada
**Objetivo:** Construir la plataforma base funcional para emergencias.

| Componente | Estado |
|-----------|--------|
| Formularios: solicitar ayuda, ofrecer ayuda, buscar personas, reportar incidentes | Completado |
| Mapa interactivo con 11 capas de marcadores | Completado |
| Cola offline con IndexedDB (Dexie) | Completado |
| PWA con Service Worker y precaching | Completado |
| Supabase con 8 tablas core + RLS | Completado |
| Panel de administracion basico | Completado |
| Refugios con gestion de capacidad | Completado |
| Centros de acopio | Completado |
| Informacion verificada por categorias | Completado |
| Contactos de emergencia | Completado |
| Personas desaparecidas/encontradas | Completado |

**Riesgos resueltos:** Schema de base de datos estabilizado. Offline queue probada en campo.
**Dependencias:** Ninguna (fundacional).

---

### Fase 1 — Centro Nacional de Coordinacion

**Estado:** Completada
**Objetivo:** Transformar la Home de una lista de herramientas a un dashboard operacional en tiempo real.

| Componente | Estado |
|-----------|--------|
| NationalBanner — 6 niveles de alerta configurables | Completado |
| BannerNacionalEditor — Editor admin para el banner | Completado |
| SeismicTicker — Datos USGS en tiempo real | Completado |
| Centro de Situacion — Grid 4x2 de KPIs clickables | Completado |
| CoordinationCenter — 20 necesidades cercanas con scoring | Completado |
| HomeMiniMap — Vista previa de mapa embebida | Completado |
| NationalFeed — Timeline unificado de 7 fuentes | Completado |
| Acciones rapidas reorganizadas | Completado |
| Quick links + CTA de compartir | Completado |
| PriorityNeeds — Necesidades por nivel | Completado |
| LiveStats — Contadores en tiempo real | Completado |

**Riesgos resueltos:** MiniMap negro en algunos dispositivos (resuelto en Fase 3 con import estatico de Leaflet).
**Dependencias:** Fase 0 (tablas, stores, componentes base).

---

### Fase 2 — IA de Clasificacion Universal + Ingesta Inteligente

**Estado:** Completada
**Objetivo:** Un solo motor de IA que clasifica cualquier tipo de contenido de emergencia.

| Componente | Estado |
|-----------|--------|
| universal-classifier.ts — 15 tipos de contenido | Completado |
| Extractores de campos (persona, sangre, telefono, fecha, ubicacion, etc.) | Completado |
| OCR con Canvas API / Tesseract.js | Completado |
| IngestaInteligente.tsx — UI admin: idle → processing → review → publish | Completado |
| Flujo de revision humana obligatorio | Completado |
| Publicacion a tabla Supabase correcta segun tipo | Completado |
| Override manual de tipo detectado | Completado |
| Scores de confianza por campo | Completado |
| Sugerencias automaticas de campos faltantes | Completado |

**Riesgos resueltos:** Arquitectura desacoplada permite reemplazar motor sin cambiar UI.
**Dependencias:** Fase 0 (tablas), Fase 1 (panel admin).

---

### Fase 3 — Motor de Inteligencia Operacional

**Estado:** Completada
**Objetivo:** NODO pasa de almacenar informacion a entenderla, relacionarla y convertirla en acciones.

| Componente | Estado |
|-----------|--------|
| intelligence.ts — Motor de analisis continuo | Completado |
| computeTrends() — Comparacion 24h vs 48h por tipo y ciudad | Completado |
| generateInsights() — Conclusiones automaticas | Completado |
| computeMatching() — Necesidad + recurso por distancia | Completado |
| computeMission() — Prioridad nacional del dia | Completado |
| NationalIntelligence.tsx — UI de insights y matching | Completado |
| MissionOfTheDay.tsx — Tarjeta de prioridad | Completado |
| Fix definitivo MiniMapa (import estatico Leaflet) | Completado |

**Riesgos resueltos:** Separacion total IA/UI via signals tipados.
**Dependencias:** Fase 0 (tablas), Fase 1 (dashboard), Fase 2 (clasificador).

---

## Fases Planificadas

### Fase 4 — Division por Estado + Red de Organizaciones

**Estado:** Planificada
**Objetivo:** Escalar NODO de cobertura capitalina a cobertura nacional con estructura por estado.

| Componente | Descripcion |
|-----------|-------------|
| Selector de estado | Filtro global por estado (24 estados + DC) |
| Dashboard por estado | Metricas independientes por region |
| Directorio de organizaciones | ONGs, iglesias, comunidades con verificacion |
| Perfiles de organizacion | Nombre, tipo, area de cobertura, verificacion |
| Sistema de verificacion | Niveles: sin verificar → comunidad → NODO → oficial |

**Riesgos:** Requiere datos de organizaciones reales. Proceso de verificacion necesita criterios claros.
**Dependencias:** Fase 3 (motor de inteligencia para metricas por region).

---

### Fase 5 — Sistema de Reputacion y Verificacion

**Estado:** Planificada
**Objetivo:** Trust Scores para publicaciones y usuarios basados en evidencia.

| Componente | Descripcion |
|-----------|-------------|
| Trust Score por publicacion | Score basado en: telefono, ubicacion, foto, organizacion, reportes multiples |
| Deteccion de duplicados | Similitud de texto/ubicacion entre reportes |
| Fusion de reportes | Sugerir (nunca automatico) fusion de reportes similares |
| Indicadores visuales | Verde (alta), Amarillo (media), Rojo (baja) confianza |
| Historial por device_id | Patron de contribuciones anonimas |

**Riesgos:** Balance entre privacidad (no hay cuentas de usuario) y confiabilidad.
**Dependencias:** Fase 3 (motor de inteligencia), Fase 4 (organizaciones verificadas).

---

### Fase 6 — API Publica + Integraciones

**Estado:** Planificada
**Objetivo:** Abrir NODO como plataforma para integraciones externas.

| Componente | Descripcion |
|-----------|-------------|
| API REST publica | Endpoints para leer solicitudes, ofertas, campanas, refugios |
| WhatsApp Business API | Recibir solicitudes via mensaje de texto |
| Telegram Bot | Canal de informacion y reportes |
| Webhooks | Notificar sistemas externos de nuevos datos |
| Export de datos | CSV, GeoJSON, API feeds |
| Documentacion API | OpenAPI/Swagger |

**Riesgos:** Rate limiting, abuso de API, costos de WhatsApp Business.
**Dependencias:** Fase 5 (verificacion para filtrar datos publicos).

---

### Fase 7 — Expansion Regional

**Estado:** Planificada
**Objetivo:** Adaptar NODO para funcionar en otros paises de America Latina.

| Componente | Descripcion |
|-----------|-------------|
| Multi-tenancy | Instancias por pais con configuracion independiente |
| Internacionalizacion | Framework de traduccion (espanol base) |
| Adaptacion geografica | APIs sismicas locales, codigos de telefono, hospitales |
| Documentacion de replicacion | Guia para desplegar NODO en un nuevo pais |

**Riesgos:** Cada pais tiene regulaciones diferentes sobre datos personales y emergencias.
**Dependencias:** Fase 6 (API estable), toda la documentacion.

---

## Ideas Futuras

Estas ideas no tienen fase asignada. Se priorizaran segun impacto y viabilidad.

| Idea | Descripcion |
|------|-------------|
| LLM para clasificacion | Reemplazar keywords por modelo de lenguaje para clasificacion semantica |
| Prediccion de necesidades | Modelos que predicen demanda basados en patrones historicos |
| Analisis de imagenes | IA que clasifica fotos de danos (derrumbes, inundaciones) |
| Mapa de calor | Heatmap de densidad de solicitudes |
| Notificaciones push | Alertas geolocalizadas para voluntarios cercanos |
| Chat entre usuarios | Comunicacion directa dentro de la plataforma |
| Dashboard para medios | Vista publica de datos agregados para periodistas |
| Integracion FUNVISIS | Datos sismicos locales de Venezuela |
| Sistema de turnos | Coordinacion de turnos para voluntarios en refugios |
| Gamificacion de voluntariado | Reconocimiento por contribuciones sostenidas |
| Modo simulacro | Entorno de prueba para capacitacion en emergencias |
