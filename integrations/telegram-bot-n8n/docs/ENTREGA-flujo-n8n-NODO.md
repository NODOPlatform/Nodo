# 🤝 ENTREGA — Bot de Telegram de consulta (n8n) para NODO

**Qué es:** un flujo de n8n que deja consultar por **Telegram** la información de NODO
(personas desaparecidas, refugios, hospitales y campañas). **Sin LLM** (clasifica por
palabras clave) → costo casi cero. Lee la base de datos de NODO por su **API REST de
Supabase con la `anon key`** (solo lectura). No escribe nada en la base de NODO.

Hay **dos versiones** en n8n (proyecto personal de Richard):

| Versión | Workflow | Para qué | URL |
|---|---|---|---|
| **Avanzada ⭐ (usar esta)** | `NODO - Bot Telegram (avanzado)` | Buffer Redis (anti-duplicado + rate-limit) + **7 categorías** + lista para queue mode | https://flowfy-n8n.kzkkfj.easypanel.host/workflow/4WPhUyRR3l4Xfdzv |
| Simple | `NODO - Bot Telegram (consulta)` | Versión mínima (4 categorías, sin Redis) | https://flowfy-n8n.kzkkfj.easypanel.host/workflow/x6bbXr41EgmN2Vg6 |

> Activa **solo una** (las dos no pueden compartir el webhook del mismo bot). Recomendado: la **avanzada**.

**Categorías de la versión avanzada:** desaparecidos, refugios, hospitales, **sangre**
(por tipo: O+, A-, …), **centros de acopio**, campañas e **info verificada**.

**Escalar a producción:** carpeta `deploy/` (docker-compose de queue mode + README).

---

## 🗺️ Cómo funciona (flujo)

```
Telegram Trigger
   → "Parsear y decidir" (Code): detecta /start, botones y texto libre;
      clasifica intención por keywords; normaliza sin acentos; arma la URL REST.
   → "Necesita base de datos?" (IF)
        ├─ SÍ → "Buscar en Supabase (NODO)" (HTTP GET REST, anon key)
        │        → "Fuzzy match y formato" (Code: filtra/rankea por nombre + HTML)
        │        → "Enviar resultados" (Telegram)
        └─ NO → "Enviar menu / mensaje" (Telegram: menú con botones)
```

Categorías que entiende (botón o texto): **Desaparecidos** (`persons`), **Refugios**
(`shelters`), **Hospitales** (`points_of_interest` con `poi_type` hospital/medical_center),
**Campañas** (`official_campaigns`). El usuario puede tocar un botón o escribir directo
(ej: *"busco a María González"*, *"refugios"*, *"hospital"*).

---

## ✅ PASO A PASO para configurar (otro desarrollador)

### 1. Supabase de NODO (la fuente de datos)
1. Abre el nodo **"Parsear y decidir"**.
2. En la **línea 1** del código cambia:
   ```js
   const SUPABASE_BASE = 'https://YOUR-PROJECT.supabase.co';
   ```
   por la URL real del proyecto Supabase de NODO (la encuentras en el frontend de
   `nodoayuda.com` o pidiéndola al admin: `VITE_SUPABASE_URL`).

### 2. Credencial de lectura (anon key)
1. En n8n: **Credentials → New → "Header Auth"**.
2. Configura:
   - **Name:** `apikey`
   - **Value:** la `anon key` de NODO (`VITE_SUPABASE_ANON_KEY`).
   - Nombre de la credencial: `NODO Supabase anon`.
3. Abre el nodo **"Buscar en Supabase (NODO)"** → en *Authentication* (Header Auth)
   selecciona la credencial `NODO Supabase anon`.

> La base de NODO ya tiene **RLS con lectura pública anónima** en las tablas que usamos,
> así que la `anon key` basta. **No hace falta** la contraseña de Postgres ni el `service_role`.

### 3. Bot de Telegram
1. Crea el bot con **@BotFather** y copia el **token**.
2. En n8n: credencial **Telegram API** → pega el token. Nómbrala `NODO Telegram Bot`.
3. Asígnala a los 3 nodos de Telegram: **"Telegram Trigger"**, **"Enviar resultados"**,
   **"Enviar menu / mensaje"**.
   > ⚠️ n8n auto-asignó una credencial Telegram ya existente ("Telegram account").
   > **Verifica que sea el bot de NODO**; si no, reemplázala por `NODO Telegram Bot`.

