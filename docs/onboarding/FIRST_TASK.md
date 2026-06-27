# Tu primera tarea en NODO

## 1. Clonar el proyecto

```bash
git clone https://github.com/NODOPlatform/nodo.git
cd nodo
```

## 2. Instalar dependencias

```bash
npm install
```

## 3. Configurar variables de entorno

```bash
cp .env.example .env.local
```

Editar `.env.local` con las credenciales de Supabase proporcionadas por el equipo.

## 4. Ejecutar en modo desarrollo

```bash
npm run dev
```

Abrir `http://localhost:5173` en el navegador.

## 5. Verificar que compila

```bash
npx tsc -b && npx vite build
```

## 6. Crear tu rama

```bash
git checkout develop
git checkout -b feature/mi-primera-tarea
```

Prefijos: `feature/`, `fix/`, `connector/`, `docs/`.

## 7. Hacer cambios y commit

```bash
git add archivos-modificados
git commit -m "feat(modulo): descripcion breve"
```

## 8. Push y Pull Request

```bash
git push -u origin feature/mi-primera-tarea
```

Ir a GitHub y crear un Pull Request hacia `develop`.

Usar el template de PR. Verificar:

- [ ] `tsc -b` pasa sin errores
- [ ] `vite build` compila
- [ ] Probado en mobile
- [ ] No rompe funcionalidad existente

## Donde buscar tareas

- Ver `docs/issues/FIRST_GOOD_ISSUES.md` para tareas ideales para nuevos colaboradores.
- Revisar los Issues abiertos en GitHub.
- Proponer un nuevo conector en `docs/connectors/HOW_TO_CREATE_CONNECTOR.md`.
