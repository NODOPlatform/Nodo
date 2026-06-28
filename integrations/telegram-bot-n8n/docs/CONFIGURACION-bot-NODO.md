# ⚙️ Documento de configuración — Bot de Telegram NODO (versión avanzada)

> Guía para conectar y activar el bot. Pensado para que **cualquiera del equipo** lo deje
> funcionando sin saber cómo se construyó. Tiempo estimado: **15–20 min**.

---

## 0. Qué es y qué ya trae (no hay que programar nada)

El flujo **ya está construido y validado**. Es un bot de Telegram que responde consultas
de la gente en la emergencia, leyendo la base de datos de NODO. **Ya incluye, de fábrica:**

- ✅ **Buffer en Redis** — anti-duplicados + rate-limit por persona (anti-spam).
- ✅ **Escalable** — listo para correr en n8n *queue mode* (aguanta mucha gente a la vez).
- ✅ **7 categorías** — desaparecidos, refugios, hospitales, sangre, acopio, campañas, info verificada.
- ✅ **Sin LLM** — clasifica por palabras clave → costo casi cero.
- ✅ **Solo lectura** — no escribe nada en la base de NODO.

**Lo único que falta es conectarlo** (credenciales + 1 línea de URL). Eso es lo que cubre este documento.

- **Workflow:** `NODO - Bot Telegram (avanzado)`
- **URL n8n:** https://flowfy-n8n.kzkkfj.easypanel.host/workflow/4WPhUyRR3l4Xfdzv

---

## 1. Antes de empezar — ten a la mano

- [ ] Acceso al **n8n** (la instancia de arriba).
- [ ] **URL y `anon key`** del proyecto **Supabase de NODO** (`VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`; están en el frontend de `nodoayuda.com` o las da el admin).
- [ ] **Token del bot de Telegram** (lo crea **@BotFather** con `/newbot`).
- [ ] Datos de un **Redis** (host, puerto, password). Puede ser el mismo del queue mode.

---

## 2. Configuración paso a paso

### Paso 1 — URL de Supabase (1 línea)
1. Abre el workflow → doble clic en el nodo **"Clasificar y decidir"**.
2. En la **primera línea** del código verás:
   ```js
   const SUPABASE_BASE = 'https://YOUR-PROJECT.supabase.co';
   ```
3. Reemplaza `https://YOUR-PROJECT.supabase.co` por la URL real de NODO (sin barra al final).
4. Clic en **Save** (arriba a la derecha).

### Paso 2 — Credencial de lectura de Supabase (anon key)
1. En n8n: menú **Credentials → New credential → "Header Auth"**.
2. Rellena:
   - **Name:** `apikey`  ← (literalmente la palabra apikey, en minúscula)
   - **Value:** la `anon key` de NODO.
   - Nombre de la credencial (arriba): `NODO Supabase anon`.
3. **Save.**
4. Abre el nodo **"Buscar en Supabase (NODO)"** → sección *Authentication* → selecciona
   `Generic Credential Type` → `Header Auth` → elige `NODO Supabase anon`.

> ℹ️ La base de NODO ya permite **lectura pública anónima** (RLS). Por eso basta la `anon key`
> y **no** se necesita la contraseña de la base ni el `service_role`.

### Paso 3 — Bot de Telegram
1. En Telegram, abre **@BotFather** → `/newbot` → sigue los pasos → copia el **token**.
2. En n8n: **Credentials → New → "Telegram API"** → pega el token → nómbrala `NODO Telegram Bot` → **Save**.
3. Asegúrate de que esa credencial esté en los **4 nodos de Telegram**:
   `Telegram Trigger`, `Aviso espera`, `Enviar resultados`, `Enviar menu / mensaje`.
   > ⚠️ n8n pudo auto-asignar una credencial Telegram vieja ("Telegram account").
   > **Verifica que sea el bot de NODO**; si no, cámbiala por `NODO Telegram Bot`.

### Paso 4 — Redis (el buffer)
1. En n8n: **Credentials → New → "Redis"** → pon host, puerto (6379), password si tiene → **Save**.
2. Confirma que los nodos **"Redis: anti-duplicado"** y **"Redis: rate-limit"** usen esa credencial.
   > Si ya tienes un Redis (el del queue mode), usa **ese mismo**.
   > ❗ Sin Redis configurado, esos 2 nodos dan error y el bot no responde.

### Paso 5 — Activar
1. Arriba a la derecha, pon el **toggle en "Active"**.
2. Al activarse, **n8n registra el webhook del bot solo** (no hay que tocar `setWebhook`).
3. Listo. Pruébalo (ver sección 5).

> ⚠️ **Solo una versión activa a la vez.** Si activas la avanzada, deja **inactiva** la simple
> (`NODO - Bot Telegram (consulta)`): dos workflows no pueden compartir el webhook del mismo bot.

---

## 3. Cómo conversa el bot (qué preguntas hace)

