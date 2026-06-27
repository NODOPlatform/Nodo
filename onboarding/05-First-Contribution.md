# 05 — Tu primera contribucion

## La forma mas rapida de contribuir a NODO

---

## Setup local

```bash
# 1. Clonar el repositorio
git clone https://github.com/nodo-venezuela/nodo.git
cd nodo

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales de Supabase

# 4. Iniciar el servidor de desarrollo
npm run dev

# 5. Verificar que compila
npx tsc -b && npx vite build
```

---

## Crear un nuevo conector

La contribucion mas valiosa: conectar una nueva plataforma a la Red NODO.

### Para personas (PersonSearchConnector)

Crear `src/lib/connect/connectors/mi-plataforma-connector.ts`:

```typescript
import type { PersonRecord } from './persona-search-connector'
import { registerPersonSearchConnector } from './persona-search-connector'

export const RECORDS: PersonRecord[] = [
  {
    id: 'mp-001',
    firstName: 'Nombre',
    lastName: 'Apellido',
    age: 30,
    sex: 'M',
    photoUrl: null,
    city: 'Caracas',
    state: 'Distrito Capital',
    lastLocation: 'Ubicacion',
    hospital: null,
    status: 'missing',  // missing | found | safe | hospitalized | reunited | deceased
    description: 'Descripcion del caso.',
    publishedAt: '2026-01-01T00:00:00Z',
    updatedAt: null,
    organization: 'Mi Plataforma',
    sourceUrl: 'https://miplataforma.com',
    confidence: 'medium',  // high | medium | low
  },
]

export function initMiPlataformaConnector(): void {
  registerPersonSearchConnector({
    providerId: 'mi-plataforma',
    providerName: 'Mi Plataforma',
    config: {
      type: 'manual',  // manual | json | api | search | html
      enabled: true,
      timeout: 5000,
      rateLimit: { minIntervalMs: 1000, maxPerMinute: 30 },
    },
    records: RECORDS,
  })
}
```

### Para multi-entidad (MultiEntityConnector)

Si la plataforma tiene personas, refugios, recursos, mascotas u hospitales, usar `multi-entity-connector.ts` como base. Ver `vzlaayuda-connector.ts` o `patitas-connector.ts` como ejemplos.

### Registrar el conector

Agregar en `src/lib/connect/connectors/index.ts`:

```typescript
import { initMiPlataformaConnector } from './mi-plataforma-connector'

// Dentro de initConnectors():
initMiPlataformaConnector()
```

### Agregar al Situation Center

Exportar `RECORDS` del conector y agregar una linea en `situation-center.ts` → `getAllRawRecords()`.

### Eso es todo

El conector se integra automaticamente con:
- Busqueda unificada
- Evidence Engine
- Humanitarian Context
- Humanitarian Brief
- Humanitarian Index
- Centro de Situacion
- Nodos Federados (panel visual)

---

## Otras formas de contribuir

### Mejorar conectores existentes

- Agregar registros a plataformas existentes
- Conectar con APIs reales cuando esten disponibles
- Mejorar la normalizacion de datos

### Frontend

- Mejorar componentes UI
- Agregar accesibilidad
- Optimizar rendimiento mobile
- Mejorar la experiencia offline

### Motores

- Mejorar el algoritmo de matching
- Agregar nuevos factores al Evidence Engine
- Ampliar las relaciones del Context Engine

### Documentacion

- Traducir documentacion
- Agregar guias de uso
- Documentar APIs de plataformas venezolanas

---

## Reglas para contribuir

1. `tsc -b` debe pasar sin errores
2. `npx vite build` debe compilar correctamente
3. No modificar Supabase ni crear nuevas tablas sin aprobacion
4. No hardcodear secretos — usar variables de entorno
5. Toda logica en `lib/` o `store/` — los componentes solo renderizan
6. Usar signals, no useState para estado compartido
7. Preact, no React

---

## Estructura de un PR

```
## Summary
- Breve descripcion de los cambios

## Test plan
- [ ] `tsc -b` pasa sin errores
- [ ] `vite build` compila correctamente
- [ ] Probado en mobile
- [ ] No rompe funcionalidad existente
```

---

Anterior: [04-How-NODO-Works.md](04-How-NODO-Works.md)

---

Bienvenido a NODO. Cada linea de codigo que escribas puede ayudar a salvar una vida.
