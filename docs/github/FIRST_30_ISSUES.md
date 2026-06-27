# Primeras 30 tareas — NODO

---

## Connectors

1. **Conector: Cruz Roja Venezuela** — Integrar datos de Cruz Roja como nodo federado.
2. **Conector: FUNVISIS** — Conectar alertas sismicas del observatorio nacional.
3. **Conector: Proteccion Civil** — Integrar reportes oficiales de emergencia.
4. **Conector: Bomberos de Venezuela** — Integrar estaciones y operativos activos.
5. **Conector: Farmacias de turno** — Conectar disponibilidad de farmacias en emergencia.
6. **Ampliar Hospitales Venezuela** — Agregar 30 hospitales mas al conector existente.
7. **Ampliar Reencuentro Venezuela** — Agregar 20 registros mas con datos variados.

## Frontend

8. **Skeleton loading en Home** — Reemplazar spinners por skeleton placeholders.
9. **Clusters en MapView** — Agrupar marcadores cercanos con Leaflet.markercluster.
10. **Mejorar contraste WCAG AA** — Auditar y corregir ratios de contraste en botones y textos.
11. **Animaciones de transicion** — Agregar transiciones suaves entre paginas.
12. **Modo oscuro** — Implementar dark theme usando tokens del design system.
13. **Empty states mejorados** — Disenar estados vacios con ilustraciones para cada seccion.
14. **Pull-to-refresh en Home** — Agregar gesto de recarga en mobile.

## AI / Assist

15. **Mejorar intent classifier** — Agregar deteccion de intento para "donacion" y "voluntario".
16. **Respuestas en ingles** — Agregar soporte para respuestas del Assist en ingles.
17. **Mejorar entity extractor** — Detectar numeros de telefono y cedulas en texto libre.
18. **Confidence tuning en Brief** — Ajustar pesos de los 6 factores de confianza.

## Mapas

19. **Filtros en MapView** — Filtrar marcadores por tipo de entidad (persona, hospital, refugio).
20. **Heatmap de incidentes** — Capa de calor mostrando densidad de reportes por zona.
21. **Ruta al hospital mas cercano** — Boton para calcular ruta desde ubicacion actual.
22. **Geocoding en busqueda** — Permitir buscar por direccion ademas de coordenadas.

## Documentacion

23. **Traducir README a ingles** — Version en ingles del README.md.
24. **Traducir onboarding a ingles** — Traducir los 5 documentos de onboarding/.
25. **Guia de migraciones Supabase** — Documentar que hace cada migracion (001-012).
26. **API reference de motores** — Documentar inputs/outputs de cada engine.

## Testing

27. **Tests para Evidence Engine** — Tests unitarios verificando niveles de evidencia.
28. **Tests para person-matching** — Tests para el algoritmo de coincidencias fuzzy.
29. **Tests para humanitarian-brief** — Verificar calculo de confianza y generacion de resumen.

## Infraestructura

30. **GitHub Actions: CI basico** — Workflow que ejecute `tsc -b && vite build` en cada PR.

---

Cada tarea puede resolverse en 1-2 dias. Para tomarla: crear Issue, asignarse, crear rama `feature/` o `fix/`.
