# NODO — Instrucciones para Desarrollo

## Antes de modificar cualquier parte importante del sistema

Lee estos documentos primero:
- `NODO_CONTEXT.md` — **Memoria permanente del proyecto.** Contiene todo: proposito, filosofia, estado actual, arquitectura, flujo de datos, IA, roadmap, decisiones, convenciones y reglas NO ROMPER. Este es el documento principal.
- `NODO_ARCHITECTURE.md` — Arquitectura tecnica detallada
- `DATA_FLOW.md` — Flujo de datos por tipo de contenido
- `DECISION_LOG.md` — Decisiones historicas y sus motivos
- `ROADMAP.md` — Fases completadas y planificadas
- `CHANGELOG.md` — Historial de cambios por version

## Stack

- **Preact** (NO React) con `@preact/signals` y `preact-iso`
- **Supabase** con anon key solamente (nunca service_role)
- **Leaflet** con import estatico (nunca `await import('leaflet')`)
- **Tailwind CSS v4** con `@theme` directive
- **TypeScript 6.0** estricto (`tsc -b` debe pasar)
- **Vite 8.1** con vite-plugin-pwa

## Reglas criticas

1. **Toda logica en stores/lib.** Los componentes solo renderizan signals.
2. **La IA nunca publica automaticamente.** Siempre revision humana.
3. **Supabase es la unica fuente de verdad.** No duplicar datos.
4. **Solo anon key.** Nunca service_role en frontend.
5. **Reutilizar componentes** antes de crear nuevos.
6. **Signals, no useState** para estado compartido.
7. **Deploy despues de cada cambio:** `vercel --prod --yes`

## Variables de entorno

Archivo `.env.local` (no `.env`):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Build y deploy

```bash
tsc -b && vite build   # Build
vercel --prod --yes     # Deploy
```
