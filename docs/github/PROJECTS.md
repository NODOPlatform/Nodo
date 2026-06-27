# GitHub Projects — NODO

## Tablero recomendado

Crear un GitHub Project tipo **Board** con las siguientes columnas:

| Columna | Proposito |
|---------|-----------|
| Ideas | Propuestas sin evaluar. Cualquiera puede agregar. |
| Backlog | Aprobadas pero sin prioridad inmediata. |
| Ready | Listas para trabajar. Tienen scope claro y criterio de aceptacion. |
| In Progress | Alguien esta trabajando activamente. Debe tener asignado. |
| Review | PR creado, esperando revision. |
| Done | Mergeado a develop o main. |

## Configuracion

1. Ir a GitHub → NODOPlatform → Projects → New project → Board
2. Nombre: `NODO Development`
3. Crear las 6 columnas en orden
4. Habilitar: auto-move issues cuando se crea PR (In Progress → Review)
5. Habilitar: auto-move issues cuando se mergea PR (Review → Done)

## Campos personalizados sugeridos

| Campo | Tipo | Valores |
|-------|------|---------|
| Priority | Single select | High, Medium, Low |
| Team | Single select | Frontend, Backend, Connectors, AI, Maps, QA, Docs |
| Sprint | Iteration | 2 semanas |
| Effort | Single select | Small (1d), Medium (2-3d), Large (1w) |

## Flujo de un issue

```
Idea → Backlog → Ready → In Progress → Review → Done
```

Un issue solo pasa a Ready cuando tiene:
- Descripcion clara
- Criterio de aceptacion
- Label asignado
- Estimacion de esfuerzo
