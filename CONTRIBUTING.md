# Contribuir a NODO

Gracias por querer contribuir. Cada linea de codigo puede ayudar a salvar una vida.

---

## Setup

```bash
git clone https://github.com/nodo-venezuela/nodo.git
cd nodo
npm install
cp .env.example .env.local
npm run dev
```

---

## Flujo de trabajo

### 1. Crear una rama

```bash
git checkout -b tipo/descripcion-corta
```

Nombres de ramas:

| Prefijo | Uso |
|---------|-----|
| `feat/` | Nueva funcionalidad |
| `fix/` | Correccion de bug |
| `connector/` | Nuevo conector para la Red NODO |
| `docs/` | Documentacion |
| `refactor/` | Reestructuracion sin cambio funcional |

Ejemplos:
- `connector/cruz-roja-venezuela`
- `feat/search-filters`
- `fix/offline-sync-retry`

### 2. Hacer cambios

- `tsc -b` debe pasar sin errores
- `npx vite build` debe compilar
- No romper funcionalidad existente

### 3. Hacer commit

```
tipo(modulo): descripcion breve

Cuerpo opcional explicando el por que.
```

Ejemplos:
- `feat(connect): add Cruz Roja Venezuela connector`
- `fix(search): handle empty query in federation engine`

### 4. Crear Pull Request

Usar el template proporcionado. Incluir:
- Que cambia y por que
- Como probarlo
- Checklist de verificacion

---

## Crear un conector

La contribucion mas valiosa. Ver [onboarding/05-First-Contribution.md](onboarding/05-First-Contribution.md) para el tutorial completo.

Resumen:

1. Crear `src/lib/connect/connectors/mi-plataforma-connector.ts`
2. Usar `PersonSearchConnector` o `MultiEntityConnector` como base
3. Registrar en `connectors/index.ts`
4. Exportar `RECORDS` y agregar en `situation-center.ts`
5. Verificar con `tsc -b && npx vite build`

---

## Reportar bugs

Usar el template **Bug Report** en Issues. Incluir:
- Que paso
- Que esperabas
- Pasos para reproducir
- Navegador y dispositivo

---

## Proponer funcionalidades

Usar el template **Feature Request** en Issues. Incluir:
- El problema que resuelve
- La solucion propuesta
- Alternativas consideradas

---

## Reglas

1. **Preact, no React.** Usar `@preact/signals`, no `useState`.
2. **Logica en lib/store.** Los componentes solo renderizan.
3. **Solo anon key.** Nunca service_role en frontend.
4. **La IA nunca publica automaticamente.** Siempre revision humana.
5. **Respetar plataformas.** Rate-limit, cache, creditos.
6. **No hardcodear secretos.** Usar variables de entorno.
7. **No crear tablas nuevas** sin aprobacion previa.

---

## Estructura de PR

```markdown
## Summary
- Breve descripcion

## Test plan
- [ ] `tsc -b` pasa
- [ ] `vite build` compila
- [ ] Probado en mobile
- [ ] No rompe funcionalidad existente
```
