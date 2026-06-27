# Politica de Seguridad

## Reportar una vulnerabilidad

NODO maneja datos humanitarios sensibles. La seguridad es critica.

**No reportar vulnerabilidades en Issues publicos.**

Enviar un correo a: **nahuntrader33@gmail.com**

Incluir:
- Descripcion de la vulnerabilidad
- Pasos para reproducirla
- Impacto potencial
- Solucion sugerida (si la tiene)

## Tiempo de respuesta

- Confirmacion de recepcion: 48 horas
- Evaluacion inicial: 7 dias
- Parche: lo antes posible segun severidad

## Alcance

- Codigo fuente del repositorio
- Configuracion de Supabase (RLS, permisos)
- Variables de entorno y secretos
- Dependencias con vulnerabilidades conocidas

## Principios

- Solo `anon key` en frontend. Nunca `service_role`.
- Las contrasenas por defecto se cargan desde variables de entorno.
- Los datos de ubicacion de personas en emergencia son informacion sensible.
- La IA nunca publica datos automaticamente.
