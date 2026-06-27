# Flujo de Desarrollo — NODO

## Ramas

| Rama | Proposito | Base | Merge hacia |
|------|-----------|------|-------------|
| `main` | Produccion. Siempre estable y desplegable. | — | — |
| `develop` | Integracion. Aqui se fusionan las features antes de ir a main. | `main` | `main` |
| `feature/*` | Nuevas funcionalidades. | `develop` | `develop` |
| `fix/*` | Correcciones de bugs. | `develop` | `develop` |
| `hotfix/*` | Emergencias en produccion. | `main` | `main` + `develop` |

## Flujo

```
feature/mi-feature  →  develop  →  main (produccion)
fix/mi-fix          →  develop  →  main
hotfix/urgente      →  main (directo) + develop
```

## Reglas

1. Nunca hacer push directo a `main`.
2. Toda funcionalidad pasa por `develop` antes de llegar a `main`.
3. Solo `hotfix/*` puede ir directo a `main` (emergencias).
4. Cada PR debe pasar `tsc -b` y `vite build`.
5. Nombrar ramas en ingles: `feature/search-filters`, `fix/offline-sync`.

## Ejemplo

```bash
git checkout develop
git pull origin develop
git checkout -b feature/new-connector
# ... hacer cambios ...
git add .
git commit -m "feat(connect): add new connector"
git push -u origin feature/new-connector
# Crear PR hacia develop
```