### 4. Redis (solo versión avanzada)
Los nodos **"Redis: anti-duplicado"** y **"Redis: rate-limit"** usan una credencial **Redis**
(host/puerto/password). n8n ya auto-asignó una credencial "Redis account" existente — verifica
que apunte al Redis correcto (idealmente el **mismo Redis del queue mode**). Sin Redis
configurado, esos 2 nodos fallan.

### 5. Activar
1. **Activa** el workflow (toggle arriba a la derecha). Al activarse, n8n registra el
   *webhook* del bot automáticamente (no hay que llamar `setWebhook` a mano).
2. Prueba en Telegram: `/start`, un botón, *"busco a <un nombre real>"*, *"refugios"*, *"O+"*.
3. Para escala real (mucha gente): deploy en **queue mode** → ver carpeta `deploy/`.

---

## 🔌 Contrato de datos (qué lee de los "motores" de NODO)

Lee directo las tablas de NODO (verificadas en `supabase/migrations/002_tables.sql`):

| Categoría | Tabla / filtro REST | Campos usados |
|---|---|---|
| Desaparecidos | `persons?limit=200` | `first_name, last_name, current_status, is_found, city, last_known_address` |
| Refugios | `shelters?status=eq.active` | `name, address_text, city, capacity, current_occupancy` |
| Hospitales | `points_of_interest?poi_type=in.(hospital,medical_center)&is_active=eq.true` | `name, city, address_text` |
| Campañas | `official_campaigns?status=eq.active` | `title, organization, campaign_type` |

**Si NODO cambia el esquema** (nombres de tabla/columnas), se ajustan las URLs en el
nodo "Parsear y decidir" (objeto `urls`) y los campos en "Fuzzy match y formato".

---

## 📈 Escalabilidad (mucha gente consultando)

El flujo es liviano; la escala se resuelve a nivel de **infraestructura**, no del workflow:

- **n8n en queue mode**: Redis (con `appendonly yes` / AOF y `maxmemory-policy noeviction`)
  + varios *workers* + proceso *webhook* separado + Postgres como DB de n8n. Esto absorbe
  picos de miles de consultas (benchmark oficial: ~162 req/s vs 23 en modo simple).
- **Límite real = Telegram**: 30 mensajes/seg por bot (1/seg por chat). Los *updates*
  entrantes no cuentan. La cola de n8n + Redis amortigua el pico; nadie se pierde, solo
  esperan en orden. Si hace falta más, @BotFather permite *Paid Broadcasts* (hasta 1000/s).

---

## 🔒 Privacidad

La RLS de NODO ya expone estas lecturas de forma anónima (decisión de su equipo). Aun así,
para v2 conviene definir con el admin: rate-limit por `chat_id` (anti-scraping), dedup de
`update_id`, y qué campos sensibles (ubicación exacta) se muestran.

---

## 🚧 Pendiente / ideas v2 (no incluido en v1)

- **Dedup `update_id`** y **rate-limit por chat** con Redis (recomendado para producción).
- **answerCallbackQuery** (quitar el "reloj" al tocar un botón).
- Búsqueda por **tipo de sangre** (`points_of_interest` `poi_type=health_request`) y por
  **centros de acopio**.
- **Reportes** (la persona reporta "encontré a X" / "necesito ayuda") → requiere escribir
  en la DB de NODO y coordinar moderación. (v1 es **solo lectura**.)
- Ordenar por **cercanía** (la DB tiene lat/lng; se puede pedir ubicación al usuario).

---

## ⚖️ Nota de gobernanza (importante)

Esto es un **flujo externo de n8n** que *consume* la API pública de NODO. **No** modifica
el repo `NODOPlatform/Nodo`. Ojo: NODO ya tiene documentado un *TODO* para un **provider
oficial de Telegram dentro del código** (`src/assist/providers/telegram.ts`). Antes de
publicarlo, **confirmar con el admin** si quieren este bot externo o el provider in-repo,
para no duplicar esfuerzo (la misión de NODO es "conectar, no competir").

Si en algún momento esto entra al repo, se sigue el **Git Flow** del equipo: rama
`feature/*` desde `develop`, PR hacia `develop` (nunca `main`), 1 aprobación mínima.
