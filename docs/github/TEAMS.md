# Equipos — NODO

---

## Frontend

**Mision:** Construir una experiencia mobile-first accesible y rapida.

**Responsabilidades:**
- Paginas, componentes, layout
- Design system y tokens
- Accesibilidad (WCAG AA)
- Performance y UX

**Tareas ejemplo:** skeleton loading, modo oscuro, animaciones, contraste.

---

## Backend

**Mision:** Mantener la integridad de datos, stores y logica de negocio.

**Responsabilidades:**
- Stores (signals)
- Libs de logica
- Supabase (migraciones, RLS)
- Offline sync y PWA

**Tareas ejemplo:** nuevas migraciones, mejorar sync offline, optimizar queries.

---

## Connectors

**Mision:** Expandir la Red NODO conectando nuevas plataformas.

**Responsabilidades:**
- Crear nuevos conectores
- Mantener conectores existentes
- Normalizar datos entre fuentes
- Conectar APIs reales cuando esten disponibles

**Tareas ejemplo:** conector Cruz Roja, ampliar hospitales, conectar FUNVISIS.

---

## AI

**Mision:** Mejorar el motor de asistencia conversacional sin auto-publicar.

**Responsabilidades:**
- Intent classifier
- Entity extractor
- Response builder
- Handlers por tipo de busqueda

**Tareas ejemplo:** detectar nuevos intentos, mejorar extraccion, soporte multilenguaje.

---

## Maps

**Mision:** Proveer visualizacion geografica precisa y util.

**Responsabilidades:**
- MapView y Leaflet
- Geolocation
- Clusters, heatmaps, rutas
- Geocoding

**Tareas ejemplo:** clusters de marcadores, filtros por entidad, ruta al hospital.

---

## QA

**Mision:** Garantizar que nada se rompa y todo funcione en mobile.

**Responsabilidades:**
- Tests unitarios y de integracion
- Verificacion cross-browser
- Testing en dispositivos reales
- Revision de PRs

**Tareas ejemplo:** tests de Evidence Engine, tests de matching, CI pipeline.

---

## Documentation

**Mision:** Hacer que cualquier persona pueda entender y contribuir a NODO.

**Responsabilidades:**
- README, onboarding, guias
- Traducciones (espanol/ingles)
- API reference de motores
- Documentacion de migraciones

**Tareas ejemplo:** traducir a ingles, documentar migraciones, guia de conectores.

---

## Estructura en GitHub

```
NODOPlatform/
├── @core          → Owners del proyecto
├── @frontend      → Paginas y componentes
├── @backend       → Stores, libs, Supabase
├── @connectors    → Conectores de la Red NODO
├── @ai            → Motor Assist
├── @maps          → MapView y geolocation
├── @qa            → Testing y CI
└── @docs          → Documentacion
```

Crear equipos en: GitHub → NODOPlatform → Settings → Teams.
