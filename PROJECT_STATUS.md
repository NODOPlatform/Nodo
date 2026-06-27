# Estado del Proyecto — NODO

Ultima actualizacion: junio 2026

---

## Estado general: Operativo

La plataforma esta en produccion en [nodoayuda.com](https://www.nodoayuda.com).

---

## Motores implementados

| Motor | Estado |
|-------|--------|
| Federation Engine | Operativo — busqueda adaptativa multi-fuente |
| Evidence Engine | Operativo — verificacion multi-fuente (4 niveles) |
| Humanitarian Context | Operativo — relaciones automaticas entre entidades |
| Humanitarian Brief | Operativo — resumen ejecutivo con confianza |
| Humanitarian Index | Operativo — agregacion por tipo de entidad |
| Situation Center | Operativo — dashboard nacional |
| Motor de Coincidencias | Operativo — matching fuzzy de personas |
| Timeline | Operativo — cronologia por persona |
| Unified Profile | Operativo — perfil consolidado multi-fuente |
| Assist (IA) | Operativo — ingesta conversacional asistida |

## Conectores (Red NODO)

| Nodo | Entidades | Registros | Estado |
|------|-----------|-----------|--------|
| Hospitales en Venezuela | hospital | 20 | Activo |
| Venezuela Te Busca | person | 10 | Activo |
| Desaparecidos Terremoto | person | 12 | Activo |
| VzlaAyuda | person, shelter, resource | 12 | Activo |
| Patitas a Salvo | pet | 10 | Activo |
| Reencuentro Venezuela | person | 15 | Activo |

**Total: 6 nodos, 79 registros, 5 tipos de entidad.**

## Documentacion disponible

| Documento | Contenido |
|-----------|-----------|
| README, MANIFESTO, CONTRIBUTING | Base open source |
| onboarding/ (5 docs) | Guia completa para nuevos colaboradores |
| docs/github/ | Projects, labels, teams, issues |
| docs/architecture/ | Estructura del proyecto |
| docs/connectors/ | Como crear conectores |
| DEVELOPMENT_WORKFLOW | Flujo de ramas |

## Infraestructura

| Componente | Estado |
|-----------|--------|
| Supabase (DB + RLS) | Operativo — 12 migraciones |
| Vercel (deploy) | Operativo — produccion |
| PWA + offline | Operativo |
| GitHub Organization | Configurado |
| CI/CD | Pendiente |

## Construyendo ahora

- Organizacion de trabajo en GitHub (Projects, Labels, Teams)
- Preparacion para recibir colaboradores externos
- Documentacion de onboarding

## Proximos objetivos

- CI basico con GitHub Actions
- Conectar APIs reales (cuando esten disponibles)
- Tests unitarios para motores core
- Traducciones a ingles
- Nuevos conectores: Cruz Roja, FUNVISIS, Proteccion Civil
