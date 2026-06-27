# Estructura del Proyecto — NODO

## Frontend (`src/`)

| Directorio | Contenido |
|-----------|-----------|
| `pages/` | Vistas principales: Home, SearchPerson, MapView, Detail, SituationCenter, Admin, etc. |
| `components/` | Componentes reutilizables: UI primitivos, layout, paneles especializados |
| `components/ui/` | Design system: Button, Card, Modal, Badge, Spinner, StatusBadge, etc. |
| `components/layout/` | Header, BottomNav, OfflineBanner, InstallBanner |
| `components/admin/` | Paneles de administracion: gobernanza, campanas, ingesta |
| `hooks/` | Hooks reutilizables: geolocation, offline queue, online status |
| `design/` | Tokens del design system: colores, tipografia, espaciado, sombras |
| `types/` | Definiciones TypeScript compartidas |
| `store/` | Estado reactivo con signals |
| `lib/` | Logica de negocio |

## Supabase (`supabase/`)

| Archivo | Contenido |
|---------|-----------|
| `migrations/001_extensions.sql` | Extensiones: PostGIS, pg_trgm |
| `migrations/002_tables.sql` | Tablas principales: persons, shelters, help_requests, offers, incidents |
| `migrations/003_indexes.sql` | Indices de busqueda y geoespaciales |
| `migrations/004_rls.sql` | Row Level Security (anon CRUD) |
| `migrations/005_seed.sql` | Datos iniciales |
| `migrations/006-012` | Migraciones incrementales: admin, contactos, campanas, gobernanza |

## Motores (`src/lib/connect/`)

| Motor | Archivo | Funcion |
|-------|---------|---------|
| Federation Engine | `connector-manager.ts` | Registro y orquestacion de conectores |
| Adaptive Search | `connector-priority.ts` | Busqueda adaptativa con prioridad |
| Evidence Engine | `evidence-engine.ts` | Verificacion multi-fuente |
| Humanitarian Context | `humanitarian-context.ts` | Relaciones entre entidades |
| Humanitarian Brief | `humanitarian-brief.ts` | Resumen ejecutivo |
| Humanitarian Index | `humanitarian-index.ts` | Agregacion por tipo |
| Situation Center | `situation-center.ts` | Dashboard nacional |
| Cache | `connector-cache.ts` | Cache de resultados |
| Rate Limit | `connector-rate-limit.ts` | Control de frecuencia |
| Normalizer | `connector-normalizer.ts` | Normalizacion de datos |

## Conectores (`src/lib/connect/connectors/`)

| Conector | Entidades | Registros |
|----------|-----------|-----------|
| `hospitales-connector.ts` | hospital | 20 |
| `venezuela-te-busca-connector.ts` | person | 10 |
| `desaparecidos-terremoto-connector.ts` | person | 12 |
| `vzlaayuda-connector.ts` | person, shelter, resource | 12 |
| `patitas-connector.ts` | pet | 10 |
| `reencuentro-connector.ts` | person | 15 |

Templates reutilizables:
- `persona-search-connector.ts` — para plataformas de personas
- `multi-entity-connector.ts` — para plataformas multi-entidad

## Assist (`src/assist/`)

Motor de IA conversacional para ingesta asistida.

| Directorio | Contenido |
|-----------|-----------|
| `ai/` | Clasificador de intento, extractor de entidades, generador de respuesta |
| `handlers/` | Handlers por tipo: buscar persona, reportar, crear solicitud |
| `services/` | Servicios: matching, busqueda, Supabase |
| `providers/` | Canales: WhatsApp |

## Design System (`src/design/`)

Tokens centralizados que definen la identidad visual:

`colors.ts` · `typography.ts` · `spacing.ts` · `shadows.ts` · `radius.ts` · `animations.ts` · `breakpoints.ts`

Exportados desde `index.ts` para uso en cualquier componente.
