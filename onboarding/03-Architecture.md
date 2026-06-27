# 03 — Arquitectura

## Stack y estructura del proyecto

---

## Stack

| Tecnologia | Proposito |
|-----------|-----------|
| **Preact** (NO React) | Framework UI — 6KB vs 40KB |
| **@preact/signals** | Estado reactivo global |
| **preact-iso** | Router + lazy loading |
| **Supabase** | Base de datos (solo anon key, nunca service_role) |
| **Leaflet** | Mapas interactivos |
| **Tailwind CSS v4** | Estilos utility-first |
| **Vite** | Build + HMR |
| **vite-plugin-pwa** | Service Worker + offline |
| **TypeScript** | Tipado estricto (`tsc -b` debe pasar) |

---

## Estructura de directorios

```
src/
├── pages/              Vistas de ruta (solo renderizan)
├── components/
│   ├── ui/             Componentes reutilizables (Button, Card, Modal...)
│   ├── layout/         Header, BottomNav, banners
│   └── admin/          Paneles de administracion
├── store/              Estado reactivo (@preact/signals)
├── lib/                Logica pura
│   └── connect/        Federation Engine
│       └── connectors/ Nodos federados individuales
├── hooks/              Efectos reutilizables
├── design/             Design system tokens
├── assist/             Motor de IA conversacional
└── types/              Definiciones TypeScript
```

---

## Motores principales

```
Usuario busca "Maria Gonzalez"
         │
    ┌────┴────┐
    │ Paralelo │
    ├──────────┤
    │ Supabase │ ← Base de datos NODO
    │ 6 Nodos  │ ← Federation Engine (conectores)
    └────┬─────┘
         │
    deduplicateResults()  ← Elimina duplicados cross-source
         │
    ┌────┴──────────────────────────────┐
    │ Evidence Engine                    │ Verificacion multi-fuente
    │ Humanitarian Index                 │ Contadores por tipo
    │ Humanitarian Context               │ Relaciones entre entidades
    │ Humanitarian Brief                 │ Resumen ejecutivo
    └───────────────────────────────────┘
         │
    Vista unificada consolidada
```

| Motor | Archivo | Funcion |
|-------|---------|---------|
| Federation Engine | `connector-manager.ts` | Busqueda adaptativa con cache, rate-limit, prioridad |
| Evidence Engine | `evidence-engine.ts` | Verificacion multi-fuente (verified/corroborated/single/unconfirmed) |
| Humanitarian Context | `humanitarian-context.ts` | Relaciones automaticas entre entidades |
| Humanitarian Brief | `humanitarian-brief.ts` | Resumen ejecutivo con confianza |
| Humanitarian Index | `humanitarian-index.ts` | Agregacion por tipo de entidad |
| Situation Center | `situation-center.ts` | Dashboard nacional |
| Person Matching | `person-matching.ts` | Motor de coincidencias fuzzy |
| Person Timeline | `person-timeline.ts` | Eventos cronologicos |
| Person Profile | `person-profile.ts` | Ficha unificada cross-source |

---

## Reglas criticas

1. **Toda logica en stores/lib.** Los componentes solo renderizan signals.
2. **La IA nunca publica automaticamente.** Siempre revision humana.
3. **Solo anon key.** Nunca service_role en frontend.
4. **Signals, no useState** para estado compartido.
5. **Reutilizar componentes** antes de crear nuevos.
6. **Supabase es la unica fuente de verdad.**

---

## Variables de entorno

Archivo `.env.local` (no `.env`):

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_ADMIN_DEFAULT_PASSWORD=your-admin-password
VITE_OWNER_DEFAULT_PASSWORD=your-owner-password
```

---

Anterior: [02-Vision.md](02-Vision.md) | Siguiente: [04-How-NODO-Works.md](04-How-NODO-Works.md)