| El usuario… | El bot… |
|---|---|
| `/start`, "hola", "menú", "ayuda" | Da la bienvenida y muestra el **menú de 7 botones**. |
| Toca **Desaparecidos** | Pregunta: *"Escríbeme el nombre y apellido de la persona que buscas."* → el usuario escribe el nombre → muestra coincidencias. |
| Toca **Sangre** | Pregunta: *"Escribe el tipo de sangre (ej: O+)…"* → el usuario escribe `O+` → muestra solicitudes de ese tipo. |
| Toca **Refugios / Hospitales / Acopio / Campañas / Info** | Responde **directo** con la lista (no pregunta nada más). |
| Escribe libre: *"busco a María González"* | Detecta que busca persona → muestra coincidencias. |
| Escribe un nombre solo: *"Pedro Pérez"* | Lo trata como búsqueda de persona. |
| Escribe *"refugio"*, *"hospital"*, *"O+"*, *"acopio"*, *"campañas"*, *"qué está pasando"* | Detecta la categoría y responde. |
| Escribe algo que no entiende | *"No te entendí bien…"* + muestra el menú. |
| Manda muchos mensajes muy rápido | *"Estás enviando muchas consultas muy rápido. Dame un momento…"* (anti-spam). |

---

## 4. Qué responde en cada categoría (de dónde sale la info)

| Categoría | Tabla de NODO | Qué muestra |
|---|---|---|
| Desaparecidos | `persons` | Nombre, estado (desaparecida/encontrada), ciudad, última ubicación |
| Refugios | `shelters` (activos) | Nombre, dirección, ciudad, cupo |
| Hospitales | `points_of_interest` (hospital/medical_center) | Nombre, ciudad, dirección |
| Sangre | `points_of_interest` (health_request) | Hospital, tipo de sangre, ubicación |
| Acopio | `points_of_interest` (collection_center) | Nombre, dirección, ciudad |
| Campañas | `official_campaigns` (activas) | Título, organización |
| Info verificada | `verified_info` (activa) | Título, contenido, fuente |

> Si NODO cambia nombres de tablas/columnas, se ajustan en el nodo **"Clasificar y decidir"**
> (objeto `urls`) y en **"Fuzzy match y formato"**.

---

## 5. Prueba que quedó bien (checklist)

En Telegram, con el bot:
- [ ] `/start` → sale el menú con 7 botones.
- [ ] Toca **Desaparecidos** → te pide el nombre → escribe uno real → responde.
- [ ] Toca **Refugios** → lista refugios (o "no hay" si la base está vacía).
- [ ] Escribe *"O+"* → responde solicitudes de sangre.
- [ ] Manda 8 mensajes seguidos rápido → en algún momento dice *"espera un momento"* (anti-spam OK).
- [ ] Reenvía el mismo mensaje → no responde dos veces (anti-duplicado OK).

---

## 6. Escalar para MUCHA gente (queue mode)

El bot ya está listo; la escala se activa a nivel de infraestructura corriendo n8n en
**queue mode**: las consultas se encolan en Redis y varios *workers* las procesan en paralelo.

- Archivo: `deploy/docker-compose.queue.yml` + `deploy/README-deploy.md`.
- Levantar: `docker compose -f docker-compose.queue.yml --env-file .env up -d`
- Escalar: `--scale n8n-worker=3`
- **Límite real = Telegram**: 30 mensajes/seg por bot (los mensajes que ENTRAN no cuentan).
  La cola amortigua los picos; el bot responde **1 mensaje por consulta** para no malgastar
  ese techo. Si algún día se queda corto → *Paid Broadcasts* en @BotFather (hasta 1000/seg).

---

## 7. Si algo falla (problemas comunes)

| Síntoma | Causa probable | Solución |
|---|---|---|
| El bot no responde nada | Workflow inactivo / token equivocado | Actívalo; verifica la credencial Telegram = bot de NODO |
| Error en nodo **Redis** | Credencial Redis mal o host inalcanzable | Revisa host/puerto/password de la credencial Redis |
| Siempre dice "no encontré" | `SUPABASE_BASE` mal, o `apikey` mal, o base vacía | Revisa Paso 1 y 2; prueba la URL REST en el navegador |
| Error 401 en "Buscar en Supabase" | `anon key` incorrecta o el Header no se llama `apikey` | Revisa la credencial Header Auth (Name = `apikey`) |
| El botón se queda "cargando" | Falta `answerCallbackQuery` (cosmético) | No afecta la respuesta; se puede agregar en una v3 |

---

## 8. Notas

- **Privacidad:** la lectura ya es pública por diseño de NODO (RLS). Aun así, conviene revisar
  con el admin qué campos sensibles (ubicación exacta) se muestran. El bot ya limita resultados
  y trae rate-limit anti-scraping.
- **Gobernanza:** esto es un flujo **externo** que consume la API pública de NODO; **no** toca el
  repo `NODOPlatform/Nodo`. NODO tiene un *TODO* para un provider de Telegram in-repo
  (`src/assist/providers/telegram.ts`) — confirmar con el admin si quieren el bot externo o el
  in-repo, para no duplicar.
- **Versión simple** (`NODO - Bot Telegram (consulta)`): queda como respaldo (4 categorías, sin Redis).
