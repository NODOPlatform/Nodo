# 02 — Vision del Producto

## De herramienta local a infraestructura humanitaria

---

## Donde estamos hoy

NODO es una PWA funcional desplegada en produccion (nodoayuda.com) con:

- 6 nodos federados conectados (79 registros)
- Busqueda unificada con deduplicacion cross-source
- Motor de verificacion multi-fuente (Evidence Engine)
- Contexto humanitario automatico entre entidades
- Resumenes ejecutivos por busqueda
- Centro Nacional de Situacion
- Panel de administracion con gobernanza
- Soporte offline completo
- 12 migraciones de Supabase

---

## Hacia donde vamos

### Corto plazo

- Abrir el repositorio como proyecto open source
- Documentar como crear nuevos conectores
- Permitir que cualquier desarrollador agregue plataformas a la Red NODO
- Conectar plataformas reales con APIs oficiales

### Mediano plazo

- Sincronizacion incremental con plataformas que ofrezcan APIs
- Conectores internacionales (Mexico, Colombia, Ecuador)
- Sistema de alertas y seguimiento de busquedas
- Verificacion comunitaria de datos

### Largo plazo

- Red NODO como protocolo abierto de coordinacion humanitaria
- Cualquier organizacion puede conectar su plataforma como un nodo
- Interoperabilidad con sistemas de Proteccion Civil y Cruz Roja
- Estandar de datos humanitarios abiertos

---

## El modelo de conectores

El poder de NODO esta en su arquitectura de conectores. Agregar una nueva plataforma a la Red requiere:

1. Un archivo TypeScript con los datos o la conexion
2. Una linea de registro en `connectors/index.ts`

Todo lo demas es automatico: busqueda, deduplicacion, evidencia, contexto, resumenes, estadisticas del Centro de Situacion.

Esto significa que un voluntario puede integrar una nueva plataforma en una tarde. No necesita entender los motores internos. Solo necesita proporcionar datos en el formato correcto.

---

## Tipos de entidades soportadas

| Tipo | Descripcion | Ejemplo |
|------|-------------|---------|
| `person` | Personas desaparecidas, encontradas, hospitalizadas | Venezuela Te Busca |
| `hospital` | Centros de salud con servicios y contacto | Hospitales en Venezuela |
| `shelter` | Refugios temporales con capacidad | VzlaAyuda |
| `resource` | Centros de acopio y campanas | VzlaAyuda |
| `pet` | Mascotas perdidas, encontradas, en refugio | Patitas a Salvo |

---

Anterior: [01-Mission.md](01-Mission.md) | Siguiente: [03-Architecture.md](03-Architecture.md)
