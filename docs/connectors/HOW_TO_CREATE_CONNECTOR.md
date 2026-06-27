# Como crear un conector para la Red NODO

Un conector integra una plataforma externa a la Red NODO. Cuando un usuario busca, NODO consulta todos los conectores registrados en paralelo.

---

## Tipos de conector

| Template | Usar cuando |
|----------|------------|
| `PersonSearchConnector` | La plataforma solo tiene personas |
| `MultiEntityConnector` | La plataforma tiene personas + refugios + recursos + mascotas |

---

## Ejemplo: VzlaAyuda (MultiEntityConnector)

### Paso 1 — Crear el archivo

```
src/lib/connect/connectors/vzlaayuda-connector.ts
```

### Paso 2 — Definir los registros

Cada registro necesita:

```typescript
{
  id: 'vzla-001',          // ID unico del conector
  entityType: 'person',    // person | hospital | shelter | resource | pet
  firstName: 'Maria',
  lastName: 'Rodriguez',
  city: 'Caracas',
  state: 'Distrito Capital',
  status: 'missing',       // missing | found | safe | hospitalized | reunited | deceased
  description: 'Descripcion del caso.',
  publishedAt: '2025-03-28T10:00:00Z',
  organization: 'VzlaAyuda',
  sourceUrl: 'https://vzlaayuda.org',
  confidence: 'medium',    // high | medium | low
  metadata: {}             // Campos adicionales por tipo de entidad
}
```

### Paso 3 — Registrar el conector

En la funcion `init`:

```typescript
registerMultiEntityConnector({
  providerId: 'vzlaayuda',
  providerName: 'VzlaAyuda',
  config: {
    type: 'manual',       // manual | json | api | search | html
    enabled: true,
    timeout: 5000,
    rateLimit: { minIntervalMs: 1000, maxPerMinute: 30 },
  },
  records: RECORDS,
})
```

### Paso 4 — Agregar al index

En `src/lib/connect/connectors/index.ts`:

```typescript
import { initVzlaAyudaConnector } from './vzlaayuda-connector'

// Dentro de initConnectors():
initVzlaAyudaConnector()
```

### Paso 5 — Exportar RECORDS

Exportar el array de registros para que el Situation Center pueda leerlo:

```typescript
export const RECORDS: EntityRecord[] = [...]
```

Agregar la importacion en `situation-center.ts` → `getAllRawRecords()`.

### Paso 6 — Verificar

```bash
npx tsc -b && npx vite build
```

---

## Integracion automatica

Al registrar el conector, se integra automaticamente con:

- Busqueda unificada
- Evidence Engine (verificacion multi-fuente)
- Humanitarian Context (relaciones)
- Humanitarian Brief (resumen)
- Humanitarian Index (contadores)
- Situation Center (dashboard)
- Panel de Nodos Federados

No se necesita modificar ningun otro archivo.

---

## Checklist

- [ ] Archivo creado en `connectors/`
- [ ] RECORDS exportado
- [ ] Registrado en `connectors/index.ts`
- [ ] Agregado en `situation-center.ts`
- [ ] `tsc -b` pasa
- [ ] `vite build` compila
