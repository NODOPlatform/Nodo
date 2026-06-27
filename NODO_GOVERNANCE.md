# NODO Governance 1.0

**Fecha:** 2026-06-27
**Estado:** Activo
**Acceso:** Panel Admin > Seguridad y Gobernanza (solo admin)

---

## Arquitectura

```
src/lib/governance.ts     — Tipos, constantes, logica pura (roles, permisos, validaciones)
src/store/governance.ts   — Signals + CRUD Supabase (usuarios, auditoria, sesiones, config)
src/components/admin/GovernancePanel.tsx — UI completa (overview, usuarios, auditoria, sesiones, emergencia, backups)
supabase/migrations/010_governance.sql  — Tablas y seed data
```

---

## Roles (5 niveles)

| Rol | Nivel | Icono | Color | Descripcion |
|-----|-------|-------|-------|-------------|
| **Owner** | 100 | 👑 | Amarillo | Maximo control. Protegido: no se puede eliminar ni degradar. Minimo 1 activo siempre. |
| **Super Admin** | 80 | ⭐ | Naranja | Gestion completa excepto roles/integraciones/backups. Minimo 1 activo. |
| **Admin** | 60 | 🔵 | Azul | Gestion de contenido: campanas, refugios, centros, salud, incidentes, estadisticas. |
| **Moderator** | 40 | 🟣 | Morado | Gestion limitada: campanas, refugios, centros, info verificada. |
| **Editor** | 20 | 🟢 | Verde | Solo publicacion de contenido basico. |

### Jerarquia

- Un usuario solo puede gestionar roles **inferiores** al suyo.
- Solo Owner puede crear/modificar Owners.
- Solo Owner puede asignar roles iguales o superiores a los suyos.

---

## Permisos (13 granulares)

| Permiso | Etiqueta | Icono |
|---------|----------|-------|
| `manage_users` | Gestionar usuarios | 👥 |
| `manage_roles` | Gestionar roles | 🛡️ |
| `manage_campaigns` | Gestionar campanas | 📢 |
| `manage_shelters` | Gestionar refugios | 🏠 |
| `manage_collection_centers` | Gestionar centros de acopio | 📦 |
| `manage_health` | Gestionar salud | ❤️ |
| `manage_incidents` | Gestionar incidentes | 🚨 |
| `manage_verified_info` | Gestionar info verificada | 📰 |
| `manage_statistics` | Ver estadisticas | 📊 |
| `manage_settings` | Configuracion general | ⚙️ |
| `manage_integrations` | Integraciones | 🔌 |
| `view_audit_log` | Ver auditoria | 📋 |
| `restore_backups` | Restaurar backups | 💾 |

Cada rol tiene permisos por defecto, pero se pueden asignar individualmente.

---

## Auditoria

Toda accion critica se registra en `audit_logs`:

| Campo | Descripcion |
|-------|-------------|
| `user_name` | Quien realizo la accion |
| `user_role` | Rol al momento de la accion |
| `action` | Tipo de accion (create_user, delete_user, change_role, etc.) |
| `entity_type` | Tabla afectada |
| `entity_id` | ID del registro afectado |
| `old_state` | Estado anterior (JSONB) |
| `new_state` | Estado nuevo (JSONB) |
| `metadata` | Info adicional (browser, OS, device) |
| `user_agent` | User-Agent del navegador |
| `created_at` | Timestamp |

### Filtros disponibles en UI

- Por tipo de accion
- Por nombre de usuario
- Paginacion (30 registros por pagina)

---

## Sesiones Activas

Cada login crea un registro en `active_sessions` con:
- Dispositivo (Desktop/Movil/Tablet)
- Navegador y OS (parseados del User-Agent)
- Ultima actividad
- Expiracion (3 horas)

### Acciones

- **Cerrar sesion individual** — Revocar un dispositivo especifico
- **Cerrar todas** — Revocar todas las sesiones del usuario

---

## Modo Emergencia

Cuando se activa:
- **Bloquea** crear usuarios, eliminar usuarios, cambiar roles, cambiar permisos, cambiar configuracion
- **Solo Owner** puede operar durante modo emergencia
- Se muestra banner rojo en el overview de gobernanza
- Se registra activacion/desactivacion en auditoria

Almacenado en `governance_config` con key `emergency_mode`.

---

## Backups (Preparado)

Arquitectura lista en `governance_config` con key `backup_config`:
- Toggle de backup diario automatico
- Retencion configurable (default 30 dias)
- Ultimo backup registrado
- Botones de backup manual y restauracion (pendientes de proveedor)

Solo Owner puede crear y restaurar backups.

---

## 2FA (Preparado)

Columnas `totp_secret` y `totp_enabled` en `user_roles`.
UI muestra estado "Pendiente" con badge amarillo.
Preparado para integracion con Google Authenticator / Authy via TOTP.

---

## Invariantes de Seguridad

1. **Siempre minimo 1 Owner activo** — No se puede eliminar/desactivar el ultimo Owner.
2. **Siempre minimo 1 Super Admin activo** — Mismo principio.
3. **Owner no puede ser eliminado** — Solo desactivado, y solo por otro Owner.
4. **Jerarquia estricta** — No se pueden gestionar roles iguales o superiores.
5. **Toda accion critica queda en auditoria** — Sin excepciones.
6. **Modo emergencia bloquea cambios** — Solo Owner opera.

---

## Tablas Supabase

### user_roles (evolucionada)

Columnas agregadas: `permissions TEXT[]`, `is_active BOOLEAN`, `last_login TIMESTAMPTZ`, `created_by TEXT`, `totp_secret TEXT`, `totp_enabled BOOLEAN`.

Roles expandidos: `owner`, `super_admin`, `admin`, `moderator`, `editor`, `collaborator`.

### audit_logs (nueva)

4 indices: `created_at DESC`, `user_id`, `action`, `(entity_type, entity_id)`.

### active_sessions (nueva)

2 indices: `user_id`, `expires_at`.

### governance_config (nueva)

Key-value con JSONB. Seeds: `emergency_mode`, `backup_config`.

Todas las tablas con RLS habilitado y politicas anon read/write.

---

## Migration

Archivo: `supabase/migrations/010_governance.sql`

Seed automatico: Owner por defecto (`owner@nodoayuda.com`) con todos los permisos.

**Ejecutar en Supabase SQL Editor antes de usar la funcionalidad.**

---

## Compatibilidad

- **No rompe** la autenticacion existente (localStorage con password)
- **No rompe** el sistema de moderadores (admin-config.ts)
- **Coexiste** con el sistema actual; governance es una capa adicional
- **Backwards compatible** con user_roles existentes (nuevas columnas tienen defaults)
