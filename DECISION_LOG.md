# NODO — Registro de Decisiones

Historial cronologico de decisiones tecnicas y de producto importantes.

Cada decision incluye: fecha, problema, solucion, motivo e impacto.

---

## DEC-001 — Preact en lugar de React

**Fecha:** 2025-03 (v0.1)
**Problema:** Necesitabamos un framework UI para una PWA que debe cargar rapido en conexiones lentas de Venezuela.
**Solucion:** Elegir Preact (6KB) sobre React (40KB) con `@preact/signals` para estado reactivo.
**Motivo:** La diferencia de tamano es critica para usuarios con 2G/3G. Signals es mas eficiente que useState/useReducer para estado compartido.
**Impacto:** Bundle significativamente mas pequeno. Restriccion: no se puede usar el ecosistema React directamente (react-router, react-query, etc.). Se usa preact-iso para routing.

---

## DEC-002 — Supabase como unica fuente de verdad

**Fecha:** 2025-03 (v0.1)
**Problema:** Los datos estaban divididos entre localStorage, Supabase y variables en memoria. Habia inconsistencias.
**Solucion:** Migrar todo a Supabase. localStorage solo para configuracion admin y sesion. IndexedDB solo para cola offline temporal.
**Motivo:** Una sola fuente de verdad elimina conflictos de sincronizacion y facilita queries complejos.
**Impacto:** Toda logica de lectura consulta Supabase via stores. La cola offline se sincroniza automaticamente y se elimina despues.

---

## DEC-003 — Solo anon key en frontend

**Fecha:** 2025-03 (v0.1)
**Problema:** Necesitabamos decidir que nivel de acceso dar al frontend.
**Solucion:** Usar unicamente `VITE_SUPABASE_ANON_KEY`. Row Level Security permite lectura/escritura anonima para operaciones de emergencia.
**Motivo:** No hay backend propio. Exponer service_role seria un riesgo critico de seguridad. RLS protege las operaciones destructivas.
**Impacto:** Cualquier usuario puede crear solicitudes y ofertas sin autenticarse. La seguridad depende enteramente de las politicas RLS.

---

## DEC-004 — Cola offline con Dexie/IndexedDB

**Fecha:** 2025-04
**Problema:** Durante emergencias, la conectividad falla frecuentemente. Los usuarios perdian datos al enviar formularios sin conexion.
**Solucion:** Implementar cola offline usando Dexie (IndexedDB). Los formularios guardan localmente y sincronizan cuando hay conexion.
**Motivo:** IndexedDB tiene mucho mas espacio que localStorage y soporta transacciones. Dexie simplifica la API.
**Impacto:** Todos los formularios funcionan offline. El campo `offline_id` (UUID) previene duplicados al sincronizar (error 23505 = ya existe).

---

## DEC-005 — Eliminacion de localStorage para Centros de Acopio

**Fecha:** 2025-05
**Problema:** Los centros de acopio se guardaban en localStorage del admin. Esto significaba que solo existian en el dispositivo del admin y no eran visibles para otros.
**Solucion:** Migrar centros de acopio a Supabase (`points_of_interest` con `poi_type = 'collection_center'`).
**Motivo:** Consistencia con la decision DEC-002. Un centro de acopio es un dato publico que debe ser accesible desde cualquier dispositivo.
**Impacto:** Los centros de acopio ahora aparecen en el mapa, en el feed y en las busquedas. La gestion sigue siendo desde el panel admin.

---

## DEC-006 — Autenticacion admin via localStorage (no Supabase Auth)

**Fecha:** 2025-04
**Problema:** Necesitabamos un sistema admin simple sin requerir cuentas de email.
**Solucion:** Contrasena almacenada en localStorage. Sesion de 3 horas. Moderadores con permisos granulares.
**Motivo:** No hay infraestructura de email en Venezuela confiable para reset de contrasenas. El admin es una sola persona o un equipo pequeno que comparte la contrasena presencialmente.
**Impacto:** Seguridad basica pero funcional. La contrasena default (`nodo2025`) debe cambiarse en produccion. No soporta multiples admins con sesiones independientes (futuro: migrar a Supabase Auth).

---

## DEC-007 — Campanas oficiales como tabla separada

**Fecha:** 2025-06
**Problema:** Las campanas (jornadas de donacion, ollas comunitarias, etc.) no encajaban en el modelo de `help_requests` ni `points_of_interest`.
**Solucion:** Crear tabla `official_campaigns` con campos especificos: locations[], requirements[], verification_level, schedule.
**Motivo:** Las campanas tienen multiples ubicaciones, horarios, organizaciones y necesitan un sistema de verificacion propio.
**Impacto:** Migracion `009_campaigns.sql`. Nuevo store `campaigns.ts`. Integrado en mapa, feed, coordinacion y busqueda.

---

## DEC-008 — OCR con revision humana obligatoria

