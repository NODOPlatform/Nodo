# 04 — Como funciona NODO

## Flujo completo de una busqueda

---

## Paso 1: El usuario busca

El usuario escribe "Maria Gonzalez" en el buscador de `/buscar-persona`.

---

## Paso 2: Deteccion de intento

`detectIntent()` analiza el texto y determina el tipo de busqueda:

| Intento | Palabras clave | Accion |
|---------|---------------|--------|
| `persona` | nombres, apellidos | Busca en personas |
| `mascota` | perro, gato, mascota | Busca en mascotas |
| `hospital` | hospital, clinica | Busca en hospitales |
| `refugio` | refugio, albergue | Busca en refugios |
| `sangre` | sangre, donante | Busca campanas de sangre |

Todos los intentos consultan todos los conectores. No hay filtro.

---

## Paso 3: Busqueda paralela

NODO y el Federation Engine buscan simultaneamente:

```
Supabase (NODO DB)    →  Personas en la base de datos local
Hospitales Venezuela  →  20 hospitales
Venezuela Te Busca    →  10 registros de personas
Desaparecidos T.      →  12 registros de personas
VzlaAyuda             →  12 registros multi-entidad
Patitas a Salvo       →  10 mascotas
Reencuentro Venezuela →  15 registros de personas
```

Cada conector tiene: cache, rate-limit, timeout, metricas de disponibilidad.

---

## Paso 4: Deduplicacion

`deduplicateResults()` elimina duplicados por `firstName::lastName::providerId`.

Los resultados de Supabase se convierten a `FederatedResult` con `providerId: 'nodo'` para participar en la deduplicacion junto con los demas nodos.

---

## Paso 5: Evidence Engine

Para cada persona encontrada en 2+ fuentes:

| Nivel | Condicion |
|-------|-----------|
| **verified** | 3+ fuentes, al menos 2 con confianza alta |
| **corroborated** | 2+ fuentes |
| **single_source** | 1 fuente con confianza alta |
| **unconfirmed** | 1 fuente sin confianza alta |

Ejemplo: "Maria Gonzalez" aparece en Venezuela Te Busca, Desaparecidos Terremoto y Reencuentro Venezuela → **verified**.

---

## Paso 6: Humanitarian Context

Busca relaciones reales entre entidades por ciudad, hospital, ubicacion:

- Persona → Hospital donde fue reportada
- Persona → Refugio en la misma ciudad
- Persona → Campana de sangre activa en la zona
- Persona → Otras personas en el mismo hospital
- Mascota → Refugio en la misma ciudad

No inventa relaciones. Solo muestra conexiones que existen en los datos.

---

## Paso 7: Humanitarian Brief

Genera un resumen ejecutivo con:

- Cantidad de coincidencias y fuentes
- Ubicacion mas reciente (hospital, ciudad)
- Estado mas reciente (desaparecido, hospitalizado, a salvo)
- Recursos y refugios relacionados
- Puntuacion de confianza (0-100%) con 6 factores verificables

---

## Paso 8: Presentacion

Todo se muestra en una unica vista consolidada:

1. Resumen de la situacion (Brief)
2. Personas (unificadas de todas las fuentes, con fuente visible)
3. Indice humanitario (contadores por tipo)
4. Evidencia multi-fuente
5. Contexto humanitario
6. Hospitales, refugios, recursos, mascotas
7. Estado de la Red NODO

---

## Flujo de datos general

```
Formulario → Supabase INSERT (o IndexedDB si offline)
                    │
              processQueue() cada 15s (si offline)
                    │
              Store (signal) ← loadXxx()
                    │
              Componente UI (renderiza signal)
```

Las paginas nunca tienen logica de negocio. Los stores manejan el estado. Las libs procesan los datos.

---

Anterior: [03-Architecture.md](03-Architecture.md) | Siguiente: [05-First-Contribution.md](05-First-Contribution.md)