**Fecha:** 2025-06
**Problema:** Mucha informacion durante emergencias llega como imagenes (flyers de WhatsApp, capturas de pantalla).
**Solucion:** Implementar OCR con Canvas API + Tesseract.js. El texto extraido pasa por el clasificador universal, pero NUNCA se publica automaticamente.
**Motivo:** La precision del OCR no es 100%. Publicar informacion incorrecta puede causar dano real (ubicacion equivocada de refugio, horario incorrecto de campana).
**Impacto:** El admin recibe sugerencias de clasificacion con scores de confianza. Puede corregir tipo, campos y texto antes de publicar.

---

## DEC-009 — Clasificador Universal desacoplado

**Fecha:** 2025-06 (Fase 2)
**Problema:** Existian extractores separados: `extractCampaign()`, `extractBlood()`, etc. Cada nuevo tipo requeria un extractor nuevo.
**Solucion:** Crear `universal-classifier.ts` con una sola API: `classifyContent(text)`. Clasifica en 15 tipos y extrae campos automaticamente.
**Motivo:** Escalabilidad. El sistema debe poder procesar miles de publicaciones diarias de multiples fuentes sin escribir un extractor por tipo.
**Impacto:** Un solo punto de entrada para toda clasificacion. Los extractores de campos son funciones puras reutilizables. Agregar un nuevo tipo es agregar una entrada en `CLASS_RULES`.

---

## DEC-010 — Banner Nacional configurable con 6 niveles

**Fecha:** 2025-06 (Fase 1)
**Problema:** El banner de emergencia era estatico y no comunicaba el nivel de severidad.
**Solucion:** NationalBanner con 6 niveles: emergency_national (rojo), emergency_regional (naranja), alert_yellow, info_official (azul), drill (morado), ended (verde).
**Motivo:** Diferentes emergencias requieren diferentes niveles de alerta. Un sismo no es lo mismo que un simulacro.
**Impacto:** El admin puede cambiar el nivel en tiempo real desde el panel. El banner se auto-oculta cuando pasa la fecha de fin.

---

## DEC-011 — Feed Nacional unificado

**Fecha:** 2025-06 (Fase 1)
**Problema:** La informacion estaba fragmentada en paginas separadas. El usuario tenia que navegar a cada seccion para ver la actividad.
**Solucion:** Feed unificado que consulta 7 tablas + eventos sismicos y muestra los 30 items mas recientes con filtros por tipo.
**Motivo:** En una emergencia, la persona necesita ver TODO lo que esta pasando en un solo lugar.
**Impacto:** Componente NationalFeed en Home. Se refresca cada 45 segundos.

---

## DEC-012 — Motor de Inteligencia Operacional

**Fecha:** 2025-06 (Fase 3)
**Problema:** NODO almacenaba informacion pero no la analizaba. Los datos existian pero no generaban acciones.
**Solucion:** Crear `intelligence.ts` — un motor que analiza continuamente toda la informacion y genera: insights, trends, matching y mision del dia.
**Motivo:** La coordinacion real requiere que el sistema entienda relaciones entre datos. "Hay 4 solicitudes de sangre O+ sin atender" es mas valioso que "Hay 4 solicitudes de salud".
**Impacto:** Componentes NationalIntelligence y MissionOfTheDay en Home. Matching automatico de necesidades con recursos disponibles.

---

## DEC-013 — Leaflet con import estatico

**Fecha:** 2025-06 (Fase 3)
**Problema:** El HomeMiniMap usaba `await import('leaflet')` (dynamic import) y renderizaba negro en muchos dispositivos.
**Solucion:** Cambiar a import estatico: `import L from 'leaflet'` + `import 'leaflet/dist/leaflet.css'`.
**Motivo:** El import dinamico no cargaba el CSS de Leaflet consistentemente. Sin el CSS, los tiles no se posicionan correctamente y el mapa aparece negro. El MapView funciona porque siempre uso import estatico.
**Impacto:** El mapa se inicializa de forma confiable. El bundle es ligeramente mas grande pero la confiabilidad es prioritaria.

---

## DEC-014 — Solicitudes de salud como POI

**Fecha:** 2025-05
**Problema:** Las solicitudes de sangre, medicinas, oxigeno, etc. necesitaban un modelo que soporte metadata variable (grupo sanguineo, cantidad de donantes, hospital, prioridad).
**Solucion:** Usar `points_of_interest` con `poi_type = 'health_request'` y metadata JSONB para campos variables.
**Motivo:** Evitar crear una tabla nueva por cada tipo de solicitud. El campo metadata JSONB es flexible y permite agregar campos sin migraciones.
**Impacto:** health_type, blood_type, donor_count, donors_confirmed, priority, hospital_name se almacenan en metadata.

---

## DEC-015 — Signals como interfaz entre IA y UI

**Fecha:** 2025-06 (Fase 3)
**Problema:** Necesitabamos una arquitectura que permita reemplazar el motor de IA sin cambiar la UI.
**Solucion:** Los stores exportan interfaces tipadas (`Insight`, `MatchSuggestion`, `TrendData`, `MissionData`) y signals. Los componentes solo consumen signals.
**Motivo:** Preparar para migracion futura a LLM. La interfaz de datos no cambia aunque el motor interno sea completamente diferente.
**Impacto:** `intelligence.ts` puede ser reescrito internamente sin tocar `NationalIntelligence.tsx`, `MissionOfTheDay.tsx` ni `Home.tsx`.
